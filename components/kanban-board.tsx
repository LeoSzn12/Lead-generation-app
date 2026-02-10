'use client';

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, GripVertical, MoreHorizontal, Phone, Mail, Calendar, Sparkles, Copy, SearchCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CallButton } from '@/components/voice/call-button';

// --- Global Types ---
type Status = 'new' | 'contacted' | 'replied' | 'interested' | 'qualified' | 'won' | 'lost';

interface Lead {
  id: string;
  businessName: string;
  status: string;
  category: string;
  contactedAt?: string;
  lastActivityAt?: string;
  leadScore: number;
  emails: string[];
  phone?: string;
  enrichmentStatus?: string;
  icebreaker?: string;
}

// --- Columns Configuration ---
const COLUMNS: { id: Status; title: string; color: string }[] = [
  { id: 'new', title: 'New Leads', color: 'bg-slate-100 border-slate-200' },
  { id: 'contacted', title: 'Contacted', color: 'bg-blue-50 border-blue-200' },
  { id: 'replied', title: 'Replied', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'interested', title: 'Interested', color: 'bg-orange-50 border-orange-200' },
  { id: 'qualified', title: 'Call Booked', color: 'bg-green-50 border-green-200' },
  { id: 'won', title: 'Closed Won', color: 'bg-emerald-100 border-emerald-300' },
  { id: 'lost', title: 'Lost', color: 'bg-red-50 border-red-200' },
];

// --- Sortable Item Component (The Card) ---
function SortableLeadCard({ lead }: { lead: Lead }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: lead.id,
    data: {
      type: 'Lead',
      lead,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-40 bg-white p-4 rounded-lg border border-slate-200 shadow-sm h-[120px]"
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing group"
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-sm text-slate-800 line-clamp-1">{lead.businessName}</h4>
        <MoreHorizontal className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="flex flex-wrap gap-1 mb-2">
         {lead.leadScore > 50 && (
           <Badge variant="outline" className="text-[10px] px-1 py-0 h-5 border-green-200 text-green-700 bg-green-50">
             Score: {lead.leadScore}
           </Badge>
         )}
         {lead.enrichmentStatus === 'completed' && (
           <Badge variant="outline" className="text-[10px] px-1 py-0 h-5 border-indigo-200 text-indigo-700 bg-indigo-50">
             <Sparkles className="w-2 h-2 mr-1" /> AI
           </Badge>
         )}
      </div>

      <div className="text-xs text-slate-500 space-y-1">
        <div className="flex items-center gap-1.5">
          <Mail className="w-3 h-3" />
          <span className="truncate max-w-[150px]">{lead.emails[0] || 'No email'}</span>
        </div>
        {lead.lastActivityAt && (
           <div className="flex items-center gap-1.5 text-slate-400">
             <Calendar className="w-3 h-3" />
             <span>{new Date(lead.lastActivityAt).toLocaleDateString()}</span>
           </div>
        )}
        </div>
        <div className="flex justify-end mt-1 gap-1">
            <button 
              className="p-1.5 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title="Find Similar Leads"
              onClick={async (e) => {
                  e.stopPropagation();
                  toast.info("Finding lookalikes...");
                  try {
                      const res = await fetch('/api/leads/lookalike', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ leadId: lead.id })
                      });
                      const data = await res.json();
                      if (data.leads && data.leads.length > 0) {
                          const names = data.leads.map((l: any) => l.businessName).join(', ');
                          toast.success(`Found similar: ${names}`, { duration: 5000 });
                      } else {
                          toast.warning("No similar leads found nearby.");
                      }
                  } catch (err) { toast.error("Failed to find lookalikes"); }
              }}
            >
               <SearchCheck className="w-4 h-4" />
            </button>
            <CallButton leadId={lead.id} phone={lead.phone} compact={true} />
        </div>


      {lead.icebreaker && (
        <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500 italic line-clamp-2">
          "{lead.icebreaker}"
        </div>
      )}
    </div>
  );
}

