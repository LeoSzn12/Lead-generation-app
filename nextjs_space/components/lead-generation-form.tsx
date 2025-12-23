'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Sparkles, Clock, Zap, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { estimateTime } from '@/lib/utils'

interface LeadGenerationFormProps {
  onJobCreated: (jobId: string) => void
}

export function LeadGenerationForm({ onJobCreated }: LeadGenerationFormProps) {
  const [cities, setCities] = useState('Los Angeles, San Diego')
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['Med Spa'])
  const [maxLeads, setMaxLeads] = useState(10)
  const [source, setSource] = useState<string>('google_search')
  const [apiKey, setApiKey] = useState('')
  const [rememberApiKey, setRememberApiKey] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const businessTypes = [
    { id: 'medspa', label: 'Med Spa', value: 'Med Spa' },
    { id: 'pharmacy', label: 'Pharmacy', value: 'Pharmacy' },
  ]

  const dataSources = [
    { 
      value: 'google_maps', 
      label: 'Google Maps API', 
      description: 'Fast & accurate (requires API key)',
      icon: <Zap className="w-4 h-4" />
    },
    { 
      value: 'google_search', 
      label: 'Google Search', 
      description: 'Free but slower',
      icon: <Globe className="w-4 h-4" />
    },
    { 
      value: 'yelp', 
      label: 'Yelp Scraping', 
      description: 'Free with good data',
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

  const handleTypeToggle = (value: string) => {
    setSelectedTypes((prev) =>
      prev.includes(value)
        ? prev.filter((t) => t !== value)
        : [...prev, value]
    )
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

    if (selectedTypes.length === 0) {
      toast.error('Please select at least one business type')
      return
    }

    if (source === 'google_maps' && !apiKey.trim()) {
      toast.error('Please enter your Google Maps API key or choose a free data source')
      return
    }

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
          businessTypes: selectedTypes,
          maxLeads,
          source,
          apiKey: source === 'google_maps' ? apiKey : undefined,
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
                ? 'Google Maps API provides the fastest and most accurate results'
                : 'Web scraping is free but slower and may have lower data quality'}
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
            <Label>Business Types</Label>
            <div className="space-y-2">
              {businessTypes.map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={type.id}
                    checked={selectedTypes.includes(type.value)}
                    onCheckedChange={() => handleTypeToggle(type.value)}
                  />
                  <label
                    htmlFor={type.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {type.label}
                  </label>
                </div>
              ))}
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

          {/* API Key (only if Google Maps selected) */}
          {source === 'google_maps' && (
            <div className="space-y-2">
              <Label htmlFor="apiKey">Google Maps API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="border-gray-300"
              />
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberApiKey"
                  checked={rememberApiKey}
                  onCheckedChange={handleRememberApiKey}
                />
                <label
                  htmlFor="rememberApiKey"
                  className="text-xs text-gray-600 cursor-pointer"
                >
                  Remember my API key (stored securely in browser)
                </label>
              </div>
            </div>
          )}

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
  )
}
