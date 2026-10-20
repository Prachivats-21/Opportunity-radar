import React, { useState, useRef, useEffect } from 'react'
import {
  Bookmark,
  Calendar,
  MapPin,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Globe,
  Clock,
  ShieldCheck,
  AlertCircle,
  XCircle,
} from 'lucide-react'
import type { Opportunity, MatchResult, ApplicationStatus } from '../types'

interface OpportunityCardProps {
  opportunity: Opportunity
  match?: MatchResult
  isSaved: boolean
  onToggleSave: (id: string) => void
  onInspect?: (opportunity: Opportunity) => void
  userSkills?: string[]
  trackedStatus?: ApplicationStatus
  onTrackApplication?: (opportunity: Opportunity, status: ApplicationStatus) => void
}

let sharedCardObserver: IntersectionObserver | null = null
const cardFocusCallbacks = new Map<Element, (focused: boolean) => void>()

function getSharedCardObserver() {
  if (!sharedCardObserver && typeof IntersectionObserver !== 'undefined') {
    sharedCardObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const cb = cardFocusCallbacks.get(entry.target)
          if (cb) {
            cb(entry.isIntersecting && entry.intersectionRatio >= 0.45)
          }
        }
      },
      {
        threshold: [0.2, 0.45, 0.75],
        rootMargin: '-12% 0px -12% 0px',
      }
    )
  }
  return sharedCardObserver
}

