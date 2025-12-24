'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, Clock, CheckCircle2, XCircle, Loader2, Mail, Phone, Globe, User } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'

interface Lead {
  id: string
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
}

interface Job {
  id: string
  status: string
  progress: string
  totalFound: number
  totalProcessed: number
  error?: string
  leads: Lead[]
}

interface ResultsDisplayProps {
  jobId: string | null
}

export function ResultsDisplay({ jobId }: ResultsDisplayProps) {
  const [job, setJob] = useState<Job | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  useEffect(() => {
    if (!jobId) {
      setJob(null)
      return
    }

    setIsLoading(true)
    const pollJob = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`)
        if (!response.ok) throw new Error('Failed to fetch job')
        
        const data = await response.json()
        setJob(data)
        setIsLoading(false)

        // Continue polling if still processing
        if (data.status === 'pending' || data.status === 'processing') {
          setTimeout(pollJob, 2000)
        } else if (data.status === 'completed') {
          toast.success('Lead generation completed!')
        } else if (data.status === 'failed') {
          toast.error(data.error || 'Lead generation failed')
        }
      } catch (error: any) {
        console.error('Error polling job:', error)
        setIsLoading(false)
        toast.error('Failed to fetch job status')
      }
    }

    pollJob()
  }, [jobId])

  const handleDownloadCSV = async () => {
    if (!jobId) return

    try {
      const response = await fetch(`/api/export-csv/${jobId}`)
      if (!response.ok) throw new Error('Failed to download CSV')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `leads-${jobId}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('CSV downloaded successfully!')
    } catch (error: any) {
      console.error('Error downloading CSV:', error)
      toast.error(error?.message || 'Failed to download CSV')
    }
  }

  const getStatusIcon = () => {
    if (!job) return <Clock className="w-5 h-5 text-gray-400" />
    
    switch (job.status) {
      case 'pending':
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = () => {
    if (!job) return 'bg-gray-100 text-gray-700'
    
    switch (job.status) {
      case 'pending':
      case 'processing':
        return 'bg-blue-100 text-blue-700'
      case 'completed':
        return 'bg-green-100 text-green-700'
      case 'failed':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (!jobId) {
    return (
      <Card className="shadow-xl border-gray-200 h-full">
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>Your generated leads will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">No active job. Start generating leads!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card className="shadow-xl border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {getStatusIcon()}
              Status
            </span>
            <Badge className={getStatusColor()}>
              {job?.status || 'unknown'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">{job?.progress || 'Waiting...'}</p>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-gray-500">Found:</span>
                <span className="ml-2 font-semibold text-blue-600">{job?.totalFound || 0}</span>
              </div>
              <div>
                <span className="text-gray-500">Processed:</span>
                <span className="ml-2 font-semibold text-green-600">{job?.totalProcessed || 0}</span>
              </div>
            </div>
          </div>

          {job?.status === 'completed' && job?.leads && job.leads.length > 0 && (
            <Button
              onClick={handleDownloadCSV}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <Download className="mr-2 h-4 w-4" />
              Download CSV ({job.leads.length} leads)
            </Button>
          )}

          {job?.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{job.error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leads Display */}
      {job?.leads && job.leads.length > 0 && (
        <Card className="shadow-xl border-gray-200">
          <CardHeader>
            <CardTitle>Generated Leads ({job.leads.length})</CardTitle>
            <CardDescription>Click on a lead to view details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {job.leads.map((lead, index) => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setSelectedLead(lead)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{lead.businessName}</h4>
                      <p className="text-sm text-gray-600">{lead.category}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {lead.source}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-sm">
                    {lead.city && (
                      <p className="text-gray-600">
                        📍 {lead.city}, {lead.state}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-3 mt-2">
                      {lead.phone && (
                        <span className="flex items-center gap-1 text-gray-700">
                          <Phone className="w-3 h-3" />
                          {lead.phone}
                        </span>
                      )}
                      {lead.emails && lead.emails.length > 0 && (
                        <span className="flex items-center gap-1 text-gray-700">
                          <Mail className="w-3 h-3" />
                          {lead.emails.length} email(s)
                        </span>
                      )}
                      {lead.website && (
                        <span className="flex items-center gap-1 text-gray-700">
                          <Globe className="w-3 h-3" />
                          Website
                        </span>
                      )}
                      {lead.possibleOwnerNames && lead.possibleOwnerNames.length > 0 && (
                        <span className="flex items-center gap-1 text-gray-700">
                          <User className="w-3 h-3" />
                          {lead.possibleOwnerNames.length} contact(s)
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedLead(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">{selectedLead.businessName}</h3>
              <p className="text-gray-600 mt-1">{selectedLead.category}</p>
            </div>

            <div className="p-6 space-y-4">
              {selectedLead.address && (
                <div>
                  <Label className="text-gray-700 font-semibold">Address</Label>
                  <p className="text-gray-900">{selectedLead.address}</p>
                </div>
              )}

              {selectedLead.phone && (
                <div>
                  <Label className="text-gray-700 font-semibold">Phone</Label>
                  <p className="text-gray-900">{selectedLead.phone}</p>
                </div>
              )}

              {selectedLead.website && (
                <div>
                  <Label className="text-gray-700 font-semibold">Website</Label>
                  <a
                    href={selectedLead.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {selectedLead.website}
                  </a>
                </div>
              )}

              {selectedLead.emails && selectedLead.emails.length > 0 && (
                <div>
                  <Label className="text-gray-700 font-semibold">Emails</Label>
                  <div className="space-y-1">
                    {selectedLead.emails.map((email, i) => (
                      <p key={i} className="text-gray-900">{email}</p>
                    ))}
                  </div>
                </div>
              )}

              {selectedLead.possibleOwnerNames && selectedLead.possibleOwnerNames.length > 0 && (
                <div>
                  <Label className="text-gray-700 font-semibold">Possible Decision Makers</Label>
                  <div className="space-y-1">
                    {selectedLead.possibleOwnerNames.map((name, i) => (
                      <p key={i} className="text-gray-900">{name}</p>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-gray-700 font-semibold">Outreach Email Draft</Label>
                <div className="bg-gray-50 rounded-lg p-4 mt-2 whitespace-pre-wrap text-sm text-gray-900 border border-gray-200">
                  {selectedLead.outreachEmailDraft}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <Button
                onClick={() => setSelectedLead(null)}
                variant="outline"
                className="w-full"
              >
                Close
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

function Label({ className, ...props }: React.HTMLAttributes<HTMLLabelElement>) {
  return <label className={`text-sm font-medium ${className || ''}`} {...props} />
}
