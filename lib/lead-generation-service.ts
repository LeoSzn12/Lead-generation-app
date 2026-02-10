
import { prisma } from '@/lib/db';
import { GoogleMapsClient } from '@/lib/google-maps';
import { GoogleSearchScraper } from '@/lib/google-search-scraper';
import { YelpScraper } from '@/lib/yelp-scraper';
import { YellowPagesScraper } from '@/lib/yellowpages-scraper';
import { WebScraper } from '@/lib/scraper';
import { ContentScraper } from '@/lib/content-scraper';
import { AIEnrichmentService } from '@/lib/ai-enrichment';
import { generateOutreachEmail } from '@/lib/email-templates';
import { removeDuplicates } from '@/lib/deduplication';
import { verifyEmailBatch, getBestEmail } from '@/lib/email-verification-free';
import { calculateLeadScore } from '@/lib/lead-scoring';

interface LeadGenerationOptions {
  jobId: string;
  userId: string;
  workspaceId: string;
  cities: string[];
  businessTypes: string[];
  maxLeads: number;
  source: string;
  apiKey?: string;
  generateOutreach?: boolean;
  template?: { subject?: string; body?: string };
  enableEmailVerification?: boolean;
  enableAIEnrichment?: boolean;
  enrichmentSettings?: {
    strategy: 'basic' | 'waterfall';
    customPrompt?: string;
    fields?: string[];
  };
}


// Define BusinessData interface matching what scrapers return
export interface BusinessData {
  businessName?: string;
  name?: string; // Some scrapers use this
  address?: string;
  phone?: string;
  website?: string;
  emails?: string[];
  socialMedia?: {
    facebook?: string;
    linkedin?: string;
    instagram?: string;
    twitter?: string;
  };
  
  // New fields for enrichment/scraping
  category?: string;
  city?: string;
  state?: string;
  source?: string;
  rating?: number;
  reviewCount?: number;
  totalReviews?: number;
}

export class LeadGenerationService {
  
