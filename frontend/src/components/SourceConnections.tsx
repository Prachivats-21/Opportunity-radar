import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, ExternalLink, RefreshCw, Radio } from 'lucide-react'
import { getSourceOverview, syncSourceFeeds } from '../api'
import type { SourceOverview, SourceStatus } from '../api'

type Props = {
  onRefreshListings: () => Promise<void>
}

const STATUS_COPY: Record<string, string> = {
  connected_with_cached_data: 'Connected · cached listings',
  ready: 'Configured · ready to sync',
  credentials_required: 'API credentials needed',
  board_tokens_required: 'Company board IDs needed',
  site_names_required: 'Company site names needed',
  feed_urls_required: 'Authorized feed URLs needed',
  partner_approval_required: 'Partner/API approval needed',
}

function statusLabel(source: SourceStatus): string {
  return STATUS_COPY[source.status] || source.status.replaceAll('_', ' ')
}

export function SourceConnections({ onRefreshListings }: Props) {
  const [overview, setOverview] = useState<SourceOverview | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const refreshStatus = useCallback(async () => {
    try {
      const status = await getSourceOverview()
      setOverview(status)
      setError('')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Source status is unavailable.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshStatus()
  }, [refreshStatus])

  const handleSync = async () => {
    setSyncing(true)
    setError('')
    setNotice('')
    try {
      const result = await syncSourceFeeds()
      await onRefreshListings()
      await refreshStatus()
      const successful = result.results.filter((item) => item.status === 'ok')
      const failures = result.results.filter((item) => item.status === 'error')
      const updated = successful.reduce((total, item) => total + item.items_received, 0)
      if (result.results.length === 0) {
        setNotice('No feeds are configured yet. Add provider credentials, company board IDs, or authorized feed URLs to the backend environment.')
      } else if (failures.length > 0 || result.status === 'partial') {
        setNotice('Sync finished with ' + failures.length + ' source error(s). Previous cached listings were kept.')
      } else if (updated > 0) {
        setNotice('Sync complete. ' + updated + ' listings refreshed across ' + successful.length + ' source(s).')
      } else {
        setNotice('Configured sources were checked. No new relevant listings were returned.')
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not sync source feeds.')
      await refreshStatus()
    } finally {
      setSyncing(false)
    }
  }

  const readyCount = overview?.sources.filter((source) => source.configured).length ?? 0
  const cachedCount = overview?.cached_opportunity_count ?? 0

  return (
    <section className="source-connections" aria-label="Opportunity source connections">
      <div className="source-connections__top">
        <div className="source-connections__intro">
          <div className="source-connections__eyebrow"><Radio size={14} /> LIVE SOURCES</div>
          <h3>One radar. Multiple opportunity feeds.</h3>
          <p>Check which providers are ready and refresh published listings into your feed.</p>
        </div>
        <button className="source-connections__sync" onClick={handleSync} disabled={syncing || loading}>
          <RefreshCw size={15} className={syncing ? 'source-spin' : ''} />
          <span>{syncing ? 'Syncing sources…' : 'Sync now'}</span>
        </button>
      </div>

      <div className="source-connections__stats">
        <span><strong>{readyCount}</strong> configured</span>
        <span className="source-connections__dot" aria-hidden="true">·</span>
        <span><strong>{cachedCount}</strong> imported listings cached</span>
        {overview?.synced_at && (
          <>
            <span className="source-connections__dot" aria-hidden="true">·</span>
            <span>Last sync {new Date(overview.synced_at).toLocaleString()}</span>
          </>
        )}
      </div>

      {notice && <p className="source-connections__notice" role="status"><CheckCircle2 size={15} />{notice}</p>}
      {error && <p className="source-connections__error" role="alert"><AlertCircle size={15} />{error}</p>}

      <button
        type="button"
        className="source-connections__toggle"
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
      >
        <span>{expanded ? 'Hide source details' : 'View all ' + (overview?.sources.length ?? '…') + ' sources'}</span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expanded && (
        <div className="source-connections__grid">
          {overview?.sources.map((source) => (
            <article className="source-connections__item" key={source.id}>
              <div className="source-connections__item-heading">
                <strong>{source.name}</strong>
                <span className={'source-connections__status ' + (source.status === 'connected_with_cached_data' ? 'is-connected' : source.configured ? 'is-configured' : 'is-pending')}>
                  {statusLabel(source)}
                </span>
              </div>
              <p>{source.note}</p>
              {source.cached_items > 0 && <small>{source.cached_items} cached listing(s)</small>}
              {source.requirements.length > 0 && !source.configured && (
                <small>Needs: {source.requirements.join(', ')}</small>
              )}
              <a href={source.docs_url} target="_blank" rel="noreferrer">
                Provider details <ExternalLink size={12} />
              </a>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
