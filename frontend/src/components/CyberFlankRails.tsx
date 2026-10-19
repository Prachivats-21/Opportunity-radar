import React, { useEffect, useState } from 'react'

export const CyberFlankRails: React.FC = () => {
  const [scrollPercent, setScrollPercent] = useState<number>(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
      if (scrollHeight > 0) {
        const pct = Math.round((window.scrollY / scrollHeight) * 100)
        setScrollPercent(Math.min(100, Math.max(0, pct)))
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      {/* Left Cyber Rail */}
      <aside className="cyber-rail left-rail" aria-hidden="true">
        <div className="rail-decor-top">
          <div className="rail-crosshair">✛</div>
          <div className="rail-glow-bar" />
        </div>

        <div className="rail-vertical-content">
          <span className="rail-coordinate">28.6139° N · 77.2090° E</span>
          <span className="rail-divider">/</span>
          <span className="rail-system-label">RADAR // GRID-OSS</span>
          <span className="rail-divider">/</span>
          <span className="rail-status-pill">ARMED</span>
        </div>

        <div className="rail-decor-bottom">
          <div className="rail-tick-marks">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="rail-crosshair">✛</div>
        </div>
      </aside>

      {/* Right Cyber Rail */}
      <aside className="cyber-rail right-rail" aria-hidden="true">
        <div className="rail-decor-top">
          <div className="rail-crosshair">✛</div>
          <div className="rail-signal-badge">
            <span className="signal-dot" />
            <span className="signal-text">LIVE</span>
          </div>
        </div>

        <div className="rail-vertical-content">
          <span className="rail-system-label">SCROLL DEPTH</span>
          <span className="rail-metric-value">{scrollPercent}%</span>
          <span className="rail-divider">/</span>
          <span className="rail-system-label">PROTO // UNSTOP · GOV · SIH</span>
        </div>

        <div className="rail-decor-bottom">
          {/* Scroll progress line indicator */}
          <div className="rail-progress-track">
            <div className="rail-progress-fill" style={{ height: `${scrollPercent}%` }} />
          </div>
          <div className="rail-crosshair">✛</div>
        </div>
      </aside>
    </>
  )
}
