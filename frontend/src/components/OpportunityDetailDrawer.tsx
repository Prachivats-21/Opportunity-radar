import React, { useEffect } from 'react'
import {
  X,
  ExternalLink,
  Bookmark,
  Calendar,
  Globe,
  MapPin,
  Users,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Share2,
  CheckCircle2,
  Clock,
  ArrowRight,
  BookOpen,
} from 'lucide-react'
import type { Opportunity, MatchResult, ApplicationStatus } from '../types'

interface OpportunityDetailDrawerProps {
  opportunity: Opportunity | null
  match?: MatchResult
  isOpen: boolean
  onClose: () => void
  isSaved: boolean
  onToggleSave: (id: string) => void
  userSkills: string[]
  onSelectCategory?: (category: string) => void
  trackedStatus?: ApplicationStatus
  onTrackApplication?: (opportunity: Opportunity, status: ApplicationStatus) => void
}

export const OpportunityDetailDrawer: React.FC<OpportunityDetailDrawerProps> = ({
  opportunity,
  match,
  isOpen,
  onClose,
  isSaved,
  onToggleSave,
  userSkills,
  onSelectCategory,
  trackedStatus,
  onTrackApplication,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !opportunity) return null

  // Calculate days remaining
  const calculateDaysLeft = (deadlineStr: string | null): number | null => {
    if (!deadlineStr) return null
    const deadline = new Date(`${deadlineStr}T23:59:59`).getTime()
    const now = Date.now()
    return Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
  }

  const daysLeft = calculateDaysLeft(opportunity.deadline)

  const formatDisplayDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not specified'
    return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  // Dynamic Platform Detection & Outbound Redirection Mapping
  const getPlatformMeta = (url: string, sourceName?: string) => {
    const lowerUrl = (url || '').toLowerCase()
    const lowerSource = (sourceName || '').toLowerCase()

    if (lowerUrl.includes('unstop.com') || lowerSource.includes('unstop')) {
      return {
        platform: 'Unstop',
        buttonText: 'Register on Unstop',
        badgeClass: 'platform-unstop',
        note: 'Redirects directly to official Unstop competition portal',
      }
    }
    if (lowerUrl.includes('cyberhackathon.bihar.gov.in') || lowerUrl.includes('bihar.gov.in')) {
      return {
        platform: 'Govt of Bihar',
        buttonText: 'Register on Cyber Hackathon Portal',
        badgeClass: 'platform-gov',
        note: 'Redirects directly to official State Government portal',
      }
    }
    if (lowerUrl.includes('sih.gov.in')) {
      return {
        platform: 'Smart India Hackathon',
        buttonText: 'Register on SIH Portal',
        badgeClass: 'platform-gov',
        note: 'Redirects to Ministry of Education SIH portal',
      }
    }
    if (lowerUrl.includes('gov.in') || lowerUrl.includes('pib.gov.in') || lowerUrl.includes('nic.in')) {
      return {
        platform: 'Government of India',
        buttonText: 'Register on Official Govt Portal',
        badgeClass: 'platform-gov',
        note: 'Redirects directly to official Government Gazette portal',
      }
    }
    if (lowerUrl.includes('summerofcode.withgoogle.com') || lowerUrl.includes('google.com')) {
      return {
        platform: 'Google Open Source',
        buttonText: 'Apply on GSoC Portal',
        badgeClass: 'platform-google',
        note: 'Redirects to Google Summer of Code program directory',
      }
    }
    if (lowerUrl.includes('mlh.io')) {
      return {
        platform: 'Major League Hacking',
        buttonText: 'Apply on MLH Fellowship',
        badgeClass: 'platform-mlh',
        note: 'Redirects to MLH Fellowship application cohort',
      }
    }
    if (lowerUrl.includes('linuxfoundation.org')) {
      return {
        platform: 'Linux Foundation',
        buttonText: 'Apply on LFX Mentorship',
        badgeClass: 'platform-lfx',
        note: 'Redirects to Linux Foundation LFX Mentorship directory',
      }
    }
    if (lowerUrl.includes('microsoft.com')) {
      return {
        platform: 'Microsoft',
        buttonText: 'Register on Imagine Cup',
        badgeClass: 'platform-microsoft',
        note: 'Redirects to Microsoft Imagine Cup portal',
      }
    }
    if (lowerUrl.includes('devpost.com')) {
      return {
        platform: 'Devpost',
        buttonText: 'Register on Devpost',
        badgeClass: 'platform-devpost',
        note: 'Redirects to Devpost hackathon workspace',
      }
    }
    if (lowerUrl.includes('hackerearth.com')) {
      return {
        platform: 'HackerEarth',
        buttonText: 'Apply on HackerEarth',
        badgeClass: 'platform-hackerearth',
        note: 'Redirects to HackerEarth contest portal',
      }
    }

    return {
      platform: sourceName || 'Official Organizer',
      buttonText: `Apply on ${sourceName ? sourceName.split(' ')[0] : 'Portal'}`,
      badgeClass: 'platform-general',
      note: 'Redirects directly to official application form',
    }
  }

  const platformMeta = getPlatformMeta(opportunity.source_url, opportunity.source_name)
  const normalizedUserSkills = userSkills.map((s) => s.toLowerCase().trim())

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(opportunity.source_url)
      alert('Official portal URL copied to clipboard!')
    }
  }

  return (
    <div className="drawer-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="drawer-opp-title">
      <div className="drawer-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header Controls */}
        <div className="drawer-header">
          <div className="drawer-header-left">
            <span className={`platform-pill ${platformMeta.badgeClass}`}>
              {platformMeta.platform}
            </span>
            <span className="drawer-category-pill" onClick={() => onSelectCategory && onSelectCategory(opportunity.category)}>
              {opportunity.category}
            </span>
          </div>

          <div className="drawer-header-actions">
            <button
              type="button"
              className="drawer-action-btn"
              onClick={handleCopyLink}
              title="Copy official registration link"
              aria-label="Copy link"
            >
              <Share2 size={15} />
            </button>

            <button
              type="button"
              className={`drawer-action-btn bookmark ${isSaved ? 'saved' : ''}`}
              onClick={() => onToggleSave(opportunity.id)}
              title={isSaved ? 'Remove from saved' : 'Save opportunity'}
              aria-label={isSaved ? 'Remove from saved' : 'Save opportunity'}
            >
              <Bookmark size={15} fill={isSaved ? 'currentColor' : 'none'} />
            </button>

            <button
              type="button"
              className="drawer-close-btn"
              onClick={onClose}
              aria-label="Close detail sheet"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Drawer Body */}
        <div className="drawer-body">
          {/* Main Title Block */}
          <div className="drawer-title-block">
            <span className="drawer-org-name">{opportunity.organization}</span>
            <h2 id="drawer-opp-title" className="drawer-title">
              {opportunity.title}
            </h2>
            <p className="drawer-summary">{opportunity.summary}</p>
          </div>

          {/* Primary Registration Call-To-Action Banner */}
          <div className="drawer-cta-card">
            <div className="drawer-cta-info">
              <span className="cta-platform-label">Direct Registration Bridge</span>
              <p className="cta-platform-note">{platformMeta.note}</p>
            </div>
            <a
              href={opportunity.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`btn-primary drawer-apply-btn ${platformMeta.badgeClass}`}
            >
              <span>{platformMeta.buttonText}</span>
              <ExternalLink size={15} />
            </a>
          </div>

          {/* Key Opportunity Metadata Grid */}
          <div className="drawer-meta-grid">
            <div className="drawer-meta-item">
              <div className="meta-icon-box">
                <Calendar size={15} />
              </div>
              <div>
                <span className="meta-label">Deadline</span>
                <strong className={`meta-value ${daysLeft !== null && daysLeft <= 14 ? 'urgent' : ''}`}>
                  {daysLeft !== null
                    ? daysLeft <= 0
                      ? 'Closing today'
                      : daysLeft <= 14
                      ? `${daysLeft} days left (${formatDisplayDate(opportunity.deadline)})`
                      : formatDisplayDate(opportunity.deadline)
                    : 'To verify on portal'}
                </strong>
              </div>
            </div>

            <div className="drawer-meta-item">
              <div className="meta-icon-box">
                <Globe size={15} />
              </div>
              <div>
                <span className="meta-label">Format / Mode</span>
                <strong className="meta-value">{opportunity.mode}</strong>
              </div>
            </div>

            <div className="drawer-meta-item">
              <div className="meta-icon-box">
                <MapPin size={15} />
              </div>
              <div>
                <span className="meta-label">Location</span>
                <strong className="meta-value">{opportunity.location || 'Global / Remote'}</strong>
              </div>
            </div>

            <div className="drawer-meta-item">
              <div className="meta-icon-box">
                <Users size={15} />
              </div>
              <div>
                <span className="meta-label">Team Formation</span>
                <strong className="meta-value">
                  {opportunity.team_min && opportunity.team_max
                    ? `${opportunity.team_min} to ${opportunity.team_max} students`
                    : opportunity.team_min
                    ? `Min ${opportunity.team_min} students`
                    : 'Individual or Team'}
                </strong>
              </div>
            </div>
          </div>

          {/* Match & Eligibility Breakdown Card */}
          {match && (
            <div className="drawer-match-section">
              <div className="drawer-section-heading">
                <Sparkles size={16} className="text-sage" />
                <h3>Personalized Fit Index: {match.score}%</h3>
              </div>

              <div className="match-status-row">
                {match.eligibility === 'eligible' && (
                  <span className="eligibility-pill eligible">
                    <ShieldCheck size={13} />
                    <span>Confirmed Eligible for your profile</span>
                  </span>
                )}
                {match.eligibility === 'potentially_eligible' && (
                  <span className="eligibility-pill potentially_eligible">
                    <AlertCircle size={13} />
                    <span>Potentially eligible — confirm specific year track</span>
                  </span>
                )}
                {match.eligibility === 'not_eligible' && (
                  <span className="eligibility-pill not_eligible">
                    <AlertCircle size={13} />
                    <span>Requirement mismatch with current profile</span>
                  </span>
                )}
                {match.eligibility === 'expired' && (
                  <span className="eligibility-pill expired">
                    <Clock size={13} />
                    <span>Registration window passed</span>
                  </span>
                )}
              </div>

              {match.reasons && match.reasons.length > 0 && (
                <div className="match-reasons-block">
                  <span className="sub-heading">Why this matches you:</span>
                  <ul className="reasons-list">
                    {match.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {match.skill_gaps && match.skill_gaps.length > 0 && (
                <div className="skill-gaps-block">
                  <span className="sub-heading">Skills that give an edge:</span>
                  <div className="gap-chips">
                    {match.skill_gaps.map((gap) => (
                      <span key={gap} className="gap-pill">
                        {gap}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Skills Breakdown */}
          {opportunity.skills && opportunity.skills.length > 0 && (
            <div className="drawer-detail-section">
              <div className="drawer-section-heading">
                <BookOpen size={16} />
                <h3>Relevant Technical Skillset</h3>
              </div>
              <div className="skills-tags-row">
                {opportunity.skills.map((skill) => {
                  const isMatch = normalizedUserSkills.includes(skill.toLowerCase().trim())
                  return (
                    <span key={skill} className={`skill-pill ${isMatch ? 'overlap' : ''}`}>
                      {isMatch && <CheckCircle2 size={12} style={{ marginRight: 4 }} />}
                      {skill} {isMatch ? '(Your Skill)' : ''}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Full Description & Guidelines */}
          {opportunity.description && (
            <div className="drawer-detail-section">
              <div className="drawer-section-heading">
                <h3>Official Overview & Guidelines</h3>
              </div>
              <p className="drawer-full-desc">{opportunity.description}</p>
            </div>
          )}

          {/* Notes & Verification Checklist */}
          {opportunity.notes && (
            <div className="drawer-notes-card">
              <strong>Curator & Verification Notes:</strong>
              <p>{opportunity.notes}</p>
            </div>
          )}

          {/* Source Attribution Footer */}
          <div className="drawer-source-footer">
            <span>
              Source Verified: <strong>{opportunity.source_name || platformMeta.platform}</strong>
              {opportunity.last_verified ? ` (verified ${formatDisplayDate(opportunity.last_verified)})` : ''}
            </span>
          </div>
        </div>

        {/* Fixed Sticky Footer CTA */}
        <div className="drawer-footer-sticky">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
          >
            Close
          </button>

          {onTrackApplication && (
            <button
              type="button"
              className={`btn-track-action ${trackedStatus ? 'tracked' : ''}`}
              onClick={() => onTrackApplication(opportunity, trackedStatus ? 'Under Review' : 'Applied')}
              title={
                trackedStatus
                  ? `Tracked status: ${trackedStatus}. Click to cycle stage.`
                  : 'Track this opportunity in My Applications'
              }
              style={{ padding: '8px 14px' }}
            >
              <CheckCircle2 size={14} />
              <span>{trackedStatus ? `Tracked: ${trackedStatus}` : 'Track Application'}</span>
            </button>
          )}

          <a
            href={opportunity.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn-primary ${platformMeta.badgeClass}`}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <span>{platformMeta.buttonText}</span>
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  )
}
