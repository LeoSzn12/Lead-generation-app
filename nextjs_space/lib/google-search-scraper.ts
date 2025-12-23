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
    // 3-5 second delay for Google scraping
    await delay(3000 + Math.random() * 2000)
  }

  async searchBusinesses(
    city: string,
    businessType: string,
    maxResults: number = 10
  ): Promise<GoogleSearchResult[]> {
    const results: GoogleSearchResult[] = []
    const searchQuery = `${businessType} in ${city}, California`

    try {
      // Use a more reliable approach - search Google via fetch
      const encodedQuery = encodeURIComponent(searchQuery)
      const url = `https://www.google.com/search?q=${encodedQuery}&num=${maxResults}`

      await this.respectfulDelay()

      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      })

      if (!response.ok) {
        console.warn(`Google search failed for ${searchQuery}: ${response.status}`)
        return results
      }

      const html = await response.text()
      const $ = cheerio.load(html)

      // Extract business information from Google search results
      // Google's search results have various formats, we'll try multiple selectors
      $('div.g, div[data-hveid], div.Gx5Zad').each((_, element) => {
        if (results.length >= maxResults) return false

        const $el = $(element)
        const title = $el.find('h3').first().text().trim()
        const snippet = $el.find('div.VwiC3b, div[data-sncf]').text().trim()
        const link = $el.find('a').first().attr('href')

        if (title && link) {
          // Extract website from Google redirect link
          let website = link
          if (link.startsWith('/url?q=')) {
            const urlMatch = link.match(/\/url\?q=([^&]+)/)
            if (urlMatch) {
              website = decodeURIComponent(urlMatch[1])
            }
          }

          // Try to extract address and phone from snippet
          const phoneMatch = snippet.match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/)
          const phone = phoneMatch ? phoneMatch[0] : undefined

          // Extract city from context
          const cityMatch = snippet.toLowerCase().includes(city.toLowerCase())

          results.push({
            businessName: title,
            category: businessType,
            website: website.startsWith('http') ? website : undefined,
            phone,
            city: cityMatch ? city : undefined,
            state: 'California',
          })
        }
      })

      console.log(`Google Search found ${results.length} results for "${searchQuery}"`)
    } catch (error) {
      console.error(`Error scraping Google for ${searchQuery}:`, error)
    }

    return results
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
