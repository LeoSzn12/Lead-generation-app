'use client';

import React, { useState, useEffect } from 'react';

interface EmailAccount {
  id: string;
  name: string;
  fromEmail: string;
}

interface SequenceStep {
  subject: string;
  body: string;
  delayDays: number;
  sendIfNoReply: boolean;
  sendIfNoOpen: boolean;
}

export default function EmailCampaignBuilder({ onClose }: { onClose?: () => void }) {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [step, setStep] = useState(1); // 1: Config, 2: Compose, 3: Target, 4: Review
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [campaign, setCampaign] = useState({
    name: '',
    emailAccountId: '',
    subject: '',
    sendStartTime: '09:00',
    sendEndTime: '17:00',
    delayBetweenEmails: 120,
  });

  const [sequences, setSequences] = useState<SequenceStep[]>([
    {
      subject: '',
      body: '<p>Hi {firstName},</p>\n<p>I came across {businessName} and was impressed by your work in the {category} space.</p>\n<p>I specialize in helping businesses like yours grow through [your service]. Many of our clients have seen significant results.</p>\n<p>Would you be open to a brief conversation?</p>\n<p>Best,<br/>[Your Name]</p>',
      delayDays: 0,
      sendIfNoReply: true,
      sendIfNoOpen: false,
    },
  ]);

  const [targeting, setTargeting] = useState({
    mode: 'filter' as 'filter' | 'manual',
    filters: {
      status: '',
      qualityTier: '',
      tags: [] as string[],
    },
    leadIds: [] as string[],
  });

  useEffect(() => {
    fetch('/api/email-accounts')
      .then(r => r.json())
      .then(data => setAccounts(data.accounts || []))
      .catch(() => setError('Failed to load email accounts'));
  }, []);

  const addFollowUp = () => {
    setSequences([
      ...sequences,
      {
        subject: `Re: ${campaign.subject || sequences[0].subject}`,
        body: '<p>Hi {firstName},</p>\n<p>Just wanted to follow up on my previous email about {businessName}.</p>\n<p>I\'d love the chance to chat about how we can help. Would you have 15 minutes this week?</p>\n<p>Best,<br/>[Your Name]</p>',
        delayDays: 3,
        sendIfNoReply: true,
        sendIfNoOpen: false,
      },
    ]);
  };

  const removeFollowUp = (index: number) => {
    if (index === 0) return;
    setSequences(sequences.filter((_, i) => i !== index));
  };

  const updateSequence = (index: number, field: string, value: any) => {
    const updated = [...sequences];
    (updated[index] as any)[field] = value;
    setSequences(updated);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaign.name,
          emailAccountId: campaign.emailAccountId,
          subject: campaign.subject || sequences[0].subject,
          steps: sequences,
          targetFilters: targeting.mode === 'filter' ? targeting.filters : undefined,
          targetLeadIds: targeting.mode === 'manual' ? targeting.leadIds : [],
          sendStartTime: campaign.sendStartTime,
          sendEndTime: campaign.sendEndTime,
          delayBetweenEmails: campaign.delayBetweenEmails,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(`Campaign "${campaign.name}" created with ${data.campaign?.totalRecipients || 0} recipients!`);
      setStep(5); // Success screen
    } catch (err: any) {
      setError(err?.message || 'Failed to create campaign');
    } finally {
      setSaving(false);
    }
  };

  const startCampaign = async (campaignId: string) => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/send`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess('Campaign started! Emails are being sent.');
    } catch (err: any) {
      setError(err?.message || 'Failed to start campaign');
    }
  };

  const templateVars = [
    { label: 'First Name', value: '{firstName}' },
    { label: 'Business Name', value: '{businessName}' },
    { label: 'Category', value: '{category}' },
    { label: 'City', value: '{city}' },
    { label: 'Website', value: '{website}' },
    { label: 'Owner Name', value: '{ownerName}' },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>
          ✉️ Create Campaign
        </h2>
        {onClose && (
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '20px', cursor: 'pointer' }}>✕</button>
        )}
      </div>

      {/* Progress Steps */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '32px' }}>
        {['Configure', 'Compose', 'Target', 'Review'].map((label, i) => (
          <div key={label} style={{ flex: 1 }}>
            <div style={{
              height: '4px',
              borderRadius: '2px',
              background: step > i ? 'linear-gradient(90deg, #6366f1, #8b5cf6)' : 'rgba(51,65,85,0.5)',
              transition: 'all 0.3s',
            }} />
            <span style={{ fontSize: '12px', color: step > i ? '#a5b4fc' : '#64748b', marginTop: '4px', display: 'block' }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#fca5a5' }}>
          {error}
        </div>
      )}

      {/* Step 1: Configure */}
      {step === 1 && (
        <div style={cardStyle}>
          <h3 style={sectionTitle}>Campaign Settings</h3>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Campaign Name</label>
            <input
              type="text"
              placeholder="e.g., Med Spa Q1 Outreach"
              value={campaign.name}
              onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Send From</label>
            {accounts.length === 0 ? (
              <p style={{ color: '#fca5a5', fontSize: '14px' }}>No email accounts connected. Add one in Email Accounts settings first.</p>
            ) : (
              <select
                value={campaign.emailAccountId}
                onChange={(e) => setCampaign({ ...campaign, emailAccountId: e.target.value })}
                style={inputStyle}
              >
                <option value="">Select email account...</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.fromEmail})</option>
                ))}
              </select>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Send After</label>
              <input type="time" value={campaign.sendStartTime} onChange={(e) => setCampaign({ ...campaign, sendStartTime: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Send Before</label>
              <input type="time" value={campaign.sendEndTime} onChange={(e) => setCampaign({ ...campaign, sendEndTime: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Delay (sec)</label>
              <input type="number" value={campaign.delayBetweenEmails} onChange={(e) => setCampaign({ ...campaign, delayBetweenEmails: parseInt(e.target.value) })} style={inputStyle} />
            </div>
          </div>

          <button onClick={() => setStep(2)} disabled={!campaign.name || !campaign.emailAccountId} style={btnPrimary(!campaign.name || !campaign.emailAccountId)}>
            Next: Compose Emails →
          </button>
        </div>
      )}

      {/* Step 2: Compose */}
      {step === 2 && (
        <div style={cardStyle}>
          <h3 style={sectionTitle}>Email Sequence</h3>

          {/* Template Variables */}
          <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(99,102,241,0.1)', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)' }}>
            <span style={{ fontSize: '12px', color: '#a5b4fc', fontWeight: '600' }}>📌 Template Variables:</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
              {templateVars.map((v) => (
                <span
                  key={v.value}
                  style={{ fontSize: '12px', padding: '2px 8px', background: 'rgba(99,102,241,0.2)', borderRadius: '4px', color: '#c7d2fe', cursor: 'pointer' }}
                  title={`Click to copy: ${v.value}`}
                  onClick={() => navigator.clipboard.writeText(v.value)}
                >
                  {v.label}: <code>{v.value}</code>
                </span>
              ))}
            </div>
          </div>

          {sequences.map((seq, i) => (
            <div key={i} style={{ marginBottom: '20px', padding: '16px', background: 'rgba(15,23,42,0.4)', borderRadius: '8px', border: '1px solid rgba(148,163,184,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#a5b4fc' }}>
                  {i === 0 ? '📧 Initial Email' : `🔁 Follow-up #${i}`}
                  {i > 0 && ` (${seq.delayDays} days later)`}
                </span>
                {i > 0 && (
                  <button onClick={() => removeFollowUp(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px' }}>
                    Remove
                  </button>
                )}
              </div>

              {i > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={labelStyle}>Delay (days)</label>
                    <input type="number" min="1" value={seq.delayDays} onChange={(e) => updateSequence(i, 'delayDays', parseInt(e.target.value))} style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', paddingBottom: '2px' }}>
                    <input type="checkbox" checked={seq.sendIfNoReply} onChange={(e) => updateSequence(i, 'sendIfNoReply', e.target.checked)} style={{ accentColor: '#6366f1' }} />
                    <label style={{ fontSize: '13px', color: '#94a3b8' }}>Only if no reply</label>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', paddingBottom: '2px' }}>
                    <input type="checkbox" checked={seq.sendIfNoOpen} onChange={(e) => updateSequence(i, 'sendIfNoOpen', e.target.checked)} style={{ accentColor: '#6366f1' }} />
                    <label style={{ fontSize: '13px', color: '#94a3b8' }}>Only if not opened</label>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Subject Line</label>
                <input
                  type="text"
                  placeholder="Quick question about {businessName}"
                  value={seq.subject}
                  onChange={(e) => updateSequence(i, 'subject', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Email Body (HTML)</label>
                <textarea
                  value={seq.body}
                  onChange={(e) => updateSequence(i, 'body', e.target.value)}
                  rows={8}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.5' }}
                />
              </div>
            </div>
          ))}

          <button
            onClick={addFollowUp}
            style={{
              width: '100%',
              padding: '10px',
              background: 'rgba(51,65,85,0.3)',
              border: '1px dashed rgba(148,163,184,0.2)',
              borderRadius: '8px',
              color: '#94a3b8',
              cursor: 'pointer',
              marginBottom: '20px',
              fontSize: '14px',
            }}
          >
            + Add Follow-Up Email
          </button>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setStep(1)} style={btnSecondary}>← Back</button>
            <button onClick={() => { setCampaign({ ...campaign, subject: sequences[0].subject }); setStep(3); }} disabled={!sequences[0].subject || !sequences[0].body} style={{ ...btnPrimary(!sequences[0].subject || !sequences[0].body), flex: 1 }}>
              Next: Select Leads →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Target */}
      {step === 3 && (
        <div style={cardStyle}>
          <h3 style={sectionTitle}>Select Recipients</h3>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {(['filter', 'manual'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setTargeting({ ...targeting, mode })}
                style={{
                  padding: '8px 20px',
                  background: targeting.mode === mode ? 'rgba(99,102,241,0.3)' : 'rgba(51,65,85,0.5)',
                  border: targeting.mode === mode ? '1px solid #6366f1' : '1px solid rgba(148,163,184,0.1)',
                  borderRadius: '6px',
                  color: targeting.mode === mode ? '#a5b4fc' : '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                {mode === 'filter' ? '🎯 Filter by Criteria' : '📋 Select by ID'}
              </button>
            ))}
          </div>

          {targeting.mode === 'filter' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={labelStyle}>Lead Status</label>
                <select value={targeting.filters.status} onChange={(e) => setTargeting({ ...targeting, filters: { ...targeting.filters, status: e.target.value } })} style={inputStyle}>
                  <option value="">All Statuses</option>
                  <option value="new">New</option>
                  <option value="qualified">Qualified</option>
                  <option value="nurturing">Nurturing</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Quality Tier</label>
                <select value={targeting.filters.qualityTier} onChange={(e) => setTargeting({ ...targeting, filters: { ...targeting.filters, qualityTier: e.target.value } })} style={inputStyle}>
                  <option value="">All Tiers</option>
                  <option value="gold">🥇 Gold</option>
                  <option value="silver">🥈 Silver</option>
                  <option value="bronze">🥉 Bronze</option>
                </select>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setStep(2)} style={btnSecondary}>← Back</button>
            <button onClick={() => setStep(4)} style={{ ...btnPrimary(false), flex: 1 }}>
              Next: Review →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div style={cardStyle}>
          <h3 style={sectionTitle}>Review Campaign</h3>

          <div style={{ marginBottom: '20px' }}>
            <div style={reviewRow}><span style={reviewLabel}>Campaign</span><span style={reviewValue}>{campaign.name}</span></div>
            <div style={reviewRow}><span style={reviewLabel}>Send From</span><span style={reviewValue}>{accounts.find(a => a.id === campaign.emailAccountId)?.fromEmail}</span></div>
            <div style={reviewRow}><span style={reviewLabel}>Sequence Steps</span><span style={reviewValue}>{sequences.length} email{sequences.length > 1 ? 's' : ''}</span></div>
            <div style={reviewRow}><span style={reviewLabel}>Send Window</span><span style={reviewValue}>{campaign.sendStartTime} – {campaign.sendEndTime}</span></div>
            <div style={reviewRow}><span style={reviewLabel}>Targeting</span><span style={reviewValue}>{targeting.mode === 'filter' ? 'By filters' : `${targeting.leadIds.length} leads`}</span></div>
          </div>

          <div style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: '8px', padding: '12px', marginBottom: '20px', color: '#fcd34d', fontSize: '13px' }}>
            ⚠️ Emails will be sent gradually based on your warmup schedule. Make sure your email content is professional and includes a clear value proposition.
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => setStep(3)} style={btnSecondary}>← Back</button>
            <button onClick={handleSubmit} disabled={saving} style={{ ...btnPrimary(saving), flex: 1 }}>
              {saving ? 'Creating...' : '🚀 Create Campaign'}
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Success */}
      {step === 5 && success && (
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <p style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</p>
          <h3 style={{ fontSize: '20px', color: '#f1f5f9', marginBottom: '8px' }}>Campaign Created!</h3>
          <p style={{ color: '#86efac', marginBottom: '24px' }}>{success}</p>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
            Your campaign is saved as a draft. Go to Campaigns to start sending.
          </p>
          {onClose && (
            <button onClick={onClose} style={btnPrimary(false)}>Close</button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Shared Styles ──────────────────────── */
const cardStyle: React.CSSProperties = {
  background: 'rgba(30,41,59,0.8)',
  border: '1px solid rgba(148,163,184,0.1)',
  borderRadius: '12px',
  padding: '28px',
};
const sectionTitle: React.CSSProperties = { fontSize: '18px', fontWeight: '600', color: '#f1f5f9', marginBottom: '20px', margin: '0 0 20px 0' };
const labelStyle: React.CSSProperties = { display: 'block', color: '#94a3b8', fontSize: '14px', marginBottom: '6px' };
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  background: 'rgba(15,23,42,0.6)',
  border: '1px solid rgba(148,163,184,0.15)',
  borderRadius: '8px', color: '#e2e8f0', fontSize: '14px', outline: 'none',
};
const btnPrimary = (disabled: boolean): React.CSSProperties => ({
  padding: '12px 24px',
  background: disabled ? '#475569' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  color: '#fff', border: 'none', borderRadius: '8px',
  cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '15px',
});
const btnSecondary: React.CSSProperties = {
  padding: '12px 24px',
  background: 'rgba(51,65,85,0.5)',
  color: '#94a3b8', border: '1px solid rgba(148,163,184,0.1)',
  borderRadius: '8px', cursor: 'pointer', fontSize: '15px',
};
const reviewRow: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', padding: '10px 0',
  borderBottom: '1px solid rgba(148,163,184,0.08)',
};
const reviewLabel: React.CSSProperties = { color: '#64748b', fontSize: '14px' };
const reviewValue: React.CSSProperties = { color: '#e2e8f0', fontSize: '14px', fontWeight: '500' };
