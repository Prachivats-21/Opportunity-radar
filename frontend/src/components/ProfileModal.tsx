import React, { useState } from 'react'
import { X, Sparkles, Check, Plus } from 'lucide-react'
import type { Profile } from '../types'

interface ProfileModalProps {
  profile: Profile
  onSave: (updated: Profile) => void
  onClose: () => void
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  profile,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<Profile>({ ...profile, name: profile.name || 'Prachi Vats' })
  const [skillInput, setSkillInput] = useState('')
  const [interestInput, setInterestInput] = useState('')

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
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <h3>Tune Your Radar Profile</h3>
            <p>Personalize your student attributes to receive explainable opportunity matches.</p>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Name & Academic Year */}
          <div className="form-row-2">
            <div className="form-group">
              <label htmlFor="profile-name">Student Name</label>
              <input
                id="profile-name"
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Prachi Vats"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="profile-year">Academic Standing / Year</label>
              <select
                id="profile-year"
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

          {/* Field of Study */}
          <div className="form-group">
            <label htmlFor="profile-field">Field of Study / Major</label>
            <input
              id="profile-field"
              type="text"
              value={formData.field}
              onChange={(e) => setFormData({ ...formData, field: e.target.value })}
              placeholder="e.g. Computer Science & AI, Data Engineering"
              required
            />
          </div>

          {/* Skills Tag Editor */}
          <div className="form-group">
            <label>Skills & Proficiencies</label>
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

          {/* Interests Tag Editor */}
          <div className="form-group">
            <label>Interests & Focus Areas</label>
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

          {/* Preferences Row */}
          <div className="form-row-2">
            <div className="form-group">
              <label>Target Tracks</label>
              <div className="chips-container" style={{ minHeight: 'auto', padding: '8px' }}>
                {['Hackathon', 'Internship', 'Competition', 'Fellowship'].map((cat) => {
                  const isSelected = formData.preferred_categories.includes(cat)
                  return (
                    <span key={cat} className={`interactive-chip ${isSelected ? 'chip-selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...formData.preferred_categories, cat]
                            : formData.preferred_categories.filter((c) => c !== cat)
                          setFormData({ ...formData, preferred_categories: next })
                        }}
                        style={{ margin: 0, width: 16, height: 16, accentColor: 'var(--sage)' }}
                      />
                      <span style={{ marginLeft: 6 }}>{cat}</span>
                    </span>
                  )
                })}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="pref-mode">Format Preference</label>
              <select
                id="pref-mode"
                value={formData.preferred_mode}
                onChange={(e) => setFormData({ ...formData, preferred_mode: e.target.value })}
              >
                <option value="Any">Any Format</option>
                <option value="Online">Online / Remote</option>
                <option value="On-site">On-site</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Sparkles size={14} />
              <span>Save & Update Matches</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
