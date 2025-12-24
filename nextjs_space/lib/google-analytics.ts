// Google Analytics tracking utilities

export const GA_MEASUREMENT_ID = 'G-MNFHRN43M9'

// Track page views
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    })
  }
}

// Track custom events
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string
  category: string
  label?: string
  value?: number
}) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Track lead generation events
export const trackLeadGeneration = ({
  dataSource,
  cities,
  businessTypes,
  withOutreach,
}: {
  dataSource: string
  cities: number
  businessTypes: number
  withOutreach: boolean
}) => {
  event({
    action: 'generate_leads',
    category: 'Lead Generation',
    label: `${dataSource} - ${cities} cities - ${businessTypes} types - ${withOutreach ? 'with' : 'without'} outreach`,
  })
}

// Track export events
export const trackExport = (type: 'csv' | 'excel', leadCount: number) => {
  event({
    action: 'export_leads',
    category: 'Export',
    label: type.toUpperCase(),
    value: leadCount,
  })
}

// Track template events
export const trackTemplate = (action: 'create' | 'edit' | 'delete' | 'use', templateName: string) => {
  event({
    action: `template_${action}`,
    category: 'Templates',
    label: templateName,
  })
}

// Track data source selection
export const trackDataSource = (source: string) => {
  event({
    action: 'select_data_source',
    category: 'Data Source',
    label: source,
  })
}
