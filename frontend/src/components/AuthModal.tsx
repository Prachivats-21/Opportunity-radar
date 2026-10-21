import React, { useState } from 'react'
import { X, Lock, Mail, User, School, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, LogIn, MapPin, Globe } from 'lucide-react'
import { RadarMark } from './RadarMark'
import type { Profile } from '../types'

const INDIAN_STATES = [
  'Delhi NCR',
  'Maharashtra',
  'Karnataka',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Gujarat',
  'Rajasthan',
  'Kerala',
  'Punjab',
  'Haryana',
  'Madhya Pradesh',
  'Bihar',
  'Odisha',
  'Assam',
  'Goa',
  'Other / Pan-India',
]

const REGIONS = [
  'North India',
  'South India',
  'West India',
  'East India',
  'Central India',
  'Northeast India',
  'Pan-India / All Regions',
  'Global / Remote',
]

const DEMO_PERSONAS: { name: string; email: string; year: string; field: string; state: string; region: string; skills: string[]; interests: string[]; preferred_categories: string[]; description: string }[] = [
  {
    name: 'Prachi Vats',
    email: 'prachi.vats@student.edu.in',
    year: 'All Years',
    field: 'Computer Science & AI',
    state: 'Uttarakhand',
    region: 'North India',
    skills: ['Python', 'AI', 'Cybersecurity', 'Communication'],
    interests: ['AI', 'Cybersecurity', 'Hackathons', 'Data Science'],
    preferred_categories: ['Hackathon', 'Internship', 'Competition'],
    description: 'Undergraduate scholar exploring national cyber hackathons, AI prototype builds, and early fellowships.',
  },
  {
    name: 'Devansh Verma',
    email: 'devansh.verma@tech.ac.in',
    year: '3',
    field: 'Computer Science & Engineering',
    state: 'Karnataka',
    region: 'South India',
    skills: ['React', 'TypeScript', 'Node.js', 'Go', 'Docker', 'Git'],
    interests: ['Full-stack', 'Open Source', 'Internships', 'DevOps'],
    preferred_categories: ['Internship', 'Hackathon', 'Fellowship'],
    description: 'Undergraduate targeting tier-1 software internships (Flipkart GRiD, LFX Mentorship, GSoC).',
  },
  {
    name: 'Ananya Sen',
    email: 'ananya.sen@iit.ac.in',
    year: '2',
    field: 'Data Science & Machine Learning',
    state: 'West Bengal',
    region: 'East India',
    skills: ['Python', 'Machine Learning', 'Data Analysis', 'SQL', 'PyTorch'],
    interests: ['Machine Learning', 'Research', 'Competitions', 'Data Science'],
    preferred_categories: ['Competition', 'Fellowship', 'Internship'],
    description: 'Student focusing on global AI challenges, research fellowships, and Kaggle/Unstop competitions.',
  },
  {
    name: 'Rohan Mehta',
    email: 'rohan.mehta@mgmt.edu.in',
    year: 'All Years',
    field: 'Product Management & Business Analytics',
    state: 'Maharashtra',
    region: 'West India',
    skills: ['Product Management', 'Wireframing', 'PRD', 'User Research', 'Figma', 'Metrics'],
    interests: ['Product Management', 'Growth', 'Competitions', 'Case Studies', 'Productathons'],
    preferred_categories: ['Competition', 'Internship', 'Hackathon', 'Fellowship'],
    description: 'Undergraduate targeting APM cohorts (Google, Atlassian, Flipkart WiRED), case challenges, and productathons.',
  },
]

export interface AuthModalProps {
  currentProfile: Profile
  isLoggedIn?: boolean
  userEmail?: string
  onLoginSuccess: (profile: Profile, email?: string) => void
  onLogout?: () => void
  onClose: () => void
}

