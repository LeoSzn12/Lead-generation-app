import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
    });

    if (!lead || lead.workspaceId !== user.workspaceId) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    const activities = await prisma.activity.findMany({
      where: { leadId: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(activities);
  } catch (error: any) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch activities' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const lead = await prisma.lead.findUnique({
      where: { id: params.id },
    });

    if (!lead || lead.workspaceId !== user.workspaceId) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { type, content, metadata } = body;

    if (!type || !['note', 'email_sent', 'call_made', 'status_change', 'tag_added'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid activity type' },
        { status: 400 }
      );
    }

    const activity = await prisma.activity.create({
      data: {
        leadId: params.id,
        userId: user.id,
        type,
        content: content || null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Update lead's lastActivityAt
    await prisma.lead.update({
      where: { id: params.id },
      data: {
        lastActivityAt: new Date(),
      },
    });

    return NextResponse.json(activity);
  } catch (error: any) {
    console.error('Error creating activity:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create activity' },
      { status: 500 }
    );
  }
}
