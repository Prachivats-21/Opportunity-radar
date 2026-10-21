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
        {/* Background circular plate with bold highlighted indigo border */}
        <circle cx="50" cy="50" r="47" fill="#EEF2FF" stroke="#4F46E5" strokeWidth="2.6" />

        {/* Concentric distance rings - sharp and high contrast */}
        <circle cx="50" cy="50" r="35" stroke="#4F46E5" strokeWidth="1.8" strokeOpacity="0.7" />
        <circle cx="50" cy="50" r="23" stroke="#4F46E5" strokeWidth="1.8" strokeOpacity="0.8" />
        <circle cx="50" cy="50" r="11" fill="#4F46E5" fillOpacity="0.22" stroke="#4338CA" strokeWidth="2" />

        {/* Cardinal crosshairs */}
        <line x1="50" y1="5" x2="50" y2="95" stroke="#4F46E5" strokeWidth="1.4" strokeOpacity="0.5" strokeDasharray="3 3" />
        <line x1="5" y1="50" x2="95" y2="50" stroke="#4F46E5" strokeWidth="1.4" strokeOpacity="0.5" strokeDasharray="3 3" />

        {/* Radar Scanner Sweep Sector */}
        <g className="radar-sweep-arm">
          <path
            d="M50 50 L50 4 A46 46 0 0 1 82 18 Z"
            fill={`url(#${gradientId})`}
            opacity="0.75"
          />
          <line x1="50" y1="50" x2="50" y2="4" stroke="#4338CA" strokeWidth="2.2" strokeOpacity="1" />
        </g>

        {/* Signal Blips (Opportunities) - saturated and bold */}
        <circle cx="68" cy="28" r="3.8" fill="#4F46E5" />
        <circle cx="68" cy="28" r="6" stroke="#4F46E5" strokeWidth="1.5" strokeOpacity="0.6" />

        <circle cx="34" cy="62" r="3.2" fill="#D97706" stroke="#B45309" strokeWidth="0.8" />
        <circle cx="72" cy="68" r="3.2" fill="#E11D48" stroke="#BE123C" strokeWidth="0.8" />

        {/* Center Origin Node with white ring */}
        <circle cx="50" cy="50" r="4" fill="#312E81" stroke="#FFFFFF" strokeWidth="1.5" />

        {/* Gradient Definition for Sweep */}
        <defs>
          <linearGradient id={gradientId} x1="50" y1="50" x2="82" y2="18" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.02" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}
