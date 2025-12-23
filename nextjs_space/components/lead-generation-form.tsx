'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface LeadGenerationFormProps {
  onJobCreated: (jobId: string) => void
}

export function LeadGenerationForm({ onJobCreated }: LeadGenerationFormProps) {
  const [cities, setCities] = useState('Los Angeles, San Diego')
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['Med Spa'])
  const [maxLeads, setMaxLeads] = useState(10)
  const [apiKey, setApiKey] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const businessTypes = [
    { id: 'medspa', label: 'Med Spa', value: 'Med Spa' },
    { id: 'pharmacy', label: 'Pharmacy', value: 'Pharmacy' },
  ]

  const handleTypeToggle = (value: string) => {
    setSelectedTypes((prev) =>
      prev.includes(value)
        ? prev.filter((t) => t !== value)
        : [...prev, value]
    )
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

    if (!apiKey.trim()) {
      toast.error('Please enter your Google Maps API key')
      return
    }

    if (maxLeads < 1 || maxLeads > 100) {
      toast.error('Max leads must be between 1 and 100')
      return
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
          apiKey,
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
            <p className="text-xs text-gray-500">Between 1 and 100 leads</p>
          </div>

          {/* API Key */}
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
            <p className="text-xs text-gray-500">
              Your API key is never stored and only used for this session
            </p>
          </div>

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
