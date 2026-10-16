import React, { useState } from 'react'
import {
  Bookmark,
  Calendar,
  Globe,
  MapPin,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  XCircle,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import type { Opportunity, MatchResult } from '../types'

interface OpportunityCardProps {
  opportunity: Opportunity
  match?: MatchResult
  isSaved: boolean
  onToggleSave: (id: string) => void
  userSkills?: string[]
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  opportunity,
  match,
  isSaved,
  onToggleSave,
  userSkills = [],
}) => {
  const [isAccordionOpen, setIsAccordionOpen] = useState(false)

  // Calculate days remaining to deadline
  const calculateDaysLeft = (deadlineStr: string | null): number | null => {
    if (!deadlineStr) return null
    const deadline = new Date(`${deadlineStr}T23:59:59`).getTime()
    const now = Date.now()
    return Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
  }

  const daysRemaining = calculateDaysLeft(opportunity.deadline)

  const formatDisplayDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not confirmed'
    return new Date(`${dateStr}T12:00:00`).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  // Consistent Match Score Tier Scale
  const getMatchTier = (score: number) => {
    if (score >= 65) return { tier: 'strong', label: 'Strong fit' }
    if (score >= 40) return { tier: 'moderate', label: 'Moderate fit' }
    return { tier: 'general', label: 'General fit' }
  }

  const matchTierInfo = match ? getMatchTier(match.score) : null

  // Verified Status Display
  const getVerificationBadge = (status: string) => {
    if (status === 'verified') {
      return (
        <span className="source-status-badge verified" title="Independently verified against organizer portal">
          <span className="status-indicator-dot verified" />
          <span>Verified Source</span>
        </span>
      )
    }
    if (status === 'community_extracted') {
      return (
        <span className="source-status-badge community" title="Extracted by community curator; check source">
          <span className="status-indicator-dot community" />
          <span>Curator Extracted</span>
        </span>
      )
    }
    return (
      <span className="source-status-badge recheck" title="Preliminary record; verify details before applying">
        <span className="status-indicator-dot recheck" />
        <span>Confirm on Portal</span>
      </span>
    )
  }

  // Scannable Primary Fit Reason (directly visible on card)
  const getConciseFitReason = () => {
    if (!match) return null
    if (match.reasons && match.reasons.length > 0) {
      return match.reasons[0]
    }
    if (match.explanation) {
      return match.explanation
    }
    return 'Domain fit with student profile'
  }

  const conciseReason = getConciseFitReason()

  // Monogram initials for org
  const getInitials = (text: string) => {
    return (
      text
        .split(/\s+/)
        .slice(0, 2)
        .map((s) => s[0])
        .join('')
        .toUpperCase() || 'OP'
    )
  }

  const catLower = opportunity.category.toLowerCase()
  const normalizedUserSkills = userSkills.map((s) => s.toLowerCase().trim())

  return (
    <article className="opportunity-card" aria-labelledby={`opp-title-${opportunity.id}`}>
      {/* 1. Card Topline Header */}
      <div className="card-header">
        <div className="card-org-row">
          <div className={`org-monogram-circle c-${catLower}`} aria-hidden="true">
            {getInitials(opportunity.organization)}
          </div>
          <div className="org-info">
            <span className="org-name">{opportunity.organization}</span>
            <div className="card-badge-row">
              <span className={`category-tag-inline cat-${catLower}`}>
                {opportunity.category}
              </span>
              {getVerificationBadge(opportunity.status)}
            </div>
          </div>
        </div>

        <div className="card-actions-top">
          {/* Match Score Badge (with consistent documented scale) */}
          {match && matchTierInfo && (
            <div
              className={`match-score-badge tier-${matchTierInfo.tier}`}
              title={`${match.score}% fit index based on skills, academic year, and category match`}
            >
              <Sparkles size={12} />
              <span>{match.score}%</span>
              <small className="match-tier-text">({matchTierInfo.label})</small>
            </div>
          )}

          {/* Bookmark Button */}
          <button
            className={`bookmark-btn ${isSaved ? 'saved' : ''}`}
            onClick={() => onToggleSave(opportunity.id)}
            aria-label={isSaved ? `Remove ${opportunity.title} from saved` : `Save ${opportunity.title}`}
            title={isSaved ? 'Remove from saved' : 'Save opportunity'}
          >
            <Bookmark size={15} fill={isSaved ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* 2. Opportunity Title & Summary */}
      <h3 className="card-title" id={`opp-title-${opportunity.id}`}>
        {opportunity.title}
      </h3>
      <p className="card-summary">{opportunity.summary}</p>

      {/* 3. Skill Tags (High visibility of overlap) */}
      {opportunity.skills && opportunity.skills.length > 0 && (
        <div className="skills-tags-row" aria-label="Required skills">
          {opportunity.skills.slice(0, 4).map((skill) => {
            const isOverlap = normalizedUserSkills.includes(skill.toLowerCase().trim())
            return (
              <span key={skill} className={`skill-pill ${isOverlap ? 'overlap' : ''}`}>
                {isOverlap && <CheckCircle2 size={10} style={{ marginRight: 3 }} />}
                {skill}
              </span>
            )
          })}
          {opportunity.skills.length > 4 && (
            <span className="skill-pill more">+{opportunity.skills.length - 4} more</span>
          )}
        </div>
      )}

      {/* 4. Scannable Metadata Bar (Deadline, Location, Format, Eligibility) */}
      <div className="card-meta-list">
        {/* Participation Format */}
        <div className="meta-item">
          <Globe size={13} />
          <span>{opportunity.mode === 'Confirm with organizer' ? 'Format unconfirmed' : opportunity.mode}</span>
        </div>

        {/* Location */}
        {opportunity.location && opportunity.location !== 'Not specified' && (
          <div className="meta-item">
            <MapPin size={13} />
            <span>{opportunity.location.split(';')[0]}</span>
          </div>
        )}

        {/* Deadline with explicit status and non-color-only text */}
        <div
          className={`meta-item ${
            daysRemaining !== null && daysRemaining <= 14 && daysRemaining >= 0 ? 'urgent' : ''
          }`}
        >
          <Calendar size={13} />
          <span>
            {daysRemaining === null
              ? 'Deadline to verify on source'
              : daysRemaining < 0
              ? 'Deadline passed'
              : daysRemaining === 0
              ? 'Closing today'
              : daysRemaining <= 14
              ? `Closing soon: ${daysRemaining} days left (${formatDisplayDate(opportunity.deadline)})`
              : `Due ${formatDisplayDate(opportunity.deadline)}`}
          </span>
        </div>
      </div>

      {/* 5. Scannable Key Fit Reason (Visible without expanding) */}
      {match && (
        <div className="card-scannable-fit-row">
          <div className="fit-status-badge-wrap">
            {match.eligibility === 'eligible' && (
              <span className="eligibility-pill eligible">
                <ShieldCheck size={12} />
                <span>Confirmed Eligible</span>
              </span>
            )}
            {match.eligibility === 'potentially_eligible' && (
              <span className="eligibility-pill potentially_eligible">
                <AlertCircle size={12} />
                <span>Potentially Eligible</span>
              </span>
            )}
            {match.eligibility === 'not_eligible' && (
              <span className="eligibility-pill not_eligible">
                <XCircle size={12} />
                <span>Requirement Conflict</span>
              </span>
            )}
            {match.eligibility === 'expired' && (
              <span className="eligibility-pill expired">
                <Clock size={12} />
                <span>Deadline Passed</span>
              </span>
            )}
          </div>

          {conciseReason && (
            <p className="concise-fit-reason">
              <strong>Match signal:</strong> {conciseReason}
            </p>
          )}
        </div>
      )}

      {/* 6. Expandable In-Depth Breakdown Accordion */}
      {match && (
        <div className="why-match-accordion">
          <button
            className="accordion-trigger"
            onClick={() => setIsAccordionOpen(!isAccordionOpen)}
            aria-expanded={isAccordionOpen}
          >
            <div className="accordion-trigger-left">
              <Sparkles size={13} style={{ color: 'var(--sage)' }} />
              <span>Full match breakdown & skill gap analysis</span>
            </div>
            {isAccordionOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {isAccordionOpen && (
            <div className="accordion-content">
              {match.reasons && match.reasons.length > 0 && (
                <div>
                  <div className="accordion-sublabel">Evaluation Reasons:</div>
                  <ul className="reasons-list">
                    {match.reasons.map((reason, i) => (
                      <li key={i}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {match.skill_gaps && match.skill_gaps.length > 0 && (
                <div className="skill-gaps-row">
                  <span className="accordion-sublabel">Skills to develop:</span>
                  {match.skill_gaps.slice(0, 4).map((gap) => (
                    <span key={gap} className="gap-pill">
                      {gap}
                    </span>
                  ))}
                </div>
              )}

              {opportunity.notes && (
                <div className="listing-notes-box">
                  <strong>Verification notes:</strong> {opportunity.notes}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 7. Card Footer with Action */}
      <div className="card-footer">
        <span className="source-verified-text">
          Source: {opportunity.source_name || 'Official organizer'} · verified {formatDisplayDate(opportunity.last_verified)}
        </span>

        <a
          href={opportunity.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-apply-source"
          aria-label={`Apply or view official details for ${opportunity.title} (opens in new tab)`}
        >
          <span>Apply on Official Portal</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </article>
  )
}
