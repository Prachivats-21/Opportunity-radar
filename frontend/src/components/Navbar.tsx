import React, { useState, useRef, useEffect } from 'react'
import { Search, Bell, X, Radar, Menu, Settings2, User, Bookmark, LogOut, Check } from 'lucide-react'
import { RadarMark } from './RadarMark'

interface NavbarProps {
  query: string
  onQueryChange: (q: string) => void
  onOpenMobileMenu: () => void
  onOpenProfile: () => void
  profileName: string
  profileField: string
  onSelectTab: (tab: string) => void
  onResetProfile: () => void
  opportunitiesCount: number
}

export const Navbar: React.FC<NavbarProps> = ({
  query,
  onQueryChange,
  onOpenMobileMenu,
  onOpenProfile,
  profileName,
  profileField,
  onSelectTab,
  onResetProfile,
  opportunitiesCount,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifMenu, setShowNotifMenu] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const profileMenuRef = useRef<HTMLDivElement>(null)
  const notifMenuRef = useRef<HTMLDivElement>(null)

  // Keyboard shortcut Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false)
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setShowNotifMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const initials = profileName
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0])
    .join('')
    .toUpperCase() || 'PV'

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="mobile-menu-btn"
          onClick={onOpenMobileMenu}
          aria-label="Open sidebar navigation"
        >
          <Menu size={18} />
        </button>

        <a className="topbar-brand" href="#top" onClick={() => onSelectTab('Dashboard')}>
          <RadarMark size={36} />
          <span className="topbar-brand-text">
            <span className="topbar-brand-title">Opportunity Radar</span>
            <span className="topbar-brand-subtitle">STUDENT DISCOVERY</span>
          </span>
        </a>

        <div className="search-container">
          <Search size={15} />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search opportunities, skills, or organizations..."
            aria-label="Search opportunities"
          />
          {query ? (
            <button
              className="search-clear-btn"
              onClick={() => onQueryChange('')}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          ) : (
            <span className="search-kbd">⌘K</span>
          )}
        </div>
      </div>

      <div className="topbar-right">
        {/* Notifications Dropdown */}
        <div style={{ position: 'relative' }} ref={notifMenuRef}>
          <button
            className="icon-btn"
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            aria-label="View notifications"
          >
            <Bell size={16} />
            <span className="notif-badge" />
          </button>

          {showNotifMenu && (
            <div className="dropdown-menu">
              <div className="dropdown-header">
                <strong>Signal Updates</strong>
                <small>{opportunitiesCount} active listings verified</small>
              </div>
              <div style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <Radar size={14} style={{ color: 'var(--sage)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Radar Signal Active</strong>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>
                      Verified listings loaded from local repository.
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Check size={14} style={{ color: 'var(--sage)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Deadline Check</strong>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: '10px' }}>
                      Upcoming application deadlines monitored.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div style={{ position: 'relative' }} ref={profileMenuRef}>
          <button
            className="topbar-profile-btn"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            aria-label="User account menu"
          >
            <div className="user-avatar" style={{ width: 28, height: 28, fontSize: 11 }}>
              {initials}
            </div>
            <span className="topbar-profile-name">{profileName}</span>
          </button>

          {showProfileMenu && (
            <div className="dropdown-menu">
              <div className="dropdown-header">
                <strong>{profileName}</strong>
                <small>{profileField}</small>
              </div>
              <button
                className="dropdown-item"
                onClick={() => {
                  setShowProfileMenu(false)
                  onOpenProfile()
                }}
              >
                <User size={14} /> My Profile
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  setShowProfileMenu(false)
                  onSelectTab('Saved')
                }}
              >
                <Bookmark size={14} /> Saved Opportunities
              </button>
              <button
                className="dropdown-item"
                onClick={() => {
                  setShowProfileMenu(false)
                  onOpenProfile()
                }}
              >
                <Settings2 size={14} /> Preferences
              </button>
              <div style={{ height: 1, backgroundColor: 'var(--divider)', margin: '4px 0' }} />
              <button
                className="dropdown-item danger"
                onClick={() => {
                  setShowProfileMenu(false)
                  onResetProfile()
                }}
              >
                <LogOut size={14} /> Reset Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
