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
  FileCheck2,
  RefreshCw,
  Code2,
  Briefcase,
  Trophy,
  GraduationCap,
} from 'lucide-react'
import { RadarMark } from './RadarMark'

import type { Opportunity } from '../types'

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
  applicationsCount?: number
  onSyncFeeds?: () => void
  isSyncing?: boolean
  onConnectLinkedIn?: () => void
  isLinkedInConnected?: boolean
  targetOpportunity?: Opportunity | null
  onClearClockTarget?: () => void
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
  applicationsCount = 0,
  onSyncFeeds,
  isSyncing = false,
  onConnectLinkedIn,
  isLinkedInConnected = false,
  targetOpportunity,
  onClearClockTarget,
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
              <LayoutDashboard size={13} />
              <span>Overview</span>
            </button>

            <button
              type="button"
              className={`nav-link-btn ${activeTab === 'Hackathons' ? 'active' : ''}`}
              onClick={() => handleNavClick('Hackathons')}
              aria-current={activeTab === 'Hackathons' ? 'page' : undefined}
            >
              <Code2 size={13} />
              <span>Hackathons</span>
            </button>

            <button
              type="button"
              className={`nav-link-btn ${activeTab === 'Internships' ? 'active' : ''}`}
              onClick={() => handleNavClick('Internships')}
              aria-current={activeTab === 'Internships' ? 'page' : undefined}
            >
              <Briefcase size={13} />
              <span>Internships</span>
            </button>

            <button
              type="button"
              className={`nav-link-btn ${activeTab === 'Competitions' ? 'active' : ''}`}
              onClick={() => handleNavClick('Competitions')}
              aria-current={activeTab === 'Competitions' ? 'page' : undefined}
            >
              <Trophy size={13} />
              <span>Competitions</span>
            </button>

            <button
              type="button"
              className={`nav-link-btn ${activeTab === 'Fellowships' ? 'active' : ''}`}
              onClick={() => handleNavClick('Fellowships')}
              aria-current={activeTab === 'Fellowships' ? 'page' : undefined}
            >
              <GraduationCap size={13} />
              <span>Fellowships</span>
            </button>

            <button
              type="button"
              className={`nav-link-btn ${activeTab === 'Saved' ? 'active' : ''}`}
              onClick={() => handleNavClick('Saved')}
              aria-current={activeTab === 'Saved' ? 'page' : undefined}
            >
              <Bookmark size={13} />
              <span>Saved</span>
              {savedCount > 0 && <span className="header-nav-badge highlight">{savedCount}</span>}
            </button>

            <button
              type="button"
              className={`nav-link-btn ${activeTab === 'Applications' ? 'active' : ''}`}
              onClick={() => handleNavClick('Applications')}
              aria-current={activeTab === 'Applications' ? 'page' : undefined}
            >
              <FileCheck2 size={13} />
              <span>Applications</span>
              {applicationsCount > 0 && <span className="header-nav-badge highlight">{applicationsCount}</span>}
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
          {/* Live Sync Trigger */}
          {onSyncFeeds && (
            <button
              type="button"
              className={`btn-sync-feeds ${isSyncing ? 'spinning' : ''}`}
              onClick={onSyncFeeds}
              disabled={isSyncing}
              title="Sync live opportunities from Unstop, Government Portals & Devpost"
            >
              <RefreshCw size={13} />
              <span className="hide-on-mobile">{isSyncing ? 'Syncing...' : 'Sync Feeds'}</span>
            </button>
          )}

          {/* LinkedIn Profile & Jobs Sync */}
          {onConnectLinkedIn && (
            <button
              type="button"
              className={`btn-linkedin-header ${isLinkedInConnected ? 'connected' : ''}`}
              onClick={onConnectLinkedIn}
              title={isLinkedInConnected ? 'LinkedIn synced: Calibrated with your skills' : 'Connect LinkedIn to import skills & target roles'}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
              </svg>
              <span className="hide-on-mobile">{isLinkedInConnected ? 'LinkedIn Synced' : 'Sync LinkedIn'}</span>
            </button>
          )}

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

                <button
                  type="button"
                  className={`dropdown-item-btn ${activeTab === 'Applications' ? 'current' : ''}`}
                  onClick={() => handleNavClick('Applications')}
                  role="menuitem"
                >
                  <FileCheck2 size={14} />
                  <span>My Applications Tracker</span>
                  {applicationsCount > 0 && <span className="dropdown-badge accent">{applicationsCount}</span>}
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
                className={`mobile-nav-item ${activeTab === 'Applications' ? 'active' : ''}`}
                onClick={() => handleNavClick('Applications')}
              >
                <FileCheck2 size={15} />
                <span>My Applications</span>
                {applicationsCount > 0 && <span className="mobile-badge accent">{applicationsCount}</span>}
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
