import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowDownRight, ArrowRight, ArrowUpRight, Bookmark, CalendarDays, Check, ChevronDown, CircleHelp, Compass, ExternalLink, Filter, Flame, Globe2, GraduationCap, Layers3, Menu, Radar, Search, Settings2, Sparkles, Target, Trophy, Users, X } from 'lucide-react'
import { extractOpportunity, getMatches, getOpportunities } from './api'
import type { MatchResult, Opportunity, Profile } from './types'

const defaultProfile: Profile = {
  year: '1', field: 'Computer Science & AI', skills: ['Python', 'AI', 'Communication'],
  interests: ['AI', 'Cybersecurity', 'Hackathons', 'Product Management'],
  preferred_categories: ['Hackathon', 'Internship', 'Competition'], preferred_mode: 'Any', location: 'India', team_size: null,
}
const fallbackOpportunities: Opportunity[] = [
  { id:'cyber-hackathon-bihar-2026', title:'Cyber Hackathon 2026', organization:'Government of Bihar Cyber Hackathon', category:'Hackathon', summary:'Student-focused cyber defence challenge with tracks in AI for cyber defence, digital forensics, threat intelligence and OSINT.', description:'Official guidelines list registration and development from 12 to 26 October 2026. Team requirement listed as three to four students. Confirm the selected problem statement rules.', skills:['cybersecurity','AI','Python','digital forensics'], eligible_years:[], eligible_fields:[], location:'India', mode:'Online', team_min:3, team_max:4, deadline:'2026-10-26', start_date:null, source_url:'https://cyberhackathon.bihar.gov.in/guidelines', source_name:'Official guidelines', last_verified:'2026-10-15', status:'needs_recheck', notes:'Verify current status and complete eligibility.' },
  { id:'nhai-winter-internship-2026', title:'NHAI Winter Internship Programme 2026–27', organization:'National Highways Authority of India', category:'Internship', summary:'Winter internship connected to ongoing National Highway projects, scheduled for December 2026 to January 2027.', description:'The PIB announcement gives an application deadline of 20 October 2026 and notes that institute verification and recommendation are required. Confirm eligible disciplines on the official portal.', skills:['research','engineering','data analysis','project work'], eligible_years:[], eligible_fields:[], location:'India', mode:'On-site / project-based', team_min:null, team_max:null, deadline:'2026-10-20', start_date:'2026-12-01', source_url:'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2299419&lang=1&reg=3', source_name:'Press Information Bureau', last_verified:'2026-10-15', status:'needs_recheck', notes:'Institute recommendation required; discipline eligibility needs confirmation.' },
  { id:'saarthi-26', title:'SAARTHI-26 Student Hackathon', organization:'Graphic Era Hill University', category:'Hackathon', summary:'Student hackathon scheduled for 31 October to 2 November 2026, with AI, healthcare and smart-city tracks.', description:'Official event website lists dates and an application route. Registration deadline and full eligibility need confirmation.', skills:['AI','software development','problem solving','teamwork'], eligible_years:[], eligible_fields:[], location:'Dehradun, India', mode:'Confirm with organizer', team_min:null, team_max:null, deadline:null, start_date:'2026-10-31', source_url:'https://saarthi.gehu.ac.in/', source_name:'Official event website', last_verified:'2026-10-15', status:'needs_recheck', notes:'Confirm registration deadline, eligibility and event format.' },
]
const categoryOptions = ['All opportunities', 'Hackathon', 'Internship', 'Competition', 'Fellowship', 'Scholarship', 'Workshop']
const formatDate = (date: string | null) => date ? new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : 'Not confirmed'
const daysLeft = (date: string | null) => { if (!date) return null; const d = Math.ceil((new Date(`${date}T23:59:59`).getTime() - Date.now()) / 86400000); return d }
const initials = (text: string) => text.split(/\s+/).slice(0,2).map(s=>s[0]).join('').toUpperCase()

