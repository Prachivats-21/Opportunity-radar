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
  Globe,
  Layers,
  Target,
  HelpCircle,
  Zap,
  Info,
  Radio,
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
    const stats: Record<string, { total: number; matches: number; online: number; offline: number }> = {
      Hackathon: { total: 0, matches: 0, online: 0, offline: 0 },
      Internship: { total: 0, matches: 0, online: 0, offline: 0 },
      Competition: { total: 0, matches: 0, online: 0, offline: 0 },
      Fellowship: { total: 0, matches: 0, online: 0, offline: 0 },
    }

    opportunities.forEach((opp) => {
      const cat = opp.category
      if (stats[cat]) {
        stats[cat].total += 1
        const match = matchMap.get(opp.id)
        if (match && match.score >= 50) {
          stats[cat].matches += 1
        }
        const m = (opp.mode || '').toLowerCase()
        if (
          m.includes('offline') ||
          m.includes('in-person') ||
          m.includes('on-site') ||
          m.includes('on-campus') ||
          (opp.location || '').toLowerCase().includes('in-person')
        ) {
          stats[cat].offline += 1
        } else {
          stats[cat].online += 1
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
    <div className="overview-command-center" aria-label="Opportunity Radar Overview">
      {/* 1. HERO SECTION (Clean, purposeful, high-clarity) */}
      <section className="dashboard-hero-section">
        <div className="hero-content-main">
          <div className="hero-top-badge-row">
            <span className="hero-status-pill">
              <span className="live-radar-dot" />
              <span>Live Radar · Sourced from 10+ student platforms</span>
            </span>
            <button
              type="button"
              className="hero-profile-pill"
              onClick={onEditProfile}
              title="Calibrate your domain or skills"
            >
              <UserCheck size={13} className="text-accent" />
              <span>{firstName} · {profile.field}</span>
              <span className="hero-pill-link">Calibrate →</span>
            </button>
          </div>

          <div className="hero-title-group">
            <h1 className="hero-main-heading">
              Student opportunities, <em>matched to your skills.</em>
            </h1>
            <p className="hero-lead-text">
              A centralized, merit-first radar aggregating verified hackathons, internships, case competitions, and fellowships. Filtered by what you build, open to all academic years with direct official links.
            </p>
          </div>

          <div className="hero-actions-row">
            <button
              type="button"
              className="btn-primary hero-cta-btn"
              onClick={() => {
                const el = document.getElementById('curated-signals-section')
                el?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <span>Explore Recommended Signals</span>
              <ArrowRight size={14} />
            </button>

            {onConnectLinkedIn && (
              <button
                type="button"
                className={`btn-secondary hero-secondary-btn ${isLinkedInConnected ? 'synced' : ''}`}
                onClick={onConnectLinkedIn}
                title="Sync skills from LinkedIn"
              >
                <Linkedin size={14} />
                <span>{isLinkedInConnected ? 'LinkedIn Profile Connected' : 'Sync LinkedIn (Optional)'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Compact Metric Bar */}
        <div className="hero-metrics-strip">
          <div
            className="hero-metric-tile"
            onClick={() => onSelectTab('all')}
            role="button"
            tabIndex={0}
            title="View all opportunities"
          >
            <span className="metric-tile-val">{opportunities.length}</span>
            <span className="metric-tile-lbl">Open Opportunities</span>
            <span className="metric-tile-sub">All Academic Years</span>
          </div>

          <div
            className="hero-metric-tile"
            onClick={() => {
              const el = document.getElementById('urgent-radar-section')
              el?.scrollIntoView({ behavior: 'smooth' })
            }}
            role="button"
            tabIndex={0}
            title="View opportunities closing soon"
          >
            <span className="metric-tile-val urgent-val">{closingSoonList.length}</span>
            <span className="metric-tile-lbl">Closing Soon</span>
            <span className="metric-tile-sub">Within 14 Days</span>
          </div>

          <div
            className="hero-metric-tile"
            onClick={() => {
              const el = document.getElementById('curated-signals-section')
              el?.scrollIntoView({ behavior: 'smooth' })
            }}
            role="button"
            tabIndex={0}
            title="Explore highest matched signal"
          >
            <span className="metric-tile-val match-val">
              {topSpotlights[0] ? `${matchMap.get(topSpotlights[0].id)?.score || 95}%` : '100%'}
            </span>
            <span className="metric-tile-lbl">Top Match Score</span>
            <span className="metric-tile-sub">Tailored to Your Profile</span>
          </div>
        </div>
      </section>

      {/* 2. EXPLORE DEDICATED PORTALS (Cohesive 4-card neutral system) */}
      <section className="overview-section" id="portals-section" aria-label="Explore dedicated categories">
        <div className="overview-section-header">
          <div className="section-title-wrap">
            <h2 className="overview-section-title">Explore Dedicated Portals</h2>
            <span className="overview-section-subtitle">
              Focused tracks across hackathons, internships, competitions, and fellowships
            </span>
          </div>
        </div>

        <div className="category-launchpad-grid">
          {/* Hackathons */}
          <div
            className="portal-card"
            onClick={() => onSelectTab('Hackathons')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelectTab('Hackathons')}
          >
            <div className="portal-card-top">
              <div className="portal-icon-wrap">
                <Code2 size={18} />
              </div>
              <span className="portal-count-tag">{categoryStats['Hackathon']?.total || 0} Available</span>
            </div>
            <h3 className="portal-card-title">Hackathons</h3>
            <p className="portal-card-desc">
              Sprint builds, developer challenges, and product prototype sprints with cash prizes.
            </p>
            <div className="portal-card-footer">
              <span className="portal-link-text">
                <span>Explore Hackathons</span>
                <ArrowRight size={13} />
              </span>
            </div>
          </div>

          {/* Internships */}
          <div
            className="portal-card"
            onClick={() => onSelectTab('Internships')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelectTab('Internships')}
          >
            <div className="portal-card-top">
              <div className="portal-icon-wrap">
                <Briefcase size={18} />
              </div>
              <span className="portal-count-tag">{categoryStats['Internship']?.total || 0} Open Roles</span>
            </div>
            <h3 className="portal-card-title">Internships</h3>
            <p className="portal-card-desc">
              Summer 2026 APM, SWE, data science, and cybersecurity roles verified from top teams.
            </p>
            <div className="portal-card-footer">
              <span className="portal-link-text">
                <span>Explore Internships</span>
                <ArrowRight size={13} />
              </span>
            </div>
          </div>

          {/* Competitions */}
          <div
            className="portal-card"
            onClick={() => onSelectTab('Competitions')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelectTab('Competitions')}
          >
            <div className="portal-card-top">
              <div className="portal-icon-wrap">
                <Trophy size={18} />
              </div>
              <span className="portal-count-tag">{categoryStats['Competition']?.total || 0} Challenges</span>
            </div>
            <h3 className="portal-card-title">Competitions</h3>
            <p className="portal-card-desc">
              National business case cups, product teardowns, and design thinking challenges.
            </p>
            <div className="portal-card-footer">
              <span className="portal-link-text">
                <span>Explore Competitions</span>
                <ArrowRight size={13} />
              </span>
            </div>
          </div>

          {/* Fellowships */}
          <div
            className="portal-card"
            onClick={() => onSelectTab('Fellowships')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelectTab('Fellowships')}
          >
            <div className="portal-card-top">
              <div className="portal-icon-wrap">
                <GraduationCap size={18} />
              </div>
              <span className="portal-count-tag">{categoryStats['Fellowship']?.total || 0} Cohorts</span>
            </div>
            <h3 className="portal-card-title">Fellowships</h3>
            <p className="portal-card-desc">
              Selective 8 to 12-week programs offering mentorship, stipends, and peer cohorts.
            </p>
            <div className="portal-card-footer">
              <span className="portal-link-text">
                <span>Explore Fellowships</span>
                <ArrowRight size={13} />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TOP 3 CURATED SIGNALS (Clean, compact list/rows for easy scanning) */}
      <section className="overview-section" id="curated-signals-section" aria-label="Recommended opportunities">
        <div className="overview-section-header with-action">
          <div className="section-title-wrap">
            <h2 className="overview-section-title">Recommended for You</h2>
            <span className="overview-section-subtitle">
              Ranked by match compatibility with your field ({profile.field}) and target skills
            </span>
          </div>
          <button
            type="button"
            className="btn-link-action"
            onClick={() => onSelectTab('all')}
          >
            <span>View all opportunities ({opportunities.length})</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="curated-opportunity-list">
          {topSpotlights.map((opp, idx) => {
            const match = matchMap.get(opp.id)
            const isSaved = saved.includes(opp.id)
            const score = match?.score || 90

            return (
              <div key={opp.id} className="opportunity-row-card">
                {/* Left: Match score badge */}
                <div className="opportunity-row-badge-col">
                  <span className="row-match-badge">
                    <Sparkles size={11} />
                    <span>{score}% Match</span>
                  </span>
                </div>

                {/* Middle: Title, Meta, Summary, Skills */}
                <div className="opportunity-row-main-col">
                  <div className="opportunity-row-header">
                    <h3
                      className="opportunity-row-title"
                      onClick={() => onInspect(opp)}
                    >
                      {opp.title}
                    </h3>
                    <div className="opportunity-row-meta">
                      <span className="row-org-name">{opp.organization}</span>
                      <span className="row-bullet">·</span>
                      <span className="row-cat-name">{opp.category}</span>
                      <span className="row-bullet">·</span>
                      <span className="row-mode-name">{opp.mode}</span>
                    </div>
                  </div>

                  <p className="opportunity-row-summary">{opp.summary}</p>

                  {/* Skills tags */}
                  <div className="opportunity-row-skills">
                    {opp.skills.slice(0, 3).map((sk) => (
                      <span key={sk} className="row-skill-tag">{sk}</span>
                    ))}
                    {opp.skills.length > 3 && (
                      <span className="row-skill-more">+{opp.skills.length - 3}</span>
                    )}
                  </div>
                </div>

                {/* Right: Deadline & Actions */}
                <div className="opportunity-row-actions-col">
                  <div className="row-deadline-wrap">
                    <Clock size={12} />
                    <span>{formatDaysLeft(opp.deadline)}</span>
                  </div>

                  <div className="row-buttons-group">
                    <button
                      type="button"
                      className={`row-save-btn ${isSaved ? 'saved' : ''}`}
                      onClick={() => onToggleSave(opp.id)}
                      title={isSaved ? 'Remove from saved' : 'Save opportunity'}
                      aria-label="Save opportunity"
                    >
                      <Bookmark size={14} fill={isSaved ? 'currentColor' : 'none'} />
                    </button>

                    <button
                      type="button"
                      className="btn-primary row-view-btn"
                      onClick={() => onInspect(opp)}
                    >
                      <span>View Details</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 4. SECONDARY SECTION: Urgent Deadlines & Target Preferences (Clean, compact 2-panel grid) */}
      <div className="overview-split-grid" id="urgent-radar-section">
        {/* Urgent Deadlines Radar */}
        <section className="overview-card-panel urgent-panel">
          <div className="panel-header">
            <div className="panel-header-title">
              <Clock size={15} className="text-amber" />
              <h3>Urgent Deadlines</h3>
            </div>
            <span className="panel-badge-subtle">{closingSoonList.length} closing soon</span>
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
                  onKeyDown={(e) => e.key === 'Enter' && onInspect(opp)}
                >
                  <div className="urgent-item-info">
                    <span className="urgent-item-title">{opp.title}</span>
                    <span className="urgent-item-org">{opp.organization} · {opp.category}</span>
                  </div>
                  <span className="urgent-countdown-tag">
                    {formatDaysLeft(opp.deadline)}
                  </span>
                </div>
              ))
            ) : (
              <p className="panel-empty-text">No opportunities closing in the next 14 days.</p>
            )}
          </div>
        </section>

        {/* Target Preferences & Signals */}
        <section className="overview-card-panel calibration-panel">
          <div className="panel-header">
            <div className="panel-header-title">
              <TrendingUp size={15} className="text-accent" />
              <h3>Target Preferences</h3>
            </div>
            <button type="button" className="panel-text-action" onClick={onEditProfile}>
              Edit preferences →
            </button>
          </div>

          <div className="calibration-body">
            <div className="calibration-meta-item">
              <span className="calibration-label">Career Focus</span>
              <span className="calibration-value">{profile.field}</span>
            </div>

            <div className="calibration-meta-item">
              <span className="calibration-label">Eligibility</span>
              <span className="calibration-value">
                {profile.year === 'All Years' ? 'Open to All Years (Merit-First)' : `Year ${profile.year}`}
              </span>
            </div>

            <div className="calibration-skills-item">
              <span className="calibration-label">Active Skills</span>
              <div className="calibration-chips-wrap">
                {(profile.skills && profile.skills.length > 0
                  ? profile.skills
                  : ['Product Management', 'Wireframing', 'PRD', 'A/B Testing']
                ).map((s) => (
                  <span key={s} className="calibration-chip">{s}</span>
                ))}
              </div>
            </div>

            {onConnectLinkedIn && (
              <div className="calibration-footer-action">
                <button
                  type="button"
                  className={`btn-linkedin-subtle ${isLinkedInConnected ? 'connected' : ''}`}
                  onClick={onConnectLinkedIn}
                >
                  <Linkedin size={13} />
                  <span>{isLinkedInConnected ? '✓ LinkedIn Profile Synced' : 'Sync LinkedIn for auto-match'}</span>
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
