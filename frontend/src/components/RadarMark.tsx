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
        <circle cx="50" cy="50" r="48" fill="#F4F8F5" stroke="#D1E2D6" strokeWidth="1.5" />

        {/* Concentric distance rings */}
        <circle cx="50" cy="50" r="35" stroke="#2F5D4D" strokeWidth="1" strokeOpacity="0.22" />
        <circle cx="50" cy="50" r="22" stroke="#2F5D4D" strokeWidth="1" strokeOpacity="0.32" />
        <circle cx="50" cy="50" r="9" fill="#2F5D4D" fillOpacity="0.12" stroke="#2F5D4D" strokeWidth="1.2" />

        {/* Cardinal crosshairs */}
        <line x1="50" y1="6" x2="50" y2="94" stroke="#2F5D4D" strokeWidth="0.8" strokeOpacity="0.18" strokeDasharray="2 3" />
        <line x1="6" y1="50" x2="94" y2="50" stroke="#2F5D4D" strokeWidth="0.8" strokeOpacity="0.18" strokeDasharray="2 3" />

        {/* Radar Scanner Sweep Sector */}
        <g className="radar-sweep-arm">
          <path
            d="M50 50 L50 4 A46 46 0 0 1 82 18 Z"
            fill={`url(#${gradientId})`}
            opacity="0.55"
          />
          <line x1="50" y1="50" x2="50" y2="4" stroke="#2F5D4D" strokeWidth="1.5" strokeOpacity="0.8" />
        </g>

        {/* Signal Blips (Opportunities) */}
        <circle cx="68" cy="28" r="3" fill="#2F5D4D" />
        <circle cx="68" cy="28" r="5" stroke="#2F5D4D" strokeWidth="1" strokeOpacity="0.4" />

        <circle cx="34" cy="62" r="2.5" fill="#C85A32" />
        <circle cx="72" cy="68" r="2.5" fill="#3A6D88" />

        {/* Center Origin Node */}
        <circle cx="50" cy="50" r="3" fill="#2F5D4D" />

        {/* Gradient Definition for Sweep */}
        <defs>
          <linearGradient id={gradientId} x1="50" y1="50" x2="82" y2="18" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2F5D4D" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#2F5D4D" stopOpacity="0.02" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}
