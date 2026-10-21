import React, { useState, useMemo } from 'react'
import {
  Code2,
  Briefcase,
  Trophy,
  GraduationCap,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Globe,
  Sparkles,
  ArrowLeft,
  X,
  ExternalLink,
  MapPin,
  Building,
} from 'lucide-react'
import { OpportunityCard } from './OpportunityCard'
import type { Opportunity, MatchResult, Profile, ApplicationStatus } from '../types'

interface CategoryPageViewProps {
  category: 'Hackathon' | 'Internship' | 'Competition' | 'Fellowship'
  opportunities: Opportunity[]
  matchMap: Map<string, MatchResult>
  saved: string[]
  onToggleSave: (id: string) => void
  onInspect: (opportunity: Opportunity) => void
  userSkills: string[]
  applicationStatusMap: Map<string, ApplicationStatus>
  onTrackApplication: (opportunity: Opportunity, status: ApplicationStatus) => void
  profile: Profile
  onNavigateHome: () => void
}

const CATEGORY_META = {
  Hackathon: {
    title: 'Student Hackathons & Sprints',
    subtitle: 'Build functional prototypes, solve industry problem statements, and compete for hiring PPIs, incubation grants, and national prizes.',
    icon: Code2,
    accentColor: '#38BDF8',
    subfilters: ['All', 'Product Management', 'Cybersecurity & Defense', 'AI & Data', 'Online / Virtual', 'Closing Soon'],
  },
  Internship: {
    title: 'Student Internships & Trainee Programs',
    subtitle: 'Pre-placement offers (PPIs), early career trainee roles, and paid student internships across LinkedIn, Unstop, and tier-1 tech programs.',
    icon: Briefcase,
    accentColor: '#10B981',
    subfilters: ['All', 'LinkedIn Verified', 'Product Management', 'Cybersecurity', 'Remote / Online', 'Closing Soon'],
  },
  Competition: {
    title: 'Case Challenges & Coding Competitions',
    subtitle: 'National business case competitions, corporate quizzes, and algorithm challenges directly evaluated by senior industry leadership.',
    icon: Trophy,
    accentColor: '#F59E0B',
    subfilters: ['All', 'Case Studies', 'Product Challenges', 'National Finals', 'Closing Soon'],
  },
  Fellowship: {
    title: 'Student Fellowships & Research Grants',
    subtitle: 'Funded research fellowships, open source mentorships (Google Summer of Code, LFX), and defense/space innovation grants (DRDO, ISRO).',
    icon: GraduationCap,
    accentColor: '#C084FC',
    subfilters: ['All', 'Open Source', 'Government & Defense', 'Funded Stipend', 'Closing Soon'],
  },
}

