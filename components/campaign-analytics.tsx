'use client';

import React, { useState, useEffect } from 'react';

interface Campaign {
  id: string;
  name: string;
  status: string;
  totalRecipients: number;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalReplied: number;
  totalBounced: number;
  totalUnsubscribed: number;
  createdAt: string;
  emailAccount: { name: string; fromEmail: string };
  steps: { id: string; stepOrder: number; subject: string; totalSent: number; totalOpened: number }[];
}

interface CampaignAnalytics {
  rates: { open: number; click: number; reply: number; bounce: number };
  steps: { order: number; subject: string; sent: number; opened: number; openRate: number }[];
}

export default function CampaignAnalyticsDashboard() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (selected) fetchAnalytics(selected);
  }, [selected]);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch('/api/campaigns');
      const data = await res.json();
      setCampaigns(data.campaigns || []);
      if (data.campaigns?.length > 0) setSelected(data.campaigns[0].id);
    } catch (err) {
      console.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (id: string) => {
    try {
      const res = await fetch(`/api/campaigns/${id}`);
      const data = await res.json();
      setAnalytics(data.analytics);
    } catch (err) {
      console.error('Failed to load analytics');
    }
  };

  const handleAction = async (id: string, action: string) => {
    try {
      if (action === 'start') {
        await fetch(`/api/campaigns/${id}/send`, { method: 'POST' });
      } else {
        await fetch(`/api/campaigns/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: action }),
        });
      }
      fetchCampaigns();
    } catch (err) {
      console.error('Action failed');
    }
  };

  const getStatusStyle = (status: string) => {
    const styles: Record<string, { bg: string; color: string; label: string }> = {
      draft: { bg: 'rgba(148,163,184,0.15)', color: '#94a3b8', label: '📝 Draft' },
      active: { bg: 'rgba(34,197,94,0.15)', color: '#86efac', label: '🟢 Active' },
      paused: { bg: 'rgba(234,179,8,0.15)', color: '#fcd34d', label: '⏸️ Paused' },
      completed: { bg: 'rgba(99,102,241,0.15)', color: '#a5b4fc', label: '✅ Completed' },
      cancelled: { bg: 'rgba(239,68,68,0.15)', color: '#fca5a5', label: '❌ Cancelled' },
    };
    return styles[status] || styles.draft;
  };

  const activeCampaign = campaigns.find(c => c.id === selected);

  return (
    <div style={{ padding: '24px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#f1f5f9', marginBottom: '24px' }}>
        📊 Campaign Analytics
      </h2>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '48px' }}>Loading...</div>
      ) : campaigns.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '48px', background: 'rgba(30,41,59,0.4)', borderRadius: '12px', border: '1px dashed rgba(148,163,184,0.2)' }}>
          <p style={{ fontSize: '48px', marginBottom: '12px' }}>📭</p>
          <p>No campaigns yet. Create one to get started!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px' }}>
          {/* Campaign List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {campaigns.map(c => {
              const statusStyle = getStatusStyle(c.status);
              return (
                <button
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  style={{
                    textAlign: 'left',
                    padding: '14px',
                    background: selected === c.id ? 'rgba(99,102,241,0.15)' : 'rgba(30,41,59,0.6)',
                    border: selected === c.id ? '1px solid rgba(99,102,241,0.3)' : '1px solid rgba(148,163,184,0.08)',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    color: '#e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '600', fontSize: '14px' }}>{c.name}</span>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '9999px', background: statusStyle.bg, color: statusStyle.color }}>
                      {statusStyle.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {c.totalSent}/{c.totalRecipients} sent • {c.emailAccount.fromEmail}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Analytics Panel */}
          {activeCampaign && (
            <div>
              {/* Stats Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                {[
                  { label: 'Sent', value: activeCampaign.totalSent, color: '#6366f1', icon: '📤' },
                  { label: 'Opened', value: activeCampaign.totalOpened, rate: analytics?.rates.open, color: '#22c55e', icon: '👁️' },
                  { label: 'Clicked', value: activeCampaign.totalClicked, rate: analytics?.rates.click, color: '#eab308', icon: '🖱️' },
                  { label: 'Replied', value: activeCampaign.totalReplied, rate: analytics?.rates.reply, color: '#06b6d4', icon: '💬' },
                ].map(stat => (
                  <div key={stat.label} style={{
                    background: 'rgba(30,41,59,0.8)', borderRadius: '10px', padding: '16px',
                    border: '1px solid rgba(148,163,184,0.08)',
                  }}>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>{stat.icon} {stat.label}</div>
                    <div style={{ fontSize: '28px', fontWeight: '700', color: stat.color }}>{stat.value}</div>
                    {stat.rate !== undefined && (
                      <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>{stat.rate}%</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Funnel Visualization */}
              <div style={{ background: 'rgba(30,41,59,0.8)', borderRadius: '12px', padding: '20px', marginBottom: '20px', border: '1px solid rgba(148,163,184,0.08)' }}>
                <h4 style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '16px', marginTop: 0 }}>Campaign Funnel</h4>
                {[
                  { label: 'Recipients', value: activeCampaign.totalRecipients, pct: 100, color: '#64748b' },
                  { label: 'Sent', value: activeCampaign.totalSent, pct: activeCampaign.totalRecipients > 0 ? (activeCampaign.totalSent / activeCampaign.totalRecipients) * 100 : 0, color: '#6366f1' },
                  { label: 'Opened', value: activeCampaign.totalOpened, pct: activeCampaign.totalSent > 0 ? (activeCampaign.totalOpened / activeCampaign.totalSent) * 100 : 0, color: '#22c55e' },
                  { label: 'Replied', value: activeCampaign.totalReplied, pct: activeCampaign.totalSent > 0 ? (activeCampaign.totalReplied / activeCampaign.totalSent) * 100 : 0, color: '#06b6d4' },
                ].map(row => (
                  <div key={row.label} style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                      <span style={{ color: '#94a3b8' }}>{row.label}</span>
                      <span style={{ color: '#e2e8f0' }}>{row.value} ({Math.round(row.pct)}%)</span>
                    </div>
                    <div style={{ background: 'rgba(51,65,85,0.5)', borderRadius: '9999px', height: '6px', overflow: 'hidden' }}>
                      <div style={{ width: `${row.pct}%`, height: '100%', background: row.color, borderRadius: '9999px', transition: 'width 0.5s' }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Bounce & Unsub */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: 'rgba(239,68,68,0.08)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(239,68,68,0.15)' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Bounced</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#ef4444' }}>{activeCampaign.totalBounced} <span style={{ fontSize: '14px', fontWeight: '400' }}>({analytics?.rates.bounce || 0}%)</span></div>
                </div>
                <div style={{ background: 'rgba(234,179,8,0.08)', borderRadius: '10px', padding: '14px', border: '1px solid rgba(234,179,8,0.15)' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Unsubscribed</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#eab308' }}>{activeCampaign.totalUnsubscribed}</div>
                </div>
              </div>

              {/* Step Performance */}
              {analytics?.steps && analytics.steps.length > 1 && (
                <div style={{ background: 'rgba(30,41,59,0.8)', borderRadius: '12px', padding: '20px', marginBottom: '20px', border: '1px solid rgba(148,163,184,0.08)' }}>
                  <h4 style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '12px', marginTop: 0 }}>Step Performance</h4>
                  {analytics.steps.map(s => (
                    <div key={s.order} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid rgba(148,163,184,0.06)' }}>
                      <span style={{ fontSize: '12px', color: '#6366f1', fontWeight: '600', minWidth: '60px' }}>Step {s.order}</span>
                      <span style={{ flex: 1, fontSize: '13px', color: '#e2e8f0' }}>{s.subject}</span>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{s.sent} sent</span>
                      <span style={{ fontSize: '12px', color: '#22c55e' }}>{s.openRate}% open</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                {activeCampaign.status === 'draft' && (
                  <button onClick={() => handleAction(activeCampaign.id, 'start')} style={actionBtn('#22c55e')}>
                    ▶ Start Sending
                  </button>
                )}
                {activeCampaign.status === 'active' && (
                  <button onClick={() => handleAction(activeCampaign.id, 'paused')} style={actionBtn('#eab308')}>
                    ⏸ Pause
                  </button>
                )}
                {activeCampaign.status === 'paused' && (
                  <button onClick={() => handleAction(activeCampaign.id, 'active')} style={actionBtn('#22c55e')}>
                    ▶ Resume
                  </button>
                )}
                {['draft', 'active', 'paused'].includes(activeCampaign.status) && (
                  <button onClick={() => handleAction(activeCampaign.id, 'cancelled')} style={actionBtn('#ef4444')}>
                    ✕ Cancel
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const actionBtn = (color: string): React.CSSProperties => ({
  padding: '8px 16px',
  background: `${color}22`,
  border: `1px solid ${color}44`,
  borderRadius: '8px',
  color: color,
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '13px',
});
