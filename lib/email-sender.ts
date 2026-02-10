/**
 * Email sending service using Nodemailer
 * Supports Gmail, Outlook, and custom SMTP
 * Includes tracking pixel injection and unsubscribe link
 */

import nodemailer from 'nodemailer';
import { prisma } from '@/lib/db';

export interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  trackingId: string;
  sentEmailId: string;
  replyTo?: string;
}

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

/**
 * Create a Nodemailer transporter from SMTP config
 */
function createTransporter(config: SmtpConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      rejectUnauthorized: false, // Allow self-signed certs for dev
    },
  });
}

/**
 * Test SMTP connection
 */
export async function testSmtpConnection(config: SmtpConfig): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter(config);
    await transporter.verify();
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Failed to connect to SMTP server',
    };
  }
}

/**
 * Inject tracking pixel and unsubscribe link into email HTML
 */
function injectTracking(html: string, trackingId: string, baseUrl: string): string {
  const trackingPixel = `<img src="${baseUrl}/api/track/${trackingId}/open" width="1" height="1" style="display:none;" alt="" />`;

  const unsubscribeBlock = `
    <div style="margin-top:32px; padding-top:16px; border-top:1px solid #e5e7eb; text-align:center; font-size:12px; color:#9ca3af;">
      <p>You received this email because you're a business contact.</p>
      <p><a href="${baseUrl}/api/unsubscribe/${trackingId}" style="color:#6b7280; text-decoration:underline;">Unsubscribe</a></p>
    </div>
  `;

  // Insert pixel before closing body tag, or at end
  if (html.includes('</body>')) {
    html = html.replace('</body>', `${trackingPixel}${unsubscribeBlock}</body>`);
  } else {
    html = html + trackingPixel + unsubscribeBlock;
  }

  return html;
}

/**
 * Replace tracking links in HTML to route through our tracker
 */
function wrapLinks(html: string, trackingId: string, baseUrl: string): string {
  // Replace all <a href="..."> with tracked versions
  return html.replace(
    /href="(https?:\/\/[^"]+)"/g,
    (match, url) => {
      // Don't wrap unsubscribe link or tracking pixel
      if (url.includes('/api/track/') || url.includes('/api/unsubscribe/')) {
        return match;
      }
      const encodedUrl = encodeURIComponent(url);
      return `href="${baseUrl}/api/track/${trackingId}/click?url=${encodedUrl}"`;
    }
  );
}

/**
 * Substitute template variables in email content
 */
export function substituteVariables(text: string, variables: Record<string, string>): string {
  let result = text;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '');
  });
  return result;
}

/**
 * Send a single email through an EmailAccount
 */
export async function sendEmail(
  accountId: string,
  options: SendEmailOptions,
  baseUrl: string = process.env.NEXTAUTH_URL || 'http://localhost:3000'
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Get email account
    const account = await prisma.emailAccount.findUnique({
      where: { id: accountId },
    });

    if (!account || !account.isActive) {
      return { success: false, error: 'Email account not found or inactive' };
    }

    // Check daily limit
    const now = new Date();
    const lastReset = new Date(account.dailyResetAt);
    const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

    let dailySentCount = account.dailySentCount;

    // Reset daily counter if 24h+ since last reset
    if (hoursSinceReset >= 24) {
      dailySentCount = 0;
      await prisma.emailAccount.update({
        where: { id: accountId },
        data: {
          dailySentCount: 0,
          dailyResetAt: now,
        },
      });
    }

    if (dailySentCount >= account.dailySendLimit) {
      return { success: false, error: 'Daily send limit reached' };
    }

    // Create transporter
    const transporter = createTransporter({
      host: account.smtpHost,
      port: account.smtpPort,
      secure: account.smtpSecure,
      user: account.smtpUser,
      pass: account.smtpPass,
    });

    // Inject tracking
    let html = injectTracking(options.html, options.trackingId, baseUrl);
    html = wrapLinks(html, options.trackingId, baseUrl);

    // Send email
    const info = await transporter.sendMail({
      from: `"${account.fromName}" <${account.fromEmail}>`,
      to: options.toName ? `"${options.toName}" <${options.to}>` : options.to,
      subject: options.subject,
      html: html,
      replyTo: options.replyTo || account.fromEmail,
      headers: {
        'X-Tracking-Id': options.trackingId,
        'List-Unsubscribe': `<${baseUrl}/api/unsubscribe/${options.trackingId}>`,
      },
    });

    // Update account's daily sent count
    await prisma.emailAccount.update({
      where: { id: accountId },
      data: {
        dailySentCount: { increment: 1 },
        lastError: null,
      },
    });

    // Update sent email record
    await prisma.sentEmail.update({
      where: { id: options.sentEmailId },
      data: {
        status: 'sent',
        sentAt: new Date(),
        messageId: info.messageId,
      },
    });

    return { success: true, messageId: info.messageId };

  } catch (error: any) {
    console.error('Email send error:', error);

    // Update sent email with error
    await prisma.sentEmail.update({
      where: { id: options.sentEmailId },
      data: {
        status: 'failed',
        errorMessage: error?.message || 'Unknown error',
      },
    }).catch(console.error);

    // Update account error
    await prisma.emailAccount.update({
      where: { id: accountId },
      data: {
        lastError: error?.message || 'Send failed',
      },
    }).catch(console.error);

    return { success: false, error: error?.message || 'Failed to send email' };
  }
}

