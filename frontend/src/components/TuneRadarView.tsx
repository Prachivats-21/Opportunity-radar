import React, { useState } from 'react'
import { Sliders, Sparkles, Check, Users, Monitor, Compass, ShieldCheck, Trophy, GraduationCap, Flame, Award } from 'lucide-react'
import type { Profile } from '../types'

interface TuneRadarViewProps {
  profile: Profile
  onSave: (updated: Profile) => void
  onNavigateToDashboard: () => void
  totalOpportunities: number
}

const CATEGORY_OPTIONS: { id: 'Hackathon' | 'Internship' | 'Competition' | 'Fellowship'; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'Hackathon', label: 'Hackathons', icon: <Trophy size={16} />, desc: 'Team-based prototyping challenges & coding sprints.' },
  { id: 'Internship', label: 'Internships', icon: <GraduationCap size={16} />, desc: 'Practical industry & research project placements.' },
  { id: 'Competition', label: 'Competitions', icon: <Flame size={16} />, desc: 'Individual or team problem solving & state/national challenges.' },
  { id: 'Fellowship', label: 'Fellowships', icon: <Award size={16} />, desc: 'Funded cohort programs with structured mentorship.' },
]

export const TuneRadarView: React.FC<TuneRadarViewProps> = ({
  profile,
  onSave,
  onNavigateToDashboard,
  totalOpportunities,
}) => {
  const [formData, setFormData] = useState<Profile>({ ...profile })
  const [isSavedRecently, setIsSavedRecently] = useState(false)

  const toggleCategory = (cat: 'Hackathon' | 'Internship' | 'Competition' | 'Fellowship') => {
    const exists = formData.preferred_categories.includes(cat)
    const next = exists
      ? formData.preferred_categories.filter((c) => c !== cat)
      : [...formData.preferred_categories, cat]
    setFormData((prev) => ({ ...prev, preferred_categories: next }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    setIsSavedRecently(true)
    setTimeout(() => setIsSavedRecently(false), 3000)
  }

  return (
    <div className="view-container tune-view">
      <div className="view-header">
        <div className="view-header-title-group">
          <div className="view-badge">MATCHING ENGINE</div>
          <h1 className="view-title">Tune Radar Preferences</h1>
          <p className="view-subtitle">
            Configure matching criteria to calibrate relevance scoring, track weighting, and eligibility checks.
          </p>
        </div>
        <div className="view-header-actions">
          <button type="button" className="btn-secondary" onClick={onNavigateToDashboard}>
            <Compass size={14} />
            <span>View Opportunities ({totalOpportunities})</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="tune-layout-grid">
        {/* Left Column: Preference Panels */}
        <div className="tune-main-col">
          {/* Target Tracks / Categories */}
          <div className="tune-card">
            <div className="tune-card-header">
              <div className="tune-card-icon-box">
                <Sliders size={18} />
              </div>
              <div>
                <h3 className="tune-card-title">Target Opportunity Tracks</h3>
                <p className="tune-card-desc">Opportunities in selected tracks receive priority matching bonuses in your feed.</p>
              </div>
            </div>

            <div className="track-selection-grid">
              {CATEGORY_OPTIONS.map((track) => {
                const isSelected = formData.preferred_categories.includes(track.id)
                return (
                  <div
                    key={track.id}
                    className={`track-choice-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleCategory(track.id)}
                    role="checkbox"
                    aria-checked={isSelected}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault()
                        toggleCategory(track.id)
                      }
                    }}
                  >
                    <div className="track-choice-top">
                      <div className="track-choice-icon">{track.icon}</div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // Handled by parent card click
                        tabIndex={-1}
                        aria-hidden="true"
                        style={{ accentColor: 'var(--sage)' }}
                      />
                    </div>
                    <div className="track-choice-name">{track.label}</div>
                    <div className="track-choice-desc">{track.desc}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Mode & Team Size */}
          <div className="tune-card">
            <div className="tune-card-header">
              <div className="tune-card-icon-box">
                <Monitor size={18} />
              </div>
              <div>
                <h3 className="tune-card-title">Participation Format & Team Dynamics</h3>
                <p className="tune-card-desc">Filter or prioritize based on whether you want online sprints, on-site experiences, or specific team sizes.</p>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="tune-mode">Preferred Format</label>
                <select
                  id="tune-mode"
                  value={formData.preferred_mode}
                  onChange={(e) => setFormData({ ...formData, preferred_mode: e.target.value })}
                >
                  <option value="Any">Any Format (Online, Hybrid, or On-site)</option>
                  <option value="Online">Online / Remote Only</option>
                  <option value="On-site">On-site Only</option>
                  <option value="Hybrid">Hybrid Opportunities</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="tune-team-size">Target Team Size Preference</label>
                <select
                  id="tune-team-size"
                  value={formData.team_size ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      team_size: e.target.value ? parseInt(e.target.value, 10) : null,
                    })
                  }
                >
                  <option value="">Flexible (Solo or Any Team Size)</option>
                  <option value="1">Individual / Solo Only</option>
                  <option value="2">Pairs (2 participants)</option>
                  <option value="3">Small Team (3 participants)</option>
                  <option value="4">Standard Team (4 participants)</option>
                  <option value="5">Large Team (5+ participants)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Signal Explanation Card */}
        <div className="tune-side-col">
          <div className="tune-card tune-summary-box">
            <h3>How Radar Scoring Works</h3>
            <ul className="radar-rules-list">
              <li>
                <strong>Keyword Overlap (up to 45 pts):</strong> Sourced skills, category tags, and description terms matching your profile.
              </li>
              <li>
                <strong>Track Preference (+15 pts):</strong> Opportunities within your selected target tracks.
              </li>
              <li>
                <strong>Deterministic Eligibility:</strong> Python rule evaluation checks academic year and field boundaries without hallucination.
              </li>
              <li>
                <strong>Deadline Penalty:</strong> Opportunities whose registration deadline has passed are marked expired and scored 0.
              </li>
            </ul>

            <div className="tune-status-pill">
              <ShieldCheck size={14} style={{ color: 'var(--sage)' }} />
              <span>Matching rules run deterministically in backend & offline fallback.</span>
            </div>

            <div style={{ marginTop: '20px' }}>
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                <Check size={14} />
                <span>Apply & Re-Score Radar</span>
              </button>
              {isSavedRecently && (
                <div className="saved-feedback" style={{ marginTop: '10px', justifyContent: 'center' }}>
                  <Check size={14} /> Preferences updated and matches recomputed!
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