function App() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(() => { try { const custom = JSON.parse(window.localStorage.getItem('opportunity-radar-custom') || '[]') as Opportunity[]; return [...fallbackOpportunities, ...custom] } catch { return fallbackOpportunities } })
  const [profile, setProfile] = useState<Profile>(() => { try { const stored = window.localStorage.getItem('opportunity-radar-profile'); return stored ? { ...defaultProfile, ...JSON.parse(stored) } : defaultProfile } catch { return defaultProfile } })
  const [matches, setMatches] = useState<MatchResult[]>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All opportunities')
  const [sort, setSort] = useState('Best match')
  const [saved, setSaved] = useState<string[]>(() => { try { return JSON.parse(window.localStorage.getItem('opportunity-radar-saved') || '[]') as string[] } catch { return [] } })
  const [activeTab, setActiveTab] = useState('Discover')
  const [showProfile, setShowProfile] = useState(false)
  const [showAddOpportunity, setShowAddOpportunity] = useState(false)
  const [listingTitle, setListingTitle] = useState('')
  const [listingUrl, setListingUrl] = useState('')
  const [listingText, setListingText] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState('')
  const [extractWarnings, setExtractWarnings] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(false)
  const [apiNotice, setApiNotice] = useState('')
  const [toast, setToast] = useState('')
  const [skillInput, setSkillInput] = useState('')
  const [interestInput, setInterestInput] = useState('')

  useEffect(() => { getOpportunities().then(items => setOpportunities(prev => [...items, ...prev.filter(item => item.id.startsWith('user-added-'))])).catch(() => setApiNotice('Showing curated listings. Connect the API to calculate personalized matches.')) }, [])
  useEffect(() => { try { window.localStorage.setItem('opportunity-radar-custom', JSON.stringify(opportunities.filter(item => item.id.startsWith('user-added-')))) } catch { /* Storage may be disabled; custom listings remain for this session. */ } }, [opportunities])
  useEffect(() => { try { window.localStorage.setItem('opportunity-radar-profile', JSON.stringify(profile)) } catch { /* Storage may be disabled; the app still works for this session. */ } }, [profile])
  useEffect(() => { try { window.localStorage.setItem('opportunity-radar-saved', JSON.stringify(saved)) } catch { /* Storage may be disabled; the app still works for this session. */ } }, [saved])
  useEffect(() => { if (toast) { const timer = window.setTimeout(() => setToast(''), 2400); return () => window.clearTimeout(timer) } }, [toast])
  useEffect(() => { if (apiNotice) { const timer = window.setTimeout(() => setApiNotice(''), 7000); return () => window.clearTimeout(timer) } }, [apiNotice])

  const visible = useMemo(() => {
    let list = [...opportunities]
    if (activeTab === 'Saved') list = list.filter(item => saved.includes(item.id))
    if (category !== 'All opportunities') list = list.filter(item => item.category === category)
    if (query.trim()) { const q = query.toLowerCase(); list = list.filter(item => [item.title,item.organization,item.summary,item.category,...item.skills].join(' ').toLowerCase().includes(q)) }
    if (sort === 'Deadline soon') list.sort((a,b) => (a.deadline || '9999').localeCompare(b.deadline || '9999'))
    else if (sort === 'Newest added') list.sort((a,b) => (b.last_verified || '').localeCompare(a.last_verified || ''))
    else if (matches.length) { const scores = new Map(matches.map(m => [m.opportunity.id,m.score])); list.sort((a,b) => (scores.get(b.id) || 0) - (scores.get(a.id) || 0)) }
    return list
  }, [opportunities, activeTab, saved, category, query, sort, matches])
  const matchMap = useMemo(() => new Map(matches.map(m => [m.opportunity.id, m])), [matches])

  async function calculateMatches() {
    setLoading(true)
    try {
      const results = await getMatches(profile, opportunities)
      setMatches(results)
      setOpportunities(prev => prev.map(item => item))
      setSort('Best match')
      setToast('Your matches have been refreshed')
    } catch {
      // Useful offline fallback: transparent keyword/category matching, never claim it came from AI.
      const p = [...profile.skills, ...profile.interests, profile.field].join(' ').toLowerCase()
      const local: MatchResult[] = opportunities.map(opportunity => {
        const terms = [...opportunity.skills, opportunity.category, opportunity.summary].map(s=>s.toLowerCase())
        const hits = terms.filter(t => p.includes(t) || t.split(/\W+/).some(token => token.length > 3 && p.includes(token)))
        const score = Math.min(92, 28 + hits.length * 11 + (profile.preferred_categories.includes(opportunity.category) ? 15 : 0))
        const expired = !!opportunity.deadline && daysLeft(opportunity.deadline)! < 0
        return { opportunity, score: expired ? 0 : score, eligibility: expired ? 'expired' : 'potentially_eligible', reasons: hits.length ? [`Profile overlaps with ${[...new Set(hits)].slice(0,3).join(', ')}.`] : ['Add more skills or interests to improve relevance.'], skill_gaps: opportunity.skills.filter(s=>!p.includes(s.toLowerCase())).slice(0,4), explanation: 'Keyword-based fallback ranking. Start the backend and local Gemma model for AI-generated explanations.' }
      }).sort((a,b)=>b.score-a.score)
      setMatches(local)
      setSort('Best match')
      setToast('Local fallback matches ready')
      setApiNotice('AI service unavailable. These are keyword-based fallback scores, not model-generated recommendations.')
    } finally { setLoading(false) }
  }
  function toggleSaved(id: string) { setSaved(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev,id]); setToast(saved.includes(id) ? 'Removed from saved' : 'Saved for later') }
  function addChip(kind: 'skills'|'interests', value: string) { const clean = value.trim(); if (!clean) return; setProfile(prev => ({...prev, [kind]: [...new Set([...prev[kind], clean])] })); if (kind==='skills') setSkillInput(''); else setInterestInput('') }

  return <div className="app-shell">
    <div className="ambient ambient-one"/><div className="ambient ambient-two"/>
    <aside className="sidebar">
      <a className="brand" href="#top" aria-label="Opportunity Radar home"><span className="brand-mark"><Radar size={24}/><i/></span><span>opportunity<span className="brand-light">radar</span><small>YOUR NEXT MOVE, FOUND.</small></span></a>
      <div className="side-section-label">WORKSPACE</div>
      <nav className="side-nav">
        <button className={activeTab==='Discover'?'nav-item active':'nav-item'} onClick={()=>setActiveTab('Discover')}><Compass size={18}/> Discover <span className="nav-count">{opportunities.length}</span></button>
        <button className={activeTab==='For you'?'nav-item active':'nav-item'} onClick={()=>{setActiveTab('For you'); calculateMatches()}}><Sparkles size={18}/> For you <span className="new-dot"/></button>
        <button className={activeTab==='Saved'?'nav-item active':'nav-item'} onClick={()=>setActiveTab('Saved')}><Bookmark size={18}/> Saved <span className="nav-count">{saved.length}</span></button>
      </nav>
      <div className="side-section-label explore-label">EXPLORE</div>
      <div className="category-nav">
        {categoryOptions.slice(1).map((item,i)=><button key={item} className={category===item?'category-link selected':'category-link'} onClick={()=>{setCategory(category===item?'All opportunities':item);setActiveTab('Discover')}}><span className={`category-icon c-${i}`}><CategoryIcon category={item}/></span>{item}<ArrowUpRight size={13} className="cat-arrow"/></button>)}
      </div>
      <div className="sidebar-bottom">
        <div className="mini-radar-card"><div className="mini-radar-art"><span/><span/><span/><i/></div><p>YOUR NEXT BIG THING<br/><strong>is out there.</strong></p><button onClick={()=>setShowProfile(true)}>Tune your radar <ArrowRight size={14}/></button></div>
        <button className="sidebar-profile" onClick={()=>setShowProfile(true)}><div className="avatar">{initials(profile.field==='Not specified'?'Your profile':profile.field)}</div><span><strong>Your profile</strong><small>{profile.year==='Not specified'?'Add your details':`Year ${profile.year} · ${profile.field}`}</small></span><Settings2 size={17}/></button>
      </div>
    </aside>

    <main className="main-content" id="top">
      <header className="topbar"><div className="breadcrumb"><span>Workspace</span><span className="crumb-slash">/</span><strong>{activeTab}</strong></div><div className="top-actions"><span className="status-pill"><span/> OPEN OPPORTUNITIES</span><button className="icon-button mobile-menu" aria-label="Open menu"><Menu size={19}/></button><button className="profile-button" onClick={()=>setShowProfile(true)}><div className="avatar small-avatar">{initials(profile.field==='Not specified'?'You':profile.field)}</div><ChevronDown size={15}/></button></div></header>
      <section className="hero-section">
        <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line"/> THE WORLD IS YOUR PLAYGROUND</div><h1>Big things don't<br/>find <em>themselves.</em></h1><p className="hero-description">Hackathons, internships, fellowships and more. A little less endless scrolling, a lot more <span>getting somewhere.</span></p><div className="hero-cta-row"><button className="primary-button" onClick={calculateMatches} disabled={loading}>{loading ? <span className="spinner"/> : <Sparkles size={17}/>} {loading?'Finding your matches':'Find my opportunities'} <ArrowRight size={16}/></button><button className="text-button" onClick={()=>setShowProfile(true)}>Personalize radar <ArrowUpRight size={16}/></button></div><div className="hero-proof"><div className="proof-avatars"><span>P</span><span>A</span><span>R</span></div><span><strong>Made for the ambitious</strong><small>Start with your interests. Go from there.</small></span></div></div>
        <div className="hero-art" aria-label="Decorative 3D radar illustration"><div className="art-grid"/><div className="orbit orbit-a"/><div className="orbit orbit-b"/><div className="orbit orbit-c"/><div className="radar-core"><div className="core-glow"/><div className="core-face"><Radar size={58} strokeWidth={1.2}/></div><div className="core-ring ring-one"/><div className="core-ring ring-two"/></div><div className="orbit-node node-one"><Trophy size={17}/></div><div className="orbit-node node-two"><GraduationCap size={18}/></div><div className="orbit-node node-three"><Flame size={16}/></div><div className="orbit-node node-four"><Target size={17}/></div><div className="art-label label-top"><span/> OPPORTUNITY SIGNAL <b>ACTIVE</b></div><div className="art-label label-bottom"><span className="tiny-wave">⌁</span> YOUR POTENTIAL, IN RANGE</div><div className="floating-chip chip-one"><Sparkles size={13}/> New match found</div><div className="floating-chip chip-two"><span className="chip-dot"/> Radar is warming up</div></div>
      </section>

      <section className="stat-strip"><div className="stat-item"><span className="stat-icon violet"><Layers3 size={17}/></span><span><strong>{opportunities.length.toString().padStart(2,'0')}</strong><small>Curated listings</small></span></div><div className="stat-item"><span className="stat-icon cyan"><Target size={17}/></span><span><strong>{matches.length ? matches.filter(m=>m.score>=60).length.toString().padStart(2,'0') : '—'}</strong><small>Strong matches</small></span></div><div className="stat-item"><span className="stat-icon orange"><CalendarDays size={17}/></span><span><strong>{opportunities.filter(o=>o.deadline && (daysLeft(o.deadline) ?? -1)>=0).length.toString().padStart(2,'0')}</strong><small>Upcoming deadlines</small></span></div><div className="stat-footnote"><span className="pulse-dot"/> Listings include original source links</div></section>

      <section className="discover-section">
        <div className="section-heading"><div><div className="eyebrow section-eyebrow">THE RADAR FEED</div><h2>{activeTab==='Saved'?'Your saved list':activeTab==='For you'?'Picked for your potential':'Opportunities worth your time'}<span className="heading-sparkle">✳</span></h2><p>Curated signals, not another 47 open tabs.</p></div><div className="heading-actions"><button className="outline-button add-listing-button" onClick={()=>{setExtractError('');setExtractWarnings([]);setShowAddOpportunity(true)}}><span>+</span> Add opportunity</button><button className="outline-button" onClick={()=>setShowProfile(true)}><Settings2 size={16}/> Edit preferences</button></div></div>
        {apiNotice && <div className="notice"><CircleHelp size={16}/><span>{apiNotice}</span><button onClick={()=>setApiNotice('')} aria-label="Dismiss notice"><X size={15}/></button></div>}
        <div className="toolbar"><label className="search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search roles, skills, organizations..."/><kbd>⌘ K</kbd></label><button className={`filter-button ${showFilters?'filter-active':''}`} onClick={()=>setShowFilters(v=>!v)}><Filter size={16}/> Filters {category!=='All opportunities'&&<span className="filter-count">1</span>}</button><label className="sort-select"><span>Sort:</span><select value={sort} onChange={e=>setSort(e.target.value)}><option>Best match</option><option>Deadline soon</option><option>Newest added</option></select><ChevronDown size={14}/></label></div>
        {showFilters && <motion.div className="filter-panel" initial={{opacity:0,y:-5}} animate={{opacity:1,y:0}}><div><label>Opportunity type</label><select value={category} onChange={e=>setCategory(e.target.value)}>{categoryOptions.map(c=><option key={c}>{c}</option>)}</select></div><div><label>Format preference</label><select value={profile.preferred_mode} onChange={e=>setProfile(p=>({...p,preferred_mode:e.target.value}))}><option>Any</option><option>Online</option><option>On-site</option><option>Hybrid</option></select></div><button className="clear-filters" onClick={()=>{setCategory('All opportunities');setProfile(p=>({...p,preferred_mode:'Any'}));setQuery('')}}>Clear filters</button></motion.div>}
        <div className="result-count"><span>SHOWING <strong>{visible.length}</strong> OPPORTUNITIES</span><span className="verified-legend"><span/> Source-linked · Recheck before applying</span></div>
        <div className="opportunity-grid">
          {visible.map((item,index)=>{ const match = matchMap.get(item.id); const remaining = daysLeft(item.deadline); const isSaved=saved.includes(item.id); return <motion.article className="opportunity-card" key={item.id} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:index*.045,duration:.28}} whileHover={{y:-3}}>
            <div className="card-topline"><div className={`org-monogram monogram-${index%5}`}>{initials(item.organization)}</div><div className="card-org"><strong>{item.organization}</strong><span>{item.category}</span></div><button className={`save-button ${isSaved?'saved':''}`} onClick={()=>toggleSaved(item.id)} aria-label={isSaved?'Remove saved opportunity':'Save opportunity'}><Bookmark size={17} fill={isSaved?'currentColor':'none'}/></button></div>
            <h3>{item.title}</h3><p className="card-summary">{item.summary}</p>
            <div className="tag-row">{item.skills.slice(0,3).map(skill=><span className="skill-tag" key={skill}>{skill}</span>)}{item.skills.length>3&&<span className="skill-more">+{item.skills.length-3}</span>}</div>
            <div className="card-meta"><span><Globe2 size={14}/>{item.mode==='Confirm with organizer'?'Format unconfirmed':item.mode}</span><span><CalendarDays size={14}/>{item.deadline ? `Due ${formatDate(item.deadline)}` : 'Deadline unconfirmed'}</span></div>
            {match && <div className="match-explanation"><div className="match-meter"><span style={{width:`${match.score}%`}}/></div><div className="match-copy"><span className="match-label"><Sparkles size={13}/> {match.score}% profile overlap</span><p>{match.reasons[0]}</p></div></div>}
            <div className="card-bottom"><div className="deadline-state">{remaining===null?<span className="unknown-state"><CircleHelp size={13}/> Confirm deadline</span>:remaining<0?<span className="expired-state">Deadline passed</span>:remaining<=5?<span className="urgent-state"><span/> {remaining===0?'Due today':`${remaining} days left`}</span>:<span className="normal-state">{remaining} days left</span>}<span className="eligibility-state">{match?.eligibility==='eligible'?'Eligible':match?.eligibility==='not_eligible'?'Requirement conflict':match?.eligibility==='expired'?'Expired':'Eligibility to verify'}</span></div><a className="card-link" href={item.source_url} target="_blank" rel="noreferrer">View opportunity <ExternalLink size={14}/></a></div>
            <div className="source-note">Source: {item.source_name} · checked {formatDate(item.last_verified)}</div>
          </motion.article> })}
          {visible.length===0 && <div className="empty-state"><div className="empty-orb"><Search size={24}/></div><h3>No signals found</h3><p>Try a different search or clear your filters. The opportunity universe is large; this little dataset is still growing.</p><button className="outline-button" onClick={()=>{setQuery('');setCategory('All opportunities');setActiveTab('Discover')}}>Reset discovery</button></div>}
        </div>
        <div className="data-disclaimer"><CircleHelp size={15}/><span>Listings are a small curated starting set, not a live feed. Verify dates, eligibility, and requirements on the organizer's original page.</span></div>
      </section>
      <footer className="footer"><a className="footer-brand" href="#top"><Radar size={17}/> Opportunity Radar</a><span>Built for people who are going places.</span><span className="footer-version">OPEN-WEIGHT AI · EXPLAINABLE MATCHES</span></footer>
    </main>
    {showProfile && <div className="modal-backdrop" onClick={()=>setShowProfile(false)}><motion.div className="profile-modal" initial={{opacity:0,y:15,scale:.98}} animate={{opacity:1,y:0,scale:1}} onClick={e=>e.stopPropagation()}><div className="modal-heading"><div><span className="modal-kicker"><Radar size={15}/> TUNE YOUR RADAR</span><h2>Your next move starts here.</h2><p>A few details help us make the feed more relevant.</p></div><button className="icon-button" onClick={()=>setShowProfile(false)} aria-label="Close profile"><X size={19}/></button></div><div className="profile-form"><div className="form-row"><label>Academic year<select value={profile.year} onChange={e=>setProfile(p=>({...p,year:e.target.value}))}><option value="Not specified">Prefer not to say</option><option value="1">1st year</option><option value="2">2nd year</option><option value="3">3rd year</option><option value="4">4th year</option><option value="Graduate">Graduate</option></select></label><label>Field of study<input value={profile.field} onChange={e=>setProfile(p=>({...p,field:e.target.value}))} placeholder="e.g. Computer Science & AI"/></label></div><label className="full-label">Skills <span>What can you do?</span></label><div className="chip-editor">{profile.skills.map(s=><button key={s} className="editable-chip" onClick={()=>setProfile(p=>({...p,skills:p.skills.filter(x=>x!==s)}))}>{s}<X size={12}/></button>)}<form onSubmit={e=>{e.preventDefault();addChip('skills',skillInput)}}><input value={skillInput} onChange={e=>setSkillInput(e.target.value)} placeholder="Add a skill + Enter"/></form></div><label className="full-label">Interests <span>What gets you curious?</span></label><div className="chip-editor">{profile.interests.map(s=><button key={s} className="editable-chip interest-chip" onClick={()=>setProfile(p=>({...p,interests:p.interests.filter(x=>x!==s)}))}>{s}<X size={12}/></button>)}<form onSubmit={e=>{e.preventDefault();addChip('interests',interestInput)}}><input value={interestInput} onChange={e=>setInterestInput(e.target.value)} placeholder="Add an interest + Enter"/></form></div><div className="form-row"><label>Preferred opportunities<select value={profile.preferred_categories[0]||'Any'} onChange={e=>setProfile(p=>({...p,preferred_categories:e.target.value==='Any'?[]:[e.target.value]}))}><option>Any</option><option>Hackathon</option><option>Internship</option><option>Competition</option><option>Fellowship</option><option>Scholarship</option><option>Workshop</option></select></label><label>Preferred format<select value={profile.preferred_mode} onChange={e=>setProfile(p=>({...p,preferred_mode:e.target.value}))}><option>Any</option><option>Online</option><option>On-site</option><option>Hybrid</option></select></label></div><div className="modal-privacy"><span><Check size={15}/></span><p>No account needed. Your profile and saved items are stored in this browser on this device. Avoid entering sensitive personal information.</p></div><div className="modal-actions"><button className="text-button" onClick={()=>setShowProfile(false)}>Cancel</button><button className="primary-button" onClick={()=>{setShowProfile(false);calculateMatches()}}><Sparkles size={16}/> Save & find matches <ArrowRight size={15}/></button></div></div></motion.div></div>}
    {showAddOpportunity && <div className="modal-backdrop" onClick={()=>!extracting&&setShowAddOpportunity(false)}><motion.div className="profile-modal listing-modal" initial={{opacity:0,y:15,scale:.98}} animate={{opacity:1,y:0,scale:1}} onClick={e=>e.stopPropagation()}><div className="modal-heading"><div><span className="modal-kicker"><Sparkles size={15}/> ADD A SIGNAL</span><h2>Bring an opportunity onto the radar.</h2><p>Paste the listing text and its original source. Gemma will extract the details it can actually find.</p></div><button className="icon-button" onClick={()=>!extracting&&setShowAddOpportunity(false)} aria-label="Close add opportunity"><X size={19}/></button></div><form className="profile-form" onSubmit={async e=>{e.preventDefault();setExtracting(true);setExtractError('');setExtractWarnings([]);try{const result=await extractOpportunity({title_hint:listingTitle,source_url:listingUrl,raw_text:listingText});setOpportunities(prev=>[result.opportunity,...prev]);setExtractWarnings(result.warnings);setShowAddOpportunity(false);setListingTitle('');setListingUrl('');setListingText('');setActiveTab('Discover');setCategory('All opportunities');setToast('Opportunity extracted and added to your radar')}catch(err){setExtractError(err instanceof Error?err.message:'Extraction failed. Check the API and local Gemma model.')}finally{setExtracting(false)}}}><label className="full-label">Listing title <span>Optional hint</span></label><input className="listing-input" value={listingTitle} onChange={e=>setListingTitle(e.target.value)} placeholder="e.g. National AI Hackathon 2026"/><label className="full-label">Original source URL <span>Required</span></label><input className="listing-input" type="url" required value={listingUrl} onChange={e=>setListingUrl(e.target.value)} placeholder="https://official-event-page.example"/><label className="full-label">Opportunity description <span>Paste the visible listing text</span></label><textarea className="listing-textarea" required minLength={80} value={listingText} onChange={e=>setListingText(e.target.value)} placeholder="Paste eligibility, deadline, skills, team size, and other details from the source page. At least 80 characters." rows={7}/><p className="listing-helper">We don't scrape the source page automatically. Only the text you paste is sent to your configured model for extraction. Unknown fields remain unknown.</p>{extractError&&<div className="form-error"><CircleHelp size={15}/>{extractError}</div>}{extractWarnings.length>0&&<div className="form-warning">{extractWarnings.map(w=><p key={w}>{w}</p>)}</div>}<div className="modal-actions"><button type="button" className="text-button" onClick={()=>setShowAddOpportunity(false)} disabled={extracting}>Cancel</button><button type="submit" className="primary-button" disabled={extracting}>{extracting?<span className="spinner"/>:<Sparkles size={16}/>} {extracting?'Extracting with Gemma…':'Extract & add listing'} <ArrowRight size={15}/></button></div></form></motion.div></div>}
    {toast && <motion.div className="toast" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}><Check size={16}/>{toast}</motion.div>}
  </div>
}
function CategoryIcon({category}:{category:string}) { if(category==='Hackathon')return <Trophy size={15}/>; if(category==='Internship')return <GraduationCap size={15}/>; if(category==='Competition')return <Flame size={15}/>; if(category==='Fellowship')return <Users size={15}/>; return <Sparkles size={15}/> }
export default App