export const AuthModal: React.FC<AuthModalProps> = ({
  currentProfile,
  isLoggedIn,
  userEmail = 'prachi.vats@student.edu.in',
  onLoginSuccess,
  onLogout,
  onClose,
}) => {
  const [authTab, setAuthTab] = useState<'signin' | 'register' | 'personas'>('signin')

  // Sign In state
  const [emailInput, setEmailInput] = useState(userEmail || 'prachi.vats@student.edu.in')
  const [passwordInput, setPasswordInput] = useState('student2026')
  const [rememberMe, setRememberMe] = useState(true)

  // Registration state
  const [regName, setRegName] = useState(currentProfile.name || '')
  const [regEmail, setRegEmail] = useState('')
  const [regCollege, setRegCollege] = useState('Graphic Era Hill University')
  const [regYear, setRegYear] = useState(currentProfile.year || 'All Years')
  const [regField, setRegField] = useState(currentProfile.field || 'Computer Science & AI')
  const [regState, setRegState] = useState(currentProfile.state || 'Uttarakhand')
  const [regRegion, setRegRegion] = useState(currentProfile.region || 'North India')
  const [regSkills, setRegSkills] = useState(currentProfile.skills.join(', '))
  const [regInterests, setRegInterests] = useState(currentProfile.interests.join(', '))

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    // Find matching persona or update current profile
    const matched = DEMO_PERSONAS.find((p) => p.email.toLowerCase() === emailInput.toLowerCase())
    if (matched) {
      onLoginSuccess(
        {
          name: matched.name,
          year: matched.year,
          field: matched.field,
          skills: matched.skills,
          interests: matched.interests,
          preferred_categories: matched.preferred_categories,
          preferred_mode: 'Any',
          location: 'India',
          team_size: null,
        },
        matched.email,
      )
    } else {
      onLoginSuccess(
        {
          ...currentProfile,
          name: emailInput.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Student',
        },
        emailInput,
      )
    }
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    const parsedSkills = regSkills.split(',').map((s: string) => s.trim()).filter(Boolean)
    const parsedInterests = regInterests.split(',').map((s: string) => s.trim()).filter(Boolean)

    const newProfile: Profile = {
      name: regName.trim() || 'Student',
      year: regYear,
      field: regField.trim() || 'Computer Science',
      state: regState,
      region: regRegion,
      skills: parsedSkills.length > 0 ? parsedSkills : ['Python', 'Problem Solving'],
      interests: parsedInterests.length > 0 ? parsedInterests : ['Hackathons', 'Tech'],
      preferred_categories: ['Hackathon', 'Internship', 'Competition'],
      preferred_mode: 'Any',
      location: `${regState}, India`,
      team_size: null,
    }

    onLoginSuccess(newProfile, regEmail || `${regName.toLowerCase().replace(/\s+/g, '.')}@student.edu`)
  }

  const handleSelectPersona = (persona: typeof DEMO_PERSONAS[0]) => {
    onLoginSuccess(
      {
        name: persona.name,
        year: persona.year,
        field: persona.field,
        state: persona.state,
        region: persona.region,
        skills: persona.skills,
        interests: persona.interests,
        preferred_categories: persona.preferred_categories,
        preferred_mode: 'Any',
        location: `${persona.state}, India`,
        team_size: null,
      },
      persona.email,
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <div className="modal-dialog auth-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="auth-modal-header">
          <div className="auth-brand-badge">
            <RadarMark size={28} />
            <div>
              <h2 id="auth-modal-title" className="auth-modal-title">
                Student Access Portal
              </h2>
              <span className="auth-modal-kicker">OPPORTUNITY RADAR · AI MATCHING ENGINE</span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <X size={18} />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="auth-tab-bar" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={authTab === 'signin'}
            className={`auth-tab-btn ${authTab === 'signin' ? 'active' : ''}`}
            onClick={() => setAuthTab('signin')}
          >
            <LogIn size={14} />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={authTab === 'register'}
            className={`auth-tab-btn ${authTab === 'register' ? 'active' : ''}`}
            onClick={() => setAuthTab('register')}
          >
            <User size={14} />
            <span>New Student Onboarding</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={authTab === 'personas'}
            className={`auth-tab-btn ${authTab === 'personas' ? 'active' : ''}`}
            onClick={() => setAuthTab('personas')}
          >
            <Sparkles size={14} />
            <span>Test Personas (1-Click)</span>
          </button>
        </div>

        <div className="auth-modal-body">
          {/* TAB 1: SIGN IN */}
          {authTab === 'signin' && (
            <form onSubmit={handleSignIn} className="auth-form-layout">
              {isLoggedIn && (
                <div className="auth-active-session-banner">
                  <CheckCircle2 size={16} className="text-sage" />
                  <div style={{ flex: 1, fontSize: '13px' }}>
                    Currently signed in as <strong>{currentProfile.name}</strong> ({userEmail}).
                  </div>
                  <button type="button" className="btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={onLogout}>
                    Sign Out
                  </button>
                </div>
              )}

              <div className="form-field-group">
                <label className="field-label" htmlFor="auth-email">
                  Student Email / College ID
                </label>
                <div className="input-with-icon">
                  <Mail size={15} className="input-icon" />
                  <input
                    id="auth-email"
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="student.name@university.ac.in"
                    className="styled-input"
                  />
                </div>
              </div>

              <div className="form-field-group">
                <label className="field-label" htmlFor="auth-password">
                  Portal Password
                </label>
                <div className="input-with-icon">
                  <Lock size={15} className="input-icon" />
                  <input
                    id="auth-password"
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••••••"
                    className="styled-input"
                  />
                </div>
              </div>

              <div className="auth-form-row">
                <label className="checkbox-label" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Keep student session active</span>
                </label>
                <span className="auth-hint-text">Pre-configured for local dev</span>
              </div>

              <button type="submit" className="btn-primary auth-submit-btn">
                <span>Enter Opportunity Radar</span>
                <ArrowRight size={15} />
              </button>

              <div className="auth-footer-notice">
                <ShieldCheck size={14} style={{ color: 'var(--sage)' }} />
                <span>Your academic year and skills calibrate AI recommendations automatically.</span>
              </div>
            </form>
          )}

          {/* TAB 2: REGISTER / ONBOARDING */}
          {authTab === 'register' && (
            <form onSubmit={handleRegister} className="auth-form-layout">
              <div className="auth-grid-2col">
                <div className="form-field-group">
                  <label className="field-label" htmlFor="reg-name">
                    Full Student Name
                  </label>
                  <div className="input-with-icon">
                    <User size={15} className="input-icon" />
                    <input
                      id="reg-name"
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Prachi Vats"
                      className="styled-input"
                    />
                  </div>
                </div>

                <div className="form-field-group">
                  <label className="field-label" htmlFor="reg-email">
                    Student Email
                  </label>
                  <div className="input-with-icon">
                    <Mail size={15} className="input-icon" />
                    <input
                      id="reg-email"
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. prachi@gehu.ac.in"
                      className="styled-input"
                    />
                  </div>
                </div>
              </div>

              <div className="auth-grid-2col">
                <div className="form-field-group">
                  <label className="field-label" htmlFor="reg-year">
                    Current Academic Year
                  </label>
                  <select
                    id="reg-year"
                    value={regYear}
                    onChange={(e) => setRegYear(e.target.value)}
                    className="styled-select"
                  >
                    <option value="1">1st Year (Freshman)</option>
                    <option value="2">2nd Year (Sophomore)</option>
                    <option value="3">3rd Year (Junior)</option>
                    <option value="4">4th Year (Senior)</option>
                    <option value="Graduate">Postgraduate / Master's</option>
                  </select>
                </div>

                <div className="form-field-group">
                  <label className="field-label" htmlFor="reg-college">
                    Institution / University
                  </label>
                  <div className="input-with-icon">
                    <School size={15} className="input-icon" />
                    <input
                      id="reg-college"
                      type="text"
                      value={regCollege}
                      onChange={(e) => setRegCollege(e.target.value)}
                      placeholder="e.g. Graphic Era Hill University"
                      className="styled-input"
                    />
                  </div>
                </div>
              </div>

              <div className="form-field-group">
                <label className="field-label" htmlFor="reg-field">
                  Discipline / Major
                </label>
                <input
                  id="reg-field"
                  type="text"
                  required
                  value={regField}
                  onChange={(e) => setRegField(e.target.value)}
                  placeholder="e.g. Computer Science & AI, Data Science"
                  className="styled-input"
                />
              </div>

              {/* State & Region Geographic Category */}
              <div className="auth-grid-2col">
                <div className="form-field-group">
                  <label className="field-label" htmlFor="reg-state">
                    State / Union Territory
                  </label>
                  <div className="input-with-icon">
                    <MapPin size={15} className="input-icon" />
                    <select
                      id="reg-state"
                      value={regState}
                      onChange={(e) => setRegState(e.target.value)}
                      className="styled-select"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-field-group">
                  <label className="field-label" htmlFor="reg-region">
                    Target Region / Zone
                  </label>
                  <div className="input-with-icon">
                    <Globe size={15} className="input-icon" />
                    <select
                      id="reg-region"
                      value={regRegion}
                      onChange={(e) => setRegRegion(e.target.value)}
                      className="styled-select"
                    >
                      {REGIONS.map((rg) => (
                        <option key={rg} value={rg}>
                          {rg}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-field-group">
                <label className="field-label" htmlFor="reg-skills">
                  Technical Skills (comma separated)
                </label>
                <input
                  id="reg-skills"
                  type="text"
                  value={regSkills}
                  onChange={(e) => setRegSkills(e.target.value)}
                  placeholder="Python, React, Machine Learning, Cybersecurity"
                  className="styled-input"
                />
              </div>

              <div className="form-field-group">
                <label className="field-label" htmlFor="reg-interests">
                  Areas of Interest (comma separated)
                </label>
                <input
                  id="reg-interests"
                  type="text"
                  value={regInterests}
                  onChange={(e) => setRegInterests(e.target.value)}
                  placeholder="Hackathons, AI research, Fullstack, Open source"
                  className="styled-input"
                />
              </div>

              <button type="submit" className="btn-primary auth-submit-btn">
                <span>Complete Onboarding & Calibrate Feed</span>
                <ArrowRight size={15} />
              </button>
            </form>
          )}

          {/* TAB 3: DEMO PERSONAS */}
          {authTab === 'personas' && (
            <div className="personas-list-wrap">
              <p className="personas-intro">
                Switch instantly between real student profiles to see how Opportunity Radar dynamically alters match scores, eligibility flags, and recommendations.
              </p>

              <div className="personas-grid">
                {DEMO_PERSONAS.map((persona) => {
                  const isCurrent = currentProfile.name === persona.name
                  return (
                    <div
                      key={persona.email}
                      className={`persona-card ${isCurrent ? 'selected' : ''}`}
                      onClick={() => handleSelectPersona(persona)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') handleSelectPersona(persona)
                      }}
                    >
                      <div className="persona-card-header">
                        <div className="persona-avatar">
                          {persona.name.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div className="persona-info">
                          <strong className="persona-name">{persona.name}</strong>
                          <span className="persona-tag">{persona.field} · {persona.state} ({persona.region})</span>
                        </div>
                        {isCurrent && (
                          <span className="current-badge">
                            <CheckCircle2 size={13} /> Active
                          </span>
                        )}
                      </div>

                      <p className="persona-desc">{persona.description}</p>

                      <div className="persona-skills-row">
                        {persona.skills.slice(0, 3).map((s) => (
                          <span key={s} className="persona-skill-chip">{s}</span>
                        ))}
                      </div>

                      <div className="persona-action-row">
                        <span className="persona-email">{persona.email}</span>
                        <span className="persona-switch-cta">
                          {isCurrent ? 'Active Profile' : 'Switch to Profile →'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
