import React, { useState, useMemo } from 'react'
import {
  FileCheck2,
  Clock,
  Calendar,
  Sparkles,
  Search,
  ExternalLink,
  Trash2,
  Edit3,
  Users,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Plus,
  Send,
  Building,
  Check,
  ChevronRight,
  ArrowRight,
} from 'lucide-react'
import type { Opportunity, ApplicationRecord, ApplicationStatus } from '../types'

interface ApplicationsViewProps {
  applications: ApplicationRecord[]
  onUpdateStatus: (opportunityId: string, status: ApplicationStatus) => void
  onUpdateDetails: (
    opportunityId: string,
    details: { teamName?: string; teamMembers?: string[]; notes?: string; appliedDate?: string }
  ) => void
  onRemoveApplication: (opportunityId: string) => void
  onNavigateToExplore: () => void
  onInspect: (opportunity: Opportunity) => void
}

const STATUS_OPTIONS: ApplicationStatus[] = [
  'Saved',
  'Applied',
  'Under Review',
  'Shortlisted',
  'Selected',
  'Rejected',
]

const STATUS_COLORS: Record<ApplicationStatus, { bg: string; text: string; border: string }> = {
  Saved: { bg: 'rgba(56, 189, 248, 0.12)', text: '#38BDF8', border: 'rgba(56, 189, 248, 0.25)' },
  Applied: { bg: 'rgba(16, 185, 129, 0.12)', text: '#10B981', border: 'rgba(16, 185, 129, 0.25)' },
  'Under Review': { bg: 'rgba(245, 158, 11, 0.12)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.25)' },
  Shortlisted: { bg: 'rgba(139, 92, 246, 0.15)', text: '#A78BFA', border: 'rgba(139, 92, 246, 0.3)' },
  Selected: { bg: 'rgba(16, 185, 129, 0.2)', text: '#34D399', border: 'rgba(16, 185, 129, 0.4)' },
  Rejected: { bg: 'rgba(239, 68, 68, 0.12)', text: '#F87171', border: 'rgba(239, 68, 68, 0.25)' },
}

