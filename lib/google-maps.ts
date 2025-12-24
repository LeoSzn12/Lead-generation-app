export interface BusinessResult {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  website?: string;
  placeId: string;
  category: string;
}

export class GoogleMapsClient {
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api/place';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchBusinesses(
    city: string,
    businessType: string,
    maxResults: number = 20
  ): Promise<BusinessResult[]> {
    const results: BusinessResult[] = [];
    
    try {
      // Construct search query
      const query = `${businessType} in ${city}, California`;
      const searchUrl = `${this.baseUrl}/textsearch/json?query=${encodeURIComponent(query)}&key=${this.apiKey}`;

      const response = await fetch(searchUrl);
      const data = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Maps API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      }

      if (!data.results || data.results.length === 0) {
        return results;
      }

      // Process results
      for (const place of data.results.slice(0, maxResults)) {
        // Get detailed info
        await new Promise(resolve => setTimeout(resolve, 200)); // Rate limiting
        const details = await this.getPlaceDetails(place.place_id);

        if (details) {
          results.push({
            name: details.name || place.name,
            address: details.address,
            city: details.city || city,
            state: 'CA',
            phone: details.phone,
            website: details.website,
            placeId: place.place_id,
            category: businessType,
          });
        }
      }

    } catch (error: any) {
      console.error('Error searching businesses:', error);
      throw new Error(`Failed to search businesses: ${error?.message || 'Unknown error'}`);
    }

    return results;
  }

  private async getPlaceDetails(placeId: string): Promise<{
    name: string;
    address?: string;
    city?: string;
    phone?: string;
    website?: string;
  } | null> {
    try {
      const detailsUrl = `${this.baseUrl}/details/json?place_id=${placeId}&fields=name,formatted_address,address_components,formatted_phone_number,website,international_phone_number&key=${this.apiKey}`;
      
      const response = await fetch(detailsUrl);
      const data = await response.json();

      if (data.status !== 'OK') {
        console.log(`Failed to get details for place ${placeId}: ${data.status}`);
        return null;
      }

      const result = data.result;
      let city = '';

      // Extract city from address components
      if (result.address_components) {
        for (const component of result.address_components) {
          if (component.types.includes('locality')) {
            city = component.long_name;
            break;
          }
        }
      }

      return {
        name: result.name,
        address: result.formatted_address,
        city: city,
        phone: result.formatted_phone_number || result.international_phone_number,
        website: result.website,
      };
    } catch (error) {
      console.error(`Error getting place details for ${placeId}:`, error);
      return null;
    }
  }
}
