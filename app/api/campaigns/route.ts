import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { substituteVariables } from '@/lib/email-sender';

/**
 * GET /api/campaigns - List all campaigns for workspace
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaigns = await prisma.emailCampaign.findMany({
      where: { workspaceId: user.workspaceId },
      include: {
        emailAccount: {
          select: { id: true, name: true, fromEmail: true },
        },
        steps: {
          orderBy: { stepOrder: 'asc' },
          select: {
            id: true,
            stepOrder: true,
            subject: true,
            delayDays: true,
            totalSent: true,
            totalOpened: true,
          },
        },
        _count: {
          select: {
            sentEmails: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ campaigns });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch campaigns' }, { status: 500 });
  }
}

/**
 * POST /api/campaigns - Create a new campaign with sequence steps
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      emailAccountId,
      subject,
      steps, // Array of { subject, body, delayDays, sendIfNoReply, sendIfNoOpen }
      targetLeadIds = [],
      targetFilters,
      sendStartTime = '09:00',
      sendEndTime = '17:00',
      timezone = 'America/Los_Angeles',
      delayBetweenEmails = 120,
    } = body;

    // Validation
    if (!name || !emailAccountId || !steps || steps.length === 0) {
      return NextResponse.json(
        { error: 'name, emailAccountId, and at least one step are required' },
        { status: 400 }
      );
    }

    // Verify email account belongs to workspace
    const account = await prisma.emailAccount.findFirst({
      where: { id: emailAccountId, workspaceId: user.workspaceId },
    });

    if (!account) {
      return NextResponse.json({ error: 'Email account not found' }, { status: 404 });
    }

    // Get target leads
    let leadIds = targetLeadIds;
    if (leadIds.length === 0 && targetFilters) {
      // Build lead query from filters
      const filters = typeof targetFilters === 'string' ? JSON.parse(targetFilters) : targetFilters;
      const leads = await prisma.lead.findMany({
        where: {
          workspaceId: user.workspaceId,
          ...(filters.status ? { status: filters.status } : {}),
          ...(filters.qualityTier ? { qualityTier: filters.qualityTier } : {}),
          ...(filters.tags?.length ? { tags: { hasSome: filters.tags } } : {}),
          // Must have a valid email
          OR: [
            { primaryEmail: { not: null } },
            { emails: { isEmpty: false } },
          ],
        },
        select: { id: true },
      });
      leadIds = leads.map((l: any) => l.id);
    }

    if (leadIds.length === 0) {
      return NextResponse.json(
        { error: 'No leads match the targeting criteria' },
        { status: 400 }
      );
    }

    // Create campaign with steps in a transaction
    const campaign = await prisma.$transaction(async (tx) => {
      const newCampaign = await tx.emailCampaign.create({
        data: {
          workspaceId: user.workspaceId,
          userId: user.id,
          emailAccountId,
          name,
          subject: subject || steps[0].subject,
          targetLeadIds: leadIds,
          targetFilters: targetFilters ? JSON.stringify(targetFilters) : null,
          sendStartTime,
          sendEndTime,
          timezone,
          delayBetweenEmails,
          totalRecipients: leadIds.length,
        },
      });

      // Create sequence steps
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        await tx.emailSequenceStep.create({
          data: {
            campaignId: newCampaign.id,
            stepOrder: i + 1,
            subject: step.subject || subject,
            body: step.body,
            delayDays: step.delayDays || (i === 0 ? 0 : 3),
            sendIfNoReply: step.sendIfNoReply ?? true,
            sendIfNoOpen: step.sendIfNoOpen ?? false,
          },
        });
      }

      return newCampaign;
    });

    // Fetch the complete campaign
    const fullCampaign = await prisma.emailCampaign.findUnique({
      where: { id: campaign.id },
      include: {
        steps: { orderBy: { stepOrder: 'asc' } },
        emailAccount: { select: { id: true, name: true, fromEmail: true } },
      },
    });

    return NextResponse.json({
      message: `Campaign created with ${leadIds.length} recipients`,
      campaign: fullCampaign,
    });
  } catch (error: any) {
    console.error('Campaign creation error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create campaign' }, { status: 500 });
  }
}
