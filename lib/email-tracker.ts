/**
 * Email tracking service
 * Handles open tracking (pixel), click tracking (redirects), and unsubscribe
 */

import { prisma } from '@/lib/db';

/**
 * Record an email open event
 */
export async function recordOpen(trackingId: string): Promise<boolean> {
  try {
    const sentEmail = await prisma.sentEmail.findUnique({
      where: { trackingId },
    });

    if (!sentEmail) return false;

    // Only record first open
    if (!sentEmail.openedAt) {
      await prisma.sentEmail.update({
        where: { trackingId },
        data: {
          status: 'opened',
          openedAt: new Date(),
        },
      });

      // Update campaign stats
      await prisma.emailCampaign.update({
        where: { id: sentEmail.campaignId },
        data: { totalOpened: { increment: 1 } },
      });

      // Update step stats
      await prisma.emailSequenceStep.update({
        where: { id: sentEmail.stepId },
        data: { totalOpened: { increment: 1 } },
      });
    }

    return true;
  } catch (error) {
    console.error('Error recording open:', error);
    return false;
  }
}

/**
 * Record a link click event
 */
export async function recordClick(trackingId: string): Promise<boolean> {
  try {
    const sentEmail = await prisma.sentEmail.findUnique({
      where: { trackingId },
    });

    if (!sentEmail) return false;

    // Only record first click
    if (!sentEmail.clickedAt) {
      await prisma.sentEmail.update({
        where: { trackingId },
        data: {
          status: 'clicked',
          clickedAt: new Date(),
          // Also mark as opened if not already
          openedAt: sentEmail.openedAt || new Date(),
        },
      });

      // Update campaign stats
      await prisma.emailCampaign.update({
        where: { id: sentEmail.campaignId },
        data: {
          totalClicked: { increment: 1 },
          // Also increment opened if it wasn't tracked via pixel
          ...(sentEmail.openedAt ? {} : { totalOpened: { increment: 1 } }),
        },
      });

      // Update step stats
      await prisma.emailSequenceStep.update({
        where: { id: sentEmail.stepId },
        data: {
          totalClicked: { increment: 1 },
          ...(sentEmail.openedAt ? {} : { totalOpened: { increment: 1 } }),
        },
      });
    }

    return true;
  } catch (error) {
    console.error('Error recording click:', error);
    return false;
  }
}

/**
 * Record an unsubscribe event
 */
export async function recordUnsubscribe(trackingId: string): Promise<{
  success: boolean;
  email?: string;
}> {
  try {
    const sentEmail = await prisma.sentEmail.findUnique({
      where: { trackingId },
    });

    if (!sentEmail) return { success: false };

    // Mark email as unsubscribed
    await prisma.sentEmail.update({
      where: { trackingId },
      data: {
        unsubscribedAt: new Date(),
      },
    });

    // Update campaign stats
    await prisma.emailCampaign.update({
      where: { id: sentEmail.campaignId },
      data: { totalUnsubscribed: { increment: 1 } },
    });

    // Mark the lead as unsubscribed - remove from all future campaigns
    // Cancel all queued emails to this lead
    await prisma.sentEmail.updateMany({
      where: {
        leadId: sentEmail.leadId,
        status: 'queued',
      },
      data: {
        status: 'failed',
        errorMessage: 'Recipient unsubscribed',
      },
    });

    return { success: true, email: sentEmail.toEmail };
  } catch (error) {
    console.error('Error recording unsubscribe:', error);
    return { success: false };
  }
}

/**
 * Record a bounce event
 */
export async function recordBounce(trackingId: string, reason?: string): Promise<boolean> {
  try {
    const sentEmail = await prisma.sentEmail.findUnique({
      where: { trackingId },
    });

    if (!sentEmail) return false;

    await prisma.sentEmail.update({
      where: { trackingId },
      data: {
        status: 'bounced',
        bouncedAt: new Date(),
        errorMessage: reason || 'Email bounced',
      },
    });

    // Update campaign stats
    await prisma.emailCampaign.update({
      where: { id: sentEmail.campaignId },
      data: { totalBounced: { increment: 1 } },
    });

    // Decrease sender reputation
    await prisma.emailAccount.update({
      where: { id: sentEmail.emailAccountId },
      data: { reputation: { decrement: 3 } },
    });

    return true;
  } catch (error) {
    console.error('Error recording bounce:', error);
    return false;
  }
}

/**
 * Record a reply event
 */
export async function recordReply(trackingId: string): Promise<boolean> {
  try {
    const sentEmail = await prisma.sentEmail.findUnique({
      where: { trackingId },
    });

    if (!sentEmail) return false;

    if (!sentEmail.repliedAt) {
      await prisma.sentEmail.update({
        where: { trackingId },
        data: {
          status: 'replied',
          repliedAt: new Date(),
        },
      });

      // Update campaign stats
      await prisma.emailCampaign.update({
        where: { id: sentEmail.campaignId },
        data: { totalReplied: { increment: 1 } },
      });

      // Update step stats
      await prisma.emailSequenceStep.update({
        where: { id: sentEmail.stepId },
        data: { totalReplied: { increment: 1 } },
      });

      // Increase sender reputation on replies
      await prisma.emailAccount.update({
        where: { id: sentEmail.emailAccountId },
        data: { reputation: { increment: 2 } },
      });
    }

    return true;
  } catch (error) {
    console.error('Error recording reply:', error);
    return false;
  }
}

/**
 * Get campaign analytics summary
 */
export async function getCampaignAnalytics(campaignId: string) {
  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId },
    include: {
      steps: {
        orderBy: { stepOrder: 'asc' },
      },
    },
  });

  if (!campaign) return null;

  const openRate = campaign.totalSent > 0
    ? Math.round((campaign.totalOpened / campaign.totalSent) * 100)
    : 0;

  const clickRate = campaign.totalOpened > 0
    ? Math.round((campaign.totalClicked / campaign.totalOpened) * 100)
    : 0;

  const replyRate = campaign.totalSent > 0
    ? Math.round((campaign.totalReplied / campaign.totalSent) * 100)
    : 0;

  const bounceRate = campaign.totalSent > 0
    ? Math.round((campaign.totalBounced / campaign.totalSent) * 100)
    : 0;

  return {
    campaign: {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
    },
    totals: {
      recipients: campaign.totalRecipients,
      sent: campaign.totalSent,
      opened: campaign.totalOpened,
      clicked: campaign.totalClicked,
      replied: campaign.totalReplied,
      bounced: campaign.totalBounced,
      unsubscribed: campaign.totalUnsubscribed,
    },
    rates: {
      open: openRate,
      click: clickRate,
      reply: replyRate,
      bounce: bounceRate,
    },
    steps: campaign.steps.map(step => ({
      id: step.id,
      order: step.stepOrder,
      subject: step.subject,
      sent: step.totalSent,
      opened: step.totalOpened,
      clicked: step.totalClicked,
      replied: step.totalReplied,
      openRate: step.totalSent > 0 ? Math.round((step.totalOpened / step.totalSent) * 100) : 0,
    })),
  };
}

/**
 * Generate 1x1 transparent tracking pixel as Buffer
 */
export function getTrackingPixel(): Buffer {
  // Minimal 1x1 transparent GIF
  return Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );
}
