import * as cheerio from 'cheerio'
import { delay } from './utils'

interface YellowPagesResult {
  businessName: string
  category: string
  address?: string
  city?: string
  state?: string
  phone?: string
  website?: string
  rating?: number
  reviewCount?: number
}

export class YellowPagesScraper {
  private async respectfulDelay() {
    await delay(3000 + Math.random() * 2000) // 3-5 seconds
  }

  async searchBusinesses(
    city: string,
    businessType: string,
    maxResults: number = 10
  ): Promise<YellowPagesResult[]> {
    const results: YellowPagesResult[] = []

    try {
      // Yellow Pages URL format
      const searchQuery = encodeURIComponent(businessType)
      const locationQuery = encodeURIComponent(`${city}, CA`)
      const url = `https://www.yellowpages.com/search?search_terms=${searchQuery}&geo_location_terms=${locationQuery}`

      await this.respectfulDelay()

      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      })

      if (!response.ok) {
        console.warn(`Yellow Pages search failed: ${response.status}`)
        return results
      }

      const html = await response.text()
      const $ = cheerio.load(html)

      // Yellow Pages uses specific selectors for business listings
      $('.result').each((_, element) => {
        if (results.length >= maxResults) return false

        const $el = $(element)
        const name = $el.find('.business-name').text().trim()
        const street = $el.find('.street-address').text().trim()
        const locality = $el.find('.locality').text().trim()
        const phone = $el.find('.phone').text().trim()
        const website = $el.find('.track-visit-website').attr('href')
        const ratingText = $el.find('.rating span').text().trim()
        const reviewText = $el.find('.count').text().trim()

        if (name) {
          results.push({
            businessName: name,
            category: businessType,
            address: street || undefined,
            city: locality || city,
            state: 'California',
            phone: phone || undefined,
            website: website || undefined,
            rating: ratingText ? parseFloat(ratingText) : undefined,
            reviewCount: reviewText ? parseInt(reviewText.replace(/\D/g, '')) : undefined,
          })
        }
      })

      console.log(`Yellow Pages found ${results.length} results for "${businessType}" in ${city}`)
    } catch (error) {
      console.error(`Error scraping Yellow Pages for ${businessType} in ${city}:`, error)
    }

    return results
  }

  async findBusinesses(
    cities: string[],
    businessTypes: string[],
    maxLeadsPerSearch: number = 10
  ): Promise<YellowPagesResult[]> {
    const allResults: YellowPagesResult[] = []

    for (const city of cities) {
      for (const businessType of businessTypes) {
        const results = await this.searchBusinesses(city, businessType, maxLeadsPerSearch)
        allResults.push(...results)
      }
    }

    return allResults
  }
}
