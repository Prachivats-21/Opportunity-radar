import React from 'react'
import { LayoutDashboard, Compass, Bookmark, User, Settings2, ArrowRight, X } from 'lucide-react'

interface SidebarProps {
  activeTab: string
  onSelectTab: (tab: string) => void
  savedCount: number
  opportunitiesCount: number
  profileName: string
  profileYear: string
  profileField: string
  onOpenProfile: () => void
  isOpen: boolean
  onClose: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  savedCount,
  opportunitiesCount,
  profileName,
  profileYear,
  profileField,
  onOpenProfile,
  isOpen,
  onClose,
}) => {
  const initials = profileName
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase() || 'PV'

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(25, 59, 56, 0.4)',
            zIndex: 35,
            backdropFilter: 'blur(2px)',
          }}
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          {isOpen && (
            <button
              onClick={onClose}
              style={{ marginLeft: 'auto', color: 'var(--text-tertiary)', padding: 4 }}
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="sidebar-content">
          <div>
            <div className="nav-group-label">WORKSPACE</div>
            <nav className="sidebar-nav">
              <button
                className={`nav-item ${activeTab === 'Dashboard' ? 'active' : ''}`}
                onClick={() => {
                  onSelectTab('Dashboard')
                  onClose()
                }}
              >
                <LayoutDashboard size={16} />
                <span>Dashboard</span>
              </button>

              <button
                className={`nav-item ${activeTab === 'Explore' ? 'active' : ''}`}
                onClick={() => {
                  onSelectTab('Explore')
                  onClose()
                }}
              >
                <Compass size={16} />
                <span>Explore</span>
                <span className="nav-badge">{opportunitiesCount}</span>
              </button>

              <button
                className={`nav-item ${activeTab === 'Saved' ? 'active' : ''}`}
                onClick={() => {
                  onSelectTab('Saved')
                  onClose()
                }}
              >
                <Bookmark size={16} />
                <span>Saved Opportunities</span>
                {savedCount > 0 && <span className="nav-badge">{savedCount}</span>}
              </button>
            </nav>
          </div>

          <div>
            <div className="nav-group-label">ACCOUNT & PREFERENCES</div>
            <nav className="sidebar-nav">
              <button
                className={`nav-item ${activeTab === 'Profile' ? 'active' : ''}`}
                onClick={() => {
                  onOpenProfile()
                  onClose()
                }}
              >
                <User size={16} />
                <span>My Profile</span>
              </button>

              <button
                className={`nav-item ${activeTab === 'Settings' ? 'active' : ''}`}
                onClick={() => {
                  onOpenProfile()
                  onClose()
                }}
              >
                <Settings2 size={16} />
                <span>Settings</span>
              </button>
            </nav>
          </div>

          {/* Radar Tune Prompt Card */}
          <div className="sidebar-card">
            <h4>Personalise Radar</h4>
            <p>Update your academic year, target tracks, and skills for more relevant matches.</p>
            <button
              className="sidebar-card-btn"
              onClick={() => {
                onOpenProfile()
                onClose()
              }}
            >
              <span>Tune preferences</span>
              <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* Sidebar Footer User Pill */}
        <div className="sidebar-footer">
          <button className="sidebar-user-pill" onClick={onOpenProfile}>
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <span className="user-name">{profileName}</span>
              <span className="user-sub">
                {profileYear !== 'Not specified' ? `Year ${profileYear} · ` : ''}
                {profileField}
              </span>
            </div>
            <Settings2 size={15} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          </button>
        </div>
      </aside>
    </>
  )
}