  async processJob(options: LeadGenerationOptions) {
    const { 
        jobId, userId, workspaceId, cities, businessTypes, maxLeads, 
        source, apiKey, generateOutreach = true, template, enableEmailVerification = false,
        enrichmentSettings
    } = options;

    try {
      await prisma.generationJob.update({
        where: { id: jobId },
        data: { status: 'processing', progress: 'Starting lead discovery...' },
      });

      const scraper = new WebScraper();
      const allBusinesses: BusinessData[] = [];
      let sourceName = '';

      // Initialize Sources
      if (source === 'google_maps') {
        sourceName = 'Google Maps';
        const googleMaps = new GoogleMapsClient(apiKey!);
        const leadsPerSearch = Math.ceil(maxLeads / (cities.length * businessTypes.length));

        for (const city of cities) {
          for (const businessType of businessTypes) {
            try {
              await this.updateProgress(jobId, `Searching for ${businessType} in ${city} (Google Maps)...`);
              const businesses = await googleMaps.searchBusinesses(city, businessType, leadsPerSearch);
              allBusinesses.push(...businesses.map(b => ({ ...b, source: 'google_maps' })));
              await this.updateProgress(jobId, `Found ${allBusinesses.length} businesses so far...`, allBusinesses.length);
            } catch (error) {
              console.error(`Error searching ${businessType} in ${city}:`, error);
            }
            if (allBusinesses.length >= maxLeads) break;
          }
          if (allBusinesses.length >= maxLeads) break;
        }
      } 
      else if (source === 'google_search') {
          sourceName = 'Google Search';
          const googleSearchScraper = new GoogleSearchScraper();
          await this.updateProgress(jobId, `Searching via Google Search (free)...`);
          const businesses = await googleSearchScraper.findBusinesses(cities, businessTypes, maxLeads);
          allBusinesses.push(...businesses.map(b => ({ ...b, source: 'google_search', category: 'Local Business' })));
          await this.updateProgress(jobId, `Found ${allBusinesses.length} businesses...`, allBusinesses.length);
      }
      else if (source === 'yelp') {
          sourceName = 'Yelp';
          const yelpScraper = new YelpScraper();
          await this.updateProgress(jobId, `Searching via Yelp (free)...`);
          const businesses = await yelpScraper.findBusinesses(cities, businessTypes, maxLeads);
          allBusinesses.push(...businesses.map(b => ({ ...b, source: 'yelp', category: 'Local Business' })));
          await this.updateProgress(jobId, `Found ${allBusinesses.length} businesses...`, allBusinesses.length);
      }
      else if (source === 'yellowpages') {
          sourceName = 'Yellow Pages';
          const ypScraper = new YellowPagesScraper();
          await this.updateProgress(jobId, `Searching via Yellow Pages (free)...`);
          const businesses = await ypScraper.findBusinesses(cities, businessTypes, maxLeads);
          allBusinesses.push(...businesses.map(b => ({ ...b, source: 'yellowpages', category: 'Local Business' })));
          await this.updateProgress(jobId, `Found ${allBusinesses.length} businesses...`, allBusinesses.length);
      }
      else if (source === 'multi_source') {
           sourceName = 'Multi-Source';
           
           // ... (Same logic as before, but ensuring type safety)
           if (apiKey) {
               await this.updateProgress(jobId, `Multi-source: checking Google Maps...`);
               const googleMaps = new GoogleMapsClient(apiKey);
               const leadsPerSearch = Math.ceil(maxLeads * 0.6 / (cities.length * businessTypes.length));
                for (const city of cities) {
                    for (const businessType of businessTypes) {
                        try {
                            const businesses = await googleMaps.searchBusinesses(city, businessType, leadsPerSearch);
                            allBusinesses.push(...businesses.map(b => ({ ...b, source: 'google_maps' })));
                        } catch (e) { console.error(e); }
                    }
                }
           }
           
           const yp = new YellowPagesScraper();
           const ypBiz = await yp.findBusinesses(cities, businessTypes, Math.ceil(maxLeads * 0.3));
           allBusinesses.push(...ypBiz.map(b => ({ ...b, source: 'yellowpages', category: 'Local Business' })));
           
           const yelp = new YelpScraper();
           const yelpBiz = await yelp.findBusinesses(cities, businessTypes, Math.ceil(maxLeads * 0.1));
           allBusinesses.push(...yelpBiz.map(b => ({ ...b, source: 'yelp', category: 'Local Business' })));
      }

      // Deduplicate
      await this.updateProgress(jobId, `Removing duplicates...`);
      // @ts-ignore - removeDuplicates expects any[] usually or specific type, basic dedupe by name/phone
      const uniqueBusinesses = removeDuplicates(allBusinesses, 0.85); 
      await this.updateProgress(jobId, `Processing ${uniqueBusinesses.length} unique businesses...`, uniqueBusinesses.length);

      const businessesToProcess = uniqueBusinesses.slice(0, maxLeads);
      let processedCount = 0;

      for (const business of businessesToProcess) {
          try {
              const businessName = business.name || business.businessName || 'Unknown Business';
              await this.updateProgress(jobId, `Processing ${businessName} (${processedCount + 1}/${businessesToProcess.length})...`);
              
              let emails: string[] = [];
              let phones: string[] = business.phone ? [business.phone] : [];
              let ownerNames: string[] = [];
              let socialMedia = { 
                  facebook: null as string | null, 
                  linkedin: null as string | null, 
                  instagram: null as string | null, 
                  twitter: null as string | null 
              };

              // Scrape Website
              if (business.website) {
                  try {
                      const scrapedData = await scraper.scrapeWebsite(business.website);
                      emails = scrapedData.emails || [];
                      ownerNames = scrapedData.ownerNames || [];
                      if (scrapedData.phones?.length) phones = [...new Set([...phones, ...scrapedData.phones])];
                      if (scrapedData.socialMedia) {
                          socialMedia = {
                              facebook: scrapedData.socialMedia.facebook || null,
                              linkedin: scrapedData.socialMedia.linkedin || null,
                              instagram: scrapedData.socialMedia.instagram || null,
                              twitter: scrapedData.socialMedia.twitter || null
                          };
                      }
                  } catch (e) { console.error(`Scrape error for ${business.website}`, e); }
              }

              // Verify Emails
              let emailValidationStatus = undefined; // Prisma expects string | null | undefined for optional fields in create input? No, nullable string
              let emailValidationStatusStr: string | null = null;
              let emailConfidenceScore: number | null = null;
              let primaryEmail: string | null = null;

              if (enableEmailVerification && emails.length > 0) {
                  const bestEmail = await getBestEmail(emails);
                  if (bestEmail) {
                      const verification = await verifyEmailBatch([bestEmail]);
                      if (verification[0]) {
                          emailValidationStatusStr = verification[0].status;
                          emailConfidenceScore = verification[0].confidence;
                          primaryEmail = bestEmail;
                      }
                  }
              }

              // Score Lead
              const leadScoreData = calculateLeadScore({
                  emails, phone: phones[0], website: business.website || undefined,
                  facebookUrl: socialMedia.facebook || undefined,
                  linkedinUrl: socialMedia.linkedin || undefined,
                  instagramUrl: socialMedia.instagram || undefined,
                  twitterUrl: socialMedia.twitter || undefined,
                  rating: business.rating || undefined, 
                  reviewCount: business.reviewCount || undefined,
                  emailValidationStatus: emailValidationStatusStr || undefined
              });

              // Generate Outreach
              let outreachEmail = '';
              if (generateOutreach) {
                  outreachEmail = generateOutreachEmail(
                      businessName, 
                      business.category || 'Local Business', 
                      ownerNames, 
                      business.website || undefined, 
                      business.city || undefined, 
                      template
                  );
              }

              // AI Enrichment (New)
              let enrichedData: any = null;
              let icebreaker: string | null = null;
              let enrichmentStatus = 'not_started';
              
              if (options.enableAIEnrichment && business.website && apiKey) {
                  try {
                       await this.updateProgress(jobId, `Enriching ${businessName} with AI...`);
                       const contentScraper = new ContentScraper();
                       const enrichmentService = new AIEnrichmentService(apiKey);
                       
                       const pageContent = await contentScraper.scrapeContent(business.website);
                       if (pageContent?.content) {
                           const enrichmentResult = await enrichmentService.enrichLead(
                               businessName, 
                               pageContent.content,
                               enrichmentSettings?.customPrompt
                           );
                           enrichedData = JSON.stringify({
                               summary: enrichmentResult.summary,
                               valueProp: enrichmentResult.valueProp,
                               techStack: enrichmentResult.techStack,
                               hiring: enrichmentResult.hiring,
                               customResearch: enrichmentResult.customResearch
                           });
                           icebreaker = enrichmentResult.icebreaker;
                           enrichmentStatus = 'completed';
                       }
                  } catch (e) {
                      console.error(`Enrichment failed for ${businessName}`, e);
                      enrichmentStatus = 'failed';
                  }
              }


              // Save to DB
              await prisma.lead.create({
                  data: {
                      jobId, workspaceId, businessName, 
                      category: business.category || 'Local Business', 
                      address: business.address, city: business.city, state: business.state || 'California',
                      phone: phones[0] || null, 
                      website: business.website || null, 
                      emails: emails as string[], 
                      possibleOwnerNames: ownerNames as string[],
                      source: business.source || sourceName, 
                      outreachEmailDraft: outreachEmail,
                      emailValidationStatus: emailValidationStatusStr, 
                      emailConfidenceScore: emailConfidenceScore as number | null, 
                      primaryEmail: primaryEmail as string | null,
                      rating: business.rating || null, 
                      reviewCount: business.reviewCount || null,
                      facebookUrl: socialMedia.facebook || null,
                      linkedinUrl: socialMedia.linkedin || null,
                      instagramUrl: socialMedia.instagram || null,
                      twitterUrl: socialMedia.twitter || null,
                      leadScore: leadScoreData.score, 
                      qualityTier: leadScoreData.tier,
                      
                      // AI Fields
                      enrichmentStatus,
                      enrichedData,
                      icebreaker: icebreaker || null
                  }
              });

              processedCount++;
              await prisma.generationJob.update({ where: { id: jobId }, data: { totalProcessed: processedCount } });

          } catch (e) { console.error(`Error processing business`, e); }
      }

      // Update quota
      // @ts-ignore - workspace model might be capitalized or lowercase depending on generation
      const workspaceModel = (prisma as any).workspace || (prisma as any).Workspace;
      if (workspaceModel) {
          await workspaceModel.update({
              where: { id: workspaceId },
              data: { leadsUsed: { increment: processedCount } }
          });
      }

      // Finish
      await prisma.generationJob.update({
        where: { id: jobId },
        data: { status: 'completed', progress: `Successfully generated ${processedCount} leads!` },
      });

      return processedCount;

    } catch (error: any) {
        console.error('Fatal Service Error:', error);
        await prisma.generationJob.update({
            where: { id: jobId },
            data: { status: 'failed', error: error.message, progress: 'Failed.' }
        });
        throw error;
    }
  }

  private async updateProgress(jobId: string, progress: string, totalFound?: number) {
      const data: any = { progress };
      if (typeof totalFound === 'number') data.totalFound = totalFound;
      await prisma.generationJob.update({ where: { id: jobId }, data });
  }
}
