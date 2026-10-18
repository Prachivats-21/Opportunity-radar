import React from 'react'
import { ArrowUpRight, ShieldCheck } from 'lucide-react'
import { RadarMark } from './RadarMark'

export const AppFooter: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="footer-container">
        <div className="footer-top-row">
          <div className="footer-brand-block">
            <a className="footer-brand-link" href="#top" aria-label="Opportunity Radar, back to top">
              <RadarMark size={28} animated={false} />
              <span className="footer-wordmark">Opportunity Radar</span>
            </a>
            <p className="footer-tagline">
              Personalized discovery and explainable matching for student hackathons, internships, competitions, and fellowships.
            </p>
          </div>

          <div className="footer-disclaimer-block">
            <div className="footer-disclaimer-pill">
              <ShieldCheck size={14} style={{ color: 'var(--sage)' }} />
              <span>Independent Verification Notice</span>
            </div>
            <p className="footer-disclaimer-text">
              Records are sourced with original links and verification timestamps. Always confirm registration deadlines, eligibility criteria, and fee policies on official organizer portals before applying.
            </p>
          </div>
        </div>

        <div className="footer-bottom-row">
          <div className="footer-copy">
            © {currentYear} Opportunity Radar. Built with FastAPI, React, and local Gemma AI inference.
          </div>
          <a className="footer-back-top" href="#top">
            <span>Back to top</span>
            <ArrowUpRight size={13} />
          </a>
        </div>
      </div>
    </footer>
  )
}
