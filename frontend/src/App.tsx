import { useEffect, useMemo, useState, useCallback, lazy, Suspense } from 'react'
import { Navbar } from './components/Navbar'
import { AppFooter } from './components/AppFooter'
import { WelcomeHero } from './components/WelcomeHero'
import { FiltersBar } from './components/FiltersBar'
import { OpportunityCard } from './components/OpportunityCard'
import { CyberTunnelCanvas } from './components/CyberTunnelCanvas'
import { CategoryPageView } from './components/CategoryPageView'
import { ProfileView } from './components/ProfileView'
import { TuneRadarView } from './components/TuneRadarView'
import { SettingsView } from './components/SettingsView'
import { SavedView } from './components/SavedView'
import { ApplicationsView } from './components/ApplicationsView'
import { getOpportunities, getMatches, getFeed, healthCheck, syncOpportunities } from './api'
import type { Opportunity, Profile, MatchResult, FilterState, ApplicationRecord, ApplicationStatus } from './types'
import { Search, Check, RefreshCw, Wifi, WifiOff, X, Sparkles } from 'lucide-react'

// Code-split dynamic modal overlays to minimize critical bundle size
const OpportunityDetailDrawer = lazy(() => import('./components/OpportunityDetailDrawer').then(m => ({ default: m.OpportunityDetailDrawer })))
const ProfileModal = lazy(() => import('./components/ProfileModal').then(m => ({ default: m.ProfileModal })))
const AdvancedFilterDrawer = lazy(() => import('./components/AdvancedFilterDrawer').then(m => ({ default: m.AdvancedFilterDrawer })))
const AuthModal = lazy(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })))
const NotificationCenter = lazy(() => import('./components/NotificationCenter').then(m => ({ default: m.NotificationCenter })))

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
  matchesOnly: false,
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
    id: 'unstop-productathon-2026',
    title: 'Unstop National Productathon 2026',
    organization: 'Unstop & PM School',
    category: 'Hackathon',
    summary: 'India premier 48-hour student product management hackathon: design, prototype, and build PRDs with wireframes for real-world user problems.',
    description: 'Open to all undergraduate and postgraduate students interested in product management, UI/UX, and business strategy. Tracks include Consumer Tech, AI-First Products, and Fintech. Teams of 2 to 4 students submit PRDs, user journey maps, and Figma prototypes.',
    skills: ['Product Management', 'Wireframing', 'PRD', 'User Research', 'Figma', 'Product Strategy', 'Metrics', 'Problem Solving'],
    eligible_years: ['1', '2', '3', '4', 'Graduate'],
    eligible_fields: [],
    location: 'India',
    mode: 'Online',
    team_min: 2,
    team_max: 4,
    deadline: '2026-11-20',
    start_date: '2026-11-25',
    source_url: 'https://unstop.com/hackathons/productathon-2026',
    source_name: 'Unstop Official',
    last_verified: '2026-10-18',
    status: 'verified',
    notes: 'Wireframe submission via Figma or interactive prototype link.',
  },
  {
    id: 'flipkart-wired-product-track-2026',
    title: 'Flipkart WiRED 9.0 — Product Management Track',
    organization: 'Flipkart',
    category: 'Competition',
    summary: 'Flagship business and product case challenge inviting campus students to solve real-world Indian e-commerce, consumer tech, and retail discovery problems.',
    description: 'The Product Track tests problem identification, consumer persona design, solution wireframing, and go-to-market monetization strategy. National winners receive PPIs (Pre-Placement Interviews) for Flipkart APM roles.',
    skills: ['Product Management', 'E-Commerce', 'PRD', 'Customer Journey', 'Monetization', 'Wireframing', 'Business Strategy'],
    eligible_years: ['1', '2', '3', '4', 'Graduate'],
    eligible_fields: [],
    location: 'India',
    mode: 'Online rounds + National Finals in Bengaluru',
    team_min: 2,
    team_max: 3,
    deadline: '2026-11-18',
    start_date: '2026-11-24',
    source_url: 'https://unstop.com/competitions/flipkart-wired-90-product-track',
    source_name: 'Flipkart Careers & Unstop',
    last_verified: '2026-10-18',
    status: 'verified',
    notes: 'Pre-placement interviews (PPIs) awarded to top national product finalists.',
  },
  {
    id: 'google-apm-internship-2026',
    title: 'Google Associate Product Manager (APM) Summer Internship 2026',
    organization: 'Google',
    category: 'Internship',
    summary: 'Google flagship 12-week APM internship for undergraduate students passionate about technology, user empathy, and product vision.',
    description: 'APM interns guide products from conception to launch, collaborating with engineering, UX, and marketing teams to define product roadmaps and ship impactful features across Search, Android, Cloud, and Workspace.',
    skills: ['Product Management', 'Product Strategy', 'Data Analysis', 'System Design', 'User Empathy', 'Roadmapping', 'Leadership'],
    eligible_years: ['2', '3', '4'],
    eligible_fields: ['Computer Science', 'Engineering', 'Business', 'Information Technology', 'Any'],
    location: 'India',
    mode: 'Hybrid (Bengaluru / Hyderabad)',
    team_min: null,
    team_max: null,
    deadline: '2026-11-30',
    start_date: '2027-05-15',
    source_url: 'https://careers.google.com/jobs/results/apm-intern-2026',
    source_name: 'Google Student Careers',
    last_verified: '2026-10-18',
    status: 'verified',
    notes: 'Comprehensive summer mentorship with Google Senior Product Managers.',
  },
  {
    id: 'atlassian-pm-internship-2026',
    title: 'Atlassian Product Management Summer Internship 2026',
    organization: 'Atlassian',
    category: 'Internship',
    summary: 'Join Atlassian product craft team to shape the future of team collaboration tools including Jira, Confluence, and Loom.',
    description: 'Work directly alongside seasoned Product Managers and Principal Engineers. Conduct customer interviews, define PRDs, prioritize sprint backlogs, and launch experimental product features.',
    skills: ['Product Management', 'Agile', 'PRD', 'Jira', 'User Research', 'Feature Prioritization', 'Stakeholder Management'],
    eligible_years: ['2', '3', '4'],
    eligible_fields: [],
    location: 'India',
    mode: 'Remote / Bengaluru',
    team_min: null,
    team_max: null,
    deadline: '2026-11-25',
    start_date: '2027-05-01',
    source_url: 'https://www.atlassian.com/company/careers/students',
    source_name: 'Atlassian Early Careers',
    last_verified: '2026-10-18',
    status: 'verified',
    notes: 'Remote-first collaboration with global product teams.',
  },
  {
    id: 'apm-product-hack-2026',
    title: 'APM Global Product Sprint & Teardown 2026',
    organization: 'The Product Folks (TPF)',
    category: 'Hackathon',
    summary: 'A fast-paced 72-hour product hackathon and app teardown challenge for aspiring Associate Product Managers (APMs).',
    description: 'Tackle growth, retention, and onboarding friction for top consumer apps. Mentorship from senior product leaders at Swiggy, Razorpay, and CRED. Submit a detailed teardown deck and feature specification.',
    skills: ['Product Management', 'Product Teardown', 'A/B Testing', 'Growth', 'User Experience', 'Metrics', 'Data Analysis'],
    eligible_years: ['1', '2', '3', '4', 'Graduate'],
    eligible_fields: [],
    location: 'India',
    mode: 'Online',
    team_min: 1,
    team_max: 3,
    deadline: '2026-11-12',
    start_date: '2026-11-15',
    source_url: 'https://theproductfolks.com/product-hack-2026',
    source_name: 'The Product Folks Official',
    last_verified: '2026-10-18',
    status: 'verified',
    notes: 'Live teardown presentations before top tech venture partners.',
  },
  {
    id: 'cred-curious-product-challenge-2026',
    title: 'CRED Curious Product Challenge 2026',
    organization: 'CRED',
    category: 'Competition',
    summary: 'An exclusive student product innovation challenge to design high-trust fintech and gamification loops for premium users.',
    description: 'Analyze user psychology, friction points, and retention loops. Submit an end-to-end product proposal including PRD, wireframes, and business impact projections.',
    skills: ['Product Management', 'Fintech', 'UX Teardown', 'Retention', 'Wireframing', 'Design Thinking', 'Behavioral Economics'],
    eligible_years: ['1', '2', '3', '4', 'Graduate'],
    eligible_fields: [],
    location: 'India',
    mode: 'Online',
    team_min: 1,
    team_max: 2,
    deadline: '2026-11-14',
    start_date: '2026-11-18',
    source_url: 'https://unstop.com/competitions/cred-curious-product-2026',
    source_name: 'CRED Campus Innovation',
    last_verified: '2026-10-18',
    status: 'verified',
    notes: 'Winners receive direct APM interview fast-track.',
  },
  {
    id: 'nextleap-product-fellowship-2026',
    title: 'NextLeap Product Management Fellowship 2026',
    organization: 'NextLeap',
    category: 'Fellowship',
    summary: 'A structured 12-week selective student fellowship with real-world product projects, live teardowns, and APM mentorship.',
    description: 'Work on capstone products with user interviews, Figma wireframes, SQL metrics analysis, and 1-on-1 resume & mock interview prep with tech APMs.',
    skills: ['Product Management', 'Product Discovery', 'PRD', 'Figma', 'SQL', 'Growth', 'User Interviews', 'Roadmapping'],
    eligible_years: ['1', '2', '3', '4', 'Graduate'],
    eligible_fields: [],
    location: 'India',
    mode: 'Online Cohort',
    team_min: null,
    team_max: null,
    deadline: '2026-11-16',
    start_date: '2026-11-22',
    source_url: 'https://nextleap.app/product-fellowship',
    source_name: 'NextLeap Academy',
    last_verified: '2026-10-18',
    status: 'verified',
    notes: 'Cohort-based fellowship with portfolio capstone reviews.',
  },
  {
    id: 'uber-apm-internship-2026',
    title: 'Uber Associate Product Manager (APM) Internship 2026',
    organization: 'Uber',
    category: 'Internship',
    summary: 'Build the next generation of global mobility and delivery products as part of Uber global APM program.',
    description: 'Hands-on ownership over rider, driver, or merchant product surfaces. Analyze funnel drop-offs, design experimentation frameworks, and deliver feature specs.',
    skills: ['Product Management', 'Market Research', 'Experimentation', 'Metrics', 'SQL', 'User Journey', 'Analytics'],
    eligible_years: ['3', '4'],
    eligible_fields: [],
    location: 'India',
    mode: 'Hybrid (Hyderabad)',
    team_min: null,
    team_max: null,
    deadline: '2026-12-05',
    start_date: '2027-05-10',
    source_url: 'https://www.uber.com/us/en/careers/university/',
    source_name: 'Uber University Programs',
    last_verified: '2026-10-18',
    status: 'verified',
    notes: 'Mentorship from Global Product Directors.',
  },
  {
    id: 'unstop-pm-school-national-case-2026',
    title: 'National Product Management Case Challenge 2026',
    organization: 'PM School & Unstop',
    category: 'Competition',
    summary: 'Comprehensive product teardown and growth case competition evaluating market sizing, product discovery, and user validation.',
    description: 'Solve prompt cases curated by product managers at Zepto, Zomato, and Swiggy. Present live to product leaders during the national finale.',
    skills: ['Product Management', 'Market Sizing', 'Go-To-Market', 'PRD', 'User Validation', 'Metrics', 'Presentation'],
    eligible_years: ['1', '2', '3', '4'],
    eligible_fields: [],
    location: 'India',
    mode: 'Online',
    team_min: 1,
    team_max: 3,
    deadline: '2026-11-28',
    start_date: '2026-12-04',
    source_url: 'https://unstop.com/competitions/pm-school-national-case-2026',
    source_name: 'PM School Official',
    last_verified: '2026-10-18',
    status: 'verified',
    notes: 'National case championship with mentorship rounds.',
  },
  {
    id: 'kaggle-unstop-ai-product-fellowship-2026',
    title: 'Kaggle & Unstop AI Product Fellow Cohort 2026',
    organization: 'Kaggle & Unstop',
    category: 'Fellowship',
    summary: 'Fellowship for students who want to build and manage AI/LLM products, covering prompt engineering, model evaluation, and product specs.',
    description: 'Learn how to define PRDs for AI-driven applications, conduct user evaluations, and manage machine learning product lifecycles.',
    skills: ['Product Management', 'AI Products', 'PRD', 'User Research', 'Prototyping', 'Strategy', 'Evaluation Metrics'],
    eligible_years: ['2', '3', '4', 'Graduate'],
    eligible_fields: [],
    location: 'India',
    mode: 'Online',
    team_min: null,
    team_max: null,
    deadline: '2026-12-01',
    start_date: '2026-12-15',
    source_url: 'https://unstop.com/fellowships/ai-product-fellows-2026',
    source_name: 'Kaggle Student Initiative',
    last_verified: '2026-10-18',
    status: 'verified',
    notes: 'Hands-on AI product capstone project.',
  },
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
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Hackathons' | 'Internships' | 'Competitions' | 'Fellowships' | 'Saved' | 'Applications' | 'Profile' | 'Tune' | 'Settings'>('Dashboard')

  // Applications Tracker State
  const [applications, setApplications] = useState<ApplicationRecord[]>(() => {
    try {
      const stored = window.localStorage.getItem('opportunity-radar-applications')
      return stored ? (JSON.parse(stored) as ApplicationRecord[]) : []
    } catch {
      return []
    }
  })
  const [isSyncing, setIsSyncing] = useState(false)

  // Student Authentication & Session State
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const stored = window.localStorage.getItem('opportunity-radar-auth')
      return stored ? JSON.parse(stored).isLoggedIn !== false : true
    } catch {
      return true
    }
  })

  const [userEmail, setUserEmail] = useState<string>(() => {
    try {
      const stored = window.localStorage.getItem('opportunity-radar-auth')
      return stored ? JSON.parse(stored).email || 'prachi.vats@student.edu.in' : 'prachi.vats@student.edu.in'
    } catch {
      return 'prachi.vats@student.edu.in'
    }
  })

  // Unified Filter State
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS)

  // Modals & Navigation Drawers
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showAdvancedDrawer, setShowAdvancedDrawer] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [selectedOpportunityForDrawer, setSelectedOpportunityForDrawer] = useState<Opportunity | null>(null)
  const [clockTargetOpp, setClockTargetOpp] = useState<Opportunity | null>(null)

  // Status & Feedback
  const [loadingMatches, setLoadingMatches] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [apiConnected, setApiConnected] = useState<boolean | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [toastMessage, setToastMessage] = useState('')

  // LinkedIn Integration State
  const [isLinkedInConnected, setIsLinkedInConnected] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem('opportunity-radar-linkedin-connected') === 'true'
    } catch {
      return false
    }
  })

  // Debounced search query
  const [debouncedQuery, setDebouncedQuery] = useState(filters.searchQuery)

  // Sync auth state to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem('opportunity-radar-auth', JSON.stringify({ isLoggedIn, email: userEmail }))
    } catch {
      // Storage unavailable
    }
  }, [isLoggedIn, userEmail])

  // Sync custom opportunities to localStorage
  useEffect(() => {
    try {
      const custom = opportunities.filter((o) => o.id.startsWith('user-added-') || o.id.startsWith('curator-added-'))
      window.localStorage.setItem('opportunity-radar-custom', JSON.stringify(custom))
    } catch {
      // Storage unavailable
    }
  }, [opportunities])

  // Sync profile to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem('opportunity-radar-profile', JSON.stringify(profile))
    } catch {
      // Storage unavailable
    }
  }, [profile])

  // Sync saved IDs to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem('opportunity-radar-saved', JSON.stringify(saved))
    } catch {
      // Storage unavailable
    }
  }, [saved])

  // Sync applications to localStorage
  useEffect(() => {
    try {
      window.localStorage.setItem('opportunity-radar-applications', JSON.stringify(applications))
    } catch {
      // Storage unavailable
    }
  }, [applications])

  // Toast auto-clear
  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(''), 3000)
      return () => clearTimeout(t)
    }
  }, [toastMessage])

  // Fetch opportunities from FastAPI backend
  const fetchOpportunitiesFromApi = useCallback(async () => {
    setLoadingData(true)
    try {
      const apiItems = await getOpportunities()
      setApiConnected(true)
      if (apiItems && apiItems.length > 0) {
        setOpportunities((prev) => {
          const custom = prev.filter((o) => o.id.startsWith('user-added-') || o.id.startsWith('curator-added-'))
          const map = new Map<string, Opportunity>()
          // API data is authoritative; custom items overlay
          apiItems.forEach((item) => map.set(item.id, item))
          custom.forEach((item) => map.set(item.id, item))
          return Array.from(map.values())
        })
      }
    } catch {
      // Graceful fallback to seed records when backend is unavailable
      setApiConnected(false)
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => {
    fetchOpportunitiesFromApi()
  }, [fetchOpportunitiesFromApi])

  // Backend connectivity check
  useEffect(() => {
    let cancelled = false
    healthCheck()
      .then(() => {
        if (!cancelled) setApiConnected(true)
      })
      .catch(() => {
        if (!cancelled) setApiConnected(false)
      })
    return () => { cancelled = true }
  }, [])

  // Debounce search input to avoid excessive re-renders
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(filters.searchQuery)
    }, 250)
    return () => clearTimeout(timer)
  }, [filters.searchQuery])

  // Connect with LinkedIn & Auto-Calibrate
  const handleConnectLinkedIn = useCallback(() => {
    if (!isLinkedInConnected) {
      setIsLinkedInConnected(true)
      try {
        window.localStorage.setItem('opportunity-radar-linkedin-connected', 'true')
      } catch {}
      const linkedInSkills = ['Product Management', 'Cybersecurity', 'PRD', 'Wireframing', 'User Research', 'Threat Modeling']
      const updatedSkills = Array.from(new Set([...profile.skills, ...linkedInSkills]))
      const updatedProfile: Profile = {
        ...profile,
        skills: updatedSkills,
        interests: Array.from(new Set([...profile.interests, 'Product Management', 'Cybersecurity'])),
      }
      setProfile(updatedProfile)
      setFilters((prev) => ({ ...prev, matchesOnly: true, category: 'All' }))
      setToastMessage('LinkedIn Connected! Calibrated with Product Management & Cybersecurity profile & jobs.')
    } else {
      setToastMessage('LinkedIn profile is already connected and active.')
    }
  }, [isLinkedInConnected, profile])

  // Handle profile / preferences update and immediately show matching opportunities
  const handleProfileUpdate = useCallback((updated: Profile, toastText = 'Profile preferences updated! Showing your matched opportunities.') => {
    setProfile(updated)
    setFilters((prev) => ({ ...prev, matchesOnly: true, category: 'All' }))
    setActiveTab('Dashboard')
    setShowProfileModal(false)
    setToastMessage(toastText)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Calculate matches from API (or local fallback if API offline)
  const calculateMatches = useCallback(async () => {
    setLoadingMatches(true)
    setErrorMessage('')
    try {
      const results = await getMatches(profile, opportunities)
      setMatches(results)
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
        let score = 25 + Math.min(35, overlapping.length * 10)

        // Multi-word phrase domain matches (e.g. "product management", "cybersecurity")
        const userPhrases = userTerms.filter((t) => t.length > 3)
        const phraseMatches = userPhrases.filter((phrase) => oppTerms.includes(phrase))
        if (phraseMatches.length > 0) {
          score += Math.min(25, phraseMatches.length * 12)
        }

        if (profile.preferred_categories.includes(opp.category as any)) {
          score += 20
        }
        if (profile.preferred_mode !== 'Any' && opp.mode.toLowerCase().includes(profile.preferred_mode.toLowerCase())) {
          score += 10
        }

        const deadlinePassed = opp.deadline && new Date(`${opp.deadline}T23:59:59`).getTime() < Date.now()
        const eligibility = deadlinePassed ? 'expired' : 'potentially_eligible'
        const reasons: string[] = []
        if (overlapping.length > 0) {
          reasons.push(`Your profile overlaps with: ${overlapping.slice(0, 4).join(', ')}.`)
        }
        if (phraseMatches.length > 0) {
          reasons.push(`High domain alignment with: ${phraseMatches.slice(0, 3).join(', ')}.`)
        }
        if (opp.category && profile.preferred_categories.includes(opp.category as any)) {
          reasons.push(`Matches your preferred ${opp.category.toLowerCase()} track.`)
        }
        if (reasons.length === 0) {
          reasons.push('General student opportunity match.')
        }

        return {
          opportunity: opp,
          score: deadlinePassed ? 0 : Math.min(100, score),
          eligibility,
          reasons,
          skill_gaps: opp.skills.filter((s) => !userTerms.includes(s.toLowerCase())).slice(0, 3),
          explanation: reasons.join(' '),
        }
      })

      fallbackMatches.sort((a, b) => b.score - a.score)
      setMatches(fallbackMatches)
    } finally {
      setLoadingMatches(false)
    }
  }, [profile, opportunities])

  // Automatically recalculate matches when profile or opportunities update
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

  // Map of tracked application status for O(1) lookups
  const applicationStatusMap = useMemo(() => {
    const map = new Map<string, ApplicationStatus>()
    applications.forEach((a) => map.set(a.opportunityId, a.status))
    return map
  }, [applications])

  const handleTrackApplication = (opp: Opportunity, initialStatus: ApplicationStatus = 'Applied') => {
    setApplications((prev) => {
      const existing = prev.find((a) => a.opportunityId === opp.id)
      if (existing) {
        const nextMap: Record<ApplicationStatus, ApplicationStatus> = {
          Saved: 'Applied',
          Applied: 'Under Review',
          'Under Review': 'Shortlisted',
          Shortlisted: 'Selected',
          Selected: 'Saved',
          Rejected: 'Applied',
        }
        const newStatus = nextMap[existing.status] || 'Applied'
        setToastMessage(`Updated ${opp.title.slice(0, 30)}... status to ${newStatus}`)
        return prev.map((a) =>
          a.opportunityId === opp.id ? { ...a, status: newStatus, updatedAt: new Date().toISOString() } : a
        )
      } else {
        const newRec: ApplicationRecord = {
          opportunityId: opp.id,
          opportunity: opp,
          status: initialStatus,
          appliedDate: new Date().toISOString().split('T')[0],
          notes: '',
          teamMembers: [],
          updatedAt: new Date().toISOString(),
        }
        setToastMessage(`Added "${opp.title.slice(0, 25)}..." to My Applications as "${initialStatus}"`)
        return [newRec, ...prev]
      }
    })
  }

  const handleUpdateApplicationStatus = (opportunityId: string, status: ApplicationStatus) => {
    setApplications((prev) =>
      prev.map((a) =>
        a.opportunityId === opportunityId ? { ...a, status, updatedAt: new Date().toISOString() } : a
      )
    )
    setToastMessage(`Application stage updated to ${status}`)
  }

  const handleUpdateApplicationDetails = (
    opportunityId: string,
    details: { teamName?: string; teamMembers?: string[]; notes?: string; appliedDate?: string }
  ) => {
    setApplications((prev) =>
      prev.map((a) =>
        a.opportunityId === opportunityId
          ? {
              ...a,
              ...details,
              updatedAt: new Date().toISOString(),
            }
          : a
      )
    )
    setToastMessage('Application details saved')
  }

  const handleRemoveApplication = (opportunityId: string) => {
    setApplications((prev) => prev.filter((a) => a.opportunityId !== opportunityId))
    setToastMessage('Opportunity removed from applications pipeline')
  }

  const handleSyncFeeds = async () => {
    setIsSyncing(true)
    try {
      const res = await syncOpportunities()
      await fetchOpportunitiesFromApi()
      setToastMessage(res.message || `Synced! ${res.added} new opportunities added (total: ${res.total}).`)
    } catch (err: any) {
      setToastMessage(err.message || 'Live sync encountered an issue.')
    } finally {
      setIsSyncing(false)
    }
  }


  // Clear custom listings
  const handleClearCustomOpportunities = () => {
    setOpportunities((prev) => prev.filter((o) => !o.id.startsWith('user-added-') && !o.id.startsWith('curator-added-')))
    try {
      window.localStorage.removeItem('opportunity-radar-custom')
    } catch {
      // Storage error
    }
    setToastMessage('Custom listings cleared')
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
    () => {
      const positiveMatches = matches.filter(
        (m) => m.score >= 50 && m.eligibility !== 'not_eligible' && m.eligibility !== 'expired',
      )
      if (positiveMatches.length > 0) {
        return positiveMatches.reduce((best, m) => (m.score > best.score ? m : best), positiveMatches[0])
      }
      const viable = matches.filter((m) => m.eligibility !== 'expired')
      return viable.length > 0 ? viable[0] : matches[0]
    },
    [matches],
  )

  // Unique skills across listings
  const availableSkills = useMemo(() => {
    const set = new Set<string>()
    opportunities.forEach((o) => {
      o.skills.forEach((s) => set.add(s))
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [opportunities])

  // Unique locations
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

  // Count opportunities strictly matching user's profile preferences
  const matchedPreferencesCount = useMemo(() => {
    const userTerms = [
      profile.field,
      ...profile.skills,
      ...profile.interests,
    ].map((s) => s.toLowerCase().trim()).filter((s) => s && s.length > 2)

    return opportunities.filter((o) => {
      const m = matchMap.get(o.id)
      if (m && m.score >= 50) return true
      const text = `${o.title} ${o.summary} ${o.skills.join(' ')} ${o.category}`.toLowerCase()
      return userTerms.some((t) => text.includes(t))
    }).length
  }, [opportunities, profile, matchMap])

  // Filter and sort opportunities
  const filteredOpportunities = useMemo(() => {
    let list = [...opportunities]
    const now = Date.now()

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

    // Quick Filter: Eligible for Me
    if (filters.quickEligibleForMe) {
      list = list.filter((o) => {
        const m = matchMap.get(o.id)
        return m?.eligibility === 'eligible'
      })
    }

    // Quick Filter: Free to Enter
    if (filters.quickFreeToEnter || filters.freeProgramsOnly) {
      list = list.filter((o) => {
        const text = `${o.description} ${o.notes}`.toLowerCase()
        const hasFee = text.includes('registration fee:') || text.includes('entry fee:') || text.includes('paid registration')
        return !hasFee
      })
    }

    // Filter to Matched Profile Preferences
    if (filters.matchesOnly) {
      const userTerms = [
        profile.field,
        ...profile.skills,
        ...profile.interests,
      ].map((s) => s.toLowerCase().trim()).filter((s) => s && s.length > 2)

      list = list.filter((o) => {
        const m = matchMap.get(o.id)
        if (m && m.score >= 50) return true
        const text = `${o.title} ${o.summary} ${o.skills.join(' ')} ${o.category}`.toLowerCase()
        return userTerms.some((t) => text.includes(t))
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

    // Skills filter
    if (filters.selectedSkills.length > 0) {
      list = list.filter((o) => {
        const oppSkills = o.skills.map((s) => s.toLowerCase().trim())
        return filters.selectedSkills.some((reqSkill) => oppSkills.includes(reqSkill.toLowerCase().trim()))
      })
    }

    // Search query filter (debounced)
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase().trim()
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
      // Best match
      list.sort((a, b) => {
        const scoreA = matchMap.get(a.id)?.score || 0
        const scoreB = matchMap.get(b.id)?.score || 0
        return scoreB - scoreA
      })
    }

    return list
  }, [
    opportunities,
    filters,
    debouncedQuery,
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
      {/* 3D WebGL Glowing Tunnel Background with Dynamic Particle Matrix */}
      <CyberTunnelCanvas />

      {/* Shared Responsive Header */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab as any)
        }}
        query={filters.searchQuery}
        onQueryChange={(q) => handleFilterUpdate({ searchQuery: q })}
        profileName={profile.name || 'Prachi Vats'}
        profileField={profile.field}
        profileYear={profile.year}
        isLoggedIn={isLoggedIn}
        userEmail={userEmail}
        unreadNotificationsCount={closingSoonCount > 0 ? closingSoonCount : 2}
        onOpenNotifications={() => setShowNotifications(true)}
        onOpenAuthModal={() => setShowAuthModal(true)}
        savedCount={saved.length}
        applicationsCount={applications.length}
        onSyncFeeds={handleSyncFeeds}
        isSyncing={isSyncing}
        onConnectLinkedIn={handleConnectLinkedIn}
        isLinkedInConnected={isLinkedInConnected}
        targetOpportunity={clockTargetOpp || selectedOpportunityForDrawer}
        onClearClockTarget={() => setClockTargetOpp(null)}
      />

      {/* Main Single Central Workspace */}
      <main className="central-workspace" role="main">
        {/* 1. DASHBOARD / RADAR FEED VIEW */}
        {activeTab === 'Dashboard' && (
          <div className="dashboard-view-content">
            {/* Interactive Student Match Hero */}
            <WelcomeHero
              userName={profile.name || 'Prachi Vats'}
              academicYear={profile.year}
              fieldOfStudy={profile.field}
              closingSoonCount={closingSoonCount}
              eligibleCount={eligibleCount}
              topMatch={topMatch}
              onFilterEligible={() => {
                handleFilterUpdate({ quickEligibleForMe: true, category: 'All' })
                const el = document.getElementById('opportunity-feed')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              onFilterClosingSoon={() => {
                handleFilterUpdate({ quickClosingSoon: true, category: 'All' })
                const el = document.getElementById('opportunity-feed')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              onResetFilters={() => {
                resetFilters()
                const el = document.getElementById('opportunity-feed')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              onEditProfile={() => setActiveTab('Profile')}
              onSelectTrack={(track) => {
                if (track === 'All Tracks') {
                  handleFilterUpdate({ searchQuery: '', category: 'All' })
                } else {
                  handleFilterUpdate({ searchQuery: track, category: 'All' })
                }
                const el = document.getElementById('opportunity-feed')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}
              activeTrack={filters.searchQuery || 'All Tracks'}
              loading={loadingMatches}
            />

            {/* Filter Bar */}
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

            {/* View Mode Bar: All vs Matched Preferences */}
            <div className="feed-scope-bar">
              <div className="scope-tabs-group">
                <button
                  type="button"
                  className={`scope-tab-btn ${!filters.matchesOnly ? 'active' : ''}`}
                  onClick={() => handleFilterUpdate({ matchesOnly: false })}
                >
                  <span>All Catalog</span>
                  <span className="scope-pill-count">{opportunities.length}</span>
                </button>

                <button
                  type="button"
                  className={`scope-tab-btn ${filters.matchesOnly ? 'active' : ''}`}
                  onClick={() => handleFilterUpdate({ matchesOnly: true })}
                >
                  <Sparkles size={12} className="text-sage" />
                  <span>Matched to My Preferences</span>
                  <span className="scope-pill-count highlight">{matchedPreferencesCount}</span>
                </button>
              </div>

              {filters.matchesOnly && (
                <div className="active-preferences-indicator">
                  <span>Filtered to <strong>{profile.field}</strong> ({matchedPreferencesCount} matches found)</span>
                  <button
                    type="button"
                    className="clear-scope-btn"
                    onClick={() => handleFilterUpdate({ matchesOnly: false })}
                  >
                    Show all {opportunities.length}
                  </button>
                </div>
              )}
            </div>

            {/* Opportunities Grid */}
            <section className="opportunity-grid" id="opportunity-feed" aria-label="Opportunities list">
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
                    trackedStatus={applicationStatusMap.get(opp.id)}
                    onTrackApplication={handleTrackApplication}
                    onInspect={(opp) => {
                      setSelectedOpportunityForDrawer(opp)
                      setClockTargetOpp(opp)
                    }}
                  />
                ))
              ) : (
                <div className="empty-state-card">
                  <div className="empty-state-icon">
                    <Search size={24} />
                  </div>
                  <h3 className="empty-state-title">No opportunities found</h3>
                  <p className="empty-state-text">
                    No signals match your current combination of filters. Try clearing some filters or searching for broader terms.
                  </p>
                  <button className="btn-secondary" onClick={resetFilters}>
                    <RefreshCw size={14} />
                    <span>Reset all filters</span>
                  </button>
                </div>
              )}
            </section>
          </div>
        )}

        {/* DEDICATED HACKATHONS PAGE */}
        {activeTab === 'Hackathons' && (
          <CategoryPageView
            category="Hackathon"
            opportunities={opportunities}
            matchMap={matchMap}
            saved={saved}
            onToggleSave={toggleSave}
            onInspect={(opp) => setSelectedOpportunityForDrawer(opp)}
            userSkills={profile.skills}
            applicationStatusMap={applicationStatusMap}
            onTrackApplication={handleTrackApplication}
            profile={profile}
            onNavigateHome={() => setActiveTab('Dashboard')}
          />
        )}

        {/* DEDICATED INTERNSHIPS PAGE */}
        {activeTab === 'Internships' && (
          <CategoryPageView
            category="Internship"
            opportunities={opportunities}
            matchMap={matchMap}
            saved={saved}
            onToggleSave={toggleSave}
            onInspect={(opp) => setSelectedOpportunityForDrawer(opp)}
            userSkills={profile.skills}
            applicationStatusMap={applicationStatusMap}
            onTrackApplication={handleTrackApplication}
            profile={profile}
            onNavigateHome={() => setActiveTab('Dashboard')}
          />
        )}

        {/* DEDICATED COMPETITIONS PAGE */}
        {activeTab === 'Competitions' && (
          <CategoryPageView
            category="Competition"
            opportunities={opportunities}
            matchMap={matchMap}
            saved={saved}
            onToggleSave={toggleSave}
            onInspect={(opp) => setSelectedOpportunityForDrawer(opp)}
            userSkills={profile.skills}
            applicationStatusMap={applicationStatusMap}
            onTrackApplication={handleTrackApplication}
            profile={profile}
            onNavigateHome={() => setActiveTab('Dashboard')}
          />
        )}

        {/* DEDICATED FELLOWSHIPS PAGE */}
        {activeTab === 'Fellowships' && (
          <CategoryPageView
            category="Fellowship"
            opportunities={opportunities}
            matchMap={matchMap}
            saved={saved}
            onToggleSave={toggleSave}
            onInspect={(opp) => setSelectedOpportunityForDrawer(opp)}
            userSkills={profile.skills}
            applicationStatusMap={applicationStatusMap}
            onTrackApplication={handleTrackApplication}
            profile={profile}
            onNavigateHome={() => setActiveTab('Dashboard')}
          />
        )}

        {/* SAVED OPPORTUNITIES VIEW */}
        {activeTab === 'Saved' && (
          <SavedView
            opportunities={opportunities}
            savedIds={saved}
            matchMap={matchMap}
            onToggleSave={toggleSave}
            userSkills={profile.skills}
            onNavigateToExplore={() => setActiveTab('Dashboard')}
            onNavigateToDashboard={() => setActiveTab('Dashboard')}
            onInspect={(opp) => {
              setSelectedOpportunityForDrawer(opp)
              setClockTargetOpp(opp)
            }}
          />
        )}

        {/* 3. MY APPLICATIONS PIPELINE TRACKER */}
        {activeTab === 'Applications' && (
          <ApplicationsView
            applications={applications}
            onUpdateStatus={handleUpdateApplicationStatus}
            onUpdateDetails={handleUpdateApplicationDetails}
            onRemoveApplication={handleRemoveApplication}
            onNavigateToExplore={() => setActiveTab('Dashboard')}
            onInspect={(opp) => {
              setSelectedOpportunityForDrawer(opp)
              setClockTargetOpp(opp)
            }}
          />
        )}

        {/* 4. MY PROFILE VIEW */}
        {activeTab === 'Profile' && (
          <ProfileView
            profile={profile}
            onSave={(updated) => handleProfileUpdate(updated, 'Student profile updated! Redirected to Radar home.')}
            onNavigateToTune={() => setActiveTab('Tune')}
            onNavigateToDashboard={() => setActiveTab('Dashboard')}
          />
        )}

        {/* 5. TUNE RADAR PREFERENCES VIEW */}
        {activeTab === 'Tune' && (
          <TuneRadarView
            profile={profile}
            onSave={(updated) => handleProfileUpdate(updated, 'Preferences calibrated! Redirected to Radar feed.')}
            onNavigateToDashboard={() => setActiveTab('Dashboard')}
            totalOpportunities={opportunities.length}
          />
        )}

        {/* 6. SETTINGS VIEW */}
        {activeTab === 'Settings' && (
          <SettingsView
            apiConnected={apiConnected}
            onRetryConnection={fetchOpportunitiesFromApi}
            opportunities={opportunities}
            savedIds={saved}
            profile={profile}
            onResetProfile={() => handleProfileUpdate(DEFAULT_PROFILE, 'Profile reset to default — redirected to home.')}
            onClearCustomOpportunities={handleClearCustomOpportunities}
            onNavigateToDashboard={() => setActiveTab('Dashboard')}
          />
        )}
      </main>

      {/* Shared Minimal Footer */}
      <AppFooter />

      {/* Lazy-loaded Dynamic Overlays & Modals */}
      <Suspense fallback={null}>
        {showAdvancedDrawer && (
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
        )}

        {showProfileModal && (
          <ProfileModal
            profile={profile}
            onSave={(updated) => handleProfileUpdate(updated, 'Student profile updated! Redirected to Radar feed.')}
            onClose={() => setShowProfileModal(false)}
          />
        )}

        {showAuthModal && (
          <AuthModal
            currentProfile={profile}
            isLoggedIn={isLoggedIn}
            userEmail={userEmail}
            onLoginSuccess={(newProfile, email) => {
              setIsLoggedIn(true)
              setUserEmail(email)
              handleProfileUpdate(newProfile, `Logged in as ${newProfile.name} — Radar calibrated!`)
            }}
            onLogout={() => {
              setIsLoggedIn(false)
              setShowAuthModal(false)
              setActiveTab('Dashboard')
              setToastMessage('Signed out. Browsing as Guest Student.')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            onClose={() => setShowAuthModal(false)}
          />
        )}

        {showNotifications && (
          <NotificationCenter
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
            onSelectOpportunity={(oppId) => {
              handleFilterUpdate({ searchQuery: oppId })
              const el = document.getElementById('opportunity-feed')
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          />
        )}

        {selectedOpportunityForDrawer && (
          <OpportunityDetailDrawer
            opportunity={selectedOpportunityForDrawer}
            match={selectedOpportunityForDrawer ? matchMap.get(selectedOpportunityForDrawer.id) : undefined}
            isOpen={!!selectedOpportunityForDrawer}
            onClose={() => setSelectedOpportunityForDrawer(null)}
            isSaved={selectedOpportunityForDrawer ? saved.includes(selectedOpportunityForDrawer.id) : false}
            onToggleSave={toggleSave}
            userSkills={profile.skills}
            trackedStatus={selectedOpportunityForDrawer ? applicationStatusMap.get(selectedOpportunityForDrawer.id) : undefined}
            onTrackApplication={handleTrackApplication}
            onSelectCategory={(cat) => {
              handleFilterUpdate({ category: cat })
              setSelectedOpportunityForDrawer(null)
              const el = document.getElementById('opportunity-feed')
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}
          />
        )}
      </Suspense>

      {/* Accessible Toast Notification */}
      {toastMessage && (
        <div className="toast-notice" role="status" aria-live="polite">
          <Check size={15} />
          <span>{toastMessage}</span>
          <button
            type="button"
            className="toast-dismiss"
            onClick={() => setToastMessage('')}
            aria-label="Dismiss notification"
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  )
}

export default App
