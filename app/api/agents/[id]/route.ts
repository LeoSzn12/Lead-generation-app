import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agent = await prisma.agent.findUnique({
      where: { id: params.id },
    });

    if (!agent || agent.workspaceId !== user.workspaceId) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    const body = await req.json();
    const updateData: any = {};

    if (typeof body.isActive === 'boolean') {
      updateData.isActive = body.isActive;
    }

    if (body.name) updateData.name = body.name;
    if (body.niche) updateData.niche = body.niche;
    if (body.location) updateData.location = body.location;
    if (body.dailyLimit) updateData.dailyLimit = Number(body.dailyLimit);
    if (body.campaignId !== undefined) updateData.campaignId = body.campaignId || null;

    const updatedAgent = await prisma.agent.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(updatedAgent);
  } catch (error: any) {
    console.error('Error updating agent:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update agent' },
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agent = await prisma.agent.findUnique({
      where: { id: params.id },
    });

    if (!agent || agent.workspaceId !== user.workspaceId) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    await prisma.agent.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Agent deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting agent:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete agent' },
      { status: 500 }
    );
  }
}