export const OpportunityCardComponent: React.FC<OpportunityCardProps> = ({
  opportunity,
  match,
  isSaved,
  onToggleSave,
  onInspect,
  userSkills = [],
  trackedStatus,
  onTrackApplication,
}) => {
  const cardRef = useRef<HTMLElement | null>(null)
  const [isScrollFocused, setIsScrollFocused] = useState(false)

  // Dynamic scroll-aware focus with shared IntersectionObserver (O(1) overhead)
  useEffect(() => {
    const el = cardRef.current
    if (!el) return
    const obs = getSharedCardObserver()
    if (!obs) return

    cardFocusCallbacks.set(el, setIsScrollFocused)
    obs.observe(el)
    return () => {
      cardFocusCallbacks.delete(el)
      obs.unobserve(el)
    }
  }, [])

  // Calculate days remaining to deadline
  const calculateDaysLeft = (deadlineStr: string | null): number | null => {
    if (!deadlineStr) return null
    try {
      const deadline = new Date(deadlineStr)
      const now = new Date()
      const diffTime = deadline.getTime() - now.getTime()
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    } catch {
      return null
    }
  }

  const daysRemaining = calculateDaysLeft(opportunity.deadline)

  const formatDisplayDate = (dateStr: string | null): string => {
    if (!dateStr) return 'Ongoing'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  const getInitials = (orgName: string): string => {
    if (!orgName) return 'OP'
    const parts = orgName.trim().split(/\s+/)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }

  const getPlatformMeta = (sourceUrl: string, sourceName?: string) => {
    const lowerUrl = (sourceUrl || '').toLowerCase()
    if (lowerUrl.includes('unstop.com')) {
      return { platform: 'Unstop', buttonText: 'Apply on Unstop' }
    }
    if (lowerUrl.includes('gov.in') || lowerUrl.includes('nic.in') || lowerUrl.includes('aicte')) {
      return { platform: 'Govt Portal', buttonText: 'Apply on Portal' }
    }
    if (lowerUrl.includes('devpost.com')) {
      return { platform: 'Devpost', buttonText: 'View on Devpost' }
    }
    if (lowerUrl.includes('hackerearth.com')) {
      return { platform: 'HackerEarth', buttonText: 'Apply on HackerEarth' }
    }
    return {
      platform: sourceName || 'Official Source',
      buttonText: `Apply on ${sourceName ? sourceName.split(' ')[0] : 'Portal'}`,
    }
  }

  const platformMeta = getPlatformMeta(opportunity.source_url, opportunity.source_name)
  const catLower = (opportunity.category || 'other').toLowerCase()
  const normalizedUserSkills = userSkills.map((s) => s.toLowerCase().trim())

  // Concise fit reason
  const conciseReason = match?.reasons?.[0] || (match && match.score >= 70 ? 'High relevance to your target skills.' : null)

  return (
    <article
      ref={cardRef}
      className={`clean-opportunity-card ${isScrollFocused ? 'scroll-focused-card' : ''}`}
      aria-labelledby={`opp-title-${opportunity.id}`}
      onClick={() => onInspect && onInspect(opportunity)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onInspect && onInspect(opportunity)
      }}
    >
      {/* 1. Header: Org, Category, Urgency & Bookmark */}
      <div className="clean-card-header">
        <div className="clean-card-org-row">
          <div className={`clean-org-avatar c-${catLower}`} aria-hidden="true">
            {getInitials(opportunity.organization)}
          </div>
          <div className="clean-org-info">
            <span className="clean-org-name">{opportunity.organization}</span>
            <div className="clean-card-tags">
              <span className={`clean-category-badge cat-${catLower}`}>
                {opportunity.category}
              </span>
              <span className="clean-platform-badge">
                {platformMeta.platform}
              </span>
            </div>
          </div>
        </div>

        <div className="clean-card-top-right">
          {daysRemaining !== null && (
            <span
              className={`clean-deadline-pill ${
                daysRemaining <= 7 ? 'critical' : daysRemaining <= 14 ? 'warning' : 'normal'
              }`}
            >
              <Clock size={11} />
              {daysRemaining <= 0
                ? 'Closing Today'
                : daysRemaining <= 14
                ? `${daysRemaining}d left`
                : `Due ${formatDisplayDate(opportunity.deadline)}`}
            </span>
          )}

          <button
            type="button"
            className={`clean-bookmark-btn ${isSaved ? 'saved' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onToggleSave(opportunity.id)
            }}
            aria-label={isSaved ? `Remove ${opportunity.title} from saved` : `Save ${opportunity.title}`}
            title={isSaved ? 'Remove from saved' : 'Save opportunity'}
          >
            <Bookmark size={15} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* 2. Title & Summary */}
      <h3 className="clean-card-title" id={`opp-title-${opportunity.id}`}>
        {opportunity.title}
      </h3>
      <p className="clean-card-summary">{opportunity.summary}</p>

      {/* 3. Skills Pills */}
      {opportunity.skills && opportunity.skills.length > 0 && (
        <div className="clean-skills-wrap">
          {opportunity.skills.slice(0, 4).map((skill) => {
            const isOverlap = normalizedUserSkills.includes(skill.toLowerCase().trim())
            return (
              <span key={skill} className={`clean-skill-pill ${isOverlap ? 'matching' : ''}`}>
                {isOverlap && <CheckCircle2 size={10} style={{ marginRight: 3 }} />}
                {skill}
              </span>
            )
          })}
          {opportunity.skills.length > 4 && (
            <span className="clean-skill-pill more">+{opportunity.skills.length - 4}</span>
          )}
        </div>
      )}

      {/* 4. Match Signal Highlight */}
      {match && (
        <div className="clean-match-bar">
          <div className="clean-match-score-badge">
            <Sparkles size={11} />
            <span>{match.score}% Fit</span>
          </div>
          {conciseReason && <span className="clean-match-reason">{conciseReason}</span>}
        </div>
      )}

      {/* 5. Footer: Location, Mode, and Action Buttons */}
      <div className="clean-card-footer">
        <div className="clean-footer-meta">
          <span className="clean-meta-item">
            <Globe size={12} />
            {opportunity.mode || 'Online'}
          </span>
          {opportunity.location && opportunity.location !== 'Not specified' && (
            <span className="clean-meta-item">
              <MapPin size={12} />
              {opportunity.location.split(';')[0]}
            </span>
          )}
        </div>

        <div className="clean-card-actions">
          {onTrackApplication && (
            <button
              type="button"
              className={`clean-track-btn ${trackedStatus ? 'tracked' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                onTrackApplication(opportunity, trackedStatus ? 'Under Review' : 'Applied')
              }}
              title="Track application progress"
            >
              <CheckCircle2 size={12} />
              <span>{trackedStatus || 'Track'}</span>
            </button>
          )}

          <button
            type="button"
            className="clean-details-btn"
            onClick={(e) => {
              e.stopPropagation()
              onInspect && onInspect(opportunity)
            }}
          >
            Details
          </button>

          <a
            href={opportunity.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="clean-apply-btn"
            onClick={(e) => e.stopPropagation()}
            title={`Apply on ${platformMeta.platform}`}
          >
            <span>{platformMeta.buttonText}</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </article>
  )
}

export const OpportunityCard = React.memo(OpportunityCardComponent)