/**
 * Process a campaign: send next batch of emails
 */
export async function processCampaignBatch(campaignId: string): Promise<{
  sent: number;
  failed: number;
  remaining: number;
}> {
  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId },
    include: {
      emailAccount: true,
      steps: { orderBy: { stepOrder: 'asc' } },
    },
  });

  if (!campaign || campaign.status !== 'active') {
    return { sent: 0, failed: 0, remaining: 0 };
  }

  const account = campaign.emailAccount;
  if (!account.isActive) {
    return { sent: 0, failed: 0, remaining: 0 };
  }

  // Get queued emails for this campaign
  const queuedEmails = await prisma.sentEmail.findMany({
    where: {
      campaignId,
      status: 'queued',
    },
    orderBy: { scheduledAt: 'asc' },
    take: Math.max(account.dailySendLimit - account.dailySentCount, 0),
  });

  let sent = 0;
  let failed = 0;
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  for (const email of queuedEmails) {
    // Add randomized delay between sends
    const delay = campaign.delayBetweenEmails * (0.7 + Math.random() * 0.6); // ±30%
    await new Promise(resolve => setTimeout(resolve, delay * 1000));

    // Update status to sending
    await prisma.sentEmail.update({
      where: { id: email.id },
      data: { status: 'sending' },
    });

    const result = await sendEmail(account.id, {
      to: email.toEmail,
      toName: email.toName || undefined,
      subject: email.subject,
      html: email.bodyHtml,
      trackingId: email.trackingId,
      sentEmailId: email.id,
    }, baseUrl);

    if (result.success) {
      sent++;
    } else {
      failed++;
    }

    // Check if we've hit daily limit
    const updatedAccount = await prisma.emailAccount.findUnique({
      where: { id: account.id },
    });
    if (updatedAccount && updatedAccount.dailySentCount >= updatedAccount.dailySendLimit) {
      break;
    }
  }

  // Update campaign stats
  await prisma.emailCampaign.update({
    where: { id: campaignId },
    data: {
      totalSent: { increment: sent },
    },
  });

  // Get remaining count
  const remaining = await prisma.sentEmail.count({
    where: {
      campaignId,
      status: 'queued',
    },
  });

  // Mark campaign complete if no more emails
  if (remaining === 0) {
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { status: 'completed' },
    });
  }

  return { sent, failed, remaining };
}

/**
 * Common SMTP presets
 */
export const SMTP_PRESETS: Record<string, { host: string; port: number; secure: boolean }> = {
  gmail: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
  },
  outlook: {
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
  },
  yahoo: {
    host: 'smtp.mail.yahoo.com',
    port: 587,
    secure: false,
  },
  zoho: {
    host: 'smtp.zoho.com',
    port: 587,
    secure: false,
  },
};