export const ApplicationsView: React.FC<ApplicationsViewProps> = ({
  applications,
  onUpdateStatus,
  onUpdateDetails,
  onRemoveApplication,
  onNavigateToExplore,
  onInspect,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'All' | ApplicationStatus>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTeamName, setEditTeamName] = useState('')
  const [editMembers, setEditMembers] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editDate, setEditDate] = useState('')

  // Metrics
  const stats = useMemo(() => {
    const total = applications.length
    const applied = applications.filter((a) => a.status === 'Applied').length
    const underReview = applications.filter((a) => a.status === 'Under Review').length
    const shortlisted = applications.filter((a) => a.status === 'Shortlisted').length
    const selected = applications.filter((a) => a.status === 'Selected').length
    const rejected = applications.filter((a) => a.status === 'Rejected').length
    return { total, applied, underReview, shortlisted, selected, rejected }
  }, [applications])

  // Filtered applications
  const filteredApplications = useMemo(() => {
    let list = [...applications]
    if (selectedFilter !== 'All') {
      list = list.filter((a) => a.status === selectedFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter((a) => {
        const text = [
          a.opportunity.title,
          a.opportunity.organization,
          a.opportunity.category,
          a.teamName || '',
          a.notes || '',
        ]
          .join(' ')
          .toLowerCase()
        return text.includes(q)
      })
    }
    // Sort by recent update
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [applications, selectedFilter, searchQuery])

  const startEditing = (app: ApplicationRecord) => {
    setEditingId(app.opportunityId)
    setEditTeamName(app.teamName || '')
    setEditMembers((app.teamMembers || []).join(', '))
    setEditNotes(app.notes || '')
    setEditDate(app.appliedDate || new Date().toISOString().split('T')[0])
  }

  const saveEditing = (opportunityId: string) => {
    const membersList = editMembers
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean)
    onUpdateDetails(opportunityId, {
      teamName: editTeamName.trim(),
      teamMembers: membersList,
      notes: editNotes.trim(),
      appliedDate: editDate,
    })
    setEditingId(null)
  }

  return (
    <div className="view-container applications-view">
      {/* Header */}
      <div className="view-header">
        <div className="view-header-title-group">
          <div className="view-badge">STUDENT PIPELINE</div>
          <h1 className="view-title">My Applications Tracker</h1>
          <p className="view-subtitle">
            Manage your submissions, track review stages, coordinate team members, and record interview milestones in one place.
          </p>
        </div>
        <div className="view-header-actions">
          <button type="button" className="btn-secondary" onClick={onNavigateToExplore}>
            <Plus size={14} />
            <span>Discover More Opportunities</span>
          </button>
        </div>
      </div>

      {/* Stats Counter Bar */}
      <div className="applications-stats-grid">
        <div className="app-stat-card">
          <div className="stat-label">TOTAL TRACKED</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-sub">Across all platforms</div>
        </div>
        <div className="app-stat-card">
          <div className="stat-label">APPLIED / IN REVIEW</div>
          <div className="stat-value" style={{ color: '#10B981' }}>
            {stats.applied + stats.underReview}
          </div>
          <div className="stat-sub">{stats.underReview} in active review</div>
        </div>
        <div className="app-stat-card">
          <div className="stat-label">SHORTLISTED</div>
          <div className="stat-value" style={{ color: '#A78BFA' }}>
            {stats.shortlisted}
          </div>
          <div className="stat-sub">Advancing to next rounds</div>
        </div>
        <div className="app-stat-card">
          <div className="stat-label">SELECTED / WINNER</div>
          <div className="stat-value" style={{ color: '#34D399' }}>
            {stats.selected}
          </div>
          <div className="stat-sub">Offers & finalists</div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="applications-controls-bar">
        <div className="status-filter-pills" role="tablist">
          <button
            type="button"
            className={`status-pill ${selectedFilter === 'All' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('All')}
          >
            All <span className="pill-count">{stats.total}</span>
          </button>
          {STATUS_OPTIONS.map((status) => {
            const count = applications.filter((a) => a.status === status).length
            return (
              <button
                key={status}
                type="button"
                className={`status-pill ${selectedFilter === status ? 'active' : ''}`}
                onClick={() => setSelectedFilter(status)}
              >
                {status} <span className="pill-count">{count}</span>
              </button>
            )
          })}
        </div>

        <div className="applications-search-box">
          <Search size={14} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tracked applications..."
          />
        </div>
      </div>

      {/* Main Content Area */}
      {filteredApplications.length > 0 ? (
        <div className="applications-list">
          {filteredApplications.map((app) => {
            const opp = app.opportunity
            const isEditing = editingId === app.opportunityId
            const statusStyle = STATUS_COLORS[app.status] || STATUS_COLORS.Applied

            return (
              <div key={app.opportunityId} className="application-item-card">
                <div className="app-card-main-row">
                  <div className="app-card-info">
                    <div className="app-card-meta-top">
                      <span className="badge category-badge">{opp.category}</span>
                      <span className="app-card-org">
                        <Building size={12} style={{ marginRight: 4 }} />
                        {opp.organization}
                      </span>
                      {opp.deadline && (
                        <span className="app-card-deadline">
                          <Clock size={12} style={{ marginRight: 4 }} />
                          Deadline: {opp.deadline}
                        </span>
                      )}
                    </div>
                    <h3 className="app-card-title" onClick={() => onInspect(opp)}>
                      {opp.title}
                    </h3>
                  </div>

                  {/* Status Dropdown */}
                  <div className="app-card-status-control">
                    <label className="status-control-label">STATUS</label>
                    <select
                      className="status-select-dropdown"
                      value={app.status}
                      onChange={(e) =>
                        onUpdateStatus(app.opportunityId, e.target.value as ApplicationStatus)
                      }
                      style={{
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.text,
                        borderColor: statusStyle.border,
                      }}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt} value={opt} style={{ background: '#0F172A', color: '#F1F5F9' }}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Team & Submission Details */}
                <div className="app-card-details-row">
                  <div className="app-card-detail-item">
                    <Calendar size={13} style={{ color: 'var(--sage)' }} />
                    <span className="detail-label">Applied Date:</span>
                    <span className="detail-value">{app.appliedDate || 'Not recorded'}</span>
                  </div>

                  {app.teamName && (
                    <div className="app-card-detail-item">
                      <Users size={13} style={{ color: 'var(--accent)' }} />
                      <span className="detail-label">Team:</span>
                      <span className="detail-value font-medium">{app.teamName}</span>
                    </div>
                  )}

                  {app.teamMembers && app.teamMembers.length > 0 && (
                    <div className="app-card-detail-item">
                      <span className="detail-label">Members:</span>
                      <span className="detail-value">{app.teamMembers.join(', ')}</span>
                    </div>
                  )}
                </div>

                {/* Notes Display */}
                {app.notes && !isEditing && (
                  <div className="app-card-notes-preview">
                    <strong>Submission Notes:</strong> {app.notes}
                  </div>
                )}

                {/* Inline Editing Drawer */}
                {isEditing && (
                  <div className="app-card-edit-form">
                    <div className="edit-form-grid">
                      <div className="edit-field">
                        <label>Application Date</label>
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                        />
                      </div>
                      <div className="edit-field">
                        <label>Team Name (optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. CyberKnights"
                          value={editTeamName}
                          onChange={(e) => setEditTeamName(e.target.value)}
                        />
                      </div>
                      <div className="edit-field full-width">
                        <label>Teammates (comma-separated)</label>
                        <input
                          type="text"
                          placeholder="e.g. Alice (Lead), Bob (Frontend)"
                          value={editMembers}
                          onChange={(e) => setEditMembers(e.target.value)}
                        />
                      </div>
                      <div className="edit-field full-width">
                        <label>Submission Notes / Links / Interview Dates</label>
                        <textarea
                          rows={3}
                          placeholder="e.g. Submitted project deck on GitHub. Round 2 interview on Nov 14th."
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="edit-form-actions">
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn-primary btn-sm"
                        onClick={() => saveEditing(app.opportunityId)}
                      >
                        <Check size={13} />
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Footer */}
                <div className="app-card-actions-bar">
                  <div className="app-card-actions-left">
                    <button
                      type="button"
                      className="btn-text-action"
                      onClick={() => (isEditing ? setEditingId(null) : startEditing(app))}
                    >
                      <Edit3 size={13} />
                      <span>{isEditing ? 'Close Edit' : 'Edit Details'}</span>
                    </button>
                    <button
                      type="button"
                      className="btn-text-action danger"
                      onClick={() => onRemoveApplication(app.opportunityId)}
                      title="Remove from tracking"
                    >
                      <Trash2 size={13} />
                      <span>Untrack</span>
                    </button>
                  </div>

                  <div className="app-card-actions-right">
                    <button
                      type="button"
                      className="btn-secondary btn-sm"
                      onClick={() => onInspect(opp)}
                    >
                      <span>Inspect Signal</span>
                    </button>
                    <a
                      href={opp.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary btn-sm"
                    >
                      <span>Portal Link</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty-state-box">
          <FileCheck2 size={42} style={{ color: 'var(--sage)', opacity: 0.7, marginBottom: 12 }} />
          <h3 className="empty-state-title">
            {searchQuery || selectedFilter !== 'All'
              ? 'No matching tracked applications'
              : 'No tracked applications yet'}
          </h3>
          <p className="empty-state-text">
            {searchQuery || selectedFilter !== 'All'
              ? 'Try adjusting your search filter or selecting "All" to view all your tracked submissions.'
              : 'Add competitions, hackathons, and internships to your pipeline with 1-click directly from the Radar Feed or opportunity cards.'}
          </p>
          <button type="button" className="btn-primary" onClick={onNavigateToExplore}>
            <Plus size={14} />
            <span>Find Hackathons to Track</span>
          </button>
        </div>
      )}
    </div>
  )
}
