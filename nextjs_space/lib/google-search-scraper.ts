import * as cheerio from 'cheerio'
import { delay } from './utils'

interface GoogleSearchResult {
  businessName: string
  category: string
  address?: string
  city?: string
  state?: string
  phone?: string
  website?: string
}

export class GoogleSearchScraper {
  private async respectfulDelay() {
    // 2-3 second delay
    await delay(2000 + Math.random() * 1000)
  }

  async searchBusinesses(
    city: string,
    businessType: string,
    maxResults: number = 10
  ): Promise<GoogleSearchResult[]> {
    // Note: Google Search scraping doesn't work reliably due to anti-bot measures
    // Returning empty results to indicate this data source needs API access
    console.warn(`[Warning] Google Search scraping is blocked. Use Google Maps API for real data.`)
    console.log(`Google Search found 0 results for "${businessType} in ${city}, California" (scraping blocked)`)
    return []
  }

  async findBusinesses(
    cities: string[],
    businessTypes: string[],
    maxLeads: number
  ): Promise<GoogleSearchResult[]> {
    const allResults: GoogleSearchResult[] = []
    const leadsPerQuery = Math.ceil(maxLeads / (cities.length * businessTypes.length))

    for (const city of cities) {
      for (const businessType of businessTypes) {
        if (allResults.length >= maxLeads) break

        const results = await this.searchBusinesses(city, businessType, leadsPerQuery)
        allResults.push(...results)

        if (allResults.length >= maxLeads) break
      }
      if (allResults.length >= maxLeads) break
    }

    return allResults.slice(0, maxLeads)
  }
}
