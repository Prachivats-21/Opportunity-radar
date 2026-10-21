import React, { useEffect, useState, useRef } from 'react'

export const CustomCursor: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isClicked, setIsClicked] = useState(false)
  const [hoverType, setHoverType] = useState<'card' | 'button' | 'input' | null>(null)

  // Positions
  const mousePos = useRef({ x: -100, y: -100 })
  const followerPos = useRef({ x: -100, y: -100 })
  const dotRef = useRef<HTMLDivElement>(null)
  const reticleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Only enable custom cursor if fine pointer (mouse/trackpad), not touch devices
    const isTouch = window.matchMedia('(pointer: coarse)').matches
    if (isTouch) return

    setIsVisible(true)

    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX, y: e.clientY }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`
      }

      // Check if hovering over interactive element
      const target = e.target as HTMLElement | null
      if (!target) return

      const interactive = target.closest(
        'button, a, input, select, textarea, [role="button"], .launchpad-card, .clean-opportunity-card, .spotlight-card, .urgent-item-row, .clean-profile-badge, .btn-sync-linkedin-top, .metric-summary-chip, .format-toggle-btn, .category-subfilter-btn, .account-menu-trigger'
      )

      if (interactive) {
        setIsHovered(true)
        if (interactive.classList.contains('launchpad-card') || interactive.classList.contains('clean-opportunity-card') || interactive.classList.contains('spotlight-card')) {
          setHoverType('card')
        } else if (interactive.tagName === 'INPUT' || interactive.tagName === 'SELECT' || interactive.tagName === 'TEXTAREA') {
          setHoverType('input')
        } else {
          setHoverType('button')
        }
      } else {
        setIsHovered(false)
        setHoverType(null)
      }
    }

    const handleMouseDown = () => setIsClicked(true)
    const handleMouseUp = () => setIsClicked(false)
    const handleMouseLeave = () => setIsVisible(false)
    const handleMouseEnter = () => setIsVisible(true)

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mouseleave', handleMouseLeave)
    document.addEventListener('mouseenter', handleMouseEnter)

    // Smooth follower animation loop (lerp)
    let animationId: number
    const animateFollower = () => {
      const lerpSpeed = 0.22
      followerPos.current.x += (mousePos.current.x - followerPos.current.x) * lerpSpeed
      followerPos.current.y += (mousePos.current.y - followerPos.current.y) * lerpSpeed

      if (reticleRef.current) {
        reticleRef.current.style.transform = `translate3d(${followerPos.current.x}px, ${followerPos.current.y}px, 0)`
      }

      animationId = requestAnimationFrame(animateFollower)
    }

    animationId = requestAnimationFrame(animateFollower)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('mouseenter', handleMouseEnter)
      cancelAnimationFrame(animationId)
    }
  }, [])

  if (!isVisible) return null

  return (
    <div className="radar-cursor-root" aria-hidden="true">
      {/* 1. Precision Center Dot */}
      <div
        ref={dotRef}
        className={`radar-cursor-dot ${isHovered ? 'hovered' : ''} ${isClicked ? 'clicked' : ''}`}
      />

      {/* 2. Precision Follower Reticle with Ticks and Dotted Line Borders */}
      <div
        ref={reticleRef}
        className={`radar-cursor-reticle ${isHovered ? 'hovered' : ''} ${isClicked ? 'clicked' : ''} ${hoverType ? `type-${hoverType}` : ''}`}
      >
        {/* Cardinal crosshairs */}
        <span className="reticle-tick tick-top" />
        <span className="reticle-tick tick-bottom" />
        <span className="reticle-tick tick-left" />
        <span className="reticle-tick tick-right" />

        {/* Technical Corner Brackets / Dots (Visible on touch/hover) */}
        <span className="reticle-corner corner-tl" />
        <span className="reticle-corner corner-tr" />
        <span className="reticle-corner corner-bl" />
        <span className="reticle-corner corner-br" />

        {/* Technical Sub-target Ring */}
        <span className="reticle-dashed-ring" />

        {/* Small Mode Indicator */}
        {isHovered && (
          <span className="reticle-status-tag">
            {hoverType === 'card' ? 'INSPECT' : hoverType === 'input' ? 'TYPE' : 'TOUCH'}
          </span>
        )}
      </div>
    </div>
  )
}
