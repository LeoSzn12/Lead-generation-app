import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { GoogleMapsClient } from '@/lib/google-maps';
import { GoogleSearchScraper } from '@/lib/google-search-scraper';
import { YelpScraper } from '@/lib/yelp-scraper';
import { WebScraper } from '@/lib/scraper';
import { generateOutreachEmail } from '@/lib/email-templates';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cities, businessTypes, maxLeads, source = 'google_search', apiKey } = body;

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

    // Use provided API key or fall back to environment variable
    const effectiveApiKey = apiKey || process.env.GOOGLE_MAPS_API_KEY;

    if (source === 'google_maps' && !effectiveApiKey) {
      return NextResponse.json(
        { error: 'Google Maps API key is required for this data source' },
        { status: 400 }
      );
    }

    if (!['google_maps', 'google_search', 'yelp'].includes(source)) {
      return NextResponse.json(
        { error: 'Invalid data source' },
        { status: 400 }
      );
    }

    // Create job
    const job = await prisma.generationJob.create({
      data: {
        cities,
        businessTypes,
        maxLeads,
        status: 'pending',
        progress: 'Initializing lead generation...',
      },
    });

    // Start async processing (don't await)
    processLeadGeneration(job.id, cities, businessTypes, maxLeads, source, effectiveApiKey).catch((error) => {
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

    return NextResponse.json({ jobId: job.id });
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
  cities: string[],
  businessTypes: string[],
  maxLeads: number,
  source: string,
  apiKey?: string
) {
  try {
    await prisma.generationJob.update({
      where: { id: jobId },
      data: {
        status: 'processing',
        progress: 'Starting lead discovery...',
      },
    });

    const scraper = new WebScraper();
    const allBusinesses: any[] = [];

    // Initialize the appropriate data source
    let sourceName = '';
    if (source === 'google_maps') {
      sourceName = 'Google Maps';
      const googleMaps = new GoogleMapsClient(apiKey!);
      const leadsPerSearch = Math.ceil(maxLeads / (cities.length * businessTypes.length));

      for (const city of cities) {
        for (const businessType of businessTypes) {
          try {
            await prisma.generationJob.update({
              where: { id: jobId },
              data: {
                progress: `Searching for ${businessType} in ${city} (Google Maps)...`,
              },
            });

            const businesses = await googleMaps.searchBusinesses(
              city,
              businessType,
              leadsPerSearch
            );

            allBusinesses.push(...businesses);

            await prisma.generationJob.update({
              where: { id: jobId },
              data: {
                totalFound: allBusinesses.length,
                progress: `Found ${allBusinesses.length} businesses so far...`,
              },
            });

          } catch (error: any) {
            console.error(`Error searching ${businessType} in ${city}:`, error);
          }

          if (allBusinesses.length >= maxLeads) break;
        }
        if (allBusinesses.length >= maxLeads) break;
      }
    } else if (source === 'google_search') {
      sourceName = 'Google Search';
      const googleSearchScraper = new GoogleSearchScraper();

      await prisma.generationJob.update({
        where: { id: jobId },
        data: {
          progress: `Searching via Google Search (free)...`,
        },
      });

      const businesses = await googleSearchScraper.findBusinesses(cities, businessTypes, maxLeads);
      allBusinesses.push(...businesses);

      await prisma.generationJob.update({
        where: { id: jobId },
        data: {
          totalFound: allBusinesses.length,
          progress: `Found ${allBusinesses.length} businesses via Google Search...`,
        },
      });

    } else if (source === 'yelp') {
      sourceName = 'Yelp';
      const yelpScraper = new YelpScraper();

      await prisma.generationJob.update({
        where: { id: jobId },
        data: {
          progress: `Searching via Yelp (free)...`,
        },
      });

      const businesses = await yelpScraper.findBusinesses(cities, businessTypes, maxLeads);
      allBusinesses.push(...businesses);

      await prisma.generationJob.update({
        where: { id: jobId },
        data: {
          totalFound: allBusinesses.length,
          progress: `Found ${allBusinesses.length} businesses via Yelp...`,
        },
      });
    }

    // Limit to maxLeads
    const businessesToProcess = allBusinesses.slice(0, maxLeads);

    // Process each business
    let processedCount = 0;
    for (const business of businessesToProcess) {
      try {
        const businessName = business.name || business.businessName;
        await prisma.generationJob.update({
          where: { id: jobId },
          data: {
            progress: `Processing ${businessName} (${processedCount + 1}/${businessesToProcess.length})...`,
          },
        });

        let emails: string[] = [];
        let phones: string[] = business.phone ? [business.phone] : [];
        let ownerNames: string[] = [];

        // Scrape website if available
        if (business.website) {
          try {
            const scrapedData = await scraper.scrapeWebsite(business.website);
            emails = scrapedData.emails || [];
            ownerNames = scrapedData.ownerNames || [];
            
            // Add scraped phones to existing
            if (scrapedData.phones && scrapedData.phones.length > 0) {
              phones = [...new Set([...phones, ...scrapedData.phones])];
            }
          } catch (error) {
            console.error(`Error scraping ${business.website}:`, error);
          }
        }

        // Generate outreach email
        const outreachEmail = generateOutreachEmail(
          businessName,
          business.category,
          ownerNames,
          business.website
        );

        // Save lead to database
        await prisma.lead.create({
          data: {
            jobId,
            businessName,
            category: business.category,
            address: business.address,
            city: business.city,
            state: business.state || 'California',
            phone: phones[0] || null,
            website: business.website,
            emails,
            possibleOwnerNames: ownerNames,
            source: sourceName,
            outreachEmailDraft: outreachEmail,
          },
        });

        processedCount++;
        await prisma.generationJob.update({
          where: { id: jobId },
          data: {
            totalProcessed: processedCount,
          },
        });

      } catch (error: any) {
        console.error(`Error processing business ${business.name || business.businessName}:`, error);
        // Continue with next business
      }
    }

    // Mark job as completed
    await prisma.generationJob.update({
      where: { id: jobId },
      data: {
        status: 'completed',
        progress: `Successfully generated ${processedCount} leads!`,
      },
    });

  } catch (error: any) {
    console.error('Fatal error in processLeadGeneration:', error);
    throw error;
  }
}
