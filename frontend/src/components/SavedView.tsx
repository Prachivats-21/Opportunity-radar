import React, { useState, useMemo } from 'react'
import { Bookmark, Compass, Search, RefreshCw, X, ArrowRight } from 'lucide-react'
import { OpportunityCard } from './OpportunityCard'
import type { Opportunity, MatchResult } from '../types'

interface SavedViewProps {
  opportunities: Opportunity[]
  savedIds: string[]
  matchMap: Map<string, MatchResult>
  onToggleSave: (id: string) => void
  userSkills: string[]
  onNavigateToExplore: () => void
  onNavigateToDashboard: () => void
  onInspect?: (opportunity: Opportunity) => void
}

export const SavedView: React.FC<SavedViewProps> = ({
  opportunities,
  savedIds,
  matchMap,
  onToggleSave,
  userSkills,
  onNavigateToExplore,
  onNavigateToDashboard,
  onInspect,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')

  // Get all saved opportunities
  const savedOpportunities = useMemo(() => {
    return opportunities.filter((o) => savedIds.includes(o.id))
  }, [opportunities, savedIds])

  // Filter within saved
  const filteredSaved = useMemo(() => {
    let list = [...savedOpportunities]

    if (categoryFilter !== 'All') {
      list = list.filter((o) => o.category === categoryFilter)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter((o) => {
        const text = [o.title, o.organization, o.category, o.summary, o.location, ...o.skills]
          .join(' ')
          .toLowerCase()
        return text.includes(q)
      })
    }

    return list
  }, [savedOpportunities, categoryFilter, searchQuery])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Hackathon: 0, Internship: 0, Competition: 0, Fellowship: 0 }
    savedOpportunities.forEach((o) => {
      if (counts[o.category] !== undefined) counts[o.category]++
    })
    return counts
  }, [savedOpportunities])

  return (
    <div className="view-container saved-view">
      <div className="view-header">
        <div className="view-header-title-group">
          <div className="view-badge">SAVED SIGNALS</div>
          <h1 className="view-title">Saved Opportunities</h1>
          <p className="view-subtitle">
            {savedOpportunities.length} opportunities bookmarked for application deadlines and future reference.
          </p>
        </div>
        <div className="view-header-actions">
          <button type="button" className="btn-secondary" onClick={onNavigateToExplore}>
            <Compass size={14} />
            <span>Explore All Listings</span>
          </button>
        </div>
      </div>

      {savedOpportunities.length > 0 ? (
        <>
          {/* Controls Bar */}
          <div className="saved-controls-bar">
            {/* Search within saved */}
            <div className="saved-search-box">
              <Search size={14} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search saved opportunities..."
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="saved-category-pills">
              {['All', 'Hackathon', 'Internship', 'Competition', 'Fellowship'].map((cat) => {
                const count = cat === 'All' ? savedOpportunities.length : categoryCounts[cat] || 0
                return (
                  <button
                    key={cat}
                    type="button"
                    className={`saved-pill ${categoryFilter === cat ? 'active' : ''}`}
                    onClick={() => setCategoryFilter(cat)}
                  >
                    <span>{cat}</span>
                    <span className="pill-count">({count})</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Grid */}
          {filteredSaved.length > 0 ? (
            <section className="opportunity-grid" aria-label="Saved opportunities list">
              {filteredSaved.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  match={matchMap.get(opp.id)}
                  isSaved={true}
                  onToggleSave={onToggleSave}
                  userSkills={userSkills}
                  onInspect={onInspect}
                />
              ))}
            </section>
          ) : (
            <div className="empty-state-card">
              <Search size={24} style={{ color: 'var(--text-tertiary)' }} />
              <h3 className="empty-state-title">No matching saved opportunities</h3>
              <p className="empty-state-text">
                None of your bookmarked listings match the current search or category filter.
              </p>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setSearchQuery('')
                  setCategoryFilter('All')
                }}
              >
                <RefreshCw size={14} />
                <span>Clear Filters</span>
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state-card saved-empty-state">
          <div className="empty-state-icon">
            <Bookmark size={28} />
          </div>
          <h3 className="empty-state-title">No saved opportunities yet</h3>
          <p className="empty-state-text">
            Bookmark interesting hackathons, internships, competitions, and fellowships to keep track of deadlines and eligibility status in one place.
          </p>
          <button type="button" className="btn-primary" onClick={onNavigateToDashboard}>
            <span>Discover Opportunities</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
