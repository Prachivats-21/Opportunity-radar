import React from 'react'
import { Sparkles, Calendar, ShieldCheck, ArrowRight, Settings2, Compass } from 'lucide-react'
import { RadarMark } from './RadarMark'
import type { MatchResult } from '../types'

interface WelcomeHeroProps {
  userName: string
  academicYear: string
  fieldOfStudy: string
  closingSoonCount: number
  eligibleCount: number
  topMatch?: MatchResult
  totalCount: number
  onExploreClick: () => void
  onTuneClick: () => void
  loading: boolean
}

export const WelcomeHero: React.FC<WelcomeHeroProps> = ({
  userName,
  academicYear,
  fieldOfStudy,
  closingSoonCount,
  eligibleCount,
  topMatch,
  totalCount,
  onExploreClick,
  onTuneClick,
  loading,
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const firstName = userName.trim().split(/\s+/)[0] || 'Student'

  return (
    <section className="compact-summary-banner" aria-label="Student Radar Summary">
      <div className="summary-left">
        <div className="summary-greeting-row">
          <RadarMark size={32} animated={!loading} />
          <div>
            <div className="summary-eyebrow">
              <span>{getGreeting()}, {firstName}</span>
              <span className="summary-dot-sep">·</span>
              <span className="summary-profile-tag">
                {academicYear !== 'Not specified' ? `Year ${academicYear}` : 'Student'} · {fieldOfStudy}
              </span>
            </div>
            <h1 className="summary-headline">
              Radar Summary: <em>{totalCount} verified listings</em> in range.
            </h1>
          </div>
        </div>
      </div>

      {/* 3 Real Computed Signal Metrics */}
      <div className="summary-metrics-grid">
        {/* Metric 1: Confirmed Eligible */}
        <div className="summary-metric-card eligible">
          <div className="metric-icon-box">
            <ShieldCheck size={16} />
          </div>
          <div className="metric-details">
            <div className="metric-value">{eligibleCount}</div>
            <div className="metric-label">Confirmed Eligible</div>
          </div>
        </div>

        {/* Metric 2: Closing Soon */}
        <div className="summary-metric-card urgent">
          <div className="metric-icon-box">
            <Calendar size={16} />
          </div>
          <div className="metric-details">
            <div className="metric-value">{closingSoonCount}</div>
            <div className="metric-label">Closing in ≤14 Days</div>
          </div>
        </div>

        {/* Metric 3: Top Match */}
        {topMatch && (
          <div className="summary-metric-card top-fit">
            <div className="metric-icon-box">
              <Sparkles size={16} />
            </div>
            <div className="metric-details">
              <div className="metric-value">{topMatch.score}%</div>
              <div className="metric-label" title={topMatch.opportunity.title}>
                Top: {topMatch.opportunity.title.slice(0, 20)}...
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Button */}
      <div className="summary-actions">
        <button
          className="btn-primary summary-action-btn"
          onClick={() => {
            const el = document.getElementById('opportunity-feed')
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            } else {
              onExploreClick()
            }
          }}
          aria-label="Scroll to opportunity feed"
        >
          <Compass size={14} />
          <span>View Radar Feed</span>
          <ArrowRight size={13} />
        </button>

        <button
          className="btn-secondary summary-action-btn"
          onClick={onTuneClick}
          title="Tune academic year, skills and preferences"
          aria-label="Tune profile preferences"
        >
          <Settings2 size={14} />
          <span>Tune Radar</span>
        </button>
      </div>
    </section>
  )
}
