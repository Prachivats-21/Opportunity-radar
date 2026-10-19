import React, { useState, useEffect } from 'react'
import { Bell, Check, Clock, Sparkles, X, ShieldAlert, ArrowRight, Volume2 } from 'lucide-react'

export interface RadarNotification {
  id: string
  title: string
  message: string
  type: 'deadline' | 'match' | 'system'
  timestamp: string
  read: boolean
  targetId?: string
  platform?: string
}

interface NotificationCenterProps {
  isOpen: boolean
  onClose: () => void
  onSelectOpportunity?: (id: string) => void
}

const INITIAL_NOTIFICATIONS: RadarNotification[] = [
  {
    id: 'notif-1',
    title: 'Cyber Hackathon 2026 Closing Soon',
    message: 'Registration deadline on Bihar Cyber Hackathon portal closes in 7 days. Confirm team members (3–4).',
    type: 'deadline',
    timestamp: '2 hours ago',
    read: false,
    targetId: 'cyber-hackathon-bihar-2026',
    platform: 'Govt of Bihar',
  },
  {
    id: 'notif-2',
    title: 'High Fit Match: Flipkart GRiD 7.0',
    message: '92% match with your AI & algorithmic skills. Track available on Unstop.',
    type: 'match',
    timestamp: '5 hours ago',
    read: false,
    targetId: 'flipkart-grid-2026',
    platform: 'Unstop',
  },
  {
    id: 'notif-3',
    title: 'Smart India Hackathon 2026 Portal Verified',
    message: 'Verified SIH guidelines updated with problem statements for undergraduate engineering students.',
    type: 'system',
    timestamp: '1 day ago',
    read: true,
    targetId: 'sih-2026',
    platform: 'National Portal',
  },
]

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  onSelectOpportunity,
}) => {
  const [notifications, setNotifications] = useState<RadarNotification[]>(() => {
    try {
      const stored = window.localStorage.getItem('opportunity-radar-notifications')
      return stored ? JSON.parse(stored) : INITIAL_NOTIFICATIONS
    } catch {
      return INITIAL_NOTIFICATIONS
    }
  })

  const [pushStatus, setPushStatus] = useState<NotificationPermission>('default')
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    if ('Notification' in window) {
      setPushStatus(Notification.permission)
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem('opportunity-radar-notifications', JSON.stringify(notifications))
    } catch {
      // Storage unavailable
    }
  }, [notifications])

  if (!isOpen) return null

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const requestBrowserPush = async () => {
    if (!('Notification' in window)) {
      setFeedback('Browser notifications not supported in this browser.')
      return
    }

    try {
      const permission = await Notification.requestPermission()
      setPushStatus(permission)
      if (permission === 'granted') {
        setFeedback('Push notifications enabled!')
        new Notification('Opportunity Radar Alerts Active', {
          body: 'You will receive desktop alerts when deadlines approach or new hackathons drop on Unstop & Gov portals.',
          icon: '/favicon.ico',
        })
      } else {
        setFeedback('Notifications blocked or denied by browser.')
      }
    } catch {
      setFeedback('Could not request notification permissions.')
    } finally {
      setTimeout(() => setFeedback(''), 4000)
    }
  }

  const sendTestNotification = () => {
    if (Notification.permission === 'granted') {
      new Notification('🚨 Upcoming Deadline: Cyber Hackathon 2026', {
        body: 'Due in 7 days! Click to review registration guidelines on State Portal.',
      })
      setFeedback('Test notification triggered!')
      setTimeout(() => setFeedback(''), 3000)
    } else {
      requestBrowserPush()
    }
  }

  return (
    <div className="notification-popover-backdrop" onClick={onClose}>
      <div className="notification-popover" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Student Notifications Center">
        {/* Header */}
        <div className="notif-header">
          <div className="notif-header-title">
            <Bell size={16} className="text-sage" />
            <h3>Notification Center</h3>
            {unreadCount > 0 && <span className="notif-unread-badge">{unreadCount} new</span>}
          </div>
          <div className="notif-header-actions">
            {unreadCount > 0 && (
              <button type="button" className="notif-text-btn" onClick={markAllRead}>
                Mark all read
              </button>
            )}
            <button type="button" className="notif-close-btn" onClick={onClose} aria-label="Close notification panel">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Browser Push Permission Strip */}
        <div className="notif-push-strip">
          <div className="push-strip-content">
            <Volume2 size={14} className="push-icon" />
            <div className="push-text">
              <strong>Desktop & Push Alerts</strong>
              <span>{pushStatus === 'granted' ? 'Active: Ready to receive real-time deadline warnings' : 'Enable browser alerts for urgent deadlines (<=3 days)'}</span>
            </div>
          </div>
          {pushStatus !== 'granted' ? (
            <button type="button" className="btn-push-enable" onClick={requestBrowserPush}>
              Enable
            </button>
          ) : (
            <button type="button" className="btn-push-test" onClick={sendTestNotification}>
              Test Alert
            </button>
          )}
        </div>

        {feedback && (
          <div className="notif-feedback-bar">
            <Check size={12} />
            <span>{feedback}</span>
          </div>
        )}

        {/* Notifications List */}
        <div className="notif-list">
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`notif-item ${notif.read ? 'read' : 'unread'}`}
                onClick={() => {
                  markRead(notif.id)
                  if (notif.targetId && onSelectOpportunity) {
                    onSelectOpportunity(notif.targetId)
                    onClose()
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className={`notif-icon-circle ${notif.type}`}>
                  {notif.type === 'deadline' && <Clock size={13} />}
                  {notif.type === 'match' && <Sparkles size={13} />}
                  {notif.type === 'system' && <ShieldAlert size={13} />}
                </div>

                <div className="notif-content">
                  <div className="notif-title-row">
                    <span className="notif-item-title">{notif.title}</span>
                    <span className="notif-time">{notif.timestamp}</span>
                  </div>
                  <p className="notif-msg">{notif.message}</p>
                  <div className="notif-footer-row">
                    {notif.platform && <span className="notif-platform-tag">{notif.platform}</span>}
                    <span className="notif-view-cta">
                      View opportunity <ArrowRight size={10} />
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="notif-delete-btn"
                  onClick={(e) => deleteNotification(notif.id, e)}
                  title="Dismiss alert"
                  aria-label="Dismiss alert"
                >
                  <X size={12} />
                </button>
              </div>
            ))
          ) : (
            <div className="notif-empty-state">
              <Bell size={24} style={{ opacity: 0.4 }} />
              <p>No active alerts right now.</p>
              <span>You're caught up on all opportunity deadlines and matching tracks.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
