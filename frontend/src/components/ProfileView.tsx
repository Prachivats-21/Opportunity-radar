import React, { useState } from 'react'
import { User, Sparkles, Check, Plus, X, GraduationCap, MapPin, BookOpen, Compass } from 'lucide-react'
import type { Profile } from '../types'

interface ProfileViewProps {
  profile: Profile
  onSave: (updated: Profile) => void
  onNavigateToTune: () => void
  onNavigateToDashboard: () => void
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  onSave,
  onNavigateToTune,
  onNavigateToDashboard,
}) => {
  const [formData, setFormData] = useState<Profile>({ ...profile, name: profile.name || 'Prachi Vats' })
  const [skillInput, setSkillInput] = useState('')
  const [interestInput, setInterestInput] = useState('')
  const [isSavedRecently, setIsSavedRecently] = useState(false)

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = skillInput.trim()
    if (!clean || formData.skills.includes(clean)) return
    setFormData((prev) => ({ ...prev, skills: [...prev.skills, clean] }))
    setSkillInput('')
  }

  const handleRemoveSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }))
  }

  const handleAddInterest = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = interestInput.trim()
    if (!clean || formData.interests.includes(clean)) return
    setFormData((prev) => ({ ...prev, interests: [...prev.interests, clean] }))
    setInterestInput('')
  }

  const handleRemoveInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.filter((i) => i !== interest),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
    setIsSavedRecently(true)
    setTimeout(() => setIsSavedRecently(false), 3000)
  }

  const initials = (formData.name || 'PV')
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase()

  return (
    <div className="view-container profile-view">
      {/* Header Banner */}
      <div className="view-header">
        <div className="view-header-title-group">
          <div className="view-badge">STUDENT IDENTITY</div>
          <h1 className="view-title">My Profile</h1>
          <p className="view-subtitle">
            Manage your academic credentials, skills, and background used to determine eligibility and match scoring.
          </p>
        </div>
        <div className="view-header-actions">
          <button type="button" className="btn-secondary" onClick={onNavigateToTune}>
            <Sparkles size={14} />
            <span>Tune Preferences</span>
          </button>
          <button type="button" className="btn-secondary" onClick={onNavigateToDashboard}>
            <Compass size={14} />
            <span>Back to Radar</span>
          </button>
        </div>
      </div>

      <div className="profile-layout-grid">
        {/* Left Column: Summary Card */}
        <div className="profile-card profile-summary-card">
          <div className="profile-avatar-large">{initials}</div>
          <h2 className="profile-card-name">{formData.name}</h2>
          <div className="profile-card-meta">
            <span>{formData.year && formData.year !== 'Not specified' && formData.year !== 'All Years' ? `Year ${formData.year}` : 'Skill & Merit First'}</span>
            <span className="dot-sep">·</span>
            <span>{formData.field}</span>
          </div>

          <div className="profile-stats-list">
            <div className="profile-stat-row">
              <span className="profile-stat-label"><GraduationCap size={14} /> Eligibility Standard</span>
              <span className="profile-stat-value">{formData.year === 'All Years' ? 'Open to All Years' : formData.year !== 'Not specified' ? `Year ${formData.year}` : 'Open to All Years'}</span>
            </div>
            <div className="profile-stat-row">
              <span className="profile-stat-label"><BookOpen size={14} /> Field / Major</span>
              <span className="profile-stat-value">{formData.field}</span>
            </div>
            <div className="profile-stat-row">
              <span className="profile-stat-label"><MapPin size={14} /> Preferred Region</span>
              <span className="profile-stat-value">{formData.location || 'India'}</span>
            </div>
            <div className="profile-stat-row">
              <span className="profile-stat-label"><Sparkles size={14} /> Verified Skills</span>
              <span className="profile-stat-value">{formData.skills.length} listed</span>
            </div>
          </div>

          <div className="profile-tip-box">
            <strong>Signal Tip</strong>
            <p>
              Accurate academic year and field data unlocks confirmed eligibility checks across state and national listings.
            </p>
          </div>
        </div>

        {/* Right Column: Edit Form */}
        <div className="profile-card profile-form-card">
          <form onSubmit={handleSubmit}>
            <div className="form-section-title">Academic Standing</div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="pv-name">Full Name</label>
                <input
                  id="pv-name"
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Prachi Vats"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="pv-year">Academic Standing / Year</label>
                <select
                  id="pv-year"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                >
                  <option value="All Years">Open to All Years (Skill & Merit-First · Recommended)</option>
                  <option value="1">1st Year Undergraduate</option>
                  <option value="2">2nd Year Undergraduate</option>
                  <option value="3">3rd Year Undergraduate</option>
                  <option value="4">4th Year Undergraduate</option>
                  <option value="Graduate">Postgraduate / Masters</option>
                  <option value="Not specified">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="pv-field">Field of Study / Major</label>
                <input
                  id="pv-field"
                  type="text"
                  value={formData.field}
                  onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                  placeholder="e.g. Computer Science & AI"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="pv-location">Base Location / Region</label>
                <input
                  id="pv-location"
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. India"
                />
              </div>
            </div>

            <div className="form-section-title" style={{ marginTop: '24px' }}>Skills & Proficiencies</div>
            <p className="form-section-desc">Skills matched against opportunity tracks to surface relevance scores and skill gaps.</p>

            <div className="form-group">
              <div className="chips-container">
                {formData.skills.map((skill) => (
                  <span key={skill} className="interactive-chip">
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      aria-label={`Remove skill ${skill}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <div style={{ display: 'flex', flex: 1, minWidth: 140 }}>
                  <input
                    type="text"
                    className="chip-input-inline"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddSkill(e)
                      }
                    }}
                    placeholder="Type skill & press Enter..."
                  />
                  {skillInput.trim() && (
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      style={{ color: 'var(--sage)', padding: '0 4px' }}
                      aria-label="Add skill"
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="form-section-title" style={{ marginTop: '24px' }}>Interests & Focus Areas</div>
            <p className="form-section-desc">Broad topic areas you want the radar to discover.</p>

            <div className="form-group">
              <div className="chips-container">
                {formData.interests.map((interest) => (
                  <span key={interest} className="interactive-chip" style={{ backgroundColor: 'var(--blue-light)', borderColor: 'var(--blue-border)' }}>
                    <span>{interest}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveInterest(interest)}
                      aria-label={`Remove interest ${interest}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <div style={{ display: 'flex', flex: 1, minWidth: 140 }}>
                  <input
                    type="text"
                    className="chip-input-inline"
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddInterest(e)
                      }
                    }}
                    placeholder="Type interest & press Enter..."
                  />
                  {interestInput.trim() && (
                    <button
                      type="button"
                      onClick={handleAddInterest}
                      style={{ color: 'var(--sage)', padding: '0 4px' }}
                      aria-label="Add interest"
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="form-submit-row">
              {isSavedRecently && (
                <span className="saved-feedback">
                  <Check size={14} /> Changes saved to local profile
                </span>
              )}
              <button type="submit" className="btn-primary" style={{ marginLeft: 'auto' }}>
                <Check size={14} />
                <span>Save Profile Changes</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
