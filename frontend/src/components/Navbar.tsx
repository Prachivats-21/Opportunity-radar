import React, { useState, useRef, useEffect } from 'react'
import {
  Search,
  X,
  Menu,
  Settings2,
  User,
  Bookmark,
  LayoutDashboard,
  ChevronDown,
  LogIn,
  Bell,
  SlidersHorizontal,
} from 'lucide-react'
import { RadarMark } from './RadarMark'

interface NavbarProps {
  activeTab: string
  onSelectTab: (tab: string) => void
  query: string
  onQueryChange: (q: string) => void
  profileName: string
  profileField: string
  profileYear: string
  isLoggedIn?: boolean
  userEmail?: string
  unreadNotificationsCount?: number
  onOpenNotifications: () => void
  onOpenAuthModal: () => void
  savedCount: number
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  query,
  onQueryChange,
  profileName,
  profileField,
  profileYear,
  isLoggedIn = true,
  userEmail = 'prachi.vats@student.edu.in',
  unreadNotificationsCount = 2,
  onOpenNotifications,
  onOpenAuthModal,
  savedCount,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  // Keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      if (e.key === 'Escape') {
        setShowProfileMenu(false)
        setMobileNavOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const initials = (profileName || 'PV')
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase()

  const handleNavClick = (tab: string) => {
    onSelectTab(tab)
    setShowProfileMenu(false)
    setMobileNavOpen(false)
  }

