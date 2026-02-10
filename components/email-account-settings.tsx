'use client';

import React, { useState, useEffect } from 'react';

interface EmailAccount {
  id: string;
  name: string;
  fromName: string;
  fromEmail: string;
  smtpHost: string;
  smtpPort: number;
  isActive: boolean;
  isVerified: boolean;
  reputation: number;
  lastError: string | null;
  warmupStatus: {
    phase: number;
    day: number;
    dailyLimit: number;
    dailySent: number;
    isReady: boolean;
    nextPhaseIn: number;
    phaseLabel: string;
  } | null;
}

const PRESETS = {
  gmail: { host: 'smtp.gmail.com', port: 587, secure: false },
  outlook: { host: 'smtp-mail.outlook.com', port: 587, secure: false },
  yahoo: { host: 'smtp.mail.yahoo.com', port: 587, secure: false },
  custom: { host: '', port: 587, secure: false },
};

export default function EmailAccountSettings() {
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    preset: 'gmail',
    name: '',
    fromName: '',
    fromEmail: '',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPass: '',
    smtpSecure: false,
    skipWarmup: false,
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/email-accounts');
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch (err) {
      setError('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const handlePresetChange = (preset: string) => {
    const config = PRESETS[preset as keyof typeof PRESETS] || PRESETS.custom;
    setForm({
      ...form,
      preset,
      smtpHost: config.host,
      smtpPort: config.port,
      smtpSecure: config.secure,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/email-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to add account');
        return;
      }

      setSuccess('Email account connected successfully!');
      setShowForm(false);
      setForm({ preset: 'gmail', name: '', fromName: '', fromEmail: '', smtpHost: 'smtp.gmail.com', smtpPort: 587, smtpUser: '', smtpPass: '', smtpSecure: false, skipWarmup: false });
      fetchAccounts();
    } catch (err: any) {
      setError(err?.message || 'Failed to add account');
    } finally {
      setSaving(false);
    }
  };

  const getReputationColor = (rep: number) => {
    if (rep >= 80) return '#22c55e';
    if (rep >= 50) return '#eab308';
    return '#ef4444';
  };

  const getWarmupProgress = (day: number): number => Math.min(100, Math.round((day / 22) * 100));

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#f1f5f9', margin: 0 }}>📧 Email Accounts</h2>
          <p style={{ color: '#94a3b8', marginTop: '4px' }}>Connect your email accounts for outreach campaigns</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: '10px 20px',
            background: showForm ? 'rgba(239,68,68,0.2)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
          }}
        >
          {showForm ? '✕ Cancel' : '+ Add Account'}
        </button>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#fca5a5' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', padding: '12px', marginBottom: '16px', color: '#86efac' }}>
          {success}
        </div>
      )}

      {/* Add Account Form */}
      {showForm && (
        <div style={{ background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(148,163,184,0.1)', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#f1f5f9', marginBottom: '20px' }}>Connect Email Account</h3>

          <form onSubmit={handleSubmit}>
            {/* Provider Preset */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '14px', marginBottom: '6px' }}>Email Provider</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['gmail', 'outlook', 'yahoo', 'custom'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePresetChange(p)}
                    style={{
                      padding: '8px 16px',
                      background: form.preset === p ? 'rgba(99,102,241,0.3)' : 'rgba(51,65,85,0.5)',
                      border: form.preset === p ? '1px solid #6366f1' : '1px solid rgba(148,163,184,0.1)',
                      borderRadius: '6px',
                      color: form.preset === p ? '#a5b4fc' : '#94a3b8',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      fontSize: '13px',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '14px', marginBottom: '6px' }}>Account Name</label>
                <input
                  type="text"
                  placeholder="My Gmail"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '14px', marginBottom: '6px' }}>Display Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={form.fromName}
                  onChange={(e) => setForm({ ...form, fromName: e.target.value })}
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '14px', marginBottom: '6px' }}>From Email</label>
                <input
                  type="email"
                  placeholder="you@gmail.com"
                  value={form.fromEmail}
                  onChange={(e) => setForm({ ...form, fromEmail: e.target.value })}
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '14px', marginBottom: '6px' }}>SMTP Username</label>
                <input
                  type="text"
                  placeholder="you@gmail.com"
                  value={form.smtpUser}
                  onChange={(e) => setForm({ ...form, smtpUser: e.target.value })}
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '14px', marginBottom: '6px' }}>
                App Password
                <span style={{ color: '#64748b', fontSize: '12px', marginLeft: '8px' }}>
                  (Gmail: Settings → Security → App Passwords)
                </span>
              </label>
              <input
                type="password"
                placeholder="Your app password (NOT your regular password)"
                value={form.smtpPass}
                onChange={(e) => setForm({ ...form, smtpPass: e.target.value })}
                required
                style={inputStyle}
              />
            </div>

            {form.preset === 'custom' && (
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '14px', marginBottom: '6px' }}>SMTP Host</label>
                  <input
                    type="text"
                    placeholder="smtp.example.com"
                    value={form.smtpHost}
                    onChange={(e) => setForm({ ...form, smtpHost: e.target.value })}
                    required
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '14px', marginBottom: '6px' }}>Port</label>
                  <input
                    type="number"
                    value={form.smtpPort}
                    onChange={(e) => setForm({ ...form, smtpPort: parseInt(e.target.value) })}
                    style={inputStyle}
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <input
                type="checkbox"
                id="skipWarmup"
                checked={form.skipWarmup}
                onChange={(e) => setForm({ ...form, skipWarmup: e.target.checked })}
                style={{ accentColor: '#6366f1' }}
              />
              <label htmlFor="skipWarmup" style={{ color: '#94a3b8', fontSize: '14px' }}>
                Skip warmup (not recommended - may affect deliverability)
              </label>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                width: '100%',
                padding: '12px',
                background: saving ? '#475569' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                fontSize: '15px',
              }}
            >
              {saving ? 'Testing connection...' : '🔗 Connect & Test'}
            </button>
          </form>
        </div>
      )}

      {/* Account List */}
      {loading ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '48px' }}>Loading...</div>
      ) : accounts.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '48px', background: 'rgba(30,41,59,0.4)', borderRadius: '12px', border: '1px dashed rgba(148,163,184,0.2)' }}>
          <p style={{ fontSize: '48px', marginBottom: '12px' }}>📬</p>
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>No email accounts connected</p>
          <p style={{ fontSize: '14px' }}>Add your Gmail, Outlook, or custom SMTP to start sending</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {accounts.map((account) => (
            <div
              key={account.id}
              style={{
                background: 'rgba(30,41,59,0.6)',
                border: '1px solid rgba(148,163,184,0.1)',
                borderRadius: '12px',
                padding: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#f1f5f9', margin: 0 }}>
                      {account.name}
                    </h3>
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      background: account.isVerified ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                      color: account.isVerified ? '#86efac' : '#fca5a5',
                    }}>
                      {account.isVerified ? '✓ Verified' : '✕ Unverified'}
                    </span>
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '14px' }}>
                    {account.fromName} &lt;{account.fromEmail}&gt;
                  </p>
                </div>

                {/* Reputation */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Reputation</div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: getReputationColor(account.reputation) }}>
                    {account.reputation}/100
                  </div>
                </div>
              </div>

              {/* Warmup Progress */}
              {account.warmupStatus && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                      {account.warmupStatus.phaseLabel} — Day {account.warmupStatus.day}/22
                    </span>
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                      {account.warmupStatus.dailySent}/{account.warmupStatus.dailyLimit} sent today
                    </span>
                  </div>
                  <div style={{ background: 'rgba(51,65,85,0.5)', borderRadius: '9999px', height: '8px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${getWarmupProgress(account.warmupStatus.day)}%`,
                        height: '100%',
                        background: account.warmupStatus.isReady
                          ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                          : 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                        borderRadius: '9999px',
                        transition: 'width 0.5s',
                      }}
                    />
                  </div>
                  {!account.warmupStatus.isReady && (
                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                      {account.warmupStatus.nextPhaseIn} days until next phase
                    </p>
                  )}
                </div>
              )}

              {account.lastError && (
                <div style={{ marginTop: '12px', fontSize: '13px', color: '#fca5a5', background: 'rgba(239,68,68,0.1)', padding: '8px 12px', borderRadius: '6px' }}>
                  ⚠️ {account.lastError}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  background: 'rgba(15,23,42,0.6)',
  border: '1px solid rgba(148,163,184,0.15)',
  borderRadius: '8px',
  color: '#e2e8f0',
  fontSize: '14px',
  outline: 'none',
};
