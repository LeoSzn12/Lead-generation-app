
import { prisma } from '@/lib/db';
import { LeadGenerationService } from '@/lib/lead-generation-service';

export class AgentRunner {
  
  async runDueAgents() {
    console.log('Checking for due agents...');
    
    // Find active agents that are due to run
    const dueAgents = await prisma.agent.findMany({
      where: {
        isActive: true,
        nextRunAt: {
          lte: new Date(),
        },
      },
      include: {
        workspace: true,
      },
    });

    console.log(`Found ${dueAgents.length} agents due for execution.`);
    const results = [];

    for (const agent of dueAgents) {
      try {
        const result = await this.executeAgent(agent);
        results.push(result);
      } catch (error) {
        console.error(`Failed to run agent ${agent.id}:`, error);
        results.push({ agentId: agent.id, status: 'failed', error: String(error) });
      }
    }

    return results;
  }

  async executeAgent(agent: any) {
    console.log(`Executing agent: ${agent.name} (${agent.id})`);

    // 1. Create a Generation Job
    const job = await prisma.generationJob.create({
      data: {
        userId: agent.userId,
        workspaceId: agent.workspaceId,
        cities: [agent.location], // Single location for now
        businessTypes: [agent.niche], // Single niche for now
        maxLeads: agent.dailyLimit,
        source: 'multi_source', // Deep search
        status: 'pending',
        progress: 'Agent starting...',
        agentId: agent.id,
        emailVerificationEnabled: true, // Always verify for agents
      },
    });

    // 2. Run Lead Generation Service
    const leadGenService = new LeadGenerationService();
    
    // We run this "detached" but we want to wait for it here to update agent stats
    // In a real bg worker, this would be a queue. For now, we await it or let it run.
    // Let's await it to capture the result for the receipt.
    let leadsFound = 0;
    
    try {
        leadsFound = await leadGenService.processJob({
            jobId: job.id,
            userId: agent.userId,
            workspaceId: agent.workspaceId,
            cities: [agent.location],
            businessTypes: [agent.niche],
            maxLeads: agent.dailyLimit,
            source: 'multi_source',
            generateOutreach: true,
            enableEmailVerification: true,
            enableAIEnrichment: true,
            apiKey: process.env.OPENAI_API_KEY,
        });

        // 3. Auto-Add to Campaign (if configured)
        if (agent.campaignId && leadsFound > 0) {
            // Find all leads from this job with valid emails
            const leads = await prisma.lead.findMany({
                where: { jobId: job.id, primaryEmail: { not: null } }
            });

            // Add to campaign
            // (Assumes we have a helper or just create CampaignLeads)
            // Ideally we'd reuse a service, but manual insert is fine for now
            const campaignLeads = leads.map(lead => ({
                cid: `cl_${Date.now()}_${lead.id}`, // simple ID gen if needed or rely on default
                campaignId: agent.campaignId,
                leadId: lead.id,
                status: 'pending'
            }));
            
            // Note: Prisma createMany is supported
            if (campaignLeads.length > 0) {
                 await prisma.campaignLead.createMany({
                    data: campaignLeads,
                    skipDuplicates: true
                });
                console.log(`Added ${campaignLeads.length} leads to campaign ${agent.campaignId}`);
            }
        }

    } catch (e) {
        console.error("Agent execution inner error", e);
        throw e;
    }

    // 4. Update Agent Schedule & Stats
    const nextRun = new Date();
    nextRun.setHours(nextRun.getHours() + agent.runInterval);

    await prisma.agent.update({
      where: { id: agent.id },
      data: {
        lastRunAt: new Date(),
        nextRunAt: nextRun,
        totalRuns: { increment: 1 },
        totalLeadsFound: { increment: leadsFound }
      }
    });

    return { agentId: agent.id, status: 'success', leadsFound };
  }
}