// --- Main Board Component ---
export function KanbanBoard({ initialLeads }: { initialLeads?: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads || []);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [isLoading, setIsLoading] = useState(!initialLeads);

  // Load leads if not provided
  useEffect(() => {
    if (!initialLeads) {
      fetchLeads();
    }
  }, [initialLeads]);

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads'); // Assuming this returns all leads
      if (!res.ok) throw new Error('Failed to fetch leads');
      const data = await res.json();
      setLeads(data.leads || []); // Adjust based on actual API response structure
    } catch (error) {
      console.error('Error loading leads:', error);
      toast.error('Failed to load pipeline');
    } finally {
      setIsLoading(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Require slight movement to start drag (prevents accidental clicks)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // -- Drag Handlers --

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const lead = leads.find((l) => l.id === active.id);
    if (lead) setActiveLead(lead);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Optional: Visual feedback during drag
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLead(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a column
    const overColumn = COLUMNS.find(col => col.id === overId);
    
    // Check if dropped on another card
    const overLead = leads.find(l => l.id === overId);
    const targetStatus = overColumn ? overColumn.id : overLead ? (overLead.status as Status) : null;

    if (!targetStatus) return;

    // Find current lead and status
    const activeLead = leads.find(l => l.id === activeId);
    if (!activeLead || activeLead.status === targetStatus) return;

    // 1. Optimistic Update
    const oldLeads = [...leads];
    setLeads((prev) =>
      prev.map((l) =>
        l.id === activeId ? { ...l, status: targetStatus } : l
      )
    );

    // 2. API Call
    try {
      const res = await fetch(`/api/campaigns/update-lead-status`, { // We can reuse or create a dedicated endpoint
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: activeId, status: targetStatus }),
      });

      if (!res.ok) {
        throw new Error('Update failed');
      }
      toast.success(`Moved to ${COLUMNS.find(c => c.id === targetStatus)?.title}`);
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to move lead');
      setLeads(oldLeads); // Revert
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-[calc(100vh-200px)] overflow-x-auto pb-4 gap-4 px-2">
        {COLUMNS.map((col) => {
          const columnLeads = leads.filter((l) => l.status === col.id);
          
          return (
            <div key={col.id} className="flex-shrink-0 w-72 flex flex-col">
              {/* Column Header */}
              <div className={`p-3 rounded-t-lg border-t border-x ${col.color} bg-white bg-opacity-50 backdrop-blur-sm flex justify-between items-center`}>
                <h3 className="font-semibold text-sm text-slate-700">{col.title}</h3>
                <Badge variant="secondary" className="bg-white/50 text-slate-600 text-xs shadow-none">
                  {columnLeads.length}
                </Badge>
              </div>

              {/* Drop Zone */}
              <div className="flex-1 bg-slate-50/50 border-x border-b border-slate-200 rounded-b-lg p-2 overflow-y-auto custom-scrollbar">
                <SortableContext
                  id={col.id}
                  items={columnLeads.map((l) => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2 min-h-[100px]">
                    {columnLeads.map((lead) => (
                      <SortableLeadCard key={lead.id} lead={lead} />
                    ))}
                    {columnLeads.length === 0 && (
                      <div className="h-full flex items-center justify-center text-slate-300 text-xs italic py-8 border-2 border-dashed border-slate-200 rounded-lg">
                        Empty
                      </div>
                    )}
                  </div>
                </SortableContext>
              </div>
            </div>
          );
        })}
      </div>

      <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
        {activeLead ? (
          <div className="bg-white p-3 rounded-lg border border-indigo-300 shadow-xl w-72 rotate-2 opacity-90 cursor-grabbing">
             <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-sm text-slate-800">{activeLead.businessName}</h4>
             </div>
             <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Mail className="w-3 h-3" />
                <span>{activeLead.emails[0]}</span>
             </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
