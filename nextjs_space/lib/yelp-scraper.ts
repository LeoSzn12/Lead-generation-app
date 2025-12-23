import * as cheerio from 'cheerio'
import { delay } from './utils'

interface YelpSearchResult {
  businessName: string
  category: string
  address?: string
  city?: string
  state?: string
  phone?: string
  website?: string
}

export class YelpScraper {
  private async respectfulDelay() {
    // 3-4 second delay for Yelp scraping
    await delay(3000 + Math.random() * 1000)
  }

  async searchBusinesses(
    city: string,
    businessType: string,
    maxResults: number = 10
  ): Promise<YelpSearchResult[]> {
    const results: YelpSearchResult[] = []

    try {
      // Map business type to Yelp categories
      const yelpCategory = businessType.toLowerCase().replace(/\s+/g, '')
      const searchQuery = businessType.toLowerCase().replace(/\s+/g, '+')
      const cityQuery = city.toLowerCase().replace(/\s+/g, '+')
      
      const url = `https://www.yelp.com/search?find_desc=${searchQuery}&find_loc=${cityQuery}%2C+CA`

      await this.respectfulDelay()

      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      })

      if (!response.ok) {
        console.warn(`Yelp search failed for ${city}, ${businessType}: ${response.status}`)
        return results
      }

      const html = await response.text()
      const $ = cheerio.load(html)

      // Yelp search results structure
      $('div[data-testid="serp-ia-card"], li.css-1p9ibgf, div.container__09f24__FeTO6').each((_, element) => {
        if (results.length >= maxResults) return false

        const $el = $(element)
        
        // Try multiple selectors for business name
        const businessName =
          $el.find('h3 a, h2 a, a[data-analytics-label="biz-name"]').first().text().trim() ||
          $el.find('[class*="businessName"]').first().text().trim()

        // Try to find address
        const address =
          $el.find('address, [data-testid="address"], p.css-chan6m').first().text().trim() ||
          $el.find('[class*="address"]').first().text().trim()

        // Try to find phone
        const phoneText = $el.find('[data-testid="phone"], .css-1p9ibgf').text()
        const phoneMatch = phoneText.match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/)
        const phone = phoneMatch ? phoneMatch[0] : undefined

        // Get link to business page for website
        const businessLink = $el.find('h3 a, h2 a').first().attr('href')
        const website = businessLink
          ? businessLink.startsWith('http')
            ? businessLink
            : `https://www.yelp.com${businessLink}`
          : undefined

        if (businessName) {
          results.push({
            businessName,
            category: businessType,
            address,
            city,
            state: 'California',
            phone,
            website,
          })
        }
      })

      console.log(`Yelp found ${results.length} results for "${businessType}" in ${city}`)
    } catch (error) {
      console.error(`Error scraping Yelp for ${city}, ${businessType}:`, error)
    }

    return results
  }

  async findBusinesses(
    cities: string[],
    businessTypes: string[],
    maxLeads: number
  ): Promise<YelpSearchResult[]> {
    const allResults: YelpSearchResult[] = []
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
