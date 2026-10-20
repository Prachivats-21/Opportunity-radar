import React from 'react'
import {
  RotateCcw,
  SlidersHorizontal,
  Clock,
  Laptop,
  ShieldCheck,
  Tag,
  X,
  ChevronDown
} from 'lucide-react'
import type { FilterState } from '../types'

interface FiltersBarProps {
  filters: FilterState
  onFilterChange: (updated: Partial<FilterState>) => void
  categoryCounts: Record<string, number>
  totalCount: number
  resultCount: number
  onResetFilters: () => void
  onOpenAdvancedDrawer: () => void
  advancedFilterCount: number
}

const CATEGORIES = [
  { id: 'All', label: 'All Opportunities' },
  { id: 'Hackathon', label: 'Hackathons' },
  { id: 'Internship', label: 'Internships' },
  { id: 'Competition', label: 'Competitions' },
  { id: 'Fellowship', label: 'Fellowships' },
]

export const FiltersBar: React.FC<FiltersBarProps> = ({
  filters,
  onFilterChange,
  categoryCounts,
  totalCount,
  resultCount,
  onResetFilters,
  onOpenAdvancedDrawer,
  advancedFilterCount,
}) => {
  // Collect active filter chips for display
  const activeChips: { id: string; label: string; onRemove: () => void }[] = []

  if (filters.searchQuery.trim()) {
    activeChips.push({
      id: 'search',
      label: `Search: "${filters.searchQuery}"`,
      onRemove: () => onFilterChange({ searchQuery: '' }),
    })
  }

  if (filters.category !== 'All') {
    activeChips.push({
      id: 'category',
      label: `Track: ${filters.category}`,
      onRemove: () => onFilterChange({ category: 'All' }),
    })
  }

  if (filters.quickClosingSoon) {
    activeChips.push({
      id: 'closingSoon',
      label: 'Closing Soon (≤ 10 days)',
      onRemove: () => onFilterChange({ quickClosingSoon: false }),
    })
  }

  if (filters.quickRemote) {
    activeChips.push({
      id: 'remote',
      label: 'Remote / Online',
      onRemove: () => onFilterChange({ quickRemote: false }),
    })
  }

  if (filters.quickEligibleForMe) {
    activeChips.push({
      id: 'eligibleForMe',
      label: 'Eligible for Me',
      onRemove: () => onFilterChange({ quickEligibleForMe: false }),
    })
  }

  if (filters.quickFreeToEnter) {
    activeChips.push({
      id: 'freeToEnter',
      label: 'Free to Enter',
      onRemove: () => onFilterChange({ quickFreeToEnter: false }),
    })
  }

  if (filters.mode !== 'All') {
    activeChips.push({
      id: 'mode',
      label: `Format: ${filters.mode}`,
      onRemove: () => onFilterChange({ mode: 'All' }),
    })
  }

  if (filters.deadlinePreset !== 'All') {
    const presetLabel =
      filters.deadlinePreset === '7days'
        ? 'Next 7 days'
        : filters.deadlinePreset === '14days'
        ? 'Next 14 days'
        : filters.deadlinePreset === '30days'
        ? 'Next 30 days'
        : `Custom: ${filters.deadlineFrom || 'start'} to ${filters.deadlineTo || 'end'}`

    activeChips.push({
      id: 'deadline',
      label: `Deadline: ${presetLabel}`,
      onRemove: () =>
        onFilterChange({
          deadlinePreset: 'All',
          deadlineFrom: '',
          deadlineTo: '',
        }),
    })
  }

  if (filters.location !== 'All') {
    activeChips.push({
      id: 'location',
      label: `Location: ${filters.location}`,
      onRemove: () => onFilterChange({ location: 'All' }),
    })
  }

  if (filters.eligibility !== 'All') {
    const elLabel =
      filters.eligibility === 'eligible'
        ? 'Eligible Only'
        : filters.eligibility === 'potentially_eligible'
        ? 'Potentially Eligible'
        : 'Exclude Conflicts'

    activeChips.push({
      id: 'eligibility',
      label: `Status: ${elLabel}`,
      onRemove: () => onFilterChange({ eligibility: 'All' }),
    })
  }

  if (filters.freeProgramsOnly) {
    activeChips.push({
      id: 'freePrograms',
      label: 'No Listed Fees',
      onRemove: () => onFilterChange({ freeProgramsOnly: false }),
    })
  }

  filters.selectedSkills.forEach((skill) => {
    activeChips.push({
      id: `skill-${skill}`,
      label: `Skill: ${skill}`,
      onRemove: () =>
        onFilterChange({
          selectedSkills: filters.selectedSkills.filter((s) => s !== skill),
        }),
    })
  })

  const hasAnyFilterActive = activeChips.length > 0

  return (
    <div className="filter-bar-container" id="opportunity-feed">
      {/* Quick Filters Bar & Controls */}
      <div className="quick-and-sort-row">
        {/* Quick Filter Buttons */}
        <div className="quick-filters-wrap" role="group" aria-label="Quick filters">
          <button
            type="button"
            className={`quick-filter-btn ${filters.quickClosingSoon ? 'active' : ''}`}
            onClick={() => onFilterChange({ quickClosingSoon: !filters.quickClosingSoon })}
            aria-pressed={filters.quickClosingSoon}
          >
            <Clock size={13} />
            <span>Closing Soon</span>
          </button>

          <button
            type="button"
            className={`quick-filter-btn ${filters.quickRemote ? 'active' : ''}`}
            onClick={() => onFilterChange({ quickRemote: !filters.quickRemote })}
            aria-pressed={filters.quickRemote}
          >
            <Laptop size={13} />
            <span>Remote</span>
          </button>

          <button
            type="button"
            className={`quick-filter-btn ${filters.quickEligibleForMe ? 'active' : ''}`}
            onClick={() => onFilterChange({ quickEligibleForMe: !filters.quickEligibleForMe })}
            aria-pressed={filters.quickEligibleForMe}
          >
            <ShieldCheck size={13} />
            <span>Eligible for Me</span>
          </button>

          <button
            type="button"
            className={`quick-filter-btn ${filters.quickFreeToEnter ? 'active' : ''}`}
            onClick={() => onFilterChange({ quickFreeToEnter: !filters.quickFreeToEnter })}
            aria-pressed={filters.quickFreeToEnter}
          >
            <Tag size={13} />
            <span>Free to Enter</span>
          </button>
        </div>

        {/* Right side: Sort & Advanced Filter Trigger */}
        <div className="sort-and-drawer-wrap">
          {/* Sort By Dropdown */}
          <div className="filter-select-pill">
            <label htmlFor="sort-options">Sort:</label>
            <select
              id="sort-options"
              value={filters.sortBy}
              onChange={(e) =>
                onFilterChange({
                  sortBy: e.target.value as 'Best match' | 'Deadline soon' | 'Recently added',
                })
              }
            >
              <option value="Best match">Best Match</option>
              <option value="Deadline soon">Deadline Soonest</option>
              <option value="Recently added">Recently Added</option>
            </select>
            <ChevronDown size={13} style={{ color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
          </div>

          {/* Advanced Filters Button */}
          <button
            type="button"
            className={`advanced-filter-trigger ${advancedFilterCount > 0 ? 'active' : ''}`}
            onClick={onOpenAdvancedDrawer}
            aria-label="Open advanced filter drawer"
          >
            <SlidersHorizontal size={14} />
            <span>Advanced</span>
            {advancedFilterCount > 0 && (
              <span className="advanced-count-bubble">{advancedFilterCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* 3. Active Filters Chips & Clear All Row */}
      {hasAnyFilterActive && (
        <div className="active-chips-row">
          <div className="chips-list">
            <span className="active-chips-label">Active:</span>
            {activeChips.map((chip) => (
              <span key={chip.id} className="active-filter-chip">
                <span>{chip.label}</span>
                <button
                  type="button"
                  onClick={chip.onRemove}
                  aria-label={`Remove filter ${chip.label}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>

          <button
            type="button"
            className="filter-reset-btn"
            onClick={onResetFilters}
            aria-label="Clear all active filters"
          >
            <RotateCcw size={12} />
            <span>Clear all</span>
          </button>
        </div>
      )}

      {/* Results Count Line */}
      <div className="results-count-bar">
        <span>
          Showing <strong>{resultCount}</strong> of {totalCount} opportunities
        </span>
        {filters.quickFreeToEnter && (
          <span className="unverified-schema-pill">
            Notice: All verified seed listings are student programs without entry fees
          </span>
        )}
      </div>
    </div>
  )
}
