
import imaps from 'imap-simple';
import { simpleParser } from 'mailparser';
import { prisma } from '@/lib/db';

export class EmailSyncService {
  /**
   * Sync recent emails for a specific account
   */
  async syncEmails(emailAccountId: string) {
    const account = await prisma.emailAccount.findUnique({
      where: { id: emailAccountId },
    });

    if (!account || !account.imapHost || !account.imapUser || !account.imapPass) {
      throw new Error('Email account not configured for IMAP');
    }

    const config = {
      imap: {
        user: account.imapUser,
        password: account.smtpPass, // Usually same as SMTP pass (app password)
        host: account.imapHost,
        port: account.imapPort,
        tls: true,
        authTimeout: 10000,
      },
    };

    try {
      const connection = await imaps.connect(config);
      await connection.openBox('INBOX');

      // Fetch unseen messages from last 3 days
      const delay = 3 * 24 * 3600 * 1000;
      const yesterday = new Date();
      yesterday.setTime(Date.now() - delay);
      
      const searchCriteria = [
        'UNSEEN',
        ['SINCE', yesterday.toISOString()]
      ];
      
      const fetchOptions = {
        bodies: ['HEADER', 'TEXT'],
        markSeen: false, // Don't mark as seen yet
        struct: true
      };

      const messages = await connection.search(searchCriteria, fetchOptions);

      for (const item of messages) {
        const all = item.parts.find((part: any) => part.which === 'TEXT');
        const id = item.attributes.uid;
        const idHeader = "Imap-Id: "+id+"\r\n";
        
        // Parse email
        const parsed = await simpleParser(idHeader + all.body);
        
        // Extract key info
        const messageId = parsed.messageId || `uid-${id}`;
        const subject = parsed.subject || '(No Subject)';
        const from = parsed.from?.text || '';
        const to = Array.isArray(parsed.to) ? parsed.to.map(t => t.text).join(', ') : parsed.to?.text || '';
        const date = parsed.date || new Date();
        const snippet = (parsed.text || '').slice(0, 100).replace(/\s+/g, ' ');

        // Check availability of from address
        const fromHeader = parsed.from?.value;
        const fromAddress = Array.isArray(fromHeader) ? fromHeader[0]?.address?.toLowerCase() : fromHeader?.address?.toLowerCase();
        
        if (!fromAddress) continue;

        // 1. Find or Create Thread
        
        let leadId = null;
        // In Prisma, we can't filter 'has' on a string[] easily if the array is empty or null, 
        // but here 'emails' is String[] @default([]).
        const leads = await prisma.lead.findMany({
          where: { 
            workspaceId: account.workspaceId,
            emails: { has: fromAddress }
          }
        });
        
        const lead = leads[0];
        
        if (lead) {
            leadId = lead.id;
            // Auto-update lead status to 'replied' if appropriate
            if (['new', 'contacted'].includes(lead.status)) {
                await prisma.lead.update({
                    where: { id: lead.id },
                    data: { status: 'replied' }
                });
            }
        }

        // Find existing thread or create
        const cleanSubject = subject.replace(/^(Re|Fwd):\s*/i, '').trim();
        
        let thread = await prisma.emailThread.findFirst({
            where: {
                emailAccountId,
                subject: { contains: cleanSubject }, // Loose match
                updatedAt: { gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Within 7 days
            }
        });

        if (!thread) {
            thread = await prisma.emailThread.create({
                data: {
                    emailAccountId,
                    leadId,
                    subject: cleanSubject,
                    lastMessageAt: date,
                    snippet,
                    unreadCount: 1
                }
            });
        } else {
            // Update thread
            await prisma.emailThread.update({
                where: { id: thread.id },
                data: {
                    lastMessageAt: date,
                    snippet,
                    unreadCount: { increment: 1 }
                }
            });
        }

        // Save Message
        await prisma.emailMessage.create({
            data: {
                threadId: thread.id,
                emailAccountId,
                messageId,
                from,
                to,
                subject,
                textBody: parsed.text,
                body: parsed.html as string || parsed.textAsHtml || parsed.text,
                sentAt: date,
                isFromMe: false,
                isRead: false
            }
        });

        // Mark as seen on server
        // await connection.addFlags(item.attributes.uid, '\\Seen');
      }

      connection.end();
      return messages.length;

    } catch (error) {
      console.error('IMAP Sync Error:', error);
      throw error;
    }
  }
}
