import React from 'react'
import { Sparkles, Calendar, ShieldCheck, ArrowRight, UserCheck, Compass, Zap } from 'lucide-react'
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
  loading: boolean
}

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
  loading,
}) => {
  const firstName = userName.trim().split(/\s+/)[0] || 'Student'

  return (
    <section className="studio-hero-section" aria-label="Student Opportunity Radar Hero">
      {/* Top Meta Line: Live Sync Status & Personalized Student Calibrator */}
      <div className="hero-top-meta-row">
        <div className="hero-live-indicator">
          <span className="live-radar-dot" />
          <span className="live-radar-text">LIVE AGGREGATOR · UNSTOP, GOVT & GLOBAL TECH</span>
        </div>

        <button
          type="button"
          className="hero-profile-pill-btn"
          onClick={onEditProfile}
          title="Click to calibrate your year, field, and skills"
          aria-label="Calibrate student profile and matching preferences"
        >
          <UserCheck size={13} className="text-sage" />
          <span>
            {firstName} · {academicYear !== 'Not specified' ? `Year ${academicYear}` : 'Student'} ({fieldOfStudy})
          </span>
          <span className="edit-pill-hint">Edit Profile →</span>
        </button>
      </div>

      {/* Main Editorial Typographic Headline */}
      <div className="hero-main-content">
        <div className="hero-headline-group">
          <div className="hero-title-with-mark">
            <RadarMark size={36} animated={!loading} />
            <h1 className="hero-editorial-title">
              Discover verified opportunities. <em>Zero search friction.</em>
            </h1>
          </div>
          <p className="hero-editorial-subhead">
            Real-time pipeline aggregating hackathons, winter internships, and fellowships from Unstop, Government gazettes, and tech fellowships. Matched to your year and technical skillset with 1-click external registration.
          </p>
        </div>
      </div>

      {/* Interactive Match Signals HUD (Clickable Action Cards) */}
      <div className="hero-interactive-hud" role="region" aria-label="Interactive Match Signals">
        {/* Signal 1: Confirmed Eligible */}
        <button
          type="button"
          className="hud-action-card eligible-card"
          onClick={onFilterEligible}
          aria-label={`Filter to ${eligibleCount} confirmed eligible opportunities for Year ${academicYear}`}
        >
          <div className="hud-card-top">
            <div className="hud-icon-box eligible">
              <ShieldCheck size={16} />
            </div>
            <span className="hud-badge-tag">Year {academicYear} Eligible</span>
          </div>
          <div className="hud-card-body">
            <div className="hud-main-stat">{eligibleCount} Opportunities</div>
            <p className="hud-stat-desc">Confirmed zero requirement conflicts for your profile.</p>
          </div>
          <div className="hud-card-footer">
            <span>Filter Eligible</span>
            <ArrowRight size={13} />
          </div>
        </button>

        {/* Signal 2: Closing Soon */}
        <button
          type="button"
          className="hud-action-card urgent-card"
          onClick={onFilterClosingSoon}
          aria-label={`Filter to ${closingSoonCount} opportunities closing in 14 days or less`}
        >
          <div className="hud-card-top">
            <div className="hud-icon-box urgent">
              <Calendar size={16} />
            </div>
            <span className="hud-badge-tag urgent">Closing ≤14d</span>
          </div>
          <div className="hud-card-body">
            <div className="hud-main-stat">{closingSoonCount} Closing Soon</div>
            <p className="hud-stat-desc">Approaching portal registration deadlines.</p>
          </div>
          <div className="hud-card-footer">
            <span>View Urgent</span>
            <ArrowRight size={13} />
          </div>
        </button>

        {/* Signal 3: Peak AI Match */}
        <button
          type="button"
          className="hud-action-card match-card"
          onClick={() => {
            const el = document.getElementById('opportunity-feed')
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
          aria-label={topMatch ? `Top recommendation: ${topMatch.opportunity.title} with ${topMatch.score}% match index` : 'Explore highest matched opportunities'}
        >
          <div className="hud-card-top">
            <div className="hud-icon-box top-fit">
              <Sparkles size={16} />
            </div>
            <span className="hud-badge-tag top-fit">{topMatch ? `${topMatch.score}% Fit Index` : 'AI Ranked'}</span>
          </div>
          <div className="hud-card-body">
            <div className="hud-main-stat">
              {topMatch ? topMatch.opportunity.title.slice(0, 24) + '...' : 'Smart Ranked'}
            </div>
            <p className="hud-stat-desc">
              {topMatch ? `Top signal from ${topMatch.opportunity.organization}` : 'Custom ranked by skill overlap & tracks.'}
            </p>
          </div>
          <div className="hud-card-footer">
            <span>Explore Best Fit</span>
            <Zap size={13} />
          </div>
        </button>

        {/* Signal 4: View Complete Feed */}
        <button
          type="button"
          className="hud-action-card all-card"
          onClick={onResetFilters}
          aria-label="View all opportunities and clear active filters"
        >
          <div className="hud-card-top">
            <div className="hud-icon-box all">
              <Compass size={16} />
            </div>
            <span className="hud-badge-tag">Full Feed</span>
          </div>
          <div className="hud-card-body">
            <div className="hud-main-stat">Explore All</div>
            <p className="hud-stat-desc">Browse full catalog across all tracks & formats.</p>
          </div>
          <div className="hud-card-footer">
            <span>Reset & Show All</span>
            <ArrowRight size={13} />
          </div>
        </button>
      </div>
    </section>
  )
}
