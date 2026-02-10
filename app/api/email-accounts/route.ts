import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { testSmtpConnection, SMTP_PRESETS } from '@/lib/email-sender';
import { startWarmup, getWarmupStatus } from '@/lib/email-warmup';

/**
 * GET /api/email-accounts - List all email accounts for workspace
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accounts = await prisma.emailAccount.findMany({
      where: { workspaceId: user.workspaceId },
      select: {
        id: true,
        name: true,
        fromName: true,
        fromEmail: true,
        smtpHost: true,
        smtpPort: true,
        smtpSecure: true,
        warmupEnabled: true,
        warmupPhase: true,
        warmupDay: true,
        dailySendLimit: true,
        dailySentCount: true,
        isActive: true,
        isVerified: true,
        lastError: true,
        reputation: true,
        createdAt: true,
        // Exclude smtpUser/smtpPass for security
      },
      orderBy: { createdAt: 'desc' },
    });

    // Attach warmup status
    const accountsWithStatus = await Promise.all(
      accounts.map(async (account) => ({
        ...account,
        warmupStatus: await getWarmupStatus(account.id),
      }))
    );

    return NextResponse.json({ accounts: accountsWithStatus, presets: SMTP_PRESETS });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch accounts' }, { status: 500 });
  }
}

/**
 * POST /api/email-accounts - Add a new email account
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
      fromName,
      fromEmail,
      smtpHost,
      smtpPort = 587,
      smtpUser,
      smtpPass,
      smtpSecure = false,
      skipWarmup = false,
    } = body;

    // Validation
    if (!name || !fromName || !fromEmail || !smtpHost || !smtpUser || !smtpPass) {
      return NextResponse.json(
        { error: 'All fields are required: name, fromName, fromEmail, smtpHost, smtpUser, smtpPass' },
        { status: 400 }
      );
    }

    // Test SMTP connection first
    const testResult = await testSmtpConnection({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      user: smtpUser,
      pass: smtpPass,
    });

    if (!testResult.success) {
      return NextResponse.json(
        { error: `SMTP connection failed: ${testResult.error}` },
        { status: 400 }
      );
    }

    // Create account
    const account = await prisma.emailAccount.create({
      data: {
        workspaceId: user.workspaceId,
        userId: user.id,
        name,
        fromName,
        fromEmail,
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPass,
        smtpSecure,
        isVerified: true,
        dailySendLimit: skipWarmup ? 50 : 5,
        warmupPhase: skipWarmup ? 4 : 1,
        warmupDay: skipWarmup ? 22 : 0,
      },
    });

    // Start warmup if not skipped
    if (!skipWarmup) {
      await startWarmup(account.id);
    }

    return NextResponse.json({
      message: 'Email account connected successfully!',
      account: {
        id: account.id,
        name: account.name,
        fromEmail: account.fromEmail,
        isVerified: account.isVerified,
        warmupStatus: await getWarmupStatus(account.id),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to add account' }, { status: 500 });
  }
}