  return (
    <header className="site-header" role="banner">
      <div className="header-container">
        {/* Brand Logo & Wordmark */}
        <div className="header-brand-group">
          <button
            className="mobile-nav-toggle"
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            aria-label={mobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileNavOpen}
          >
            {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <a
            className="header-brand-link"
            href="#top"
            onClick={(e) => {
              e.preventDefault()
              handleNavClick('Dashboard')
            }}
            aria-label="Opportunity Radar Home"
          >
            <RadarMark size={30} />
            <div className="brand-wordmark">
              <span className="brand-name">Opportunity Radar</span>
              <span className="brand-kicker">STUDENT DISCOVERY</span>
            </div>
          </a>

          {/* Primary Desktop Navigation Links */}
          <nav className="desktop-nav" aria-label="Main navigation">
            <button
              type="button"
              className={`nav-link-btn ${activeTab === 'Dashboard' ? 'active' : ''}`}
              onClick={() => handleNavClick('Dashboard')}
              aria-current={activeTab === 'Dashboard' ? 'page' : undefined}
            >
              <LayoutDashboard size={14} />
              <span>Radar Feed</span>
            </button>

            <button
              type="button"
              className={`nav-link-btn ${activeTab === 'Saved' ? 'active' : ''}`}
              onClick={() => handleNavClick('Saved')}
              aria-current={activeTab === 'Saved' ? 'page' : undefined}
            >
              <Bookmark size={14} />
              <span>Saved</span>
              {savedCount > 0 && <span className="header-nav-badge highlight">{savedCount}</span>}
            </button>

            <button
              type="button"
              className={`nav-link-btn ${activeTab === 'Profile' ? 'active' : ''}`}
              onClick={() => handleNavClick('Profile')}
              aria-current={activeTab === 'Profile' ? 'page' : undefined}
            >
              <SlidersHorizontal size={14} />
              <span>My Profile & Skills</span>
            </button>
          </nav>
        </div>

        {/* Search Bar */}
        <div className="header-search-wrap">
          <Search size={14} className="search-icon-decor" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search Unstop, hackathons, skills..."
            aria-label="Search opportunities"
            className="header-search-input"
          />
          {query ? (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => onQueryChange('')}
              aria-label="Clear search query"
            >
              <X size={12} />
            </button>
          ) : (
            <kbd className="search-kbd-shortcut">⌘K</kbd>
          )}
        </div>

        {/* Header Right Actions */}
        <div className="header-actions-group">
          {/* Notification Center Trigger */}
          <button
            type="button"
            className="header-icon-btn notification-bell-btn"
            onClick={onOpenNotifications}
            aria-label="Open notifications center"
            title="Notification Center (Deadlines & Matches)"
          >
            <Bell size={15} />
            {unreadNotificationsCount !== undefined && unreadNotificationsCount > 0 && (
              <span className="notif-badge-pill">{unreadNotificationsCount}</span>
            )}
          </button>

          {/* User Account / Profile Dropdown Control */}
          <div className="profile-menu-container" ref={profileMenuRef}>
            <button
              type="button"
              className={`account-menu-trigger ${showProfileMenu ? 'active' : ''}`}
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              aria-label="Open student account menu"
              aria-haspopup="true"
              aria-expanded={showProfileMenu}
            >
              <div className="account-avatar">{initials}</div>
              <span className="account-trigger-name">{profileName.split(/\s+/)[0] || 'Profile'}</span>
              <ChevronDown size={13} className={`dropdown-chevron ${showProfileMenu ? 'open' : ''}`} />
            </button>

            {/* Profile Dropdown Popover */}
            {showProfileMenu && (
              <div className="account-dropdown-popover" role="menu">
                {/* User Identity Header */}
                <div className="dropdown-identity-block">
                  <div className="dropdown-avatar-big">{initials}</div>
                  <div className="dropdown-identity-meta">
                    <strong className="dropdown-user-name">{profileName}</strong>
                    <span className="dropdown-user-field">
                      {profileYear !== 'Not specified' ? `Year ${profileYear} · ` : ''}
                      {profileField}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 2 }}>{userEmail}</span>
                  </div>
                </div>

                <div className="dropdown-divider" />

                {/* Section 1: Quick Navigation */}
                <div className="dropdown-section-title">NAVIGATION</div>
                <button
                  type="button"
                  className={`dropdown-item-btn ${activeTab === 'Dashboard' ? 'current' : ''}`}
                  onClick={() => handleNavClick('Dashboard')}
                  role="menuitem"
                >
                  <LayoutDashboard size={14} />
                  <span>Radar Feed</span>
                </button>

                <button
                  type="button"
                  className={`dropdown-item-btn ${activeTab === 'Saved' ? 'current' : ''}`}
                  onClick={() => handleNavClick('Saved')}
                  role="menuitem"
                >
                  <Bookmark size={14} />
                  <span>Saved Opportunities</span>
                  {savedCount > 0 && <span className="dropdown-badge accent">{savedCount}</span>}
                </button>

                <div className="dropdown-divider" />

                {/* Section 2: Account & Calibration */}
                <div className="dropdown-section-title">STUDENT SETTINGS</div>
                <button
                  type="button"
                  className={`dropdown-item-btn ${activeTab === 'Profile' ? 'current' : ''}`}
                  onClick={() => handleNavClick('Profile')}
                  role="menuitem"
                >
                  <User size={14} />
                  <span>Edit Profile & Preferences</span>
                </button>

                <button
                  type="button"
                  className="dropdown-item-btn"
                  onClick={() => {
                    setShowProfileMenu(false)
                    onOpenAuthModal()
                  }}
                  role="menuitem"
                >
                  <LogIn size={14} style={{ color: 'var(--sage)' }} />
                  <span>Switch Student Persona / Sign In</span>
                </button>

                <button
                  type="button"
                  className={`dropdown-item-btn ${activeTab === 'Settings' ? 'current' : ''}`}
                  onClick={() => handleNavClick('Settings')}
                  role="menuitem"
                >
                  <Settings2 size={14} />
                  <span>System Diagnostics</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileNavOpen && (
        <div className="mobile-nav-drawer" role="navigation" aria-label="Mobile navigation">
          <div className="mobile-nav-inner">
            <div className="mobile-user-card">
              <div className="account-avatar">{initials}</div>
              <div>
                <strong>{profileName}</strong>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{profileField}</div>
              </div>
            </div>

            <div className="mobile-nav-links">
              <button
                type="button"
                className={`mobile-nav-item ${activeTab === 'Dashboard' ? 'active' : ''}`}
                onClick={() => handleNavClick('Dashboard')}
              >
                <LayoutDashboard size={15} />
                <span>Radar Feed</span>
              </button>

              <button
                type="button"
                className={`mobile-nav-item ${activeTab === 'Saved' ? 'active' : ''}`}
                onClick={() => handleNavClick('Saved')}
              >
                <Bookmark size={15} />
                <span>Saved Opportunities</span>
                {savedCount > 0 && <span className="mobile-badge accent">{savedCount}</span>}
              </button>

              <button
                type="button"
                className={`mobile-nav-item ${activeTab === 'Profile' ? 'active' : ''}`}
                onClick={() => handleNavClick('Profile')}
              >
                <User size={15} />
                <span>My Profile & Skills</span>
              </button>

              <button
                type="button"
                className={`mobile-nav-item ${activeTab === 'Settings' ? 'active' : ''}`}
                onClick={() => handleNavClick('Settings')}
              >
                <Settings2 size={15} />
                <span>Settings</span>
              </button>

              <button
                type="button"
                className="mobile-nav-item"
                onClick={() => {
                  setMobileNavOpen(false)
                  onOpenAuthModal()
                }}
              >
                <LogIn size={15} style={{ color: 'var(--sage)' }} />
                <span>Switch Student Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
