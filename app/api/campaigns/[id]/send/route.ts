import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { processCampaignBatch, substituteVariables } from '@/lib/email-sender';
import { canSendNow } from '@/lib/email-warmup';

/**
 * POST /api/campaigns/[id]/send - Start sending a campaign
 * 
 * This queues all emails for the first step, then starts processing.
 * Follow-up steps are queued once their delay period has passed.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: params.id },
      include: {
        emailAccount: true,
        steps: { orderBy: { stepOrder: 'asc' } },
      },
    });

    if (!campaign || campaign.workspaceId !== user.workspaceId) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    if (campaign.status === 'completed' || campaign.status === 'cancelled') {
      return NextResponse.json({ error: 'Campaign is already ' + campaign.status }, { status: 400 });
    }

    // Check if email account can send
    const sendCheck = await canSendNow(campaign.emailAccountId);
    if (!sendCheck.canSend) {
      return NextResponse.json({ error: sendCheck.reason }, { status: 400 });
    }

    const firstStep = campaign.steps[0];
    if (!firstStep) {
      return NextResponse.json({ error: 'Campaign has no sequence steps' }, { status: 400 });
    }

    // Check if emails are already queued
    const existingQueued = await prisma.sentEmail.count({
      where: { campaignId: params.id },
    });

    if (existingQueued === 0) {
      // Queue emails for the first step
      const leads = await prisma.lead.findMany({
        where: {
          id: { in: campaign.targetLeadIds },
          workspaceId: user.workspaceId,
        },
      });

      const emailsToQueue = [];

      for (const lead of leads) {
        const toEmail = lead.primaryEmail || lead.emails[0];
        if (!toEmail) continue;

        // Substitute variables
        const variables: Record<string, string> = {
          firstName: (lead.possibleOwnerNames[0] || '').split(' ')[0] || 'there',
          ownerName: lead.possibleOwnerNames[0] || '',
          businessName: lead.businessName,
          category: lead.category,
          website: lead.website || '',
          city: lead.city || '',
          phone: lead.phone || '',
        };

        const personalizedSubject = substituteVariables(firstStep.subject, variables);
        const personalizedBody = substituteVariables(firstStep.body, variables);

        emailsToQueue.push({
          campaignId: params.id,
          stepId: firstStep.id,
          emailAccountId: campaign.emailAccountId,
          leadId: lead.id,
          workspaceId: user.workspaceId,
          toEmail,
          toName: lead.possibleOwnerNames[0] || lead.businessName,
          subject: personalizedSubject,
          bodyHtml: personalizedBody,
          status: 'queued',
          scheduledAt: new Date(),
        });
      }

      if (emailsToQueue.length === 0) {
        return NextResponse.json({ error: 'No leads with valid email addresses' }, { status: 400 });
      }

      // Batch insert queued emails
      await prisma.sentEmail.createMany({
        data: emailsToQueue,
      });

      // Update campaign status
      await prisma.emailCampaign.update({
        where: { id: params.id },
        data: {
          status: 'active',
          totalRecipients: emailsToQueue.length,
        },
      });
    } else {
      // Resume campaign
      await prisma.emailCampaign.update({
        where: { id: params.id },
        data: { status: 'active' },
      });
    }

    // Process the first batch (non-blocking)
    processCampaignBatch(params.id).catch((error) => {
      console.error('Campaign processing error:', error);
    });

    return NextResponse.json({
      message: 'Campaign started! Emails are being sent.',
      remainingToday: sendCheck.remainingToday,
    });
  } catch (error: any) {
    console.error('Campaign send error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to start campaign' }, { status: 500 });
  }
}
