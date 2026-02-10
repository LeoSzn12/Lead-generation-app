import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const folder = searchParams.get('folder') || 'inbox';
    const offset = (page - 1) * limit;

    // Get active email accounts for workspace to filter threads
    const accounts = await prisma.emailAccount.findMany({
        where: { workspaceId: user.workspaceId },
        select: { id: true }
    });
    
    const accountIds = accounts.map(a => a.id);

    // Fetch threads
    const threads = await prisma.emailThread.findMany({
      where: {
        emailAccountId: { in: accountIds },
        folder: folder,
        status: 'active'
      },
      include: {
        lead: {
            select: {
                id: true,
                businessName: true,
                emails: true,
                status: true,
                leadScore: true
            }
        },
        messages: {
            take: 1,
            orderBy: { sentAt: 'desc' },
            select: {
                id: true,
                snippet: true,
                subject: true,
                sentAt: true,
                isRead: true, 
                from: true
            }
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      },
      skip: offset,
      take: limit
    });

    // Count total for pagination
    const total = await prisma.emailThread.count({
        where: {
            emailAccountId: { in: accountIds },
            folder: folder,
            status: 'active'
        }
    });

    return NextResponse.json({
      threads,
      pagination: {
        code: 200,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error('Error fetching inbox threads:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
