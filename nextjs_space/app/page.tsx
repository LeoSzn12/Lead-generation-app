'use client'

import { useState } from 'react'
import { LeadGenerationForm } from '@/components/lead-generation-form'
import { ResultsDisplay } from '@/components/results-display-enhanced'
import { Search, TrendingUp, Users, Moon, Sun, Mail, Star, Database, Sparkles, Facebook, Linkedin, Instagram, Twitter, FileSpreadsheet, BookOpen } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default function Home() {
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const { theme, setTheme } = useTheme()

  const handleJobCreated = (jobId: string) => {
    setActiveJobId(jobId)
    setShowHistory(false)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors">
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
              <p className="text-xs text-gray-600 dark:text-gray-400">AI-Powered Business Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/how-to-use">
              <Button variant="outline" className="hidden sm:flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                How to Use
              </Button>
            </Link>
            <Badge variant="secondary" className="hidden sm:flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span className="text-xs">Phase 1 Complete</span>
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-full"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/30 rounded-full border border-blue-200 dark:border-blue-800 mb-6">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Enhanced with AI-Powered Outreach</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Generate High-Quality <br />
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Business Leads
            </span> in Minutes
          </h2>
          
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Discover and enrich business data for any industry across California. Extract emails, social media handles, 
            and decision-maker contacts with custom AI-generated outreach templates.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mb-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">70%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Email Discovery Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">4+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Data Sources</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">17</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Data Fields</div>
            </div>
          </div>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
              <Database className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Multi-Source Discovery</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Google Maps API, Yelp, Yellow Pages & Google Search with smart duplicate detection.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-800">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Deep Contact Extraction</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Extract 3-8 emails, phone numbers, and 2-3 owner names per business from 12+ page types.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all border border-gray-100 dark:border-gray-800 hover:border-purple-200 dark:hover:border-purple-800">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">AI Outreach Templates</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Custom email templates with AI-generated personalized outreach for each business.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all border border-gray-100 dark:border-gray-800 hover:border-pink-200 dark:hover:border-pink-800">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
              <Star className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Social Media & Ratings</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Extract Facebook, LinkedIn, Instagram, Twitter handles plus ratings and reviews.
            </p>
          </div>
        </motion.div>

        {/* Additional Features Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 mb-12 shadow-2xl"
        >
          <div className="flex flex-wrap justify-center gap-6 text-white">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              <span className="font-medium">Excel & CSV Export</span>
            </div>
            <div className="flex items-center gap-2">
              <Facebook className="w-5 h-5" />
              <span className="font-medium">Social Media</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              <span className="font-medium">Custom Templates</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              <span className="font-medium">Real-Time Progress</span>
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <LeadGenerationForm onJobCreated={handleJobCreated} />
          </motion.div>

          {/* Results Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <ResultsDisplay jobId={activeJobId} />
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-16 border-t border-gray-200 dark:border-gray-800">
        <div className="text-center space-y-4">
          <div className="flex justify-center items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Multi-Source
            </span>
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI-Powered
            </span>
            <span className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Real-Time
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © 2024 Lead Generator Pro. Built with Next.js, TypeScript & Abacus AI.
          </p>
        </div>
      </footer>
    </main>
  )
}
