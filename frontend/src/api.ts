import type { MatchResult, Opportunity, Profile } from './types'
const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') || 'http://127.0.0.1:8000'

export async function healthCheck(): Promise<{ status: string }> {
  const response = await fetch(`${API_URL}/health`)
  if (!response.ok) throw new Error('Backend health check failed.')
  return response.json()
}

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

export async function syncOpportunities(): Promise<{ status: string; total: number; added: number; sources: string[]; message: string }> {
  const response = await fetch(`${API_URL}/api/sync`, { method: 'POST' })
  if (!response.ok) throw new Error('Live opportunity sync failed.')
  return response.json()
}

