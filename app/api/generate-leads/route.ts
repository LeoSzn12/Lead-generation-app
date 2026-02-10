import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limiter';
import { GoogleMapsClient } from '@/lib/google-maps';
import { GoogleSearchScraper } from '@/lib/google-search-scraper';
import { YelpScraper } from '@/lib/yelp-scraper';
import { YellowPagesScraper } from '@/lib/yellowpages-scraper';
import { WebScraper } from '@/lib/scraper';
import { generateOutreachEmail } from '@/lib/email-templates';
import { removeDuplicates } from '@/lib/deduplication';
import { verifyEmailBatch, getBestEmail } from '@/lib/email-verification-free';
import { calculateLeadScore } from '@/lib/lead-scoring';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

export async function POST(req: NextRequest) {
  try {
    // Authentication check
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    // Rate limiting check
    const rateLimit = await checkRateLimit(user.workspaceId, 'free');
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          resetAt: rateLimit.resetAt,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { 
      cities, 
      businessTypes, 
      maxLeads, 
      source = 'google_maps', 
      apiKey,
      generateOutreach = true,
      template,
      enableEmailVerification = false,
    } = body;

    // Validation
    if (!cities || !Array.isArray(cities) || cities.length === 0) {
      return NextResponse.json(
        { error: 'Cities array is required' },
        { status: 400 }
      );
    }

    if (!businessTypes || !Array.isArray(businessTypes) || businessTypes.length === 0) {
      return NextResponse.json(
        { error: 'Business types array is required' },
        { status: 400 }
      );
    }

    if (!maxLeads || maxLeads < 1 || maxLeads > 100) {
      return NextResponse.json(
        { error: 'Max leads must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Check workspace quota
    const workspace = user.workspace;
    if (workspace.leadsUsed >= workspace.leadsQuota) {
      return NextResponse.json(
        { error: 'Monthly quota exceeded. Please upgrade your plan.' },
        { status: 403 }
      );
    }

    // Use workspace API key or provided key
    const effectiveApiKey = apiKey || workspace.googleMapsApiKey || process.env.GOOGLE_MAPS_API_KEY;

    if ((source === 'google_maps' || source === 'multi_source') && !effectiveApiKey) {
      return NextResponse.json(
        { error: 'Google Maps API key is required for this data source' },
        { status: 400 }
      );
    }

    if (!['google_maps', 'google_search', 'yelp', 'yellowpages', 'multi_source'].includes(source)) {
      return NextResponse.json(
        { error: 'Invalid data source' },
        { status: 400 }
      );
    }

    // Create job
    const job = await prisma.generationJob.create({
      data: {
        userId: user.id,
        workspaceId: user.workspaceId,
        cities,
        businessTypes,
        maxLeads,
        source,
        status: 'pending',
        progress: 'Initializing lead generation...',
        emailVerificationEnabled: enableEmailVerification,
      },
    });

    // Start async processing (don't await)
    processLeadGeneration(
      job.id,
      user.id,
      user.workspaceId,
      cities,
      businessTypes,
      maxLeads,
      source,
      effectiveApiKey,
      generateOutreach,
      template,
      enableEmailVerification
    ).catch((error) => {
      console.error('Lead generation error:', error);
      prisma.generationJob.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          error: error?.message || 'Unknown error occurred',
          progress: 'Failed to generate leads',
        },
      }).catch(console.error);
    });

    return NextResponse.json({ 
      jobId: job.id,
      rateLimit: {
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt,
      },
    });
  } catch (error: any) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create job' },
      { status: 500 }
    );
  }
}

async function processLeadGeneration(
  jobId: string,
  userId: string,
  workspaceId: string,
  cities: string[],
  businessTypes: string[],
  maxLeads: number,
  source: string,
  apiKey?: string,
  generateOutreach: boolean = true,
  template?: { subject?: string; body?: string },
  enableEmailVerification: boolean = false
) {