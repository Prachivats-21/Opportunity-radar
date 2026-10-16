import { useEffect, useMemo, useState, useCallback } from 'react'
import { Navbar } from './components/Navbar'
import { Sidebar } from './components/Sidebar'
import { AppFooter } from './components/AppFooter'
import { WelcomeHero } from './components/WelcomeHero'
import { CategoryExplore } from './components/CategoryExplore'
import { FiltersBar } from './components/FiltersBar'
import { OpportunityCard } from './components/OpportunityCard'
import { RightPanel } from './components/RightPanel'
import { ProfileModal } from './components/ProfileModal'
import { AddOpportunityModal } from './components/AddOpportunityModal'
import { AdvancedFilterDrawer } from './components/AdvancedFilterDrawer'
import { getOpportunities, getMatches } from './api'
import type { Opportunity, Profile, MatchResult, FilterState } from './types'
import { AlertCircle, Search, Check, RefreshCw } from 'lucide-react'

const DEFAULT_PROFILE: Profile = {
  name: 'Prachi Vats',
  year: '1',
  field: 'Computer Science & AI',
  skills: ['Python', 'AI', 'Cybersecurity', 'Communication'],
  interests: ['AI', 'Cybersecurity', 'Hackathons', 'Data Science'],
  preferred_categories: ['Hackathon', 'Internship', 'Competition'],
  preferred_mode: 'Any',
  location: 'India',
  team_size: null,
}

const INITIAL_FILTERS: FilterState = {
  category: 'All',
  searchQuery: '',
  quickClosingSoon: false,
  quickRemote: false,
  quickEligibleForMe: false,
  quickFreeToEnter: false,
  mode: 'All',
  deadlinePreset: 'All',
  deadlineFrom: '',
  deadlineTo: '',
  location: 'All',
  eligibility: 'All',
  selectedSkills: [],
  freeProgramsOnly: false,
  sortBy: 'Best match',
}

