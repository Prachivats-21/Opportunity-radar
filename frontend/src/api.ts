import type { MatchResult, Opportunity, Profile } from './types'
const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || 'http://127.0.0.1:8000'

export async function getOpportunities(): Promise<Opportunity[]> {
  const response = await fetch(`${API_URL}/api/opportunities`)
  if (!response.ok) throw new Error('Could not load opportunities from the API.')
  return response.json()
}
export async function getMatches(profile: Profile, opportunities: Opportunity[]): Promise<MatchResult[]> {
  const { name: _name, ...profilePayload } = profile
  const response = await fetch(`${API_URL}/api/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile: profilePayload, opportunities })
  })
  if (!response.ok) throw new Error('Could not calculate matches. Check that the API is running.')
  return response.json()
}

export async function extractOpportunity(input: { title_hint: string; source_url: string; raw_text: string }): Promise<{ opportunity: Opportunity; warnings: string[]; ai_used: boolean }> {
  const response = await fetch(`${API_URL}/api/extract`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })
  if (!response.ok) { let detail = 'Could not extract the listing.'; try { const payload = await response.json(); detail = typeof payload.detail === 'string' ? payload.detail : detail } catch { /* Keep safe generic error. */ } throw new Error(detail) }
  return response.json()
}

 
export type SourceStatus = {
  id: string
  name: string
  types: string[]
  mode: string
  docs_url: string
  requirements: string[]
  configured: boolean
  status: string
  note: string
  cached_items: number
}

export type SourceOverview = {
  synced_at: string | null
  configured_count: number
  cached_opportunity_count: number
  sync_interval_minutes: number
  automatic_sync_enabled: boolean
  sources: SourceStatus[]
}

export type SourceSyncResult = {
  status: string
  synced_at: string | null
  imported_count: number
  results: Array<{
    source_id: string
    status: string
    items_received: number
    cached_items: number
    error?: string
  }>
}

export async function getSourceOverview(): Promise<SourceOverview> {
  const response = await fetch(\`\${API_URL}/api/sources\`)
  if (!response.ok) throw new Error('Could not load source connection status.')
  return response.json()
}

export async function syncSourceFeeds(): Promise<SourceSyncResult> {
  const response = await fetch(\`\${API_URL}/api/sources/sync\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  })
  if (!response.ok) {
    let detail = 'Could not sync source feeds.'
    try {
      const payload = await response.json()
      if (typeof payload.detail === 'string') detail = payload.detail
    } catch { /* Keep the safe generic message. */ }
    throw new Error(detail)
  }
  return response.json()
}
