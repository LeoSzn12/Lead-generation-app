
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus, Trash2, Bot, MapPin, Target, Activity, Clock, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';

interface Agent {
  id: string;
  name: string;
  niche: string;
  location: string;
  dailyLimit: number;
  isActive: boolean;
  lastRunAt: string | null;
  nextRunAt: string;
  totalLeadsFound: number;
  totalRuns: number;
}

export function AgentControlPanel() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form State
  const [newAgent, setNewAgent] = useState({
    name: '',
    niche: '',
    location: '',
    dailyLimit: 20,
    campaignId: ''
  });

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/agents');
      const data = await res.json();
      if (Array.isArray(data)) setAgents(data);
    } catch (error) {
      console.error('Failed to load agents');
    }
  };

  const handleRunAgents = async () => {
    setIsRunning(true);
    toast.info('Waking up agents...');
    try {
      const res = await fetch('/api/agents/run', { method: 'POST' });
      const data = await res.json();
      
      if (data.results) {
         const successCount = data.results.filter((r: any) => r.status === 'success').length;
         if (successCount > 0) {
             toast.success(`Agents executed successfully! Found leads.`);
         } else {
             toast.info('Agents checked. None were due or found leads.');
         }
      }
      fetchAgents();
    } catch (error) {
      toast.error('Failed to run agents');
    } finally {
      setIsRunning(false);
    }
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAgent)
      });
      
      if (res.ok) {
        toast.success('Agent created');
        setShowCreateForm(false);
        setNewAgent({ name: '', niche: '', location: '', dailyLimit: 20, campaignId: '' });
        fetchAgents();
      } else {
        toast.error('Failed to create agent');
      }
    } catch (error) {
      toast.error('Error creating agent');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Bot className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            Auto-Pilot Agents
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Background workers that find and enrich leads automatically.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Agent
          </button>
          
          <button
            onClick={handleRunAgents}
            disabled={isRunning}
            className={`flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all ${isRunning ? 'opacity-70 cursor-not-allowed' : 'shadow-lg shadow-indigo-200 dark:shadow-indigo-900/30'}`}
          >
            <Play className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Agents Running...' : 'Wake Up Agents'}
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-br from-indigo-50 to-white dark:from-slate-800 dark:to-slate-900 border-indigo-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                    <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                    <h3 className="text-sm font-medium text-slate-500">Active Agents</h3>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{agents.filter(a => a.isActive).length}</p>
                </div>
            </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-emerald-50 to-white dark:from-slate-800 dark:to-slate-900 border-emerald-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                    <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                    <h3 className="text-sm font-medium text-slate-500">Total Leads Found</h3>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {agents.reduce((acc, curr) => acc + curr.totalLeadsFound, 0)}
                    </p>
                </div>
            </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-amber-50 to-white dark:from-slate-800 dark:to-slate-900 border-amber-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                    <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                    <h3 className="text-sm font-medium text-slate-500">Total Runs</h3>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                        {agents.reduce((acc, curr) => acc + curr.totalRuns, 0)}
                    </p>
                </div>
            </div>
        </Card>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showCreateForm && (
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
            >
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Deploy New Agent</h3>
                    <form onSubmit={handleCreateAgent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Agent Name</label>
                            <input 
                                className="w-full px-3 py-2 border rounded-md dark:bg-slate-900 dark:border-slate-700" 
                                placeholder="e.g. Miami Dentists Finder"
                                value={newAgent.name}
                                onChange={e => setNewAgent({...newAgent, name: e.target.value})}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Daily Lead Limit</label>
                            <input 
                                type="number"
                                className="w-full px-3 py-2 border rounded-md dark:bg-slate-900 dark:border-slate-700" 
                                value={newAgent.dailyLimit}
                                onChange={e => setNewAgent({...newAgent, dailyLimit: parseInt(e.target.value)})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Target Niche</label>
                            <input 
                                className="w-full px-3 py-2 border rounded-md dark:bg-slate-900 dark:border-slate-700" 
                                placeholder="e.g. Dentist, Coffee Shop"
                                value={newAgent.niche}
                                onChange={e => setNewAgent({...newAgent, niche: e.target.value})}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Target Location</label>
                            <input 
                                className="w-full px-3 py-2 border rounded-md dark:bg-slate-900 dark:border-slate-700" 
                                placeholder="e.g. Miami, FL"
                                value={newAgent.location}
                                onChange={e => setNewAgent({...newAgent, location: e.target.value})}
                                required
                            />
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-2 mt-4">
                            <button 
                                type="button" 
                                onClick={() => setShowCreateForm(false)}
                                className="px-4 py-2 text-slate-600 hover:text-slate-800"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                            >
                                Deploy Agent
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Agents List */}
      <div className="grid grid-cols-1 gap-4">
        {agents.map(agent => (
            <div key={agent.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 transition-all hover:shadow-md">
                <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-slate-700 rounded-full flex items-center justify-center">
                        <Bot className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{agent.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${agent.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                {agent.isActive ? 'Active' : 'Paused'}
                            </span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                            <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {agent.niche}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {agent.location}</span>
                            <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {agent.dailyLimit}/day</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6 text-sm">
                    <div className="text-right">
                        <p className="text-slate-500">Last Run</p>
                        <p className="font-medium">
                            {agent.lastRunAt ? new Date(agent.lastRunAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Never'}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-slate-500">Next Run</p>
                        <p className="font-medium text-emerald-600">
                            {new Date(agent.nextRunAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                    </div>
                </div>
            </div>
        ))}

        {agents.length === 0 && !isLoading && (
            <div className="text-center py-12 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <Bot className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No agents deployed yet.</p>
            </div>
        )}
      </div>
    </div>
  );
}
