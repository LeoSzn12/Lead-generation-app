'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, Clock, CheckCircle2, XCircle, Loader2, Mail, Phone, Globe, User, Copy, Check, FileSpreadsheet, RefreshCw, Search, Filter, Facebook, Linkedin, Instagram, Twitter, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import * as XLSX from 'xlsx'

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
  
  // Enrichment fields
  rating?: number
  reviewCount?: number
  facebookUrl?: string
  linkedinUrl?: string
  instagramUrl?: string
  twitterUrl?: string
  employeeCount?: string
  
  // Enrichment fields (New)
  enrichmentStatus?: string
  websiteContent?: string
  enrichedData?: string
  icebreaker?: string
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
  const [copiedField, setCopiedField] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const leadsPerPage = 10

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

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopiedField(''), 2000)
    } catch (error) {
      toast.error('Failed to copy')
    }
  }

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

  const handleDownloadExcel = () => {
    if (!job?.leads || job.leads.length === 0) return

    try {
      const worksheetData = job.leads.map(lead => ({
        'Business Name': lead.businessName,
        'Category': lead.category,
        'Rating': lead.rating ? lead.rating.toFixed(1) : '',
        'Review Count': lead.reviewCount || '',
        'Address': lead.address || '',
        'City': lead.city || '',
        'State': lead.state || '',
        'Phone': lead.phone || '',
        'Website': lead.website || '',
        'Emails': lead.emails.join(', '),
        'Possible Owner Names': lead.possibleOwnerNames.join(', '),
        'Facebook': lead.facebookUrl || '',
        'LinkedIn': lead.linkedinUrl || '',
        'Instagram': lead.instagramUrl || '',
        'Twitter': lead.twitterUrl || '',
        'Source': lead.source,
        'Outreach Email Draft': lead.outreachEmailDraft || '',
      }))

      const worksheet = XLSX.utils.json_to_sheet(worksheetData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Leads')

      // Auto-size columns with better width calculation
      const colWidths = Object.keys(worksheetData[0] || {}).map(key => {
        const maxContentLength = Math.max(
          key.length,
          ...worksheetData.map(row => String(row[key as keyof typeof row] || '').length)
        );
        return {
          wch: Math.min(50, Math.max(10, maxContentLength + 2))
        };
      });
      worksheet['!cols'] = colWidths;

      // Add header styling
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!worksheet[cellAddress]) continue;
        worksheet[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "4472C4" } },
          alignment: { horizontal: "center" }
        };
      }

      XLSX.writeFile(workbook, `leads-${jobId}.xlsx`)
      toast.success('Excel file downloaded!')
    } catch (error) {
      console.error('Error creating Excel:', error)
      toast.error('Failed to create Excel file')
    }
  }

  const handleRetry = async () => {
    toast.info('Retry functionality coming soon!')
  }

  const handleEnrich = async (leadId: string) => {
    if (!job) return
    
    // Optimistic update
    setJob({
      ...job,
      leads: job.leads.map(l => l.id === leadId ? { ...l, enrichmentStatus: 'processing' } : l)
    })
    
    try {
      const res = await fetch(`/api/leads/${leadId}/enrich`, { method: 'POST' })
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error)

      // Update with enriched data
      const updatedLead = data.lead
      setJob(prev => prev ? ({
        ...prev,
        leads: prev.leads.map(l => l.id === leadId ? { ...l, ...updatedLead } : l)
      }) : null)
      
      toast.success('Lead enriched successfully!')
      
      // Also update selectedLead if it's the one open
      if (selectedLead?.id === leadId) {
        setSelectedLead(prev => prev ? ({ ...prev, ...updatedLead }) : null)
      }
      
    } catch (err: any) {
      console.error('Enrichment failed', err)
      toast.error(err.message || 'Enrichment failed')
      // Revert/Fail status
      setJob(prev => prev ? ({
        ...prev,
        leads: prev.leads.map(l => l.id === leadId ? { ...l, enrichmentStatus: 'failed' } : l)
      }) : null)
    }
  }

  // Filter and search logic
  const filteredLeads = job?.leads?.filter(lead => {
    const matchesSearch = searchTerm === '' || 
      lead.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.emails.some(email => email.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = filterCategory === 'all' || lead.category === filterCategory
    
    return matchesSearch && matchesCategory
  }) || []

  // Pagination
  const totalPages = Math.ceil(filteredLeads.length / leadsPerPage)
  const startIndex = (currentPage - 1) * leadsPerPage
  const paginatedLeads = filteredLeads.slice(startIndex, startIndex + leadsPerPage)

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
            <div className="flex gap-2">
              <Button
                onClick={handleDownloadCSV}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
              <Button
                onClick={handleDownloadExcel}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Excel
              </Button>
            </div>
          )}

          {job?.status === 'failed' && (
            <div className="space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{job.error}</p>
              </div>
              <Button
                onClick={handleRetry}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Search and Filter */}
      {job?.leads && job.leads.length > 0 && (
        <Card className="shadow-xl border-gray-200">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by business name, city, or email..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-10"
                />
              </div>
              <div className="w-full md:w-48">
                <Select value={filterCategory} onValueChange={(value) => {
                  setFilterCategory(value)
                  setCurrentPage(1)
                }}>
                  <SelectTrigger>
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Med Spa">Med Spa</SelectItem>
                    <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {filteredLeads.length !== job.leads.length && (
              <p className="text-sm text-gray-500 mt-2">
                Showing {filteredLeads.length} of {job.leads.length} leads
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Leads Display */}
      {paginatedLeads.length > 0 && (
        <Card className="shadow-xl border-gray-200">
          <CardHeader>
            <CardTitle>Generated Leads ({filteredLeads.length})</CardTitle>
            <CardDescription>Click on a lead to view full details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {paginatedLeads.map((lead, index) => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setSelectedLead(lead)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{lead.businessName}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-gray-600">{lead.category}</p>
                        {lead.rating && (
                          <span className="text-xs text-yellow-600 font-medium">
                            ⭐ {lead.rating.toFixed(1)} {lead.reviewCount && `(${lead.reviewCount})`}
                          </span>
                        )}
                      </div>
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
                    
                    {/* Social Media Icons */}
                    {(lead.facebookUrl || lead.linkedinUrl || lead.instagramUrl || lead.twitterUrl) && (
                      <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100">
                        {lead.facebookUrl && (
                          <a
                            href={lead.facebookUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Facebook"
                          >
                            <Facebook className="w-4 h-4" />
                          </a>
                        )}
                        {lead.linkedinUrl && (
                          <a
                            href={lead.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-700 hover:text-blue-900 transition-colors"
                            title="LinkedIn"
                          >
                            <Linkedin className="w-4 h-4" />
                          </a>
                        )}
                        {lead.instagramUrl && (
                          <a
                            href={lead.instagramUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-pink-600 hover:text-pink-800 transition-colors"
                            title="Instagram"
                          >
                            <Instagram className="w-4 h-4" />
                          </a>
                        )}
                        {lead.twitterUrl && (
                          <a
                            href={lead.twitterUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-600 hover:text-sky-800 transition-colors"
                            title="Twitter"
                          >
                            <Twitter className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
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
              <div className="flex items-center gap-3 mt-1">
                <p className="text-gray-600">{selectedLead.category}</p>
                {selectedLead.rating && (
                  <span className="text-sm text-yellow-600 font-semibold">
                    ⭐ {selectedLead.rating.toFixed(1)} ({selectedLead.reviewCount || 0} reviews)
                  </span>
                )}
                <Badge variant="outline">{selectedLead.source}</Badge>
              </div>
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
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-gray-700 font-semibold">Phone</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(selectedLead.phone!, `phone-${selectedLead.id}`)}
                    >
                      {copiedField === `phone-${selectedLead.id}` ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
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
                    className="text-blue-600 hover:underline block"
                  >
                  </a>
                </div>
              )}

              {/* AI Enrichment Section */}
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-sm font-semibold text-indigo-700 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    AI Insights
                    {selectedLead.enrichmentStatus === 'processing' && <Loader2 className="w-3 h-3 animate-spin" />}
                  </h4>
                  {selectedLead.enrichmentStatus !== 'completed' && selectedLead.enrichmentStatus !== 'processing' && (
                    <Button 
                      onClick={() => handleEnrich(selectedLead.id)}
                      disabled={!selectedLead.website}
                      size="sm"
                      className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      {selectedLead.website ? '⚡ Enrich Lead' : 'No Website'}
                    </Button>
                  )}
                </div>

                {selectedLead.enrichmentStatus === 'completed' && (() => {
                  let data = null;
                  try {
                    data = selectedLead.enrichedData ? JSON.parse(selectedLead.enrichedData) : null;
                  } catch (e) {}

                  return (
                    <div className="space-y-3 text-sm">
                      {selectedLead.icebreaker && (
                        <div className="bg-white p-3 rounded border border-indigo-100 shadow-sm relative group">
                          <div className="text-xs text-indigo-500 font-medium mb-1 flex items-center gap-1">
                            🧊 Icebreaker
                          </div>
                          <p className="text-gray-700 italic pr-8">"{selectedLead.icebreaker}"</p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => copyToClipboard(selectedLead.icebreaker!, 'icebreaker')}
                          >
                            {copiedField === 'icebreaker' ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3 text-gray-400" />}
                          </Button>
                        </div>
                      )}
                      
                      {data && (
                        <div className="grid grid-cols-1 gap-3">
                          {data.summary && (
                            <div>
                              <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Summary</div>
                              <div className="text-gray-800 leading-relaxed">{data.summary}</div>
                            </div>
                          )}
                          
                          {data.valueProp && (
                            <div>
                              <div className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Value Proposition</div>
                              <div className="text-gray-800 font-medium">{data.valueProp}</div>
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2 items-start mt-1">
                            {data.techStack?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 input-label">
                                {data.techStack.map((tech: string) => (
                                  <Badge key={tech} variant="secondary" className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 font-normal">
                                    {tech}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            {data.hiring && (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">
                                🚀 Hiring
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Social Media Handles */}
              {(selectedLead.facebookUrl || selectedLead.linkedinUrl || selectedLead.instagramUrl || selectedLead.twitterUrl) && (
                <div>
                  <Label className="text-gray-700 font-semibold mb-2 block">Social Media</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedLead.facebookUrl && (
                      <a
                        href={selectedLead.facebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors"
                      >
                        <Facebook className="w-4 h-4" />
                        <span className="text-sm font-medium">Facebook</span>
                      </a>
                    )}
                    {selectedLead.linkedinUrl && (
                      <a
                        href={selectedLead.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md transition-colors"
                      >
                        <Linkedin className="w-4 h-4" />
                        <span className="text-sm font-medium">LinkedIn</span>
                      </a>
                    )}
                    {selectedLead.instagramUrl && (
                      <a
                        href={selectedLead.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-md transition-colors"
                      >
                        <Instagram className="w-4 h-4" />
                        <span className="text-sm font-medium">Instagram</span>
                      </a>
                    )}
                    {selectedLead.twitterUrl && (
                      <a
                        href={selectedLead.twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-md transition-colors"
                      >
                        <Twitter className="w-4 h-4" />
                        <span className="text-sm font-medium">Twitter</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {selectedLead.emails && selectedLead.emails.length > 0 && (
                <div>
                  <Label className="text-gray-700 font-semibold">Emails</Label>
                  <div className="space-y-1">
                    {selectedLead.emails.map((email, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-50 rounded p-2">
                        <p className="text-gray-900">{email}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(email, `email-${i}`)}
                        >
                          {copiedField === `email-${i}` ? (
                            <Check className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
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
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-gray-700 font-semibold">Outreach Email Draft</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(selectedLead.outreachEmailDraft, 'email-draft')}
                  >
                    {copiedField === 'email-draft' ? (
                      <>
                        <Check className="w-4 h-4 text-green-600 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-sm text-gray-900 border border-gray-200">
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
