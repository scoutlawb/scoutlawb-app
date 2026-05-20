import { DatabaseZap, RefreshCw, Settings, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { aiConfig } from '../lib/ai'
import { NODE_API } from '../lib/repos'
import type { NetworkSignal, RepoStatus } from '../types/domain'

type HeaderProps = {
  status: RepoStatus
  signal: NetworkSignal
  onRefresh: () => void
}

function formatSyncTime(value: string) {
  const delta = Date.now() - new Date(value).getTime()
  if (!Number.isFinite(delta)) return 'unknown'
  if (delta < 60_000) return `${Math.max(1, Math.round(delta / 1000))}s ago`
  if (delta < 3_600_000) return `${Math.round(delta / 60_000)}m ago`
  return `${Math.round(delta / 3_600_000)}h ago`
}

export function Header({ status, signal, onRefresh }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="brand-cluster">
        <img src="/brand/logo-mark.png" alt="" className="brand-mark" />
        <div>
          <h1>
            Scout<span>Lawb</span>
          </h1>
          <p>GitLawb signal to Playground ideas</p>
        </div>
      </div>

      <div className="protocol-stats" aria-label="Protocol sync status">
        <Stat label="Node" value={new URL(NODE_API).host} />
        <Stat
          label="Sync"
          value={
            <span className="inline-status">
              <i className={status.kind === 'live' ? 'ok' : status.kind === 'loading' ? 'warn' : 'sample'} />
              {status.kind === 'loading'
                ? 'syncing'
                : status.kind === 'live'
                  ? 'healthy'
                  : status.kind === 'snapshot'
                    ? 'snapshot'
                    : 'sample'}
            </span>
          }
        />
        <Stat label="Indexed" value={signal.totalRepos.toLocaleString()} />
        <Stat label="Latency" value={signal.latencyMs ? `${signal.latencyMs}ms` : 'n/a'} />
        <Stat label="Last sync" value={formatSyncTime(signal.lastSyncAt)} />
      </div>

      <div className="header-actions">
        <div className={`state-pill ${status.kind}`}>
          <DatabaseZap size={14} />
          <span>{status.label}</span>
        </div>
        <div className={`state-pill ${aiConfig.enabled ? 'live' : 'sample'}`}>
          <Sparkles size={14} />
          <span>{aiConfig.enabled ? 'MiMo ready' : 'Local ideas'}</span>
        </div>
        <button type="button" className="icon-button" aria-label="Settings">
          <Settings size={14} />
        </button>
        <button type="button" className="console-button" onClick={onRefresh} disabled={status.kind === 'loading'}>
          <RefreshCw size={15} className={status.kind === 'loading' ? 'spin' : ''} />
          {status.kind === 'loading' ? 'syncing' : 'refresh'}
        </button>
      </div>
    </header>
  )
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="header-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