const SEED_FALLBACKS: Opportunity[] = [
  {
    id: 'cyber-hackathon-bihar-2026',
    title: 'Cyber Hackathon 2026',
    organization: 'Government of Bihar Cyber Hackathon',
    category: 'Hackathon',
    summary: 'A student-focused cyber defence challenge with tracks including AI for cyber defence, digital forensics, threat intelligence, secure infrastructure, and open-source intelligence.',
    description: 'The official guidelines state that registration and development run from 12 October through 26 October 2026. The listed team requirement is three to four students. Review official guidelines.',
    skills: ['cybersecurity', 'AI', 'Python', 'digital forensics', 'open-source intelligence'],
    eligible_years: [],
    eligible_fields: [],
    location: 'India',
    mode: 'Online',
    team_min: 3,
    team_max: 4,
    deadline: '2026-10-26',
    start_date: null,
    source_url: 'https://cyberhackathon.bihar.gov.in/guidelines',
    source_name: 'Official guidelines',
    last_verified: '2026-10-15',
    status: 'needs_recheck',
    notes: 'Verify current registration status.',
  },
  {
    id: 'nhai-winter-internship-2026',
    title: 'NHAI Winter Internship Programme 2026–27',
    organization: 'National Highways Authority of India',
    category: 'Internship',
    summary: 'A one-month winter internship programme connected to ongoing National Highway projects, scheduled from December 2026 into January 2027.',
    description: 'The Press Information Bureau announced that applications are due by 20 October 2026 and that institute verification and recommendation are required.',
    skills: ['research', 'engineering', 'data analysis', 'project work'],
    eligible_years: [],
    eligible_fields: [],
    location: 'India',
    mode: 'On-site / project-based',
    team_min: null,
    team_max: null,
    deadline: '2026-10-20',
    start_date: '2026-12-01',
    source_url: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2299419&lang=1&reg=3',
    source_name: 'Press Information Bureau announcement',
    last_verified: '2026-10-15',
    status: 'needs_recheck',
    notes: 'Institute recommendation required.',
  },
  {
    id: 'saarthi-26',
    title: 'SAARTHI-26 Student Hackathon',
    organization: 'Graphic Era Hill University',
    category: 'Hackathon',
    summary: 'A student-run hackathon scheduled for 31 October to 2 November 2026, with tracks including AI, healthcare, and smart cities.',
    description: 'The official event site lists the event dates and directs applicants to an application page. Team sizes from 2 to 4 participants.',
    skills: ['AI', 'software development', 'problem solving', 'teamwork'],
    eligible_years: [],
    eligible_fields: [],
    location: 'Dehradun, India',
    mode: 'Confirm with organizer',
    team_min: null,
    team_max: null,
    deadline: '2026-10-31',
    start_date: '2026-10-31',
    source_url: 'https://saarthi.gehu.ac.in/',
    source_name: 'Official event website',
    last_verified: '2026-10-15',
    status: 'needs_recheck',
    notes: 'Confirm registration closing date on official portal.',
  },
  {
    id: 'national-student-innovation-challenge-2026',
    title: 'National Student Innovation Competition 2026',
    organization: 'Innovation & Entrepreneurship Cell',
    category: 'Competition',
    summary: 'A national problem-solving challenge inviting undergraduate student teams to submit technological prototypes addressing sustainable development goals.',
    description: 'Submissions open across robotics, clean energy, and accessible software tracks. Shortlisted finalists receive incubation access.',
    skills: ['prototyping', 'Python', 'hardware', 'product design'],
    eligible_years: ['1', '2', '3', '4'],
    eligible_fields: [],
    location: 'India',
    mode: 'Online submission, Finalists on-site',
    team_min: 2,
    team_max: 5,
    deadline: '2026-11-15',
    start_date: '2026-11-25',
    source_url: 'https://example.org/innovation-challenge',
    source_name: 'National Innovation Portal',
    last_verified: '2026-10-15',
    status: 'verified',
    notes: 'Prototype submission via GitHub or video demo.',
  },
  {
    id: 'open-web-fellowship-2026',
    title: 'Open Web Undergraduate Fellowship 2026',
    organization: 'Open Source Community Initiative',
    category: 'Fellowship',
    summary: 'A 10-week summer research fellowship connecting undergraduate developers with open-source maintainers, featuring dedicated mentorship and stipend support.',
    description: 'Selected fellows work on core infrastructure tools with full remote flexibility and weekly project review check-ins.',
    skills: ['open source', 'Python', 'documentation', 'Git'],
    eligible_years: ['1', '2', '3'],
    eligible_fields: ['Computer Science', 'Information Technology'],
    location: 'Global / Remote',
    mode: 'Online',
    team_min: null,
    team_max: null,
    deadline: '2026-11-30',
    start_date: '2027-01-10',
    source_url: 'https://example.org/fellowship',
    source_name: 'Fellowship Directory',
    last_verified: '2026-10-15',
    status: 'verified',
    notes: 'Proposals reviewed on a rolling basis.',
  },
]

