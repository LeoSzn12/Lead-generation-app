'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Loader2, RefreshCw, Send, Paperclip, Archive, Trash2, Search, Mail, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

interface Thread {
  id: string;
  subject: string;
  lastMessageAt: string;
  snippet: string;
  unreadCount: number;
  lead?: {
    id: string;
    businessName: string;
    status: string;
    leadScore: number;
  };
  messages: {
    id: string;
    from: string;
    subject: string;
    sentAt: string;
    isRead: boolean;
  }[];
}

interface Message {
  id: string;
  from: string;
  to: string;
  body: string;
  sentAt: string;
  isFromMe: boolean;
}

export function MasterInbox() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/inbox/threads?limit=50');
      const data = await res.json();
      if (data.threads) {
        setThreads(data.threads);
      }
    } catch (error) {
      console.error('Failed to load inbox:', error);
      toast.error('Failed to load inbox');
    } finally {
      setIsLoading(false);
    }
  };

  const syncInbox = async () => {
    setIsSyncing(true);
    toast.info('Syncing emails...');
    try {
      const res = await fetch('/api/inbox/sync', { method: 'POST' });
      const data = await res.json();
      if (data.results) {
         toast.success(`Sync complete. ${data.results.length} accounts checked.`);
         fetchThreads(); // Refresh list
      }
    } catch (error) {
      toast.error('Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSendReply = async () => {
    if (!activeThreadId || !replyText.trim()) return;
    
    setIsSending(true);
    try {
        const res = await fetch('/api/inbox/reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ threadId: activeThreadId, body: replyText })
        });
        
        if (!res.ok) throw new Error('Failed to send');
        
        toast.success('Reply sent!');
        setReplyText('');
        fetchThreads(); 
    } catch (error) {
        toast.error('Failed to send reply');
    } finally {
        setIsSending(false);
    }
  };

  const activeThread = threads.find(t => t.id === activeThreadId);

  return (
    <div className="flex bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-[calc(100vh-200px)]">
      {/* Sidebar: Thread List */}
      <div className="w-1/3 border-r border-slate-200 flex flex-col bg-white">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Inbox
          </h3>
          <Button variant="ghost" size="icon" onClick={syncInbox} disabled={isSyncing} className="h-8 w-8 hover:bg-slate-200/50">
            <RefreshCw className={`w-4 h-4 text-slate-500 ${isSyncing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        <div className="p-2 border-b border-slate-100">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                <Input placeholder="Search emails..." className="pl-9 h-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors text-sm" />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
             <div className="flex flex-col items-center justify-center p-8 h-full">
                <Loader2 className="w-6 h-6 animate-spin text-slate-300 mb-2" />
                <span className="text-xs text-slate-400">Loading threads...</span>
             </div>
          ) : threads.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-8 h-full text-center">
                <Mail className="w-8 h-8 text-slate-300 mb-2" />
                <div className="text-slate-500 text-sm font-medium">Inbox Empty</div>
                <div className="text-slate-400 text-xs">Sync to fetch recent emails.</div>
             </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {threads.map(thread => (
                 <button
                   key={thread.id}
                   onClick={() => setActiveThreadId(thread.id)}
                   className={`w-full text-left p-4 transition-all hover:bg-slate-50 ${activeThreadId === thread.id ? 'bg-indigo-50/60 border-l-4 border-l-indigo-500 pl-[12px]' : 'border-l-4 border-l-transparent'}`}
                 >
                   <div className="flex justify-between items-start mb-1.5 w-full">
                     <span className={`font-semibold text-sm truncate max-w-[70%] ${thread.unreadCount > 0 ? 'text-slate-900' : 'text-slate-700'}`}>
                        {thread.lead?.businessName || thread.messages[0]?.from || 'Unknown Sender'}
                     </span>
                     <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2 flex-shrink-0">
                        {formatDistanceToNow(new Date(thread.lastMessageAt), { addSuffix: true })}
                     </span>
                   </div>
                   <div className="text-xs font-medium text-slate-800 truncate mb-1 w-full">{thread.subject}</div>
                   <div className="text-xs text-slate-500 truncate w-full opacity-80">{thread.snippet}</div>
                   
                   {thread.lead && (
                     <div className="mt-2 flex gap-1">
                        <Badge variant="outline" className={`text-[10px] h-4 px-1.5 font-normal ${
                            thread.lead.status === 'replied' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                            thread.lead.status === 'interested' ? 'bg-green-50 text-green-700 border-green-200' :
                            'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                           {thread.lead.status}
                        </Badge>
                        {thread.lead.leadScore > 50 && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-green-50 text-green-600 border-green-200 font-normal">
                                Score: {thread.lead.leadScore}
                            </Badge>
                        )}
                     </div>
                   )}
                 </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Area: Chat View */}
      <div className="flex-1 flex flex-col bg-slate-50/50">
        {activeThread ? (
          <>
            {/* Header */}
            <div className="h-14 px-6 border-b border-slate-200 bg-white flex justify-between items-center shadow-sm z-10">
              <div>
                <h2 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    {activeThread.lead?.businessName || 'Unknown Contact'}
                    {activeThread.lead && (
                        <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Lead</span>
                    )}
                </h2>
                <div className="text-xs text-slate-500 max-w-md truncate">{activeThread.subject}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-100"><Archive className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                 {/* Thread Start Indicator */}
                 <div className="flex justify-center">
                    <div className="text-[10px] text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                        Conversation started {new Date(activeThread.messages[activeThread.messages.length - 1]?.sentAt || activeThread.lastMessageAt).toLocaleDateString()}
                    </div>
                 </div>

                 {/* Last Message (Mocked until full history fetch implemented) */}
                 <div className="flex gap-4 group">
                    <Avatar className="h-8 w-8 mt-1 border border-slate-200 bg-white">
                        <AvatarFallback className="text-xs bg-slate-50 text-slate-500">
                            {(activeThread.messages[0]?.from || '?')[0].toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 max-w-[85%]">
                        <div className="flex items-baseline justify-between mb-1">
                            <span className="text-sm font-semibold text-slate-700">{activeThread.messages[0]?.from}</span>
                            <span className="text-[10px] text-slate-400">{new Date(activeThread.lastMessageAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className="bg-white p-4 rounded-lg rounded-tl-none shadow-sm border border-slate-200 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {activeThread.snippet}
                            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400 italic">
                                (Full message body loading...)
                            </div>
                        </div>
                    </div>
                 </div>
            </div>

            {/* Composer */}
            <div className="p-4 bg-white border-t border-slate-200 shadow-lg z-20">
               <div className="relative max-w-4xl mx-auto">
                  <div className="absolute top-3 left-3 flex gap-2">
                     <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50">
                        <Paperclip className="w-3 h-3" />
                     </Button>
                  </div>
                  <textarea
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[50px] max-h-[200px] resize-y shadow-inner"
                    placeholder="Write a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                  />
                  <div className="absolute bottom-3 right-3 flex gap-2">
                     <Button 
                        size="sm" 
                        className={`h-7 w-7 p-0 rounded-full transition-all ${isSending ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg'}`}
                        onClick={handleSendReply} 
                        disabled={isSending || !replyText.trim()}
                     >
                        {isSending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3 ml-0.5" />}
                     </Button>
                  </div>
               </div>
               <div className="text-[10px] text-slate-400 text-center mt-2">
                  Press ⌘+Enter to send
               </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30">
             <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-slate-300" />
             </div>
             <p className="text-slate-600 font-medium">Select a conversation</p>
             <p className="text-slate-400 text-sm">or start a new campaign</p>
          </div>
        )}
      </div>
    </div>
  );
}
