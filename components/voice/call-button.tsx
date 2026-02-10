'use client';

import React, { useState } from 'react';
import { Phone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CallButtonProps {
  leadId: string;
  phone: string | null | undefined;
  compact?: boolean;
}

export function CallButton({ leadId, phone, compact = false }: CallButtonProps) {
  const [calling, setCalling] = useState(false);

  const handleCall = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering parent click (e.g. opening modal)
    
    if (!phone) {
      toast.error('No phone number available for this lead');
      return;
    }

    setCalling(true);
    toast.info('Initiating AI call...');

    try {
      const res = await fetch('/api/voice/outbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId, phoneNumber: phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start call');
      }

      toast.success('Call initiated! The AI agent is dialing now.');
    } catch (error: any) {
      console.error('Call failed:', error);
      toast.error(error.message || 'Failed to connect call');
    } finally {
      setCalling(false);
    }
  };

  if (!phone) return null;

  if (compact) {
    return (
      <button
        onClick={handleCall}
        disabled={calling}
        className={`p-1.5 rounded-md transition-colors ${
          calling 
            ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
            : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-400'
        }`}
        title={`Call ${phone}`}
      >
        {calling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Phone className="w-4 h-4" />}
      </button>
    );
  }

  return (
    <button
      onClick={handleCall}
      disabled={calling}
      className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
        calling
          ? 'bg-indigo-100 text-indigo-700 cursor-wait dark:bg-indigo-900/50 dark:text-indigo-300'
          : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-md'
      }`}
    >
      {calling ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Dialing...
        </>
      ) : (
        <>
          <Phone className="w-3.5 h-3.5" />
          Call AI
        </>
      )}
    </button>
  );
}
