import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getCampaignAnalytics } from '@/lib/email-tracker';

/**
 * GET /api/campaigns/[id] - Get campaign details with analytics
 */
export async function GET(
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
        emailAccount: { select: { id: true, name: true, fromEmail: true, reputation: true } },
        steps: { orderBy: { stepOrder: 'asc' } },
        sentEmails: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          select: {
            id: true,
            toEmail: true,
            toName: true,
            subject: true,
            status: true,
            sentAt: true,
            openedAt: true,
            clickedAt: true,
            repliedAt: true,
            bouncedAt: true,
            errorMessage: true,
          },
        },
      },
    });

    if (!campaign || campaign.workspaceId !== user.workspaceId) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const analytics = await getCampaignAnalytics(params.id);

    return NextResponse.json({ campaign, analytics });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch campaign' }, { status: 500 });
  }
}

/**
 * PATCH /api/campaigns/[id] - Update campaign (pause/resume/cancel)
 */
export async function PATCH(
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
    });

    if (!campaign || campaign.workspaceId !== user.workspaceId) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    const body = await req.json();
    const { status } = body;

    if (!['active', 'paused', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Use: active, paused, or cancelled' },
        { status: 400 }
      );
    }

    // Cancel all queued emails if cancelling
    if (status === 'cancelled') {
      await prisma.sentEmail.updateMany({
        where: { campaignId: params.id, status: 'queued' },
        data: { status: 'failed', errorMessage: 'Campaign cancelled' },
      });
    }

    const updated = await prisma.emailCampaign.update({
      where: { id: params.id },
      data: { status },
    });

    return NextResponse.json({ campaign: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update campaign' }, { status: 500 });
  }
}

/**
 * DELETE /api/campaigns/[id] - Delete campaign
 */
export async function DELETE(
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
    });

    if (!campaign || campaign.workspaceId !== user.workspaceId) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    await prisma.emailCampaign.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Campaign deleted' });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to delete campaign' }, { status: 500 });
  }
}
