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
      include: {
        activities: {
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
        },
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Verify workspace access
    if (lead.workspaceId !== user.workspaceId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    return NextResponse.json(lead);
  } catch (error: any) {
    console.error('Error fetching lead:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch lead' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Verify workspace access
    if (lead.workspaceId !== user.workspaceId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { status, notes, tags, nextFollowUpAt } = body;

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status) {
      updateData.status = status;
      updateData.lastActivityAt = new Date();
      
      // Log status change activity
      await prisma.activity.create({
        data: {
          leadId: params.id,
          userId: user.id,
          type: 'status_change',
          content: `Changed status to ${status}`,
        },
      });
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (tags) {
      updateData.tags = tags;
    }

    if (nextFollowUpAt) {
      updateData.nextFollowUpAt = new Date(nextFollowUpAt);
    }

    const updatedLead = await prisma.lead.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(updatedLead);
  } catch (error: any) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update lead' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Verify workspace access
    if (lead.workspaceId !== user.workspaceId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    await prisma.lead.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Lead deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting lead:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete lead' },
      { status: 500 }
    );
  }
}
