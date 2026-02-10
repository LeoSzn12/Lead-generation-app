
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { EmailSyncService } from '@/lib/email-sync';

// Allow longer timeout for sync operations
export const maxDuration = 300; 

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Get all active email accounts for user's workspace
    const accounts = await prisma.emailAccount.findMany({
      where: {
        workspaceId: user.workspaceId,
        isActive: true,
        NOT: {
            imapHost: null
        }
      }
    });

    if (accounts.length === 0) {
      return NextResponse.json({ message: 'No active IMAP accounts found' });
    }

    const syncService = new EmailSyncService();
    const results = [];

    // 2. Sync each account (sequentially to avoid memory spikes, or parallel if robust)
    for (const account of accounts) {
        try {
            console.log(`Syncing emails for ${account.name} (${account.fromEmail})...`);
            const count = await syncService.syncEmails(account.id);
            results.push({ account: account.name, newMessages: count, status: 'success' });
        } catch (error: any) {
            console.error(`Failed to sync ${account.name}:`, error);
            results.push({ account: account.name, error: error.message, status: 'failed' });
        }
    }

    return NextResponse.json({
      message: 'Inbox sync completed',
      results
    });

  } catch (error: any) {
    console.error('Inbox sync error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
