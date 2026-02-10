'use client'

import { motion } from 'framer-motion'
import { 
  Search, 
  Bot, 
  Mail, 
  Phone, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  Users, 
  BarChart3,
  MousePointer2,
  Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const steps = [
  {
    title: "1. Discover Your Leads",
    description: "Use our multi-source scraper to find businesses in any city and niche. We tap into Google Maps, Yelp, and YellowPages simultaneously.",
    icon: Search,
    color: "bg-blue-500",
    shadow: "shadow-blue-500/20"
  },
  {
    title: "2. AI Enrichment",
    description: "Our 'Brain' (GPT-5 Nano) visits every website, extracts social links, tech stacks, and writes a personalized icebreaker for every single lead.",
    icon: Bot,
    color: "bg-purple-500",
    shadow: "shadow-purple-500/20"
  },
  {
    title: "3. Automated Outreach",
    description: "Deploy an 'Agent' that works while you sleep. They scrape, enrich, and email leads based on your custom schedule and volume limits.",
    icon: Mail,
    color: "bg-indigo-500",
    shadow: "shadow-indigo-500/20"
  },
  {
    title: "4. Closing via Voice AI",
    description: "Need a human touch? Push a button to have our Vapi-powered AI call the lead to book a meeting or answer qualifying questions.",
    icon: Phone,
    color: "bg-rose-500",
    shadow: "shadow-rose-500/20"
  }
]

export default function TutorialPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-20">
        {/* Navigation */}
        <nav className="flex justify-between items-center mb-16">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-indigo-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
              <Search className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">LeadGen Pro</span>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="text-slate-600 dark:text-slate-400 font-medium">
              Back to App
            </Button>
          </Link>
        </nav>

        {/* Hero Section */}
        <section className="text-center mb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-6">
              <Sparkles className="w-3 h-3" />
              Interactive Demo Guide
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white mb-8 tracking-tight">
              Master your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 uppercase">Outbound Engine</span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              New to LeadGen Pro? This 2-minute guide will show you how to find, enrich, and convert 
              local businesses into paying customers using AI.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-12 text-base shadow-xl shadow-indigo-500/20">
                  Got it, Take me to App
                </Button>
              </Link>
            </div>
          </motion.div>
        </section>

        {/* Steps Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 ${step.shadow} hover:shadow-2xl transition-all duration-500 group`}
            >
              <div className={`${step.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <step.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{step.title}</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                {step.description}
              </p>
              <div className="flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                View Feature <ArrowRight className="w-4 h-4" />
              </div>
            </motion.div>
          ))}
        </section>

        {/* AI Stats Section */}
        <section className="bg-indigo-600 rounded-[3rem] p-12 text-center text-white relative overflow-hidden mb-32">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800" />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold mb-12">Powered by Advanced Intelligence</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div>
                <div className="text-4xl font-bold mb-2">GPT-5</div>
                <div className="text-indigo-100 text-sm">Enrichment Brain</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">Vapi</div>
                <div className="text-indigo-100 text-sm">Voice AI Protocol</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">Active</div>
                <div className="text-indigo-100 text-sm">Auto-Pilot Agents</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">Real-time</div>
                <div className="text-indigo-100 text-sm">Web Scraping</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">Ready to launch your first campaign?</h2>
          <p className="text-slate-500 mb-10 max-w-lg mx-auto">Start searching for leads, enrich them with AI, and watch your pipeline grow.</p>
          <Link href="/">
            <Button size="lg" className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white hover:opacity-90 px-10 h-14 text-lg rounded-2xl shadow-xl">
              Get Started Now
            </Button>
          </Link>
        </section>

        {/* Footer */}
        <footer className="mt-40 pt-10 border-t border-slate-200 dark:border-slate-800 text-center text-slate-500 text-sm">
          &copy; 2026 LeadGen Pro. All rights reserved.
        </footer>
      </div>
    </div>
  )
}