export function App() {
  // 1. Persistence & Data State
  const [opportunities, setOpportunities] = useState<Opportunity[]>(() => {
    try {
      const custom = JSON.parse(window.localStorage.getItem('opportunity-radar-custom') || '[]') as Opportunity[]
      return [...SEED_FALLBACKS, ...custom]
    } catch {
      return SEED_FALLBACKS
    }
  })

  const [profile, setProfile] = useState<Profile>(() => {
    try {
      const stored = window.localStorage.getItem('opportunity-radar-profile')
      return stored ? { ...DEFAULT_PROFILE, ...JSON.parse(stored) } : DEFAULT_PROFILE
    } catch {
      return DEFAULT_PROFILE
    }
  })

  const [saved, setSaved] = useState<string[]>(() => {
    try {
      return JSON.parse(window.localStorage.getItem('opportunity-radar-saved') || '[]') as string[]
    } catch {
      return []
    }
  })

  const [matches, setMatches] = useState<MatchResult[]>([])
  const [activeTab, setActiveTab] = useState('Dashboard')

  // Unified Filter State
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS)

  // Modals & Navigation Drawers
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showAdvancedDrawer, setShowAdvancedDrawer] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Status & Feedback
  const [loadingMatches, setLoadingMatches] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [toastMessage, setToastMessage] = useState('')

  // Sync to localStorage
  useEffect(() => {
    try {
      const custom = opportunities.filter((o) => o.id.startsWith('user-added-'))
      window.localStorage.setItem('opportunity-radar-custom', JSON.stringify(custom))
    } catch {
      // Storage unavailable
    }
  }, [opportunities])

  useEffect(() => {
    try {
      window.localStorage.setItem('opportunity-radar-profile', JSON.stringify(profile))
    } catch {
      // Storage unavailable
    }
  }, [profile])

  useEffect(() => {
    try {
      window.localStorage.setItem('opportunity-radar-saved', JSON.stringify(saved))
    } catch {
      // Storage unavailable
    }
  }, [saved])

  // Toast auto-clear
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(''), 2800)
      return () => clearTimeout(t)
    }
  }, [toastMessage])

  // Fetch opportunities from FastAPI backend
  const fetchOpportunitiesFromApi = useCallback(async () => {
    setLoadingData(true)
    try {
      const apiItems = await getOpportunities()
      if (apiItems && apiItems.length > 0) {
        setOpportunities((prev) => {
          const custom = prev.filter((o) => o.id.startsWith('user-added-'))
          const map = new Map<string, Opportunity>()
          // Add seed fallbacks for category coverage
          SEED_FALLBACKS.forEach((item) => map.set(item.id, item))
          // Overlay API data
          apiItems.forEach((item) => map.set(item.id, item))
          // Add custom listings
          custom.forEach((item) => map.set(item.id, item))
          return Array.from(map.values())
        })
      }
    } catch {
      // Graceful fallback to seed records
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => {
    fetchOpportunitiesFromApi()
  }, [fetchOpportunitiesFromApi])

  // Calculate matches from API (or local fallback if API offline)
  const calculateMatches = useCallback(async () => {
    setLoadingMatches(true)
    setErrorMessage('')
    try {
      const results = await getMatches(profile, opportunities)
      setMatches(results)
      setToastMessage('Opportunity matches evaluated')
    } catch {
      // Client-side rule & keyword based fallback
      const userTerms = [...profile.skills, ...profile.interests, profile.field]
        .map((s) => s.toLowerCase().trim())
        .filter(Boolean)

      const fallbackMatches: MatchResult[] = opportunities.map((opp) => {
        const oppTerms = [...opp.skills, opp.category, opp.summary, opp.title]
          .map((s) => s.toLowerCase())
          .join(' ')

        const overlapping = userTerms.filter((term) => oppTerms.includes(term))
        let score = 30 + Math.min(45, overlapping.length * 12)
        if (profile.preferred_categories.includes(opp.category as any)) {
          score += 15
        }

        const deadlinePassed = opp.deadline && new Date(`${opp.deadline}T23:59:59`).getTime() < Date.now()
        const eligibility = deadlinePassed ? 'expired' : 'potentially_eligible'
        const reasons = overlapping.length > 0
          ? [`Profile matches keywords: ${overlapping.slice(0, 3).join(', ')}.`]
          : ['General student opportunity match.']

        if (opp.category && profile.preferred_categories.includes(opp.category as any)) {
          reasons.push(`Matches your preferred ${opp.category.toLowerCase()} track.`)
        }

        return {
          opportunity: opp,
          score: deadlinePassed ? 0 : Math.min(95, score),
          eligibility,
          reasons,
          skill_gaps: opp.skills.filter((s) => !userTerms.includes(s.toLowerCase())).slice(0, 3),
          explanation: reasons.join(' '),
        }
      })

      fallbackMatches.sort((a, b) => b.score - a.score)
      setMatches(fallbackMatches)
      setToastMessage('Local fit analysis calculated')
    } finally {
      setLoadingMatches(false)
    }
  }, [profile, opportunities])

  // Automatically run matching on mount or when profile updates
  useEffect(() => {
    calculateMatches()
  }, [calculateMatches])

  // Bookmark toggle
  const toggleSave = (id: string) => {
    setSaved((prev) => {
      const isAlreadySaved = prev.includes(id)
      const next = isAlreadySaved ? prev.filter((item) => item !== id) : [...prev, id]
      setToastMessage(isAlreadySaved ? 'Removed from saved' : 'Opportunity saved for later')
      return next
    })
  }

  // Calculate category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      Hackathon: 0,
      Internship: 0,
      Competition: 0,
      Fellowship: 0,
    }
    opportunities.forEach((o) => {
      if (counts[o.category] !== undefined) {
        counts[o.category]++
      }
    })
    return counts
  }, [opportunities])

  // Map of Match Results by Opportunity ID
  const matchMap = useMemo(() => {
    return new Map<string, MatchResult>(matches.map((m) => [m.opportunity.id, m]))
  }, [matches])

  const closingSoonCount = useMemo(() => {
    const now = Date.now()
    return opportunities.filter((opportunity) => {
      if (!opportunity.deadline) return false
      const daysUntilDeadline = Math.ceil(
        (new Date(`${opportunity.deadline}T23:59:59`).getTime() - now) / (1000 * 60 * 60 * 24),
      )
      return daysUntilDeadline >= 0 && daysUntilDeadline <= 14
    }).length
  }, [opportunities])

  const eligibleCount = useMemo(
    () => matches.filter((match) => match.eligibility === 'eligible').length,
    [matches],
  )

  const topMatch = useMemo(
    () => matches.reduce<MatchResult | undefined>(
      (best, match) => !best || match.score > best.score ? match : best,
      undefined,
    ),
    [matches],
  )

  // All available unique skills across listings
  const availableSkills = useMemo(() => {
    const set = new Set<string>()
    opportunities.forEach((o) => {
      o.skills.forEach((s) => set.add(s))
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [opportunities])

  // All available locations
  const availableLocations = useMemo(() => {
    const set = new Set<string>()
    opportunities.forEach((o) => {
      if (o.location && o.location !== 'Not specified') {
        const clean = o.location.split(';')[0].trim()
        if (clean) set.add(clean)
      }
    })
    return Array.from(set).sort()
  }, [opportunities])

  // Count active advanced filters
  const advancedFilterCount = useMemo(() => {
    let count = 0
    if (filters.mode !== 'All') count++
    if (filters.deadlinePreset !== 'All') count++
    if (filters.location !== 'All') count++
    if (filters.eligibility !== 'All') count++
    if (filters.selectedSkills.length > 0) count += filters.selectedSkills.length
    if (filters.freeProgramsOnly) count++
    return count
  }, [filters])

  // Filter and sort opportunities based on all criteria working together
  const filteredOpportunities = useMemo(() => {
    let list = [...opportunities]
    const now = Date.now()

    // Tab filter (Saved)
    if (activeTab === 'Saved') {
      list = list.filter((o) => saved.includes(o.id))
    }

    // Category filter
    if (filters.category !== 'All') {
      list = list.filter((o) => o.category === filters.category)
    }

    // Quick Filter: Closing Soon (deadline between 0 and 10 days away)
    if (filters.quickClosingSoon) {
      list = list.filter((o) => {
        if (!o.deadline) return false
        const diffDays = Math.ceil((new Date(`${o.deadline}T23:59:59`).getTime() - now) / (1000 * 60 * 60 * 24))
        return diffDays >= 0 && diffDays <= 10
      })
    }

    // Quick Filter: Remote
    if (filters.quickRemote) {
      list = list.filter((o) => {
        const m = o.mode.toLowerCase()
        const l = o.location.toLowerCase()
        return m.includes('online') || m.includes('remote') || l.includes('remote')
      })
    }

    // Quick Filter: Eligible for Me (derived from real backend match response)
    if (filters.quickEligibleForMe) {
      list = list.filter((o) => {
        const m = matchMap.get(o.id)
        return m?.eligibility === 'eligible'
      })
    }

    // Quick Filter: Free to Enter
    // Checks that the listing does not explicitly state entry fees in its description/notes
    if (filters.quickFreeToEnter || filters.freeProgramsOnly) {
      list = list.filter((o) => {
        const text = `${o.description} ${o.notes}`.toLowerCase()
        const hasFee = text.includes('registration fee:') || text.includes('entry fee:') || text.includes('paid registration')
        return !hasFee
      })
    }

    // Participation Format (Mode) filter
    if (filters.mode !== 'All') {
      list = list.filter((o) => o.mode.toLowerCase().includes(filters.mode.toLowerCase()))
    }

    // Deadline Range filter
    if (filters.deadlinePreset !== 'All') {
      list = list.filter((o) => {
        if (!o.deadline) return false
        const diffDays = Math.ceil((new Date(`${o.deadline}T23:59:59`).getTime() - now) / (1000 * 60 * 60 * 24))
        if (filters.deadlinePreset === '7days') return diffDays >= 0 && diffDays <= 7
        if (filters.deadlinePreset === '14days') return diffDays >= 0 && diffDays <= 14
        if (filters.deadlinePreset === '30days') return diffDays >= 0 && diffDays <= 30
        if (filters.deadlinePreset === 'custom') {
          if (filters.deadlineFrom && o.deadline < filters.deadlineFrom) return false
          if (filters.deadlineTo && o.deadline > filters.deadlineTo) return false
          return true
        }
        return true
      })
    }

    // Location filter
    if (filters.location !== 'All') {
      list = list.filter((o) => o.location.toLowerCase().includes(filters.location.toLowerCase()))
    }

    // Eligibility filter
    if (filters.eligibility !== 'All') {
      list = list.filter((o) => {
        const m = matchMap.get(o.id)
        if (!m) return true
        if (filters.eligibility === 'eligible') return m.eligibility === 'eligible'
        if (filters.eligibility === 'potentially_eligible') return m.eligibility === 'potentially_eligible'
        if (filters.eligibility === 'no_conflicts') return m.eligibility !== 'not_eligible' && m.eligibility !== 'expired'
        return true
      })
    }

    // Skills filter (opportunity must contain at least one of selected skills)
    if (filters.selectedSkills.length > 0) {
      list = list.filter((o) => {
        const oppSkills = o.skills.map((s) => s.toLowerCase().trim())
        return filters.selectedSkills.some((reqSkill) => oppSkills.includes(reqSkill.toLowerCase().trim()))
      })
    }

    // Search query filter
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim()
      list = list.filter((o) => {
        const hay = [o.title, o.organization, o.category, o.summary, o.description, o.location, o.mode, ...o.skills]
          .join(' ')
          .toLowerCase()
        return hay.includes(q)
      })
    }

    // Sorting
    if (filters.sortBy === 'Deadline soon') {
      list.sort((a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999'))
    } else if (filters.sortBy === 'Recently added') {
      list.sort((a, b) => (b.last_verified || '').localeCompare(a.last_verified || ''))
    } else {
      // Best match (derived from real backend match score)
      list.sort((a, b) => {
        const scoreA = matchMap.get(a.id)?.score || 0
        const scoreB = matchMap.get(b.id)?.score || 0
        return scoreB - scoreA
      })
    }

    return list
  }, [
    opportunities,
    activeTab,
    saved,
    filters,
    matchMap,
  ])

  // Update filter helper
  const handleFilterUpdate = (updated: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updated }))
  }

  // Reset all filters
  const resetFilters = () => {
    setFilters(INITIAL_FILTERS)
  }

  return (
    <div className="app-shell" id="top">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab)
          if (tab === 'Explore') {
            handleFilterUpdate({ category: 'All' })
          }
        }}
        savedCount={saved.length}
        opportunitiesCount={opportunities.length}
        profileName={profile.name || 'Prachi Vats'}
        profileYear={profile.year}
        profileField={profile.field}
        onOpenProfile={() => setShowProfileModal(true)}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="main-wrapper">
        <Navbar
          query={filters.searchQuery}
          onQueryChange={(q) => handleFilterUpdate({ searchQuery: q })}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenProfile={() => setShowProfileModal(true)}
          profileName={profile.name || 'Prachi Vats'}
          profileField={profile.field}
          onSelectTab={setActiveTab}
          onResetProfile={() => {
            setProfile(DEFAULT_PROFILE)
            setToastMessage('Profile reset to default')
          }}
          opportunitiesCount={opportunities.length}
        />

        <div className="dashboard-layout">
          {/* Main Dashboard Center */}
          <main className="dashboard-center">
            {/* Error Banner */}
            {errorMessage && (
              <div className="error-banner">
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
                <button onClick={calculateMatches}>Retry</button>
              </div>
            )}

            {/* Welcome Hero (Shown on Dashboard & Explore) */}
            {activeTab !== 'Saved' && (
              <WelcomeHero
                userName={profile.name || 'Prachi Vats'}
                academicYear={profile.year}
                fieldOfStudy={profile.field}
                closingSoonCount={closingSoonCount}
                eligibleCount={eligibleCount}
                topMatch={topMatch}
                totalCount={opportunities.length}
                onExploreClick={() => {
                  setActiveTab('Explore')
                  handleFilterUpdate({ category: 'All' })
                }}
                onTuneClick={() => setShowProfileModal(true)}
                loading={loadingMatches}
              />
            )}

            {/* Explore by Category Tracks */}
            {activeTab !== 'Saved' && (
              <CategoryExplore
                counts={categoryCounts as any}
                selectedCategory={filters.category}
                onSelectCategory={(cat) => handleFilterUpdate({ category: cat })}
              />
            )}

            {/* Opportunity Filter Bar with Quick Filters and Active Chips */}
            <FiltersBar
              filters={filters}
              onFilterChange={handleFilterUpdate}
              categoryCounts={categoryCounts}
              totalCount={opportunities.length}
              resultCount={filteredOpportunities.length}
              onResetFilters={resetFilters}
              onOpenAdvancedDrawer={() => setShowAdvancedDrawer(true)}
              advancedFilterCount={advancedFilterCount}
            />

            {/* Opportunity Grid */}
            <section className="opportunity-grid" aria-label="Opportunities list">
              {loadingData && opportunities.length === 0 ? (
                <div className="loading-indicator">
                  <div className="spinner-sage" />
                  <span>Loading verified opportunities...</span>
                </div>
              ) : filteredOpportunities.length > 0 ? (
                filteredOpportunities.map((opp) => (
                  <OpportunityCard
                    key={opp.id}
                    opportunity={opp}
                    match={matchMap.get(opp.id)}
                    isSaved={saved.includes(opp.id)}
                    onToggleSave={toggleSave}
                    userSkills={profile.skills}
                  />
                ))
              ) : (
                <div className="empty-state-card">
                  <div className="empty-state-icon">
                    <Search size={24} />
                  </div>
                  <h3 className="empty-state-title">No opportunities found</h3>
                  <p className="empty-state-text">
                    {activeTab === 'Saved'
                      ? 'You have not bookmarked any opportunities yet. Click the bookmark icon on any card to save it for later.'
                      : 'No signals match your current combination of filters. Try clearing some filters or searching for broader terms.'}
                  </p>
                  <button className="btn-secondary" onClick={resetFilters}>
                    <RefreshCw size={14} />
                    <span>Reset all filters</span>
                  </button>
                </div>
              )}
            </section>
          </main>

          {/* Right Information Panel (Desktop/Tablet) */}
          <RightPanel
            profile={profile}
            savedCount={saved.length}
            onEditProfile={() => setShowProfileModal(true)}
            onSelectTab={setActiveTab}
            onOpenAddOpportunity={() => setShowAddModal(true)}
          />
        </div>
        <AppFooter />
      </div>

      {/* Advanced Filter Drawer */}
      <AdvancedFilterDrawer
        isOpen={showAdvancedDrawer}
        onClose={() => setShowAdvancedDrawer(false)}
        filters={filters}
        onChange={handleFilterUpdate}
        onReset={resetFilters}
        availableSkills={availableSkills}
        availableLocations={availableLocations}
        resultCount={filteredOpportunities.length}
      />

      {/* Edit Profile Modal */}
      {showProfileModal && (
        <ProfileModal
          profile={profile}
          onSave={(updated) => {
            setProfile(updated)
            setToastMessage('Student profile updated')
          }}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* Add Custom Opportunity Modal (AI Extraction) */}
      {showAddModal && (
        <AddOpportunityModal
          onSuccess={(newOpp) => {
            setOpportunities((prev) => [newOpp, ...prev])
            setToastMessage('Opportunity extracted and added to radar!')
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notice" role="status" aria-live="polite">
          <Check size={15} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}

export default App
