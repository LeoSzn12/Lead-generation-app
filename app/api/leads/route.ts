import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '200');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {
      workspaceId: user.workspaceId,
    };

    if (status) {
      where.status = status;
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          businessName: true,
          category: true,
          status: true,
          leadScore: true,
          emails: true,
          phone: true,
          city: true,
          state: true,
          enrichmentStatus: true,
          icebreaker: true,
          isContacted: true,
          contactedAt: true,
          lastActivityAt: true,
          createdAt: true,
        },
      }),
      prisma.lead.count({ where }),
    ]);

    return NextResponse.json({ leads, total });
  } catch (error: any) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}
