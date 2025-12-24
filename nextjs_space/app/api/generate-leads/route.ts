import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { GoogleMapsClient } from '@/lib/google-maps';
import { GoogleSearchScraper } from '@/lib/google-search-scraper';
import { YelpScraper } from '@/lib/yelp-scraper';
import { YellowPagesScraper } from '@/lib/yellowpages-scraper';
import { WebScraper } from '@/lib/scraper';
import { generateOutreachEmail } from '@/lib/email-templates';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

// Helper function to check if a business should be excluded
function shouldExcludeBusiness(businessName: string, excludeKeywords: string[]): boolean {
  if (!excludeKeywords || excludeKeywords.length === 0) {
    return false;
  }
  
  const nameLower = businessName.toLowerCase().trim();
  
  return excludeKeywords.some(keyword => {
    const keywordLower = keyword.toLowerCase().trim();
    return nameLower.includes(keywordLower);
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      cities, 
      businessTypes, 
      excludeKeywords = [], // Array of keywords to exclude
      maxLeads, 
      source = 'google_search', 
      apiKey,
      generateOutreach = true, // Default to true for backward compatibility
      template 
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

    // Use provided API key or fall back to environment variable
    const effectiveApiKey = apiKey || process.env.GOOGLE_MAPS_API_KEY;

    if (source === 'google_maps' && !effectiveApiKey) {
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
        cities,
        businessTypes,
        excludeKeywords,
        maxLeads,
        status: 'pending',
        progress: 'Initializing lead generation...',
      },
    });

    // Start async processing (don't await)
    processLeadGeneration(job.id, cities, businessTypes, excludeKeywords, maxLeads, source, effectiveApiKey, generateOutreach, template).catch((error) => {
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
  excludeKeywords: string[],
  maxLeads: number,
  source: string,
  apiKey?: string,
  generateOutreach: boolean = true,
  template?: { subject?: string; body?: string }
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
    } else if (source === 'yellowpages') {
      sourceName = 'Yellow Pages';
      const yellowPagesScraper = new YellowPagesScraper();

      await prisma.generationJob.update({
        where: { id: jobId },
        data: {
          progress: `Searching via Yellow Pages (free)...`,
        },
      });

      const businesses = await yellowPagesScraper.findBusinesses(cities, businessTypes, maxLeads);
      allBusinesses.push(...businesses);

      await prisma.generationJob.update({
        where: { id: jobId },
        data: {
          totalFound: allBusinesses.length,
          progress: `Found ${allBusinesses.length} businesses via Yellow Pages...`,
        },
      });
    } else if (source === 'multi_source') {
      sourceName = 'Multi-Source';
      
      // Use Google Maps API for most reliable results
      if (apiKey) {
        await prisma.generationJob.update({
          where: { id: jobId },
          data: {
            progress: `Multi-source search: Starting with Google Maps...`,
          },
        });

        const googleMaps = new GoogleMapsClient(apiKey);
        const leadsPerSearch = Math.ceil(maxLeads * 0.6 / (cities.length * businessTypes.length)); // 60% from Google Maps

        for (const city of cities) {
          for (const businessType of businessTypes) {
            try {
              const businesses = await googleMaps.searchBusinesses(city, businessType, leadsPerSearch);
              allBusinesses.push(...businesses.map(b => ({ ...b, source: 'google_maps' })));
            } catch (error: any) {
              console.error(`Error with Google Maps for ${businessType} in ${city}:`, error);
            }
          }
        }
      }

      // Add Yellow Pages for additional coverage
      await prisma.generationJob.update({
        where: { id: jobId },
        data: {
          totalFound: allBusinesses.length,
          progress: `Multi-source: Found ${allBusinesses.length} from Google Maps, now checking Yellow Pages...`,
        },
      });

      const yellowPagesScraper = new YellowPagesScraper();
      const ypBusinesses = await yellowPagesScraper.findBusinesses(
        cities, 
        businessTypes, 
        Math.ceil(maxLeads * 0.3) // 30% from Yellow Pages
      );
      allBusinesses.push(...ypBusinesses.map(b => ({ ...b, source: 'yellowpages' })));

      // Add Yelp for final enrichment
      await prisma.generationJob.update({
        where: { id: jobId },
        data: {
          totalFound: allBusinesses.length,
          progress: `Multi-source: Found ${allBusinesses.length} total, finalizing with Yelp...`,
        },
      });

      const yelpScraper = new YelpScraper();
      const yelpBusinesses = await yelpScraper.findBusinesses(
        cities, 
        businessTypes, 
        Math.ceil(maxLeads * 0.1) // 10% from Yelp
      );
      allBusinesses.push(...yelpBusinesses.map(b => ({ ...b, source: 'yelp' })));

      await prisma.generationJob.update({
        where: { id: jobId },
        data: {
          totalFound: allBusinesses.length,
          progress: `Multi-source complete: Found ${allBusinesses.length} businesses from all sources!`,
        },
      });
    }

    // Remove duplicates based on business name and address
    const uniqueBusinesses = allBusinesses.reduce((acc: any[], curr: any) => {
      const businessName = (curr.name || curr.businessName || '').toLowerCase().trim();
      const address = (curr.address || '').toLowerCase().trim();
      const isDuplicate = acc.some(b => {
        const existingName = (b.name || b.businessName || '').toLowerCase().trim();
        const existingAddress = (b.address || '').toLowerCase().trim();
        return existingName === businessName && existingAddress === address;
      });
      if (!isDuplicate && businessName) {
        acc.push(curr);
      }
      return acc;
    }, []);

    // Filter out excluded businesses
    const filteredBusinesses = uniqueBusinesses.filter(business => {
      const businessName = business.name || business.businessName || '';
      return !shouldExcludeBusiness(businessName, excludeKeywords);
    });

    const excludedCount = uniqueBusinesses.length - filteredBusinesses.length;
    if (excludedCount > 0) {
      console.log(`Excluded ${excludedCount} businesses based on keywords: ${excludeKeywords.join(', ')}`);
      await prisma.generationJob.update({
        where: { id: jobId },
        data: {
          progress: `Filtered out ${excludedCount} businesses matching exclusion keywords...`,
        },
      });
    }

    // Limit to maxLeads
    const businessesToProcess = filteredBusinesses.slice(0, maxLeads);

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

        // Social media handles
        let socialMedia = {
          facebook: null as string | null,
          linkedin: null as string | null,
          instagram: null as string | null,
          twitter: null as string | null,
        };

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
            
            // Extract social media handles
            if (scrapedData.socialMedia) {
              socialMedia = {
                facebook: scrapedData.socialMedia.facebook || null,
                linkedin: scrapedData.socialMedia.linkedin || null,
                instagram: scrapedData.socialMedia.instagram || null,
                twitter: scrapedData.socialMedia.twitter || null,
              };
            }
          } catch (error) {
            console.error(`Error scraping ${business.website}:`, error);
          }
        }

        // Generate outreach email only if requested
        let outreachEmail = '';
        if (generateOutreach) {
          outreachEmail = generateOutreachEmail(
            businessName,
            business.category,
            ownerNames,
            business.website,
            business.city,
            template
          );
        }

        // Save lead to database with enrichment data
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
            source: business.source || sourceName,
            outreachEmailDraft: outreachEmail,
            
            // Enrichment fields
            rating: business.rating || null,
            reviewCount: business.reviewCount || null,
            facebookUrl: socialMedia.facebook,
            linkedinUrl: socialMedia.linkedin,
            instagramUrl: socialMedia.instagram,
            twitterUrl: socialMedia.twitter,
            employeeCount: null,
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
