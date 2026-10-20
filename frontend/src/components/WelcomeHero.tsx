import React from 'react'
import { Sparkles, Calendar, ShieldCheck, ArrowRight, UserCheck, Layers, Filter } from 'lucide-react'
import { RadarMark } from './RadarMark'
import type { MatchResult } from '../types'

interface WelcomeHeroProps {
  userName: string
  academicYear: string
  fieldOfStudy: string
  closingSoonCount: number
  eligibleCount: number
  topMatch?: MatchResult
  onFilterEligible: () => void
  onFilterClosingSoon: () => void
  onResetFilters: () => void
  onEditProfile: () => void
  onSelectTrack?: (track: string) => void
  activeTrack?: string
  loading: boolean
}

const POPULAR_TRACKS = [
  'All Tracks',
  'Product Management',
  'AI & Machine Learning',
  'Cybersecurity',
  'Web & Full-Stack',
  'Data Science',
]

export const WelcomeHero: React.FC<WelcomeHeroProps> = ({
  userName,
  academicYear,
  fieldOfStudy,
  closingSoonCount,
  eligibleCount,
  topMatch,
  onFilterEligible,
  onFilterClosingSoon,
  onResetFilters,
  onEditProfile,
  onSelectTrack,
  activeTrack = 'All Tracks',
  loading,
}) => {
  const firstName = userName.trim().split(/\s+/)[0] || 'Student'

  return (
    <section className="clean-hero-section" aria-label="Student Opportunities Dashboard Hero">
      {/* Top Banner: Student Identity + Live Feed Indicator */}
      <div className="clean-hero-topline">
        <div className="hero-status-pill">
          <span className="live-radar-dot" />
          <span>Live Aggregator · Unstop, Govt Portals & Devpost</span>
        </div>

        <button
          type="button"
          className="clean-profile-badge"
          onClick={onEditProfile}
          title="Click to calibrate your target skills or preferences"
          aria-label="Calibrate student profile and matching preferences"
        >
          <UserCheck size={13} className="text-sage" />
          <span>
            {firstName} · {fieldOfStudy}
          </span>
          <span className="clean-edit-link">Calibrate →</span>
        </button>
      </div>

      {/* Main Headline */}
      <div className="clean-hero-body">
        <div className="clean-hero-title-wrap">
          <RadarMark size={34} animated={!loading} />
          <h1 className="clean-hero-heading">
            Student opportunities, <em>matched to you.</em>
          </h1>
        </div>
        <p className="clean-hero-subhead">
          Discover verified student hackathons, internships, competitions, and fellowships. Filtered by your technical skillset and domain ambitions with direct 1-click external registration.
        </p>

        {/* 1-Click Quick Track Selector */}
        {onSelectTrack && (
          <div className="hero-track-pills-row" aria-label="Filter by popular academic track">
            <span className="track-pills-label">Explore tracks:</span>
            <div className="track-pills-list">
              {POPULAR_TRACKS.map((track) => {
                const isActive = activeTrack.toLowerCase() === track.toLowerCase()
                return (
                  <button
                    key={track}
                    type="button"
                    className={`track-pill-chip ${isActive ? 'active' : ''}`}
                    onClick={() => onSelectTrack(track)}
                  >
                    {track}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Clean 3-Metric Highlight Strip */}
      <div className="clean-hero-metrics-bar">
        <button
          type="button"
          className="metric-summary-chip eligible"
          onClick={onFilterEligible}
          title="Filter to confirmed eligible opportunities"
        >
          <div className="metric-icon-wrap">
            <ShieldCheck size={15} />
          </div>
          <div className="metric-text-wrap">
            <span className="metric-num">{eligibleCount > 0 ? eligibleCount : 'Matches Available'}</span>
            <span className="metric-desc">Skill & Merit-First Matching</span>
          </div>
        </button>

        <button
          type="button"
          className="metric-summary-chip urgent"
          onClick={onFilterClosingSoon}
          title="Filter to opportunities closing in 14 days or less"
        >
          <div className="metric-icon-wrap">
            <Calendar size={15} />
          </div>
          <div className="metric-text-wrap">
            <span className="metric-num">{closingSoonCount} Closing Soon</span>
            <span className="metric-desc">Deadlines in &le;14 days</span>
          </div>
        </button>

        {topMatch ? (
          <button
            type="button"
            className="metric-summary-chip top-match"
            onClick={() => {
              const el = document.getElementById('opportunity-feed')
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
            title="View highest matching recommendation"
          >
            <div className="metric-icon-wrap">
              <Sparkles size={15} />
            </div>
            <div className="metric-text-wrap">
              <span className="metric-num">{topMatch.score}% Best Match</span>
              <span className="metric-desc">{topMatch.opportunity.title.slice(0, 26)}...</span>
            </div>
          </button>
        ) : (
          <button
            type="button"
            className="metric-summary-chip reset"
            onClick={onResetFilters}
            title="Show full opportunity catalog"
          >
            <div className="metric-icon-wrap">
              <Filter size={15} />
            </div>
            <div className="metric-text-wrap">
              <span className="metric-num">Explore All</span>
              <span className="metric-desc">Browse full catalog</span>
            </div>
          </button>
        )}
      </div>
    </section>
  )
}
