import React from 'react'
import { ArrowUpRight } from 'lucide-react'
import { RadarMark } from './RadarMark'

export const AppFooter: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="footer-container">
        <div className="footer-top-row">
          <div className="footer-brand-section">
            <a className="footer-brand-link" href="#top" aria-label="Opportunity Radar, back to top">
              <RadarMark size={24} animated={false} />
              <span className="footer-wordmark">Opportunity Radar</span>
            </a>
            <p className="footer-tagline">
              A merit-first intelligence radar discovering verified student hackathons, internships, competitions, and fellowships.
            </p>
          </div>

          <div className="footer-nav-section">
            <a className="footer-nav-link" href="#top">Overview</a>
            <a className="footer-nav-link" href="#portals-section">Portals</a>
            <a className="footer-nav-link" href="#curated-signals-section">Recommended</a>
            <a className="footer-back-top" href="#top">
              <span>Back to top</span>
              <ArrowUpRight size={13} />
            </a>
          </div>
        </div>

        {/* Integrated Verification Disclaimer (natural text, not a floating box) */}
        <div className="footer-disclaimer-row">
          <p className="footer-disclaimer-text">
            <strong>Independent Verification Notice:</strong> Records are sourced directly with original links and verification timestamps. Always confirm registration deadlines, fee policies, and eligibility criteria on official organizer portals before applying.
          </p>
        </div>

        <div className="footer-bottom-row">
          <div className="footer-copy">
            © {currentYear} Opportunity Radar · Built for students with FastAPI, React & Gemma AI
          </div>
          <div className="footer-meta-pill">
            <span>Free & Open to All Academic Years</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
