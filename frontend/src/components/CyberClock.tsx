import React, { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

export const CyberClock: React.FC = () => {
  const [timeStr, setTimeStr] = useState<string>('')
  const [period, setPeriod] = useState<string>('')
  const [is24Hour, setIs24Hour] = useState<boolean>(false)

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      let hours = now.getHours()
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const seconds = String(now.getSeconds()).padStart(2, '0')

      if (is24Hour) {
        setTimeStr(`${String(hours).padStart(2, '0')}:${minutes}:${seconds}`)
        setPeriod('24H')
      } else {
        const ampm = hours >= 12 ? 'PM' : 'AM'
        hours = hours % 12
        hours = hours ? hours : 12 // hour '0' should be '12'
        setTimeStr(`${String(hours).padStart(2, '0')}:${minutes}:${seconds}`)
        setPeriod(ampm)
      }
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [is24Hour])

  return (
    <div
      className="cyber-clock-hud"
      onClick={() => setIs24Hour((prev) => !prev)}
      title="Live Radar Telemetry Clock — Click to toggle 12H/24H format"
      role="timer"
      aria-label={`Current time: ${timeStr} ${period}`}
    >
      <div className="cyber-clock-beacon">
        <span className="beacon-ring" />
        <span className="beacon-dot" />
      </div>

      <div className="cyber-clock-digits">
        <Clock size={12} className="cyber-clock-icon" />
        <span className="time-value">{timeStr || '00:00:00'}</span>
        <span className="time-period">{period}</span>
      </div>

      <div className="cyber-clock-zone">
        <span className="zone-label">IST</span>
      </div>
    </div>
  )
}
