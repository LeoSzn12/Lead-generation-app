'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Sparkles, Clock, Zap, Globe, CheckCircle2, Mail, Bot } from 'lucide-react'
import { toast } from 'sonner'
import { estimateTime } from '@/lib/utils'
import { TemplateManager, EmailTemplate } from '@/components/template-manager'
import { Separator } from '@/components/ui/separator'

interface LeadGenerationFormProps {
  onJobCreated: (jobId: string) => void
}

export function LeadGenerationForm({ onJobCreated }: LeadGenerationFormProps) {
  const [cities, setCities] = useState('Los Angeles, San Diego')
  const [businessTypesInput, setBusinessTypesInput] = useState('Med Spa, Pharmacy')
  const [maxLeads, setMaxLeads] = useState(10)
  const [source, setSource] = useState<string>('google_maps')
  const [apiKey, setApiKey] = useState('')
  const [rememberApiKey, setRememberApiKey] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generateOutreach, setGenerateOutreach] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  
  // Enhancement States (LeadGen 2.0)
  const [enrichmentStrategy, setEnrichmentStrategy] = useState<'basic' | 'waterfall'>('basic')
  const [customResearchPrompt, setCustomResearchPrompt] = useState('')
  const [selectedEnrichmentFields, setSelectedEnrichmentFields] = useState<string[]>(['tech_stack', 'socials'])

  // Popular business type suggestions
  const popularBusinessTypes = [
    'Med Spa', 'Pharmacy', 'Restaurant', 'Auto Repair', 'Real Estate Agent',
    'Dentist', 'Lawyer', 'Contractor', 'Salon', 'Barber', 'Gym', 'Fitness Center',
    'Pet Grooming', 'Veterinarian', 'Cleaning Service', 'Landscaping', 'HVAC',
    'Plumber', 'Electrician', 'Chiropractor', 'Massage Therapist', 'Nail Salon',
    'Insurance Agent', 'Financial Advisor', 'Accounting', 'Coffee Shop', 'Bakery',
  ]

  const dataSources = [
    { 
      value: 'google_maps', 
      label: 'Google Maps API', 
      description: '⭐ Recommended - Fast & accurate (requires API key)',
      icon: <Zap className="w-4 h-4" />
    },
    { 
      value: 'multi_source', 
      label: 'Multi-Source', 
      description: '🎯 Best Results - Combines Google Maps + Yellow Pages + Yelp',
      icon: <Zap className="w-4 h-4" />
    },
    { 
      value: 'yellowpages', 
      label: 'Yellow Pages', 
      description: '⚠️ Limited - Basic business directory data',
      icon: <Globe className="w-4 h-4" />
    },
    { 
      value: 'yelp', 
      label: 'Yelp Scraping', 
      description: '⚠️ Limited - May not find all businesses',
      icon: <Globe className="w-4 h-4" />
    },
    { 
      value: 'google_search', 
      label: 'Google Search', 
      description: '⚠️ Limited - Often blocked by anti-bot measures',
      icon: <Globe className="w-4 h-4" />
    },
  ]

  // Load saved API key on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('google_maps_api_key')
      if (savedKey) {
        setApiKey(savedKey)
        setRememberApiKey(true)
      }
    }
  }, [])

  const handleBusinessTypeSuggestion = (type: string) => {
    // Add suggestion to input if not already present
    const currentTypes = businessTypesInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    
    if (!currentTypes.includes(type)) {
      setBusinessTypesInput(currentTypes.length > 0 ? `${businessTypesInput}, ${type}` : type)
    }
  }

  const handleRememberApiKey = (checked: boolean) => {
    setRememberApiKey(checked)
    if (!checked && typeof window !== 'undefined') {
      localStorage.removeItem('google_maps_api_key')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!cities.trim()) {
      toast.error('Please enter at least one city')
      return
    }

    // Parse business types from input
    const businessTypesArray = businessTypesInput
      .split(',')
      .map((type) => type.trim())
      .filter(Boolean)

    if (businessTypesArray.length === 0) {
      toast.error('Please enter at least one business type')
      return
    }

    // API key validation removed - using environment variable

    if (maxLeads < 1 || maxLeads > 100) {
      toast.error('Max leads must be between 1 and 100')
      return
    }

    // Save API key if requested
    if (rememberApiKey && apiKey && typeof window !== 'undefined') {
      localStorage.setItem('google_maps_api_key', apiKey)
    }

    setIsSubmitting(true)

    try {
      const cityArray = cities.split(',').map((c) => c.trim()).filter(Boolean)

      const response = await fetch('/api/generate-leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cities: cityArray,
          businessTypes: businessTypesArray,
          maxLeads,
          source,
          apiKey: source === 'google_maps' || source === 'multi_source' ? apiKey : undefined,
          generateOutreach,
          enrichmentSettings: {
            strategy: enrichmentStrategy,
            customPrompt: customResearchPrompt,
            fields: selectedEnrichmentFields
          },
          template: selectedTemplate ? {
            subject: selectedTemplate.subject,
            body: selectedTemplate.body,
          } : undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to start lead generation')
      }

      toast.success('Lead generation started!')
      onJobCreated(data.jobId)
    } catch (error: any) {
      console.error('Error starting lead generation:', error)
      toast.error(error?.message || 'Failed to start lead generation')
    } finally {
      setIsSubmitting(false)
    }
  }

  const timeEstimate = estimateTime(maxLeads, source)

  return (
    <div className="space-y-4">
      {/* API Key Configured Notice */}
      {source === 'google_maps' && (
        <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <CardContent className="pt-4">
            <div className="flex gap-3">
              <div className="text-green-600 dark:text-green-400 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-green-900 dark:text-green-100 text-sm mb-1">
                  ✅ Google Maps API Key Configured!
                </h4>
                <p className="text-xs text-green-800 dark:text-green-200">
                  Your API key is ready! Use "Google Maps API" or "Multi-Source" for best results. Just click "Generate Leads" to start!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
    <Card className="shadow-xl border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          Generate Leads
        </CardTitle>
        <CardDescription>
          Configure your lead generation parameters below
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Data Source Selection */}
          <div className="space-y-2">
            <Label htmlFor="source">Data Source</Label>
            <Select value={source} onValueChange={setSource}>
              <SelectTrigger id="source" className="border-gray-300">
                <SelectValue placeholder="Select data source" />
              </SelectTrigger>
              <SelectContent>
                {dataSources.map((ds) => (
                  <SelectItem key={ds.value} value={ds.value}>
                    <div className="flex items-center gap-2">
                      {ds.icon}
                      <div>
                        <div className="font-medium">{ds.label}</div>
                        <div className="text-xs text-gray-500">{ds.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {source === 'google_maps' 
                ? 'Google Maps API provides the fastest and most accurate real business data. Highly recommended!'
                : '⚠️ Free web scraping often fails due to anti-bot protections. Google Maps API is strongly recommended for reliable results.'}
            </p>
          </div>

          {/* Cities */}
          <div className="space-y-2">
            <Label htmlFor="cities">Cities in California</Label>
            <Input
              id="cities"
              placeholder="Los Angeles, San Diego, San Francisco"
              value={cities}
              onChange={(e) => setCities(e.target.value)}
              className="border-gray-300"
            />
            <p className="text-xs text-gray-500">Separate multiple cities with commas</p>
          </div>

          {/* Business Types */}
          <div className="space-y-3">
            <Label htmlFor="businessTypes">Business Types</Label>
            <Input
              id="businessTypes"
              placeholder="Med Spa, Pharmacy, Restaurant, Auto Repair..."
              value={businessTypesInput}
              onChange={(e) => setBusinessTypesInput(e.target.value)}
              className="border-gray-300"
            />
            <p className="text-xs text-gray-500">
              Separate multiple types with commas. Type ANY business category you want!
            </p>
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-700">Popular suggestions (click to add):</p>
              <div className="flex flex-wrap gap-2">
                {popularBusinessTypes.slice(0, 12).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleBusinessTypeSuggestion(type)}
                    className="text-xs px-2 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
                  >
                    + {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Max Leads */}
          <div className="space-y-2">
            <Label htmlFor="maxLeads">Maximum Leads</Label>
            <Input
              id="maxLeads"
              type="number"
              min="1"
              max="100"
              value={maxLeads}
              onChange={(e) => setMaxLeads(parseInt(e.target.value) || 10)}
              className="border-gray-300"
            />
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>Estimated time: {timeEstimate}</span>
            </div>
          </div>

          <Separator className="my-6" />

          {/* AI Outreach Toggle */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="generateOutreach"
                checked={generateOutreach}
                onCheckedChange={(checked) => {
                  setGenerateOutreach(checked as boolean);
                  if (!checked) setSelectedTemplate(null);
                }}
              />
              <div className="flex-1">
                <Label 
                  htmlFor="generateOutreach" 
                  className="cursor-pointer font-semibold text-base flex items-center gap-2"
                >
                  <Mail className="w-4 h-4 text-blue-600" />
                  Generate AI Outreach Emails
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  Automatically create personalized outreach emails for each lead. Uncheck to skip email generation and save time.
                </p>
              </div>
            </div>

            {/* Template Selection */}
            {generateOutreach && (
              <div className="pl-7 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <Separator />
                <TemplateManager 
                  onSelectTemplate={setSelectedTemplate}
                  selectedTemplateId={selectedTemplate?.id || null}
                />
              </div>
            )}
          </div>

          <Separator className="my-6" />

          {/* LeadGen 2.0: Enrichment Strategy (Clay-inspired) */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
               <Bot className="w-4 h-4 text-purple-600" />
               Enrichment Strategy (Clay-style)
            </h3>
            <div className="grid grid-cols-2 gap-4">
               <div 
                 onClick={() => setEnrichmentStrategy('basic')}
                 className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${enrichmentStrategy === 'basic' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 dark:border-slate-800'}`}
               >
                 <div className="font-bold text-sm mb-1">Standard</div>
                 <div className="text-[10px] text-slate-500">Contact info & Socials</div>
               </div>
               <div 
                 onClick={() => setEnrichmentStrategy('waterfall')}
                 className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${enrichmentStrategy === 'waterfall' ? 'border-purple-600 bg-purple-50/50 shadow-sm' : 'border-slate-100 dark:border-slate-800'}`}
               >
                 <div className="font-bold text-sm mb-1">Waterfall Enrichment</div>
                 <div className="text-[10px] text-slate-500">Deep search + Tech stacks</div>
                 <div className="absolute top-2 right-2 flex gap-1">
                   <div className="bg-purple-600 text-white text-[8px] px-1 rounded uppercase font-bold">New</div>
                 </div>
               </div>
            </div>

            {enrichmentStrategy === 'waterfall' && (
               <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-300">
                  <Label className="text-xs">Data Points to Scrape:</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['tech_stack', 'socials', 'hiring_status', 'funding', 'founder_info'].map(field => (
                      <div key={field} className="flex items-center gap-2">
                        <Checkbox 
                          id={`f-${field}`} 
                          checked={selectedEnrichmentFields.includes(field)}
                          onCheckedChange={(checked) => {
                            if (checked) setSelectedEnrichmentFields([...selectedEnrichmentFields, field]);
                            else setSelectedEnrichmentFields(selectedEnrichmentFields.filter(f => f !== field));
                          }}
                        />
                        <Label htmlFor={`f-${field}`} className="text-xs capitalize cursor-pointer">{field.replace('_', ' ')}</Label>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-2" />
                  
                  <div className="space-y-2">
                    <Label htmlFor="customPrompt" className="text-xs flex items-center gap-2">
                       <Zap className="w-3 h-3 text-orange-500" />
                       Custom AI Research (Thunderbit-style)
                    </Label>
                    <textarea 
                      id="customPrompt"
                      className="w-full min-h-[80px] p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 feedback-ring"
                      placeholder="e.g. 'Check if they have a refund policy page', 'Find their pricing model'"
                      value={customResearchPrompt}
                      onChange={(e) => setCustomResearchPrompt(e.target.value)}
                    />
                    <p className="text-[10px] text-slate-400">GPT-5 Nano will browse the site to find answers.</p>
                  </div>
               </div>
            )}
          </div>

          <Separator className="my-6" />

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold py-6 text-lg shadow-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating Leads...
              </>
            ) : (
              'Generate Leads'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
    </div>
  )
}
