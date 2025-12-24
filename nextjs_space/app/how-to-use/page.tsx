'use client'

import { motion } from 'framer-motion'
import { Search, MapPin, Building2, Mail, FileSpreadsheet, Settings, Database, Sparkles, CheckCircle2, AlertCircle, ArrowRight, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default function HowToUsePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/90 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Search className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Lead Generator Pro
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400">How to Use Guide</p>
            </div>
          </div>
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            How to Use <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Lead Generator Pro</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Follow this comprehensive guide to generate high-quality business leads with AI-powered outreach in minutes.
          </p>
        </motion.div>

        {/* Quick Start */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-12"
        >
          <Card className="border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <Sparkles className="w-5 h-5" />
                Quick Start (3 Simple Steps)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge className="bg-blue-600 text-white">1</Badge>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Select Your Data Source</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Choose Google Maps API (recommended) or other free sources</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-blue-600 text-white">2</Badge>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Configure Your Search</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Add cities, business types, and optional AI outreach settings</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Badge className="bg-blue-600 text-white">3</Badge>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Generate & Export</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Click "Generate Leads" and download your results as CSV or Excel</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Detailed Steps */}
        <div className="space-y-8">
          {/* Step 1: Data Source Selection */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Database className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Step 1: Choose Your Data Source</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Select where to find business leads</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Google Maps API (Recommended)</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Most reliable source with 90%+ success rate. Requires a free API key from Google Cloud Console.</p>
                      <div className="mt-2 text-sm space-y-1">
                        <p className="font-medium text-gray-700 dark:text-gray-300">How to get an API key:</p>
                        <ol className="list-decimal list-inside space-y-1 text-gray-600 dark:text-gray-400">
                          <li>Visit <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a></li>
                          <li>Create a new project or select existing one</li>
                          <li>Enable "Places API" and "Maps JavaScript API"</li>
                          <li>Go to Credentials → Create Credentials → API Key</li>
                          <li>Copy your API key and paste it in the form</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Free Alternatives (Limited)</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Google Search, Yelp, Yellow Pages - May have lower success rates due to anti-bot protections.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                    <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Multi-Source (Best Coverage)</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Combines all sources with smart duplicate detection. Best for maximum lead discovery.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Step 2: Configure Cities */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Step 2: Add California Cities</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Specify target locations</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white mb-2">How to add cities:</p>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                        <span>Type a city name (e.g., "Los Angeles") and press Enter or click the + button</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                        <span>Add multiple cities to increase lead volume</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5" />
                        <span>Click the X button on any city tag to remove it</span>
                      </li>
                    </ul>
                  </div>
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">💡 Pro Tip:</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Start with 2-3 cities for your first run to test the results. Major cities like San Francisco, Los Angeles, and San Diego typically yield more results.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Step 3: Select Business Types */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Step 3: Choose Business Types</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Target specific industries</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white mb-2">Two ways to add business types:</p>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5" />
                        <span><strong>Quick Select:</strong> Choose from 27 popular suggestions (Med Spas, Restaurants, Retail, etc.)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5" />
                        <span><strong>Custom Input:</strong> Type any business type not in the suggestions and press Enter</span>
                      </li>
                    </ul>
                  </div>
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Examples:</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="secondary">Med Spas</Badge>
                      <Badge variant="secondary">Pharmacies</Badge>
                      <Badge variant="secondary">Restaurants</Badge>
                      <Badge variant="secondary">Real Estate Agencies</Badge>
                      <Badge variant="secondary">Dental Clinics</Badge>
                      <Badge variant="secondary">Coffee Shops</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Step 4: AI Outreach (Optional) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Step 4: AI Outreach (Optional)</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Generate personalized emails</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-gray-900 dark:text-white mb-3">Enable this feature to automatically generate personalized outreach emails for each lead.</p>
                    
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="font-medium text-gray-900 dark:text-white mb-2">Choose a Template:</p>
                        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                          <li className="flex items-start gap-2">
                            <ArrowRight className="w-4 h-4 text-pink-600 dark:text-pink-400 mt-0.5" />
                            <span><strong>General Outreach:</strong> Professional introduction and value proposition</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ArrowRight className="w-4 h-4 text-pink-600 dark:text-pink-400 mt-0.5" />
                            <span><strong>Service Provider:</strong> For offering services to businesses</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ArrowRight className="w-4 h-4 text-pink-600 dark:text-pink-400 mt-0.5" />
                            <span><strong>Partnership Proposal:</strong> For collaboration opportunities</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <ArrowRight className="w-4 h-4 text-pink-600 dark:text-pink-400 mt-0.5" />
                            <span><strong>Custom Templates:</strong> Create your own with variables like {'{businessName}'}, {'{ownerName}'}, {'{city}'}</span>
                          </li>
                        </ul>
                      </div>

                      <div className="p-3 bg-pink-50 dark:bg-pink-950/30 rounded-lg border border-pink-200 dark:border-pink-800">
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">💡 Template Variables:</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Use these placeholders in custom templates:</p>
                        <div className="flex flex-wrap gap-2">
                          <code className="px-2 py-1 bg-white dark:bg-gray-900 rounded text-xs">{'{businessName}'}</code>
                          <code className="px-2 py-1 bg-white dark:bg-gray-900 rounded text-xs">{'{ownerName}'}</code>
                          <code className="px-2 py-1 bg-white dark:bg-gray-900 rounded text-xs">{'{category}'}</code>
                          <code className="px-2 py-1 bg-white dark:bg-gray-900 rounded text-xs">{'{city}'}</code>
                          <code className="px-2 py-1 bg-white dark:bg-gray-900 rounded text-xs">{'{website}'}</code>
                        </div>
                      </div>

                      <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">⚠️ Note:</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Disabling AI outreach will skip email generation and save processing time. You can always export leads without outreach emails.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Step 5: Generate & Monitor */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Step 5: Generate & Monitor Progress</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Watch real-time updates</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <p className="text-gray-900 dark:text-white">After clicking "Generate Leads", you'll see:</p>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                      <span><strong>Real-Time Progress Bar:</strong> Shows percentage completed</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                      <span><strong>Status Updates:</strong> See what's happening (finding leads, extracting data, generating emails)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                      <span><strong>Lead Count:</strong> Live count of discovered leads</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
                      <span><strong>Time Estimate:</strong> Approximate completion time</span>
                    </li>
                  </ul>

                  <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">⏱️ Typical Processing Times:</p>
                    <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                      <li>• Small job (1-2 cities, 1-2 types): 2-5 minutes</li>
                      <li>• Medium job (3-5 cities, 3-5 types): 5-15 minutes</li>
                      <li>• Large job (5+ cities, 5+ types): 15-30 minutes</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Step 6: Review & Export */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <FileSpreadsheet className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle>Step 6: Review & Export Results</CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Download your leads</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white mb-2">Review Features:</p>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5" />
                        <span><strong>Search:</strong> Filter leads by business name</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5" />
                        <span><strong>Category Filter:</strong> View specific business types</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5" />
                        <span><strong>Pagination:</strong> Navigate through large result sets</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5" />
                        <span><strong>Lead Details:</strong> Click any lead card to see full information</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <ArrowRight className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5" />
                        <span><strong>Copy to Clipboard:</strong> Quick copy buttons for emails, phones, etc.</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-medium text-gray-900 dark:text-white mb-2">Export Options:</p>
                    <div className="space-y-2">
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="font-medium text-sm text-gray-900 dark:text-white mb-1">📄 CSV Export</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Standard CSV format with all 17 data fields. Perfect for importing into CRM systems.</p>
                      </div>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="font-medium text-sm text-gray-900 dark:text-white mb-1">📊 Excel Export</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Formatted XLSX with headers, proper column widths, and better readability.</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">📋 Exported Data Includes (17 Fields):</p>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-600 dark:text-gray-300">
                      <div>• Business Name</div>
                      <div>• Category</div>
                      <div>• Address</div>
                      <div>• City</div>
                      <div>• State</div>
                      <div>• Phone</div>
                      <div>• Website</div>
                      <div>• Emails (up to 8)</div>
                      <div>• Owner Names (up to 3)</div>
                      <div>• Rating</div>
                      <div>• Review Count</div>
                      <div>• Facebook URL</div>
                      <div>• LinkedIn URL</div>
                      <div>• Instagram URL</div>
                      <div>• Twitter URL</div>
                      <div>• Source</div>
                      <div>• AI Outreach Email</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tips & Best Practices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12"
        >
          <Card className="border-2 border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                <Sparkles className="w-5 h-5" />
                Pro Tips & Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                  <p className="font-medium text-sm text-gray-900 dark:text-white mb-2">✨ For Best Results:</p>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    <li>• Use Google Maps API for most reliable data</li>
                    <li>• Start with 2-3 cities to test results</li>
                    <li>• Try Multi-Source for maximum coverage</li>
                    <li>• Enable dark mode for comfortable viewing</li>
                  </ul>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                  <p className="font-medium text-sm text-gray-900 dark:text-white mb-2">💡 Email Discovery Tips:</p>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    <li>• ~70% of businesses have discoverable emails</li>
                    <li>• Larger businesses = higher email discovery rate</li>
                    <li>• Check multiple pages (About, Contact, Team)</li>
                    <li>• Social media profiles often have contact info</li>
                  </ul>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                  <p className="font-medium text-sm text-gray-900 dark:text-white mb-2">⚡ Performance Tips:</p>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    <li>• Smaller batches = faster results</li>
                    <li>• Disable AI outreach if not needed</li>
                    <li>• Major cities yield more results</li>
                    <li>• Export immediately after completion</li>
                  </ul>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                  <p className="font-medium text-sm text-gray-900 dark:text-white mb-2">🎯 Targeting Tips:</p>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                    <li>• Be specific with business types</li>
                    <li>• Try related business categories</li>
                    <li>• Focus on high-value industries</li>
                    <li>• Test different city combinations</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-12 text-center"
        >
          <Link href="/">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 gap-2">
              <Search className="w-5 h-5" />
              Start Generating Leads
            </Button>
          </Link>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-16 border-t border-gray-200 dark:border-gray-800">
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Need help? Have questions? Visit the homepage for more information.
          </p>
        </div>
      </footer>
    </main>
  )
}
