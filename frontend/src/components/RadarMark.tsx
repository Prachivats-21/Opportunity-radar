import React, { useId } from 'react'

interface RadarMarkProps {
  size?: number
  className?: string
  animated?: boolean
}

export const RadarMark: React.FC<RadarMarkProps> = ({
  size = 28,
  className = '',
  animated = true,
}) => {
  const gradientId = `radar-sweep-${useId().replace(/:/g, '')}`

  return (
    <div
      className={`radar-brand-mark ${animated ? 'sweep-animated' : ''} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Background circular plate */}
        <circle cx="50" cy="50" r="48" fill="rgba(139, 92, 246, 0.08)" stroke="rgba(139, 92, 246, 0.28)" strokeWidth="1.5" />

        {/* Concentric distance rings */}
        <circle cx="50" cy="50" r="35" stroke="#8B5CF6" strokeWidth="1" strokeOpacity="0.28" />
        <circle cx="50" cy="50" r="22" stroke="#8B5CF6" strokeWidth="1" strokeOpacity="0.38" />
        <circle cx="50" cy="50" r="9" fill="#8B5CF6" fillOpacity="0.2" stroke="#8B5CF6" strokeWidth="1.2" />

        {/* Cardinal crosshairs */}
        <line x1="50" y1="6" x2="50" y2="94" stroke="#8B5CF6" strokeWidth="0.8" strokeOpacity="0.25" strokeDasharray="2 3" />
        <line x1="6" y1="50" x2="94" y2="50" stroke="#8B5CF6" strokeWidth="0.8" strokeOpacity="0.25" strokeDasharray="2 3" />

        {/* Radar Scanner Sweep Sector */}
        <g className="radar-sweep-arm">
          <path
            d="M50 50 L50 4 A46 46 0 0 1 82 18 Z"
            fill={`url(#${gradientId})`}
            opacity="0.6"
          />
          <line x1="50" y1="50" x2="50" y2="4" stroke="#A78BFA" strokeWidth="1.5" strokeOpacity="0.85" />
        </g>

        {/* Signal Blips (Opportunities) */}
        <circle cx="68" cy="28" r="3" fill="#A78BFA" />
        <circle cx="68" cy="28" r="5" stroke="#A78BFA" strokeWidth="1" strokeOpacity="0.5" />

        <circle cx="34" cy="62" r="2.5" fill="#F59E0B" />
        <circle cx="72" cy="68" r="2.5" fill="#F43F5E" />

        {/* Center Origin Node */}
        <circle cx="50" cy="50" r="3" fill="#8B5CF6" />

        {/* Gradient Definition for Sweep */}
        <defs>
          <linearGradient id={gradientId} x1="50" y1="50" x2="82" y2="18" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.02" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}
