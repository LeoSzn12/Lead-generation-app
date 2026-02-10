
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { AgentRunner } from '@/lib/agent-runner';

export const dynamic = 'force-dynamic';
// Allow longer timeout for agent runs if invoked directly
export const maxDuration = 60; 

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const runner = new AgentRunner();
    
    // In a real production serverless env, we might want to just trigger this 
    // and return immediately, but for the "Wake Up" button feedback, 
    // waiting for at least the kickoff is good.
    // Since executeAgent awaits the scraping, this might timeout on Vercel free tier
    // if we wait for ALL agents.
    
    // Strategy: Run them, but if it takes too long, we might need a background worker.
    // For MVP local/demo, awaiting is fine.
    
    const results = await runner.runDueAgents();

    return NextResponse.json({
      message: 'Agent run completed',
      results
    });
    
  } catch (error: any) {
    console.error('Agent run failed:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to run agents' },
      { status: 500 }
    );
  }
}