export const CategoryPageView: React.FC<CategoryPageViewProps> = ({
  category,
  opportunities,
  matchMap,
  saved,
  onToggleSave,
  onInspect,
  userSkills,
  applicationStatusMap,
  onTrackApplication,
  profile,
  onNavigateHome,
}) => {
  const meta = CATEGORY_META[category] || CATEGORY_META.Hackathon
  const IconComponent = meta.icon

  const [activeSubfilter, setActiveSubfilter] = useState('All')
  const [modeFilter, setModeFilter] = useState<'All' | 'Online' | 'Offline' | 'Hybrid'>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [matchesOnly, setMatchesOnly] = useState(false)

  // Filter opportunities to this specific category
  const categoryOpportunities = useMemo(() => {
    return opportunities.filter((o) => o.category.toLowerCase() === category.toLowerCase())
  }, [opportunities, category])

  // Calculate format breakdown (Online vs Offline vs Hybrid)
  const formatStats = useMemo(() => {
    let online = 0
    let offline = 0
    let hybrid = 0
    categoryOpportunities.forEach((opp) => {
      const m = opp.mode.toLowerCase()
      if (m.includes('hybrid')) hybrid++
      else if (
        m.includes('offline') ||
        m.includes('in-person') ||
        m.includes('on-site') ||
        m.includes('on-campus') ||
        opp.location.toLowerCase().includes('in-person')
      )
        offline++
      else online++
    })
    return { online, offline, hybrid }
  }, [categoryOpportunities])

  // Subfilter and search within this category
  const filteredList = useMemo(() => {
    let list = [...categoryOpportunities]
    const q = searchQuery.toLowerCase().trim()
    const now = Date.now()

    if (q) {
      list = list.filter((o) => {
        const text = `${o.title} ${o.organization} ${o.summary} ${o.description} ${o.skills.join(' ')} ${o.location}`.toLowerCase()
        return text.includes(q)
      })
    }

    if (matchesOnly) {
      list = list.filter((o) => {
        const match = matchMap.get(o.id)
        return match && match.score >= 50
      })
    }

    // Attendance mode subcategorization: Online vs Offline vs Hybrid
    if (modeFilter === 'Online') {
      list = list.filter((o) => {
        const m = o.mode.toLowerCase()
        return (
          !m.includes('hybrid') &&
          (m.includes('online') || m.includes('virtual') || m.includes('remote') || !m.includes('offline'))
        )
      })
    } else if (modeFilter === 'Offline') {
      list = list.filter((o) => {
        const m = o.mode.toLowerCase()
        return (
          m.includes('offline') ||
          m.includes('in-person') ||
          m.includes('on-site') ||
          m.includes('on-campus') ||
          o.location.toLowerCase().includes('in-person')
        )
      })
    } else if (modeFilter === 'Hybrid') {
      list = list.filter((o) => o.mode.toLowerCase().includes('hybrid'))
    }

    if (activeSubfilter === 'Product Management') {
      list = list.filter((o) => {
        const text = `${o.title} ${o.summary} ${o.skills.join(' ')}`.toLowerCase()
        return text.includes('product') || text.includes('prd') || text.includes('management')
      })
    } else if (activeSubfilter === 'Cybersecurity & Defense' || activeSubfilter === 'Cybersecurity') {
      list = list.filter((o) => {
        const text = `${o.title} ${o.summary} ${o.skills.join(' ')} ${o.organization}`.toLowerCase()
        return text.includes('cyber') || text.includes('security') || text.includes('ctf') || text.includes('defense')
      })
    } else if (activeSubfilter === 'AI & Data') {
      list = list.filter((o) => {
        const text = `${o.title} ${o.summary} ${o.skills.join(' ')}`.toLowerCase()
        return text.includes('ai') || text.includes('machine learning') || text.includes('data')
      })
    } else if (activeSubfilter === 'Online / Virtual' || activeSubfilter === 'Remote / Online') {
      list = list.filter((o) => {
        const m = o.mode.toLowerCase()
        return m.includes('online') || m.includes('remote') || m.includes('any')
      })
    } else if (activeSubfilter === 'Closing Soon') {
      list = list.filter((o) => {
        if (!o.deadline) return false
        const diffDays = Math.ceil((new Date(`${o.deadline}T23:59:59`).getTime() - now) / (1000 * 60 * 60 * 24))
        return diffDays >= 0 && diffDays <= 14
      })
    } else if (activeSubfilter === 'LinkedIn Verified') {
      list = list.filter((o) => {
        return (o.source_name || '').toLowerCase().includes('linkedin') || (o.source_url || '').toLowerCase().includes('linkedin')
      })
    } else if (activeSubfilter === 'Open Source') {
      list = list.filter((o) => {
        const text = `${o.title} ${o.organization} ${o.summary}`.toLowerCase()
        return text.includes('open source') || text.includes('gsoc') || text.includes('lfx') || text.includes('linux')
      })
    } else if (activeSubfilter === 'Government & Defense') {
      list = list.filter((o) => {
        const text = `${o.title} ${o.organization} ${o.source_name}`.toLowerCase()
        return text.includes('drdo') || text.includes('isro') || text.includes('govt') || text.includes('ministry') || text.includes('aicte')
      })
    }

    // Sort by best match
    list.sort((a, b) => (matchMap.get(b.id)?.score ?? 0) - (matchMap.get(a.id)?.score ?? 0))
    return list
  }, [categoryOpportunities, activeSubfilter, searchQuery, matchesOnly, matchMap])

  // Count high match items
  const highMatchCount = useMemo(() => {
    return categoryOpportunities.filter((o) => (matchMap.get(o.id)?.score ?? 0) >= 60).length
  }, [categoryOpportunities, matchMap])

  return (
    <section className="category-page-view" aria-label={`${meta.title} dedicated page`}>
      {/* Category Page Hero Header */}
      <div className="category-page-hero">
        <div className="category-hero-top">
          <button type="button" className="category-back-btn" onClick={onNavigateHome}>
            <ArrowLeft size={14} />
            <span>Back to All Feed</span>
          </button>

          <div className="category-hero-pills">
            <span className="category-count-badge">
              {categoryOpportunities.length} Verified {category}s
            </span>
            {highMatchCount > 0 && (
              <span className="category-match-badge">
                <Sparkles size={12} />
                <span>{highMatchCount} High Matches for {profile.field}</span>
              </span>
            )}
          </div>
        </div>

        <div className="category-hero-main">
          <div className="category-icon-title-row">
            <div className="category-large-icon-box" style={{ color: meta.accentColor }}>
              <IconComponent size={28} />
            </div>
            <div>
              <h1 className="category-page-title">{meta.title}</h1>
              <p className="category-page-subhead">{meta.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Domain Attendance Subcategorization: Online vs Offline */}
        <div className="category-format-bar" role="group" aria-label="Format filter: Online vs Offline">
          <span className="format-bar-label">Attendance Format:</span>
          <div className="format-toggle-group">
            <button
              type="button"
              className={`format-toggle-btn ${modeFilter === 'All' ? 'active' : ''}`}
              onClick={() => setModeFilter('All')}
            >
              All Formats ({categoryOpportunities.length})
            </button>
            <button
              type="button"
              className={`format-toggle-btn online ${modeFilter === 'Online' ? 'active' : ''}`}
              onClick={() => setModeFilter('Online')}
            >
              <Globe size={13} />
              <span>🌐 Online / Virtual ({formatStats.online})</span>
            </button>
            <button
              type="button"
              className={`format-toggle-btn offline ${modeFilter === 'Offline' ? 'active' : ''}`}
              onClick={() => setModeFilter('Offline')}
            >
              <MapPin size={13} />
              <span>📍 Offline / In-Person ({formatStats.offline})</span>
            </button>
            {formatStats.hybrid > 0 && (
              <button
                type="button"
                className={`format-toggle-btn hybrid ${modeFilter === 'Hybrid' ? 'active' : ''}`}
                onClick={() => setModeFilter('Hybrid')}
              >
                <Building size={13} />
                <span>🏢 Hybrid ({formatStats.hybrid})</span>
              </button>
            )}
          </div>
        </div>

        {/* Subfilter Pills + Preference Match Toggle */}
        <div className="category-controls-row">
          <div className="category-subfilter-list" role="tablist">
            {meta.subfilters.map((sf) => {
              const active = activeSubfilter === sf
              return (
                <button
                  key={sf}
                  type="button"
                  className={`category-subfilter-btn ${active ? 'active' : ''}`}
                  onClick={() => setActiveSubfilter(sf)}
                >
                  {sf}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            className={`btn-matches-only-toggle ${matchesOnly ? 'active' : ''}`}
            onClick={() => setMatchesOnly(!matchesOnly)}
            title="Filter strictly to opportunities matching your skills and major"
          >
            <Sparkles size={13} />
            <span>{matchesOnly ? 'Showing My Matches' : 'Filter to My Matches'}</span>
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="category-search-bar">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${category.toLowerCase()}s by company, topic, or required skills...`}
            className="category-search-input"
          />
          {searchQuery && (
            <button type="button" className="clear-search-btn" onClick={() => setSearchQuery('')}>
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="category-results-header">
        <span className="category-results-count">
          Showing <strong>{filteredList.length}</strong> of {categoryOpportunities.length} {category.toLowerCase()}s
          {activeSubfilter !== 'All' && <span> in <em>{activeSubfilter}</em></span>}
          {matchesOnly && <span> (filtered to profile matches)</span>}
        </span>

        {(activeSubfilter !== 'All' || searchQuery || matchesOnly) && (
          <button
            type="button"
            className="category-reset-link"
            onClick={() => {
              setActiveSubfilter('All')
              setSearchQuery('')
              setMatchesOnly(false)
            }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Grid of Category Cards */}
      <div className="category-cards-grid">
        {filteredList.length > 0 ? (
          filteredList.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              match={matchMap.get(opp.id)}
              isSaved={saved.includes(opp.id)}
              onToggleSave={onToggleSave}
              onInspect={onInspect}
              userSkills={profile.skills}
              trackedStatus={applicationStatusMap.get(opp.id)}
              onTrackApplication={onTrackApplication}
            />
          ))
        ) : (
          <div className="category-empty-state">
            <Filter size={36} className="text-secondary" />
            <h3>No {category.toLowerCase()}s found</h3>
            <p>No listings matched your active filter &quot;{activeSubfilter}&quot; or search query.</p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setActiveSubfilter('All')
                setSearchQuery('')
                setMatchesOnly(false)
              }}
            >
              Show all {categoryOpportunities.length} {category.toLowerCase()}s
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
