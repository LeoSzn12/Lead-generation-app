
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const agents = await prisma.agent.findMany({
      where: { workspaceId: user.workspaceId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(agents);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { name, niche, location, dailyLimit, campaignId } = body;

    if (!name || !niche || !location) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const agent = await prisma.agent.create({
      data: {
        userId: user.id,
        workspaceId: user.workspaceId,
        name,
        niche,
        location,
        dailyLimit: Number(dailyLimit) || 10,
        campaignId: campaignId || null,
        isActive: true,
        runInterval: 24,
        nextRunAt: new Date(), // Ready to run immediately
      }
    });

    return NextResponse.json(agent);
  } catch (error) {
    console.error('Create agent error:', error);
    return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
  }
}
