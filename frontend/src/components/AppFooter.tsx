import React from 'react'
import { ArrowUpRight, Sparkles } from 'lucide-react'
import { RadarMark } from './RadarMark'

export const AppFooter: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="site-footer" role="contentinfo">
      <div className="footer-container">
        <div className="footer-main-row">
          <div className="footer-brand-block">
            <a className="footer-brand-link" href="#top" aria-label="Opportunity Radar, back to top">
              <RadarMark size={28} animated={false} />
              <span className="footer-wordmark">Opportunity Radar</span>
            </a>
            <span className="footer-subtext">Merit-first student opportunity discovery</span>
          </div>

          <div className="footer-links-group">
            <a className="footer-nav-link" href="#top">Overview</a>
            <a className="footer-nav-link" href="#portals-section">Portals</a>
            <a className="footer-nav-link" href="#spotlight-signals-section">Top Signals</a>
            <a className="footer-back-top" href="#top">
              <span>Back to top</span>
              <ArrowUpRight size={13} />
            </a>
          </div>
        </div>

        <div className="footer-bottom-row">
          <div className="footer-copy">
            © {currentYear} Opportunity Radar · Built for ambitious students
          </div>
          <div className="footer-badge-pill">
            <Sparkles size={12} />
            <span>100% Free · Open to All Academic Years</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
