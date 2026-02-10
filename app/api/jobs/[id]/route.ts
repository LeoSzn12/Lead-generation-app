import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const job = await prisma.generationJob.findUnique({
      where: { id: params.id },
      include: {
        leads: {
          where: {
            workspaceId: user.workspaceId, // Only show leads from user's workspace
          },
          orderBy: {
            leadScore: 'desc', // Order by quality score
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Verify workspace access
    if (job.workspaceId !== user.workspaceId) {
      return NextResponse.json(
        { error: 'Forbidden - No access to this job' },
        { status: 403 }
      );
    }

    return NextResponse.json(job);
  } catch (error: any) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch job' },
      { status: 500 }
    );
  }
}
