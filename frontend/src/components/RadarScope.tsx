import React, { useState, useMemo } from 'react'
import { Sparkles, Compass, ShieldCheck, Clock, Zap } from 'lucide-react'
import type { Opportunity, MatchResult } from '../types'

interface RadarScopeProps {
  opportunities: Opportunity[]
  matchMap: Map<string, MatchResult>
  onSelectOpportunity: (opportunity: Opportunity) => void
  activeCategory: string
  onSelectCategory: (category: string) => void
}

interface BlipPoint {
  id: string
  opportunity: Opportunity
  match?: MatchResult
  x: number
  y: number
  distance: number // radius in pixels
  angle: number // angle in degrees
  daysLeft: number
  tier: 'urgent' | 'eligible' | 'top' | 'general'
}

export const RadarScope: React.FC<RadarScopeProps> = ({
  opportunities,
  matchMap,
  onSelectOpportunity,
  activeCategory,
  onSelectCategory,
}) => {
  const [hoveredBlip, setHoveredBlip] = useState<BlipPoint | null>(null)

  // Radar Scope Dimensions
  const SIZE = 360
  const CENTER = SIZE / 2
  const MAX_RADIUS = 150

  // Calculate blips based on opportunities
  const blips = useMemo<BlipPoint[]>(() => {
    const now = Date.now()
    const filtered = activeCategory === 'All'
      ? opportunities
      : opportunities.filter((o) => o.category === activeCategory)

    return filtered.slice(0, 18).map((opp, index) => {
      const match = matchMap.get(opp.id)
      const score = match?.score || 50

      // Calculate days to deadline
      let daysLeft = 30
      if (opp.deadline) {
        const diff = Math.ceil(
          (new Date(`${opp.deadline}T23:59:59`).getTime() - now) / (1000 * 60 * 60 * 24),
        )
        daysLeft = Math.max(1, Math.min(60, diff))
      }

      // Radius determined by urgency (closer to center = closing sooner!)
      // Distance from center: 30px (closing today) to 140px (closing in 60 days)
      const distance = 35 + (daysLeft / 60) * (MAX_RADIUS - 35)

      // Angle distributed around 360 degrees based on score and index
      // High score at top/right quadrants
      const angle = (index * (360 / Math.max(1, filtered.length)) + score * 1.5) % 360
      const rad = (angle * Math.PI) / 180

      const x = CENTER + distance * Math.cos(rad)
      const y = CENTER + distance * Math.sin(rad)

      let tier: BlipPoint['tier'] = 'general'
      if (score >= 75) tier = 'top'
      else if (daysLeft <= 14) tier = 'urgent'
      else if (match?.eligibility === 'eligible') tier = 'eligible'

      return {
        id: opp.id,
        opportunity: opp,
        match,
        x,
        y,
        distance,
        angle,
        daysLeft,
        tier,
      }
    })
  }, [opportunities, matchMap, activeCategory])

  return (
    <div className="radar-scope-wrapper">
      {/* Radar Scope Header Controls */}
      <div className="radar-scope-header">
        <div className="radar-status-badge">
          <span className="pulsing-blip-dot" />
          <span>TACTILE RADAR SCOPE · {blips.length} SIGNALS IN RANGE</span>
        </div>

        <div className="radar-category-chips">
          {['All', 'Hackathon', 'Internship', 'Competition', 'Fellowship'].map((cat) => (
            <button
              key={cat}
              type="button"
              className={`radar-track-chip ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => onSelectCategory(cat)}
            >
              {cat === 'All' ? 'All Signals' : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="radar-screen-container">
        {/* SVG Interactive Radar Scope */}
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="radar-svg-canvas"
          role="img"
          aria-label="Digital radar scope tracking student opportunities"
        >
          <defs>
            {/* Radar Sweep Gradient */}
            <radialGradient id="radarSweepGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(45, 106, 80, 0.25)" />
              <stop offset="70%" stopColor="rgba(45, 106, 80, 0.08)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>

            {/* Sweep Beam Mask */}
            <linearGradient id="sweepBeam" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(45, 106, 80, 0)" />
              <stop offset="90%" stopColor="rgba(45, 106, 80, 0.2)" />
              <stop offset="100%" stopColor="rgba(45, 106, 80, 0.7)" />
            </linearGradient>
          </defs>

          {/* Background Grid Circles */}
          <circle cx={CENTER} cy={CENTER} r={MAX_RADIUS} className="radar-ring outer" />
          <circle cx={CENTER} cy={CENTER} r={MAX_RADIUS * 0.75} className="radar-ring" />
          <circle cx={CENTER} cy={CENTER} r={MAX_RADIUS * 0.5} className="radar-ring" />
          <circle cx={CENTER} cy={CENTER} r={MAX_RADIUS * 0.25} className="radar-ring inner" />

          {/* Crosshairs & Angle Rays */}
          <line x1={CENTER - MAX_RADIUS} y1={CENTER} x2={CENTER + MAX_RADIUS} y2={CENTER} className="radar-axis" />
          <line x1={CENTER} y1={CENTER - MAX_RADIUS} x2={CENTER} y2={CENTER + MAX_RADIUS} className="radar-axis" />
          <line
            x1={CENTER - MAX_RADIUS * 0.7}
            y1={CENTER - MAX_RADIUS * 0.7}
            x2={CENTER + MAX_RADIUS * 0.7}
            y2={CENTER + MAX_RADIUS * 0.7}
            className="radar-axis diagonal"
          />
          <line
            x1={CENTER - MAX_RADIUS * 0.7}
            y1={CENTER + MAX_RADIUS * 0.7}
            x2={CENTER + MAX_RADIUS * 0.7}
            y2={CENTER - MAX_RADIUS * 0.7}
            className="radar-axis diagonal"
          />

          {/* Distance / Urgency Labels */}
          <text x={CENTER + 8} y={CENTER - MAX_RADIUS * 0.25 + 4} className="radar-ring-label">≤7d</text>
          <text x={CENTER + 8} y={CENTER - MAX_RADIUS * 0.5 + 4} className="radar-ring-label">14d</text>
          <text x={CENTER + 8} y={CENTER - MAX_RADIUS * 0.75 + 4} className="radar-ring-label">30d</text>
          <text x={CENTER + 8} y={CENTER - MAX_RADIUS + 4} className="radar-ring-label">60d</text>

          {/* Rotating Sweep Beam */}
          <g className="radar-sweep-beam-group">
            <line
              x1={CENTER}
              y1={CENTER}
              x2={CENTER}
              y2={CENTER - MAX_RADIUS}
              className="radar-scanner-line"
            />
            <path
              d={`M ${CENTER} ${CENTER} L ${CENTER} ${CENTER - MAX_RADIUS} A ${MAX_RADIUS} ${MAX_RADIUS} 0 0 1 ${CENTER + MAX_RADIUS * 0.5} ${CENTER - MAX_RADIUS * 0.866} Z`}
              fill="url(#radarSweepGradient)"
              className="radar-sweep-cone"
            />
          </g>

          {/* Center Origin Mark */}
          <circle cx={CENTER} cy={CENTER} r={4} className="radar-center-dot" />

          {/* Opportunity Blips */}
          {blips.map((blip) => {
            const isHovered = hoveredBlip?.id === blip.id
            return (
              <g
                key={blip.id}
                className={`radar-blip-group ${blip.tier} ${isHovered ? 'hovered' : ''}`}
                transform={`translate(${blip.x}, ${blip.y})`}
                onMouseEnter={() => setHoveredBlip(blip)}
                onMouseLeave={() => setHoveredBlip(null)}
                onClick={() => onSelectOpportunity(blip.opportunity)}
                role="button"
                tabIndex={0}
              >
                {/* Pulsing ring on hover/top items */}
                {(isHovered || blip.tier === 'top') && (
                  <circle r={12} className="blip-pulse-wave" />
                )}
                {/* Blip Dot */}
                <circle r={isHovered ? 7 : 5} className="blip-core-dot" />
              </g>
            )
          })}
        </svg>

        {/* Hover Information Tooltip Card */}
        {hoveredBlip && (
          <div
            className="radar-interactive-tooltip"
            style={{
              left: `${Math.min(SIZE - 180, Math.max(10, hoveredBlip.x - 80))}px`,
              top: `${Math.min(SIZE - 100, Math.max(10, hoveredBlip.y - 80))}px`,
            }}
          >
            <div className="tooltip-top-row">
              <span className="tooltip-category">{hoveredBlip.opportunity.category}</span>
              {hoveredBlip.match && (
                <span className="tooltip-score">
                  <Sparkles size={10} /> {hoveredBlip.match.score}% fit
                </span>
              )}
            </div>
            <strong className="tooltip-title">{hoveredBlip.opportunity.title}</strong>
            <span className="tooltip-org">{hoveredBlip.opportunity.organization}</span>
            <div className="tooltip-footer">
              <span className="tooltip-days">
                <Clock size={10} /> {hoveredBlip.daysLeft}d left
              </span>
              <span className="tooltip-click-hint">Click to inspect →</span>
            </div>
          </div>
        )}
      </div>

      {/* Radar Legend */}
      <div className="radar-legend-bar">
        <div className="legend-item">
          <span className="legend-dot top" />
          <span>Top AI Fit (≥75%)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot urgent" />
          <span>Closing Soon (≤14d)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot eligible" />
          <span>Eligible for Year</span>
        </div>
        <div className="legend-item hint">
          <Compass size={12} />
          <span>Center = Approaching deadline</span>
        </div>
      </div>
    </div>
  )
}
