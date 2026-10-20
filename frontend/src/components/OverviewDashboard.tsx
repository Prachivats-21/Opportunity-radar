import React, { useMemo } from 'react'
import {
  Sparkles,
  Calendar,
  ShieldCheck,
  ArrowRight,
  Code2,
  Briefcase,
  Trophy,
  GraduationCap,
  Clock,
  ExternalLink,
  Bookmark,
  CheckCircle2,
  UserCheck,
  TrendingUp,
  Linkedin,
  Compass,
} from 'lucide-react'
import { RadarMark } from './RadarMark'
import type { Opportunity, Profile, MatchResult, ApplicationStatus } from '../types'

interface OverviewDashboardProps {
  profile: Profile
  opportunities: Opportunity[]
  matchMap: Map<string, MatchResult>
  saved: string[]
  applicationStatusMap: Map<string, ApplicationStatus>
  onSelectTab: (tab: string) => void
  onInspect: (opp: Opportunity) => void
  onToggleSave: (id: string) => void
  onEditProfile: () => void
  onConnectLinkedIn?: () => void
  isLinkedInConnected?: boolean
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  profile,
  opportunities,
  matchMap,
  saved,
  applicationStatusMap,
  onSelectTab,
  onInspect,
  onToggleSave,
  onEditProfile,
  onConnectLinkedIn,
  isLinkedInConnected = false,
}) => {
  const firstName = profile.name?.trim().split(/\s+/)[0] || 'Student'

  // Calculate Category Counts & Matches
  const categoryStats = useMemo(() => {
    const stats: Record<string, { total: number; matches: number }> = {
      Hackathon: { total: 0, matches: 0 },
      Internship: { total: 0, matches: 0 },
      Competition: { total: 0, matches: 0 },
      Fellowship: { total: 0, matches: 0 },
    }

    opportunities.forEach((opp) => {
      const cat = opp.category
      if (stats[cat]) {
        stats[cat].total += 1
        const match = matchMap.get(opp.id)
        if (match && match.score >= 50) {
          stats[cat].matches += 1
        }
      }
    })

    return stats
  }, [opportunities, matchMap])

  // Top 3 Curated Spotlight Matches
  const topSpotlights = useMemo(() => {
    return [...opportunities]
      .sort((a, b) => {
        const scoreA = matchMap.get(a.id)?.score || 0
        const scoreB = matchMap.get(b.id)?.score || 0
        return scoreB - scoreA
      })
      .slice(0, 3)
  }, [opportunities, matchMap])

  // Closing Soon (Deadlines within 14 days)
  const closingSoonList = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return opportunities
      .filter((opp) => {
        if (!opp.deadline) return false
        const diffDays = Math.ceil(
          (new Date(opp.deadline).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
        )
        return diffDays >= 0 && diffDays <= 14
      })
      .sort((a, b) => (a.deadline || '').localeCompare(b.deadline || ''))
      .slice(0, 4)
  }, [opportunities])

  const totalEligibleCount = useMemo(() => {
    return opportunities.filter((o) => {
      if (!profile.year || profile.year === 'Not specified') return true
      return o.eligible_years.length === 0 || o.eligible_years.includes(profile.year)
    }).length
  }, [opportunities, profile.year])

  const formatDaysLeft = (deadline: string | null) => {
    if (!deadline) return 'Ongoing'
    const today = new Date().toISOString().slice(0, 10)
    const diffDays = Math.ceil(
      (new Date(deadline).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (diffDays === 0) return 'Closes today'
    if (diffDays === 1) return '1 day left'
    return `${diffDays} days left`
  }

  return (
    <div className="overview-command-center" aria-label="Student Radar Overview">
      {/* 1. Main Welcome & Signal Calibration Hero */}
      <section className="clean-hero-section">
        {/* Topline Bar */}
        <div className="clean-hero-topline">
          <div className="hero-status-pill">
            <span className="live-radar-dot" />
            <span>Live Aggregator · Unstop, Govt Portals, LinkedIn & Devpost</span>
          </div>

          <button
            type="button"
            className="clean-profile-badge"
            onClick={onEditProfile}
            title="Click to calibrate your target skills or preferences"
          >
            <UserCheck size={13} className="text-sage" />
            <span>
              {firstName} · {profile.field}
            </span>
            <span className="clean-edit-link">Calibrate →</span>
          </button>
        </div>

        {/* Hero Body */}
        <div className="clean-hero-body">
          <div className="clean-hero-title-wrap">
            <RadarMark size={36} />
            <h1 className="clean-hero-heading">
              Student opportunities, <em>matched to you.</em>
            </h1>
          </div>
          <p className="clean-hero-subhead">
            Your centralized intelligence radar for verified hackathons, internships, competitions, and fellowships. Filtered by your technical skillset and domain ambitions with direct external registration links.
          </p>
        </div>

        {/* 3 Metric Highlight Tiles */}
        <div className="clean-hero-metrics-bar">
          <div className="metric-summary-chip eligible">
            <div className="metric-icon-wrap">
              <ShieldCheck size={16} />
            </div>
            <div className="metric-text-wrap">
              <span className="metric-num">{opportunities.length} Open Catalog</span>
              <span className="metric-desc">Skill & Merit-First (No Year Gate)</span>
            </div>
          </div>

          <div className="metric-summary-chip urgent">
            <div className="metric-icon-wrap">
              <Calendar size={16} />
            </div>
            <div className="metric-text-wrap">
              <span className="metric-num">{closingSoonList.length} Urgent</span>
              <span className="metric-desc">Closing in &le; 14 days</span>
            </div>
          </div>

          <div className="metric-summary-chip top-match">
            <div className="metric-icon-wrap">
              <Sparkles size={16} />
            </div>
            <div className="metric-text-wrap">
              <span className="metric-num">
                {topSpotlights[0] ? `${matchMap.get(topSpotlights[0].id)?.score || 95}% Best Match` : 'High Affinity'}
              </span>
              <span className="metric-desc">
                {topSpotlights[0] ? topSpotlights[0].organization : 'Curated for you'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Category Launchpad (The 4 Dedicated Portals) */}
      <section className="overview-section" aria-label="Explore dedicated categories">
        <div className="overview-section-header">
          <div className="section-header-title-row">
            <Compass size={18} className="text-sage" />
            <h2 className="overview-section-title">Explore Dedicated Portals</h2>
          </div>
          <span className="overview-section-subtitle">
            Choose a focused track to filter sub-domains, prizes, and eligibility criteria
          </span>
        </div>

        <div className="category-launchpad-grid">
          {/* Hackathons Portal Card */}
          <div
            className="launchpad-card hackathons"
            onClick={() => onSelectTab('Hackathons')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelectTab('Hackathons')}
          >
            <div className="launchpad-card-top">
              <div className="launchpad-icon-box hackathon">
                <Code2 size={22} />
              </div>
              <span className="launchpad-count-pill">
                {categoryStats['Hackathon']?.total || 0} Available
              </span>
            </div>

            <div className="launchpad-card-body">
              <h3 className="launchpad-card-title">Hackathons Arena</h3>
              <p className="launchpad-card-desc">
                48 to 72-hour product builds, cyber defense challenges, and open prototype sprints with prizes up to ₹15L.
              </p>
            </div>

            <div className="launchpad-card-footer">
              <span className="launchpad-match-text">
                ⭐ {categoryStats['Hackathon']?.matches || 0} match your skills
              </span>
              <span className="launchpad-action-btn">
                Open Hackathons <ArrowRight size={13} />
              </span>
            </div>
          </div>

          {/* Internships Portal Card */}
          <div
            className="launchpad-card internships"
            onClick={() => onSelectTab('Internships')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelectTab('Internships')}
          >
            <div className="launchpad-card-top">
              <div className="launchpad-icon-box internship">
                <Briefcase size={22} />
              </div>
              <span className="launchpad-count-pill">
                {categoryStats['Internship']?.total || 0} Open Roles
              </span>
            </div>

            <div className="launchpad-card-body">
              <h3 className="launchpad-card-title">Internships Track</h3>
              <p className="launchpad-card-desc">
                Summer 2026 APM, cybersecurity, data science, and SWE internships verified directly from LinkedIn HQ & tech giants.
              </p>
            </div>

            <div className="launchpad-card-footer">
              <span className="launchpad-match-text">
                ⭐ {categoryStats['Internship']?.matches || 0} match your skills
              </span>
              <span className="launchpad-action-btn">
                Open Internships <ArrowRight size={13} />
              </span>
            </div>
          </div>

          {/* Competitions Portal Card */}
          <div
            className="launchpad-card competitions"
            onClick={() => onSelectTab('Competitions')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelectTab('Competitions')}
          >
            <div className="launchpad-card-top">
              <div className="launchpad-icon-box competition">
                <Trophy size={22} />
              </div>
              <span className="launchpad-count-pill">
                {categoryStats['Competition']?.total || 0} Live Challenges
              </span>
            </div>

            <div className="launchpad-card-body">
              <h3 className="launchpad-card-title">Competitions Hub</h3>
              <p className="launchpad-card-desc">
                National business case competitions, product teardowns, and design thinking cups fast-tracking to PPIs.
              </p>
            </div>

            <div className="launchpad-card-footer">
              <span className="launchpad-match-text">
                ⭐ {categoryStats['Competition']?.matches || 0} match your skills
              </span>
              <span className="launchpad-action-btn">
                Open Competitions <ArrowRight size={13} />
              </span>
            </div>
          </div>

          {/* Fellowships Portal Card */}
          <div
            className="launchpad-card fellowships"
            onClick={() => onSelectTab('Fellowships')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelectTab('Fellowships')}
          >
            <div className="launchpad-card-top">
              <div className="launchpad-icon-box fellowship">
                <GraduationCap size={22} />
              </div>
              <span className="launchpad-count-pill">
                {categoryStats['Fellowship']?.total || 0} Cohorts
              </span>
            </div>

            <div className="launchpad-card-body">
              <h3 className="launchpad-card-title">Fellowships & Cohorts</h3>
              <p className="launchpad-card-desc">
                Selective 8 to 12-week fellowship programs offering 1-on-1 industry mentorship, stipends, and peer masterminds.
              </p>
            </div>

            <div className="launchpad-card-footer">
              <span className="launchpad-match-text">
                ⭐ {categoryStats['Fellowship']?.matches || 0} match your skills
              </span>
              <span className="launchpad-action-btn">
                Open Fellowships <ArrowRight size={13} />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. High-Conviction Spotlight: Top 3 Matched Signals (Curated, No Clutter) */}
      <section className="overview-section" aria-label="Top tailored opportunities">
        <div className="overview-section-header">
          <div className="section-header-title-row">
            <Sparkles size={18} className="text-sage" />
            <h2 className="overview-section-title">Top 3 Curated Signals for You</h2>
          </div>
          <span className="overview-section-subtitle">
            Ranked by compatibility with your field ({profile.field}) and target skills
          </span>
        </div>

        <div className="spotlight-cards-grid">
          {topSpotlights.map((opp, idx) => {
            const match = matchMap.get(opp.id)
            const isSaved = saved.includes(opp.id)
            const score = match?.score || 90

            return (
              <div key={opp.id} className="spotlight-card">
                <div className="spotlight-card-header">
                  <div className="spotlight-org-pill">
                    <span className="spotlight-badge-rank">#{idx + 1}</span>
                    <span className="spotlight-org-name">{opp.organization}</span>
                  </div>

                  <div className="spotlight-header-actions">
                    <span className="spotlight-match-score">
                      <Sparkles size={11} /> {score}% Match
                    </span>
                    <button
                      type="button"
                      className={`spotlight-save-btn ${isSaved ? 'saved' : ''}`}
                      onClick={() => onToggleSave(opp.id)}
                      title={isSaved ? 'Remove from saved' : 'Save for later'}
                    >
                      <Bookmark size={14} fill={isSaved ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>

                <h3 className="spotlight-card-title">{opp.title}</h3>
                <p className="spotlight-card-summary">{opp.summary}</p>

                {/* Skill Match Tags */}
                <div className="spotlight-skills-wrap">
                  {opp.skills.slice(0, 3).map((sk) => (
                    <span key={sk} className="spotlight-skill-tag">
                      {sk}
                    </span>
                  ))}
                  {opp.skills.length > 3 && (
                    <span className="spotlight-skill-more">+{opp.skills.length - 3}</span>
                  )}
                </div>

                <div className="spotlight-card-footer">
                  <div className="spotlight-meta-row">
                    <Clock size={12} />
                    <span>{formatDaysLeft(opp.deadline)}</span>
                    <span className="meta-dot">·</span>
                    <span>{opp.mode}</span>
                  </div>

                  <button
                    type="button"
                    className="btn-spotlight-inspect"
                    onClick={() => onInspect(opp)}
                  >
                    <span>View Signal</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 4. Urgent Radar & Student Readiness Dashboard Row */}
      <div className="overview-split-grid">
        {/* Urgent Deadlines Radar */}
        <section className="overview-card-panel urgent-panel">
          <div className="panel-header">
            <div className="panel-header-title">
              <Clock size={16} className="text-amber" />
              <h3>Urgent Radar (Closing Soon)</h3>
            </div>
            <span className="panel-badge">{closingSoonList.length} closing</span>
          </div>

          <div className="urgent-list">
            {closingSoonList.length > 0 ? (
              closingSoonList.map((opp) => (
                <div
                  key={opp.id}
                  className="urgent-item-row"
                  onClick={() => onInspect(opp)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="urgent-item-info">
                    <span className="urgent-item-title">{opp.title}</span>
                    <span className="urgent-item-org">{opp.organization} · {opp.category}</span>
                  </div>
                  <span className="urgent-countdown-pill">
                    {formatDaysLeft(opp.deadline)}
                  </span>
                </div>
              ))
            ) : (
              <p className="panel-empty-text">No opportunities closing in the next 14 days.</p>
            )}
          </div>
        </section>

        {/* Student Calibration & Skills Matrix */}
        <section className="overview-card-panel calibration-panel">
          <div className="panel-header">
            <div className="panel-header-title">
              <TrendingUp size={16} className="text-sage" />
              <h3>Target Preferences & Signals</h3>
            </div>
            <button type="button" className="panel-link-btn" onClick={onEditProfile}>
              Edit Preferences →
            </button>
          </div>

          <div className="calibration-body">
            <div className="calibration-meta-item">
              <span className="calibration-label">Career Focus</span>
              <span className="calibration-value">{profile.field}</span>
            </div>

            <div className="calibration-meta-item">
              <span className="calibration-label">Eligibility Model</span>
              <span className="calibration-value" style={{ color: '#A78BFA' }}>
                Open to All Years (Merit-First)
              </span>
            </div>

            <div className="calibration-skills-item">
              <span className="calibration-label">Active Target Skills</span>
              <div className="calibration-chips-wrap">
                {(profile.skills && profile.skills.length > 0
                  ? profile.skills
                  : ['Product Management', 'Wireframing', 'PRD', 'A/B Testing', 'Cybersecurity', 'Threat Hunting']
                ).map((s) => (
                  <span key={s} className="calibration-chip">
                    <CheckCircle2 size={11} /> {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="calibration-action-footer">
              {onConnectLinkedIn && (
                <button
                  type="button"
                  className={`btn-linkedin-overview ${isLinkedInConnected ? 'connected' : ''}`}
                  onClick={onConnectLinkedIn}
                >
                  <Linkedin size={13} />
                  <span>{isLinkedInConnected ? 'LinkedIn Profile Connected' : 'Sync with LinkedIn'}</span>
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
