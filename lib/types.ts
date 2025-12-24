// Lead Generation Types
export interface Lead {
  id: string
  jobId: string
  businessName: string
  category: string
  address?: string
  city?: string
  state?: string
  phone?: string
  website?: string
  emails: string[]
  possibleOwnerNames: string[]
  source: string
  outreachEmailDraft: string
  
  // Social Media & Enrichment
  facebookUrl?: string
  linkedinUrl?: string
  instagramUrl?: string
  twitterUrl?: string
  rating?: number
  reviewCount?: number
  employeeCount?: string
  
  // Lead Management
  tags: string[]
  notes?: string
  isContacted: boolean
  contactedAt?: Date
  
  createdAt: Date
  updatedAt: Date
}

export interface GenerationJob {
  id: string
  cities: string[]
  businessTypes: string[]
  maxLeads: number
  status: string
  progress: string
  totalFound: number
  totalProcessed: number
  error?: string
  createdAt: Date
  updatedAt: Date
  leads?: Lead[]
}

export type DataSource = 'google_maps' | 'google_search' | 'yelp' | 'yellowpages' | 'multi_source'

export const DATA_SOURCES = [
  { value: 'google_maps', label: 'Google Maps API', description: '⭐ Recommended - Fast & accurate' },
  { value: 'yellowpages', label: 'Yellow Pages', description: '⚠️ Limited - Basic business data' },
  { value: 'yelp', label: 'Yelp Scraping', description: '⚠️ Limited - May not find all businesses' },
  { value: 'google_search', label: 'Google Search', description: '⚠️ Limited - Often blocked' },
  { value: 'multi_source', label: 'Multi-Source (Recommended)', description: '⭐ Combines multiple sources for best results' },
] as const