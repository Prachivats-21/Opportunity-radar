import React from 'react'
import { ArrowUpRight } from 'lucide-react'
import { RadarMark } from './RadarMark'

export const AppFooter: React.FC = () => (
  <footer className="app-footer">
    <a className="footer-brand" href="#top" aria-label="Opportunity Radar, back to top">
      <RadarMark size={34} animated={false} />
      <span className="footer-brand-copy">
        <strong>Opportunity Radar</strong>
        <span>Find the signal in your next step.</span>
      </span>
    </a>
    <div className="footer-meta">
      <span>Student opportunities, thoughtfully gathered.</span>
      <a className="footer-top-link" href="#top">
        Back to top <ArrowUpRight size={13} />
      </a>
    </div>
  </footer>
)
