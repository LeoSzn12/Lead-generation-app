'use client'

import { useState } from 'react'
import { LeadGenerationForm } from '@/components/lead-generation-form'
import { ResultsDisplay } from '@/components/results-display-enhanced'
import { KanbanBoard } from '@/components/kanban-board'
import { MasterInbox } from '@/components/master-inbox'
import { AgentControlPanel } from '@/components/agent-control-panel'
import EmailCampaignBuilder from '@/components/email-campaign-builder'
import CampaignAnalyticsDashboard from '@/components/campaign-analytics'
import EmailAccountSettings from '@/components/email-account-settings'
import { Search, TrendingUp, Users, Moon, Sun, LayoutDashboard, Send, Kanban, Settings, CheckCircle2, Inbox, Bot, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Toaster } from 'sonner'
import Link from 'next/link'

export default function Home() {
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('search')
  const { theme, setTheme } = useTheme()

  const handleJobCreated = (jobId: string) => {
    setActiveJobId(jobId)
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-none">LeadGen Pro</h1>
                <p className="text-[10px] text-slate-500 font-medium">B2B Outbound System</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('search')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'search' 
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Search className="w-4 h-4" />
                Find Leads
              </button>
              <button
                onClick={() => setActiveTab('crm')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'crm' 
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Kanban className="w-4 h-4" />
                Pipeline
              </button>
       
        <button
          onClick={() => setActiveTab('inbox')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'inbox' 
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Inbox className="w-4 h-4" />
          Inbox
        </button>

        <button
          onClick={() => setActiveTab('agents')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === 'agents' 
              ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Bot className="w-4 h-4" />
          Agents
        </button>
              <button
                onClick={() => setActiveTab('campaigns')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'campaigns' 
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Send className="w-4 h-4" />
                Campaigns
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === 'settings' 
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <Link href="/tutorial">
                <button
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all border border-indigo-100 dark:border-indigo-900/30 ml-2"
                >
                  <Sparkles className="w-4 h-4" />
                  How it Works
                </button>
              </Link>
            </nav>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-full text-slate-500 hover:text-indigo-600"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* TAB: SEARCH & RESULTS */}
        {activeTab === 'search' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            {/* Hero (Only show if no job active yet to keep UI clean?) */}
            {!activeJobId && (
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                  Generate Qualified Leads Instantly
                </h2>
                <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                  Find local businesses, enrich with AI, and launch campaigns in minutes.
                </p>
              </div>
            )}

            <div className="grid lg:grid-cols-3 gap-8 items-start">
              {/* Left: Form */}
              <div className="lg:col-span-1">
                <LeadGenerationForm onJobCreated={handleJobCreated} />
              </div>

              {/* Right: Results */}
              <div className="lg:col-span-2 min-h-[500px]">
                <ResultsDisplay jobId={activeJobId} />
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB: CRM PIPELINE */}
        {activeTab === 'crm' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Deal Pipeline</h2>
              <div className="text-sm text-slate-500">Drag and drop to update status</div>
            </div>
            <KanbanBoard />
          </motion.div>
        )}

        {/* TAB: INBOX */}
        {activeTab === 'inbox' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full">
             <MasterInbox />
          </motion.div>
        )}

        {/* TAB: AGENTS */}
        {activeTab === 'agents' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
             <AgentControlPanel />
          </motion.div>
        )}

        {/* TAB: CAMPAIGNS */}
        {/* TAB: CAMPAIGNS */}
        {activeTab === 'campaigns' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="grid lg:grid-cols-2 gap-8">
               <div className="space-y-6">
                 <div className="flex items-center gap-2 mb-2">
                   <div className="bg-indigo-100 p-2 rounded-lg"><Send className="w-5 h-5 text-indigo-600"/></div>
                   <h3 className="text-lg font-bold text-slate-800">Campaign Builder</h3>
                 </div>
                 <EmailCampaignBuilder />
               </div>
               <div className="space-y-6">
                 <div className="flex items-center gap-2 mb-2">
                    <div className="bg-emerald-100 p-2 rounded-lg"><TrendingUp className="w-5 h-5 text-emerald-600"/></div>
                    <h3 className="text-lg font-bold text-slate-800">Performance Analytics</h3>
                 </div>
                 <CampaignAnalyticsDashboard />
               </div>
            </div>
          </motion.div>
        )}

        {/* TAB: SETTINGS */}
        {activeTab === 'settings' && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto">
             <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Email Settings</h2>
                <p className="text-slate-500">Connect your SMTP accounts and manage warmup.</p>
             </div>
             <EmailAccountSettings />
           </motion.div>
        )}

      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 safe-bottom">
        <div className="flex justify-around items-center h-16 px-2">
          {[
            { id: 'search', icon: Search, label: 'Leads' },
            { id: 'crm', icon: Kanban, label: 'Pipeline' },
            { id: 'inbox', icon: Inbox, label: 'Inbox' },
            { id: 'agents', icon: Bot, label: 'Agents' },
            { id: 'campaigns', icon: Send, label: 'Campaigns' },
            { id: 'settings', icon: Settings, label: 'Settings' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
                activeTab === tab.id 
                  ? 'text-indigo-600 dark:text-indigo-400' 
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </main>
  )
}
