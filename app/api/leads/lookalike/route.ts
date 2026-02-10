import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { generateEmbedding, cosineSimilarity } from '@/lib/vector-db';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { leadId } = await req.json();

    if (!leadId) {
      return NextResponse.json({ error: 'Missing leadId' }, { status: 400 });
    }

    // 1. Fetch Target Lead
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
          activities: true // Just in case we want to use activities for context later
      }
    });

    if (!lead || lead.workspaceId !== user.workspaceId) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // 2. Ensure Embedding Exists
    let embedding = lead.embedding;

    if (!embedding || embedding.length === 0) {
      // Create a rich text representation of the lead
      const textContext = `
        Business: ${lead.businessName}
        Category: ${lead.category}
        Description: ${lead.websiteContent || ''}
        Enriched Data: ${lead.enrichedData || ''}
        Location: ${lead.city}, ${lead.state}
      `.trim();

      console.log(`Generating embedding for ${lead.businessName}...`);
      embedding = await generateEmbedding(textContext);

      // Save it back to DB
      await prisma.lead.update({
        where: { id: lead.id },
        data: { embedding },
      });
    }

    // 3. Fetch All Other Leads (Candidate Pool)
    // Optimization: In a real app we would use pgvector <-> operator strictly in DB
    // For MVP (< 2000 leads), fetching simple arrays is fast enough.
    const candidates = await prisma.lead.findMany({
      where: {
        workspaceId: user.workspaceId,
        id: { not: leadId }, // Exclude self
      },
      select: {
        id: true,
        businessName: true,
        category: true,
        city: true,
        state: true,
        leadScore: true,
        embedding: true
      }
    });

    // If no candidates have embeddings, we might want to trigger a background job to embed them
    // But for now, just return what we have.
    if (candidates.length === 0) {
        return NextResponse.json({ leads: [], message: "No other analyzed leads found to compare against." });
    }

    // 4. Calculate Similarity
    const scoredCandidates = candidates
      .filter(c => c.embedding && c.embedding.length > 0)
      .map(candidate => {
        const similarity = cosineSimilarity(embedding!, candidate.embedding);
        return {
            ...candidate,
            similarity,
            embedding: undefined // Remove large array from response
        };
    });

    // 5. Sort and Return Top 5
    const topMatches = scoredCandidates
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5);

    return NextResponse.json({ leads: topMatches });

  } catch (error: any) {
    console.error('Lookalike API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
