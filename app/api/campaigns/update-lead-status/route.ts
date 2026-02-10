import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leadId, status } = await req.json();

    if (!leadId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify lead belongs to user workspace
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead || lead.workspaceId !== user.workspaceId) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Update status
    const updatedLead = await prisma.lead.update({
      where: { id: leadId },
      data: { status },
    });

    return NextResponse.json({ success: true, lead: updatedLead });

  } catch (error: any) {
    console.error('Error updating lead status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
