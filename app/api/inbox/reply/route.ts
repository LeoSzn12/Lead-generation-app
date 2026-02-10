
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { sendEmail } from '@/lib/email-sender'; // Resuing existing sender

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { threadId, body } = await req.json();

    if (!threadId || !body) {
      return NextResponse.json({ error: 'Missing threadId or body' }, { status: 400 });
    }

    // 1. Get Thread and Account
    const thread = await prisma.emailThread.findUnique({
      where: { id: threadId },
      include: { 
        emailAccount: true,
        messages: {
            orderBy: { sentAt: 'desc' },
            take: 1
        } 
      }
    });

    if (!thread || thread.emailAccount.workspaceId !== user.workspaceId) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    const lastMessage = thread.messages[0];
    const toAddress = lastMessage.from; // Reply to the sender of the last message
    
    if (!toAddress) {
         return NextResponse.json({ error: 'Cannot determine recipient' }, { status: 400 });
    }

    // 2. Send Email via SMTP
    // Extract actual email from "Name <email>" format if needed, but nodemailer handles it usually.
    // For safety, let's try to extract just the email if simpler, but nodemailer 'to' accepts name <email>.

    await sendEmail({
      emailAccount: thread.emailAccount,
      to: toAddress,
      subject: "Re: " + thread.subject.replace(/^Re:\s*/i, ''),
      html: body.replace(/\n/g, '<br>'), // Simple text to HTML
      text: body,
      inReplyTo: lastMessage.messageId, // Critical for threading
      references: lastMessage.messageId
    });

    // 3. Save Sent Message to Database
    const sentMessage = await prisma.emailMessage.create({
      data: {
        threadId: thread.id,
        emailAccountId: thread.emailAccountId,
        messageId: `sent-${Date.now()}`, // Ideally we get this from nodemailer response
        from: thread.emailAccount.fromEmail,
        to: toAddress,
        subject: "Re: " + thread.subject,
        textBody: body,
        body: body.replace(/\n/g, '<br>'),
        sentAt: new Date(),
        isFromMe: true,
        isRead: true
      }
    });

    // 4. Update Thread
    await prisma.emailThread.update({
      where: { id: thread.id },
      data: {
        lastMessageAt: new Date(),
        snippet: body.slice(0, 100),
        status: 'active' // Re-open if archived
      }
    });

    return NextResponse.json({ success: true, message: sentMessage });

  } catch (error: any) {
    console.error('Reply error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
