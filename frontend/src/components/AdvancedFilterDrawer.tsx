import React from 'react'
import { X, Calendar, MapPin, Globe, Check, AlertCircle, Info, Sparkles, Filter, RotateCcw } from 'lucide-react'
import type { FilterState } from '../types'

interface AdvancedFilterDrawerProps {
  isOpen: boolean
  onClose: () => void
  filters: FilterState
  onChange: (updated: Partial<FilterState>) => void
  onReset: () => void
  availableSkills: string[]
  availableLocations: string[]
  resultCount: number
}

export const AdvancedFilterDrawer: React.FC<AdvancedFilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onChange,
  onReset,
  availableSkills,
  availableLocations,
  resultCount,
}) => {
  if (!isOpen) return null

  const toggleSkill = (skill: string) => {
    const isSelected = filters.selectedSkills.includes(skill)
    const next = isSelected
      ? filters.selectedSkills.filter((s) => s !== skill)
      : [...filters.selectedSkills, skill]
    onChange({ selectedSkills: next })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="drawer-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-out Drawer */}
      <aside
        className="advanced-filter-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Advanced Filters"
      >
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={18} style={{ color: 'var(--sage)' }} />
            <div>
              <h3 className="drawer-title">Advanced Filters</h3>
              <span className="drawer-subtitle">
                Fine-tune opportunity search based on verified listing facts
              </span>
            </div>
          </div>
          <button
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close advanced filters"
          >
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
          {/* 1. Deadline Range */}
          <div className="drawer-section">
            <label className="drawer-section-label">
              <Calendar size={14} />
              <span>Application Deadline</span>
            </label>
            <div className="drawer-pill-group">
              {[
                { id: 'All', label: 'Any deadline' },
                { id: '7days', label: 'Next 7 days' },
                { id: '14days', label: 'Next 14 days' },
                { id: '30days', label: 'Next 30 days' },
                { id: 'custom', label: 'Custom range' },
              ].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  className={`drawer-option-pill ${filters.deadlinePreset === preset.id ? 'active' : ''}`}
                  onClick={() => onChange({ deadlinePreset: preset.id })}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {filters.deadlinePreset === 'custom' && (
              <div className="date-range-inputs">
                <div>
                  <label htmlFor="filter-from-date">From:</label>
                  <input
                    id="filter-from-date"
                    type="date"
                    value={filters.deadlineFrom}
                    onChange={(e) => onChange({ deadlineFrom: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="filter-to-date">To:</label>
                  <input
                    id="filter-to-date"
                    type="date"
                    value={filters.deadlineTo}
                    onChange={(e) => onChange({ deadlineTo: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Participation Format (Mode) */}
          <div className="drawer-section">
            <label className="drawer-section-label">
              <Globe size={14} />
              <span>Participation Format</span>
            </label>
            <div className="drawer-pill-group">
              {[
                { id: 'All', label: 'All Formats' },
                { id: 'Online', label: 'Online / Remote' },
                { id: 'On-site', label: 'On-site / In-person' },
                { id: 'Hybrid', label: 'Hybrid' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={`drawer-option-pill ${filters.mode === opt.id ? 'active' : ''}`}
                  onClick={() => onChange({ mode: opt.id })}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Location / Region */}
          <div className="drawer-section">
            <label className="drawer-section-label">
              <MapPin size={14} />
              <span>Location / Geographic Scope</span>
            </label>
            <div className="drawer-pill-group">
              {['All', 'India', 'Global / Remote'].map((loc) => (
                <button
                  key={loc}
                  type="button"
                  className={`drawer-option-pill ${filters.location === loc ? 'active' : ''}`}
                  onClick={() => onChange({ location: loc })}
                >
                  {loc}
                </button>
              ))}
            </div>
            {availableLocations.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <select
                  value={filters.location}
                  onChange={(e) => onChange({ location: e.target.value })}
                  className="drawer-select"
                >
                  <option value="All">All specific locations</option>
                  {availableLocations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* 4. Eligibility for Current Student Profile */}
          <div className="drawer-section">
            <label className="drawer-section-label">
              <Sparkles size={14} />
              <span>Eligibility Evaluation</span>
            </label>
            <div className="drawer-pill-group">
              {[
                { id: 'All', label: 'All Opportunities' },
                { id: 'eligible', label: 'Eligible for me only' },
                { id: 'potentially_eligible', label: 'Potentially eligible' },
                { id: 'no_conflicts', label: 'Exclude conflicts' },
              ].map((el) => (
                <button
                  key={el.id}
                  type="button"
                  className={`drawer-option-pill ${filters.eligibility === el.id ? 'active' : ''}`}
                  onClick={() => onChange({ eligibility: el.id })}
                >
                  {el.label}
                </button>
              ))}
            </div>
            <p className="drawer-helper-text">
              Eligibility is evaluated by deterministic backend rules against your academic year,
              field of study, and listed team sizes.
            </p>
          </div>

          {/* 5. Skills & Focus Areas */}
          <div className="drawer-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label className="drawer-section-label" style={{ margin: 0 }}>
                <span>Required Skills ({availableSkills.length})</span>
              </label>
              {filters.selectedSkills.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChange({ selectedSkills: [] })}
                  className="drawer-clear-link"
                >
                  Clear skills
                </button>
              )}
            </div>

            <div className="skills-pill-wrap">
              {availableSkills.map((skill) => {
                const isSelected = filters.selectedSkills.includes(skill)
                return (
                  <button
                    key={skill}
                    type="button"
                    className={`drawer-skill-tag ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleSkill(skill)}
                  >
                    {isSelected && <Check size={11} />}
                    <span>{skill}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 6. Compensation & Entry Fee (Transparent Schema Notice) */}
          <div className="drawer-section">
            <label className="drawer-section-label">
              <Info size={14} />
              <span>Compensation & Entry Fee</span>
            </label>

            <div className="schema-notice-box">
              <div style={{ display: 'flex', gap: '8px' }}>
                <AlertCircle size={15} style={{ color: 'var(--sage-dark)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                    Data Schema Notice
                  </div>
                  <div style={{ color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    The backend Opportunity schema does not store dedicated structured fee or stipend fields.
                    To preserve accuracy without hallucinations, fee details are not assumed. All verified records
                    in this seed are official student initiatives.
                  </div>
                </div>
              </div>

              <label className="schema-checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.freeProgramsOnly}
                  onChange={(e) => onChange({ freeProgramsOnly: e.target.checked })}
                />
                <span>Filter out any listings referencing registration fees in text</span>
              </label>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="drawer-footer">
          <button
            type="button"
            className="btn-secondary"
            onClick={onReset}
          >
            <RotateCcw size={13} />
            <span>Reset filters</span>
          </button>

          <button
            type="button"
            className="btn-primary"
            onClick={onClose}
          >
            <span>Show {resultCount} {resultCount === 1 ? 'opportunity' : 'opportunities'}</span>
          </button>
        </div>
      </aside>
    </>
  )
}
