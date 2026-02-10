import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { ContentScraper } from '@/lib/content-scraper';
import { AIEnrichmentService } from '@/lib/ai-enrichment';

export const maxDuration = 60; // Allow 60s for scraping + AI (Serverless/Edge compatible)

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const leadId = params.id;
    const body = await req.json();
    // Allow passing API key from client for "Bring Your Own Key" mode
    const { apiKey } = body;

    // 1. Fetch Lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
    });

    if (!lead || lead.workspaceId !== user.workspaceId) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (!lead.website) {
      return NextResponse.json({ error: 'Lead has no website to enrich' }, { status: 400 });
    }

    // 2. Update status to processing
    await prisma.lead.update({
      where: { id: leadId },
      data: { enrichmentStatus: 'processing' },
    });

    try {
      // 3. Scrape Website Content
      const scraper = new ContentScraper();
      console.log(`Scraping content for ${lead.website}...`);
      const scrapeResult = await scraper.scrapeContent(lead.website);
      
      if (!scrapeResult.content || scrapeResult.content.length < 50) {
        throw new Error('Website content too short or inaccessible');
      }

      // 4. AI Analysis
      // Use workspace key if available, otherwise user provided key, otherwise env key
      const workspace = await prisma.workspace.findUnique({ where: { id: lead.workspaceId } });
      const effectiveApiKey = apiKey || process.env.OPENAI_API_KEY; // TODO: Add OpenAI key to workspace model later

      if (!effectiveApiKey) {
        throw new Error('No OpenAI API Key provided. Please set it in settings.');
      }

      const aiService = new AIEnrichmentService(effectiveApiKey);
      console.log(`Analyzing content with AI for ${lead.businessName}...`);
      const enriched = await aiService.enrichLead(lead.businessName, scrapeResult.content);

      // 5. Save Results
      const updatedLead = await prisma.lead.update({
        where: { id: leadId },
        data: {
          enrichmentStatus: 'completed',
          websiteContent: scrapeResult.content.slice(0, 5000), // Store first 5k chars for context
          enrichedData: JSON.stringify({
            summary: enriched.summary,
            valueProp: enriched.valueProp,
            techStack: enriched.techStack,
            hiring: enriched.hiring,
          }),
          icebreaker: enriched.icebreaker,
          // If the AI found a better description/summary, we could optionally update 'notes' or a 'summary' field
        },
      });

      return NextResponse.json({
        message: 'Enrichment successful',
        lead: updatedLead,
      });

    } catch (error: any) {
      console.error('Enrichment process failed:', error);
      
      // Update status to failed
      await prisma.lead.update({
        where: { id: leadId },
        data: { enrichmentStatus: 'failed' },
      });

      return NextResponse.json({ 
        error: error.message || 'Enrichment failed during processing' 
      }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
