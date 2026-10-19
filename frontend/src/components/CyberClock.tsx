import React, { useState, useEffect, useRef } from 'react'
import { Clock, Volume2, VolumeX, X, Timer, AlertCircle } from 'lucide-react'

interface CyberClockProps {
  targetOpportunity?: {
    id?: string
    title: string
    deadline: string | null
    organization?: string
  } | null
  onClearTarget?: () => void
}

export const CyberClock: React.FC<CyberClockProps> = ({
  targetOpportunity,
  onClearTarget,
}) => {
  const [timeStr, setTimeStr] = useState<string>('')
  const [period, setPeriod] = useState<string>('')
  const [is24Hour, setIs24Hour] = useState<boolean>(false)
  const [countdownStr, setCountdownStr] = useState<string>('')
  const [isExpired, setIsExpired] = useState<boolean>(false)

  // Sound toggle (persisted in localStorage, muted by default)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem('opportunity-radar-sound') === 'true'
    } catch {
      return false
    }
  })

  const audioCtxRef = useRef<AudioContext | null>(null)

  // Mechanical clock tick sound using Web Audio API
  const playMechanicalTick = () => {
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
        audioCtxRef.current = new AudioCtx()
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume()
      }

      const ctx = audioCtxRef.current
      const now = ctx.currentTime

      // High-precision subtle mechanical escapement click
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(1250, now)
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.02)

      gain.gain.setValueAtTime(0.045, now)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.021)
    } catch {
      // Audio playback unavailable or restricted
    }
  }

  // Toggle sound handler
  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation()
    const next = !soundEnabled
    setSoundEnabled(next)
    try {
      window.localStorage.setItem('opportunity-radar-sound', String(next))
    } catch {
      // Storage unavailable
    }
    // Play a preview tick immediately when turning on
    if (next) {
      playMechanicalTick()
    }
  }

  // Timer loop
  useEffect(() => {
    const update = () => {
      const now = new Date()

      // 1. If target opportunity with deadline is selected: calculate countdown
      if (targetOpportunity?.deadline) {
        const deadlineDate = new Date(`${targetOpportunity.deadline}T23:59:59`).getTime()
        const diff = deadlineDate - now.getTime()

        if (diff <= 0) {
          setIsExpired(true)
          setCountdownStr('REGISTRATION CLOSED')
        } else {
          setIsExpired(false)
          const days = Math.floor(diff / (1000 * 60 * 60 * 24))
          const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
          const minutes = Math.floor((diff / (1000 * 60)) % 60)
          const seconds = Math.floor((diff / 1000) % 60)

          const parts: string[] = []
          if (days > 0) parts.push(`${days}d`)
          parts.push(`${String(hours).padStart(2, '0')}h`)
          parts.push(`${String(minutes).padStart(2, '0')}m`)
          parts.push(`${String(seconds).padStart(2, '0')}s`)

          setCountdownStr(parts.join(' '))
        }
      } else {
        setCountdownStr('')
        setIsExpired(false)
      }

      // 2. Standard Clock Time
      let hours = now.getHours()
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const seconds = String(now.getSeconds()).padStart(2, '0')

      if (is24Hour) {
        setTimeStr(`${String(hours).padStart(2, '0')}:${minutes}:${seconds}`)
        setPeriod('24H')
      } else {
        const ampm = hours >= 12 ? 'PM' : 'AM'
        hours = hours % 12
        hours = hours ? hours : 12
        setTimeStr(`${String(hours).padStart(2, '0')}:${minutes}:${seconds}`)
        setPeriod(ampm)
      }

      // 3. Audio tick (if sound enabled)
      if (soundEnabled) {
        playMechanicalTick()
      }
    }

    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [targetOpportunity, is24Hour, soundEnabled])

  const hasTarget = Boolean(targetOpportunity?.deadline)
  const shortTitle = targetOpportunity
    ? targetOpportunity.title.length > 18
      ? `${targetOpportunity.title.slice(0, 16)}…`
      : targetOpportunity.title
    : ''

  return (
    <div className="cyber-clock-cluster">
      <div
        className={`cyber-clock-hud ${hasTarget ? 'targeting-deadline' : ''}`}
        onClick={() => !hasTarget && setIs24Hour((prev) => !prev)}
        title={
          hasTarget
            ? `Deadline Countdown for "${targetOpportunity?.title}". Click (X) to return to local time.`
            : 'Live Telemetry Clock — Click to toggle 12H/24H format'
        }
        role="timer"
      >
        <div className="cyber-clock-beacon">
          <span className={`beacon-ring ${hasTarget ? 'amber' : ''}`} />
          <span className={`beacon-dot ${hasTarget ? 'amber' : ''}`} />
        </div>

        {hasTarget ? (
          <div className="cyber-clock-deadline-mode">
            <Timer size={13} className="cyber-target-icon" />
            <span className="target-opp-title">{shortTitle}:</span>
            <span className={`time-countdown-value ${isExpired ? 'expired' : ''}`}>
              {countdownStr || 'CALCULATING…'}
            </span>
            {onClearTarget && (
              <button
                type="button"
                className="target-clear-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  onClearTarget()
                }}
                title="Exit countdown & restore live clock"
                aria-label="Exit deadline countdown"
              >
                <X size={11} />
              </button>
            )}
          </div>
        ) : (
          <div className="cyber-clock-digits">
            <Clock size={12} className="cyber-clock-icon" />
            <span className="time-value">{timeStr || '00:00:00'}</span>
            <span className="time-period">{period}</span>
          </div>
        )}

        <div className="cyber-clock-zone">
          <span className="zone-label">{hasTarget ? 'DEADLINE' : 'IST'}</span>
        </div>
      </div>

      {/* Tactile Audio Tick Toggle Button */}
      <button
        type="button"
        className={`clock-sound-toggle-btn ${soundEnabled ? 'sound-active' : ''}`}
        onClick={toggleSound}
        title={soundEnabled ? 'Mute ticking sound' : 'Turn ON ticking sound (tick-tick-tick)'}
        aria-label={soundEnabled ? 'Mute ticking sound' : 'Turn ON mechanical ticking clock sound'}
      >
        {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
        <span className="sound-toggle-label">{soundEnabled ? 'TICK ON' : 'MUTE'}</span>
      </button>
    </div>
  )
}
