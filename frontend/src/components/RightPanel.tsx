import React from 'react'
import { CheckCircle2, Circle, Bookmark, Sparkles, Plus, ArrowRight, UserCheck } from 'lucide-react'
import type { Profile } from '../types'

interface RightPanelProps {
  profile: Profile
  savedCount: number
  onEditProfile: () => void
  onSelectTab: (tab: string) => void
  onOpenAddOpportunity: () => void
}

export const RightPanel: React.FC<RightPanelProps> = ({
  profile,
  savedCount,
  onEditProfile,
  onSelectTab,
  onOpenAddOpportunity,
}) => {
  // Compute real profile completion
  let score = 0
  const checklist = [
    {
      label: 'Academic year specified',
      done: profile.year !== 'Not specified' && Boolean(profile.year),
      weight: 20,
    },
    {
      label: 'Field of study added',
      done: profile.field !== 'Not specified' && profile.field.trim().length > 2,
      weight: 20,
    },
    {
      label: 'At least 3 core skills listed',
      done: profile.skills.length >= 3,
      weight: 25,
    },
    {
      label: 'Curated interest areas added',
      done: profile.interests.length >= 2,
      weight: 20,
    },
    {
      label: 'Preferred opportunity format set',
      done: profile.preferred_mode !== 'Any' || profile.preferred_categories.length > 0,
      weight: 15,
    },
  ]

  checklist.forEach((item) => {
    if (item.done) score += item.weight
  })

  // Dynamic tip based on profile state
  const getRadarTip = () => {
    if (profile.skills.length < 3) {
      return {
        title: 'Expand skill coverage',
        desc: 'Add practical skills (e.g. Python, AI, Cybersecurity) to unlock more specific hackathon matches.',
      }
    }
    if (profile.year === '1') {
      return {
        title: 'First-year strategy',
        desc: 'Hackathons and open beginner fellowships have the highest acceptance rate for first-year undergraduates.',
      }
    }
    return {
      title: 'Review verification timestamps',
      desc: 'All listings include original source links. Always verify team size and deadlines on official portals before applying.',
    }
  }

  const tip = getRadarTip()

  return (
    <aside className="dashboard-aside">
      {/* Profile Completion Card */}
      <div className="info-panel-card">
        <div className="info-card-header">
          <h4 className="info-card-title">
            <UserCheck size={16} style={{ color: 'var(--sage)' }} />
            <span>Profile Completion</span>
          </h4>
          <span className="completion-percent">{score}%</span>
        </div>

        <div className="progress-track" role="progressbar" aria-valuenow={score} aria-valuemin={0} aria-valuemax={100}>
          <div className="progress-bar" style={{ width: `${score}%` }} />
        </div>

        <div className="profile-checklist">
          {checklist.map((item, i) => (
            <div key={i} className={`checklist-item ${item.done ? 'done' : ''}`}>
              {item.done ? <CheckCircle2 size={14} /> : <Circle size={14} />}
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        <button className="btn-panel-action" onClick={onEditProfile}>
          <span>Edit student profile</span>
          <ArrowRight size={13} />
        </button>
      </div>

      {/* Saved Opportunities Counter Box */}
      <div className="info-panel-card">
        <div className="info-card-header">
          <h4 className="info-card-title">
            <Bookmark size={15} style={{ color: 'var(--sage)' }} />
            <span>Saved for Later</span>
          </h4>
        </div>

        <div className="saved-summary-box">
          <div>
            <div className="saved-count-big">{savedCount}</div>
            <div className="saved-label">
              {savedCount === 1 ? 'Opportunity saved' : 'Opportunities saved'}
            </div>
          </div>
          <button
            className="sidebar-card-btn"
            onClick={() => onSelectTab('Saved')}
            disabled={savedCount === 0}
          >
            <span>View saved</span>
            <ArrowRight size={12} />
          </button>
        </div>
      </div>

      {/* Onboarding / Radar Insight Tip */}
      <div className="radar-tip-card">
        <Sparkles size={18} className="radar-tip-icon" />
        <div>
          <h5>{tip.title}</h5>
          <p>{tip.desc}</p>
        </div>
      </div>

      {/* Add Custom Opportunity CTA */}
      <div className="info-panel-card" style={{ backgroundColor: 'var(--bg-surface-alt)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <h4 className="info-card-title" style={{ margin: 0 }}>
            <span>Found a new listing?</span>
          </h4>
        </div>
        <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Bring external hackathons or internships onto your personal radar using AI extraction.
        </p>
        <button
          className="btn-primary"
          style={{ width: '100%', marginTop: '8px', fontSize: '12px', padding: '9px' }}
          onClick={onOpenAddOpportunity}
        >
          <Plus size={15} />
          <span>Add new opportunity</span>
        </button>
      </div>
    </aside>
  )
}
