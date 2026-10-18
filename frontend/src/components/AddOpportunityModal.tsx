import React, { useState } from 'react'
import {
  X,
  Sparkles,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  Edit3,
  CheckCircle2,
  Terminal,
  HelpCircle,
  Plus
} from 'lucide-react'
import { extractOpportunity } from '../api'
import type { Opportunity } from '../types'

interface AddOpportunityModalProps {
  onSuccess: (newOpp: Opportunity) => void
  onClose: () => void
}

type Step = 'input' | 'review'

export const AddOpportunityModal: React.FC<AddOpportunityModalProps> = ({
  onSuccess,
  onClose,
}) => {
  const [step, setStep] = useState<Step>('input')

  // Step 1 Input State
  const [titleHint, setTitleHint] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [rawText, setRawText] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [aiUnavailable, setAiUnavailable] = useState(false)
  const [extractError, setExtractError] = useState('')
  const [aiWarnings, setAiWarnings] = useState<string[]>([])

  // Step 2 Review Form State (Pre-filled after extraction or manual switch)
  const [reviewData, setReviewData] = useState<Partial<Opportunity>>({
    title: '',
    organization: '',
    category: 'Hackathon',
    summary: '',
    description: '',
    skills: [],
    eligible_years: [],
    eligible_fields: [],
    location: 'India',
    mode: 'Online',
    team_min: null,
    team_max: null,
    deadline: '',
    source_url: '',
    source_name: 'Community curator',
    status: 'community_extracted',
    notes: '',
  })

  const [skillInput, setSkillInput] = useState('')

  // Handle extraction via local Gemma / FastAPI backend
  const handleExtractWithGemma = async (e: React.FormEvent) => {
    e.preventDefault()
    setExtracting(true)
    setExtractError('')
    setAiUnavailable(false)
    setAiWarnings([])

    try {
      const response = await extractOpportunity({
        title_hint: titleHint,
        source_url: sourceUrl,
        raw_text: rawText,
      })

      // Successfully extracted with local model
      setReviewData({
        ...response.opportunity,
        status: 'community_extracted',
        notes: response.opportunity.notes || 'Extracted via local Gemma; pending independent manual check.',
      })
      setAiWarnings(response.warnings || [])
      setStep('review')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'AI extraction service failed.'
      setExtractError(msg)
      // Check if it's an Ollama reachability failure
      if (
        msg.includes('503') ||
        msg.includes('Ollama') ||
        msg.includes('unavailable') ||
        msg.includes('ConnectError')
      ) {
        setAiUnavailable(true)
      }
    } finally {
      setExtracting(false)
    }
  }

  // Switch to manual review mode if Ollama is not installed/running
  const handleSwitchToManualReview = () => {
    setReviewData({
      id: `user-added-curator-${Date.now()}`,
      title: titleHint || 'New Opportunity',
      organization: 'Organizer',
      category: 'Hackathon',
      summary: rawText.slice(0, 160) + (rawText.length > 160 ? '...' : ''),
      description: rawText,
      skills: ['Problem Solving'],
      eligible_years: [],
      eligible_fields: [],
      location: 'India',
      mode: 'Online',
      team_min: 1,
      team_max: 4,
      deadline: '',
      source_url: sourceUrl,
      source_name: 'Curator submission',
      last_verified: new Date().toISOString().split('T')[0],
      status: 'community_extracted',
      notes: 'Manually curated listing. Fees and eligibility must be verified on source portal.',
    })
    setStep('review')
  }

  // Handle Skill Tag addition in review screen
  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = skillInput.trim()
    if (!clean) return
    const current = reviewData.skills || []
    if (!current.includes(clean)) {
      setReviewData({ ...reviewData, skills: [...current, clean] })
    }
    setSkillInput('')
  }

  const handleRemoveSkill = (skillToRemove: string) => {
    setReviewData({
      ...reviewData,
      skills: (reviewData.skills || []).filter((s) => s !== skillToRemove),
    })
  }

  // Final Confirmation & Submission
  const handleConfirmSubmission = (e: React.FormEvent) => {
    e.preventDefault()

    const finalOpp: Opportunity = {
      id: reviewData.id || `user-added-curator-${Date.now()}`,
      title: reviewData.title?.trim() || 'Untitled Opportunity',
      organization: reviewData.organization?.trim() || 'Independent Organizer',
      category: reviewData.category || 'Hackathon',
      summary: reviewData.summary?.trim() || reviewData.title || '',
      description: reviewData.description?.trim() || '',
      skills: reviewData.skills || [],
      eligible_years: reviewData.eligible_years || [],
      eligible_fields: reviewData.eligible_fields || [],
      location: reviewData.location || 'India',
      mode: reviewData.mode || 'Online',
      team_min: reviewData.team_min ? Number(reviewData.team_min) : null,
      team_max: reviewData.team_max ? Number(reviewData.team_max) : null,
      deadline: reviewData.deadline ? String(reviewData.deadline) : null,
      start_date: reviewData.start_date ? String(reviewData.start_date) : null,
      source_url: reviewData.source_url || sourceUrl,
      source_name: reviewData.source_name || 'Community curator',
      last_verified: new Date().toISOString().split('T')[0],
      status: 'community_extracted',
      notes: reviewData.notes || 'Curator submission; independent verification recommended.',
    }

    onSuccess(finalOpp)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={() => !extracting && onClose()}>
      <div
        className="modal-dialog curator-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Add and verify opportunity"
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <div className="curator-kicker">
              <Sparkles size={13} style={{ color: 'var(--sage)' }} />
              <span>COMMUNITY CURATION PIPELINE</span>
            </div>
            <h3>
              {step === 'input'
                ? 'Submit Opportunity for AI Extraction'
                : 'Review & Confirm Extracted Listing'}
            </h3>
            <p>
              {step === 'input'
                ? 'Paste an announcement, circular, or guidelines. Local Gemma extracts structured parameters.'
                : 'Review all extracted fields before publishing to the live student radar feed.'}
            </p>
          </div>
          <button
            className="close-btn"
            onClick={() => !extracting && onClose()}
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* =========================================================================
            STEP 1: INPUT SCREEN
           ========================================================================= */}
        {step === 'input' && (
          <form onSubmit={handleExtractWithGemma}>
            <div className="form-group">
              <label htmlFor="curator-title-hint">Opportunity Title Hint (Optional)</label>
              <input
                id="curator-title-hint"
                type="text"
                value={titleHint}
                onChange={(e) => setTitleHint(e.target.value)}
                placeholder="e.g. National Hackathon 2026 or University AI Fellowship"
              />
            </div>

            <div className="form-group">
              <label htmlFor="curator-source-url">
                Official Source URL <span style={{ color: 'var(--terracotta)' }}>*</span>
              </label>
              <input
                id="curator-source-url"
                type="url"
                required
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://official-event-page.example.org"
              />
              <small className="field-hint">
                Must be an active, verifiable official organizer webpage or guidelines page.
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="curator-raw-text">
                Announcement or Guidelines Text <span style={{ color: 'var(--terracotta)' }}>*</span>
              </label>
              <textarea
                id="curator-raw-text"
                required
                minLength={80}
                rows={6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste the eligibility conditions, deadlines, tracks, team sizes, and description copied from the source page..."
              />
              <small className="field-hint">
                Minimum 80 characters. Unstructured text is parsed locally without third-party cloud leaks.
              </small>
            </div>

            {/* Offline Ollama Guidance Card */}
            {aiUnavailable && (
              <div className="ai-setup-card">
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Terminal size={18} style={{ color: 'var(--terracotta)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Local Gemma Service is Offline</strong>
                    <p style={{ margin: '4px 0 8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      The backend was unable to reach Ollama at <code>http://127.0.0.1:11434</code>. To use
                      local AI extraction on your Mac:
                    </p>
                    <pre className="code-instruction-box">
                      ollama pull gemma3:1b{'\n'}ollama run gemma3:1b
                    </pre>
                    <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      You don't need to wait: switch to manual review mode now to input and publish this listing.
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ fontSize: '11px', padding: '6px 12px' }}
                    onClick={handleSwitchToManualReview}
                  >
                    <Edit3 size={13} />
                    <span>Continue in Manual Curator Mode</span>
                  </button>
                </div>
              </div>
            )}

            {extractError && !aiUnavailable && (
              <div className="error-banner">
                <AlertCircle size={15} />
                <span>{extractError}</span>
              </div>
            )}

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
                disabled={extracting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={handleSwitchToManualReview}
                disabled={extracting}
                title="Skip model inference and enter structured data directly"
              >
                <Edit3 size={14} />
                <span>Manual Entry</span>
              </button>

              <button
                type="submit"
                className="btn-primary"
                disabled={extracting || !rawText.trim() || !sourceUrl.trim()}
              >
                {extracting ? (
                  <>
                    <span className="spinner-sage" style={{ width: 14, height: 14, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.4)' }} />
                    <span>Extracting with Local Gemma...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Extract with Local Gemma</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* =========================================================================
            STEP 2: REVIEW & VERIFICATION SCREEN
           ========================================================================= */}
        {step === 'review' && (
          <form onSubmit={handleConfirmSubmission}>
            {/* Verification Disclaimer Callout */}
            <div className="curator-verification-notice">
              <ShieldAlert size={16} style={{ color: 'var(--sage-dark)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Independent Verification Required</strong>
                <p>
                  Model extraction does not verify truthfulness. You are acting as the curator. Confirm that
                  the deadline, fees, and requirements reflect the official guidelines.
                </p>
              </div>
            </div>

            {aiWarnings.length > 0 && (
              <div className="ai-warning-box">
                {aiWarnings.map((w, idx) => (
                  <div key={idx}>⚠️ {w}</div>
                ))}
              </div>
            )}

            {/* Editable Fields Grid */}
            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="review-title">Opportunity Title</label>
                <input
                  id="review-title"
                  type="text"
                  required
                  value={reviewData.title || ''}
                  onChange={(e) => setReviewData({ ...reviewData, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="review-org">Organizer / Organization</label>
                <input
                  id="review-org"
                  type="text"
                  required
                  value={reviewData.organization || ''}
                  onChange={(e) => setReviewData({ ...reviewData, organization: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="review-category">Category Track</label>
                <select
                  id="review-category"
                  value={reviewData.category || 'Hackathon'}
                  onChange={(e) => setReviewData({ ...reviewData, category: e.target.value as any })}
                >
                  <option value="Hackathon">Hackathon</option>
                  <option value="Internship">Internship</option>
                  <option value="Competition">Competition</option>
                  <option value="Fellowship">Fellowship</option>
                  <option value="Scholarship">Scholarship</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="review-deadline">Application Deadline (YYYY-MM-DD)</label>
                <input
                  id="review-deadline"
                  type="date"
                  value={reviewData.deadline || ''}
                  onChange={(e) => setReviewData({ ...reviewData, deadline: e.target.value })}
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="review-mode">Participation Format</label>
                <select
                  id="review-mode"
                  value={reviewData.mode || 'Online'}
                  onChange={(e) => setReviewData({ ...reviewData, mode: e.target.value })}
                >
                  <option value="Online">Online / Remote</option>
                  <option value="On-site">On-site</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Confirm with organizer">Confirm with organizer</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="review-location">Location / Region</label>
                <input
                  id="review-location"
                  type="text"
                  value={reviewData.location || 'India'}
                  onChange={(e) => setReviewData({ ...reviewData, location: e.target.value })}
                />
              </div>
            </div>

            {/* Team Size */}
            <div className="form-row-2">
              <div className="form-group">
                <label htmlFor="review-team-min">Team Min (leave blank for individual)</label>
                <input
                  id="review-team-min"
                  type="number"
                  min="1"
                  max="50"
                  value={reviewData.team_min || ''}
                  onChange={(e) =>
                    setReviewData({
                      ...reviewData,
                      team_min: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="review-team-max">Team Max</label>
                <input
                  id="review-team-max"
                  type="number"
                  min="1"
                  max="50"
                  value={reviewData.team_max || ''}
                  onChange={(e) =>
                    setReviewData({
                      ...reviewData,
                      team_max: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                />
              </div>
            </div>

            {/* Summary */}
            <div className="form-group">
              <label htmlFor="review-summary">Scannable Summary</label>
              <textarea
                id="review-summary"
                rows={2}
                required
                value={reviewData.summary || ''}
                onChange={(e) => setReviewData({ ...reviewData, summary: e.target.value })}
              />
            </div>

            {/* Skills Tags */}
            <div className="form-group">
              <label>Relevant Skills & Tech Stack</label>
              <div className="chips-container">
                {(reviewData.skills || []).map((skill) => (
                  <span key={skill} className="interactive-chip">
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      aria-label={`Remove skill ${skill}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <div style={{ display: 'flex', flex: 1, minWidth: 140 }}>
                  <input
                    type="text"
                    className="chip-input-inline"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddSkill(e)
                      }
                    }}
                    placeholder="Add skill tag & press Enter..."
                  />
                  {skillInput.trim() && (
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      style={{ color: 'var(--sage)', padding: '0 4px' }}
                      aria-label="Add skill"
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Fee & Verification Notes */}
            <div className="form-group">
              <label htmlFor="review-notes">Fee, Stipend & Eligibility Notes</label>
              <input
                id="review-notes"
                type="text"
                value={reviewData.notes || ''}
                onChange={(e) => setReviewData({ ...reviewData, notes: e.target.value })}
                placeholder="e.g. Free registration; institute recommendation letter required."
              />
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setStep('input')}
              >
                Back to Input
              </button>

              <button type="submit" className="btn-primary">
                <CheckCircle2 size={14} />
                <span>Confirm & Publish to Radar</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
