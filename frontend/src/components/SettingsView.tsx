import React, { useState } from 'react'
import {
  Settings,
  Wifi,
  WifiOff,
  Database,
  Cpu,
  Trash2,
  Download,
  RotateCcw,
  Check,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Compass
} from 'lucide-react'
import type { Opportunity, Profile } from '../types'

interface SettingsViewProps {
  apiConnected: boolean | null
  onRetryConnection: () => void
  opportunities: Opportunity[]
  savedIds: string[]
  profile: Profile
  onResetProfile: () => void
  onClearCustomOpportunities: () => void
  onNavigateToDashboard: () => void
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  apiConnected,
  onRetryConnection,
  opportunities,
  savedIds,
  profile,
  onResetProfile,
  onClearCustomOpportunities,
  onNavigateToDashboard,
}) => {
  const [checkingApi, setCheckingApi] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const customOpportunities = opportunities.filter(
    (o) => o.id.startsWith('user-added-') || o.id.startsWith('curator-added-')
  )

  const handleTestConnection = async () => {
    setCheckingApi(true)
    setFeedback(null)
    try {
      await onRetryConnection()
      setFeedback('Backend connection test completed successfully.')
    } catch {
      setFeedback('Could not connect to backend at http://127.0.0.1:8000.')
    } finally {
      setCheckingApi(false)
      setTimeout(() => setFeedback(null), 4000)
    }
  }

  const handleExportSaved = () => {
    const savedOpps = opportunities.filter((o) => savedIds.includes(o.id))
    const blob = new Blob([JSON.stringify(savedOpps, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `opportunity-radar-saved-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    setFeedback(`Exported ${savedOpps.length} saved opportunities.`)
    setTimeout(() => setFeedback(null), 3000)
  }

  const handleClearCustom = () => {
    if (window.confirm('Are you sure you want to remove all custom opportunities added via the submission form?')) {
      onClearCustomOpportunities()
      setFeedback('Custom opportunities cleared from local storage.')
      setTimeout(() => setFeedback(null), 3000)
    }
  }

  const handleResetProfile = () => {
    if (window.confirm('Reset student profile and preferences to default?')) {
      onResetProfile()
      setFeedback('Student profile reset to defaults.')
      setTimeout(() => setFeedback(null), 3000)
    }
  }

  return (
    <div className="view-container settings-view">
      <div className="view-header">
        <div className="view-header-title-group">
          <div className="view-badge">SYSTEM PREFERENCES</div>
          <h1 className="view-title">Settings & Environment</h1>
          <p className="view-subtitle">
            Manage your connection to the FastAPI backend, local Ollama AI endpoints, and browser persistence.
          </p>
        </div>
        <div className="view-header-actions">
          <button type="button" className="btn-secondary" onClick={onNavigateToDashboard}>
            <Compass size={14} />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="settings-alert-banner">
          <Check size={15} />
          <span>{feedback}</span>
        </div>
      )}

      <div className="settings-grid">
        {/* Backend API Connection Card */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">
              {apiConnected ? <Wifi size={18} style={{ color: 'var(--status-eligible)' }} /> : <WifiOff size={18} style={{ color: 'var(--terracotta)' }} />}
            </div>
            <div>
              <h3>FastAPI Backend Connection</h3>
              <p>Primary API service providing curated opportunity feeds and deterministic eligibility matching.</p>
            </div>
          </div>

          <div className="settings-card-body">
            <div className="settings-info-row">
              <span className="settings-info-label">API Endpoint</span>
              <code className="settings-code">http://127.0.0.1:8000</code>
            </div>
            <div className="settings-info-row">
              <span className="settings-info-label">Current Status</span>
              <span className={`status-badge-pill ${apiConnected ? 'eligible' : 'expired'}`}>
                {apiConnected ? '● Online & Operational' : '○ Offline / Using Local Fallback'}
              </span>
            </div>
            <div className="settings-info-row">
              <span className="settings-info-label">Verified Listings Loaded</span>
              <strong>{opportunities.length} total listings</strong>
            </div>
          </div>

          <div className="settings-card-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={handleTestConnection}
              disabled={checkingApi}
            >
              <RefreshCw size={14} className={checkingApi ? 'spin-icon' : ''} />
              <span>{checkingApi ? 'Testing Connection...' : 'Test Connection & Refresh'}</span>
            </button>
            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="btn-text"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
            >
              <span>Swagger Docs</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Local AI / Ollama Configuration Card */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">
              <Cpu size={18} style={{ color: 'var(--sage)' }} />
            </div>
            <div>
              <h3>Local AI Inference (Gemma + Ollama)</h3>
              <p>Powers the structured extraction pipeline for submitted opportunity descriptions.</p>
            </div>
          </div>

          <div className="settings-card-body">
            <div className="settings-info-row">
              <span className="settings-info-label">Ollama Host</span>
              <code className="settings-code">http://127.0.0.1:11434</code>
            </div>
            <div className="settings-info-row">
              <span className="settings-info-label">Configured Model</span>
              <span className="settings-tag">gemma3:1b</span>
            </div>
            <div className="settings-note-box">
              <p>
                To enable local model extraction, ensure Ollama is running:
              </p>
              <code>ollama run gemma3:1b</code>
              <p style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                If Ollama is offline, the Add Opportunity modal provides manual entry so you can still add opportunities without AI inference.
              </p>
            </div>
          </div>
        </div>

        {/* Browser Persistence & Data Card */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">
              <Database size={18} style={{ color: 'var(--blue-dark)' }} />
            </div>
            <div>
              <h3>Local Browser Storage</h3>
              <p>Saved bookmarks, custom extracted opportunities, and tuned profile attributes persist in your browser.</p>
            </div>
          </div>

          <div className="settings-card-body">
            <div className="settings-info-row">
              <span className="settings-info-label">Bookmarked Opportunities</span>
              <strong>{savedIds.length} saved</strong>
            </div>
            <div className="settings-info-row">
              <span className="settings-info-label">Curator-Added Opportunities</span>
              <strong>{customOpportunities.length} custom listings</strong>
            </div>
            <div className="settings-info-row">
              <span className="settings-info-label">Current Student Profile</span>
              <span>{profile.name || 'Default Student'} ({profile.field})</span>
            </div>
          </div>

          <div className="settings-card-footer" style={{ flexWrap: 'wrap', gap: '8px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleExportSaved}
              disabled={savedIds.length === 0}
            >
              <Download size={14} />
              <span>Export Saved as JSON</span>
            </button>

            {customOpportunities.length > 0 && (
              <button
                type="button"
                className="btn-secondary"
                onClick={handleClearCustom}
                style={{ color: 'var(--terracotta)' }}
              >
                <Trash2 size={14} />
                <span>Clear Custom Listings ({customOpportunities.length})</span>
              </button>
            )}

            <button
              type="button"
              className="btn-secondary"
              onClick={handleResetProfile}
            >
              <RotateCcw size={14} />
              <span>Reset Profile to Default</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
