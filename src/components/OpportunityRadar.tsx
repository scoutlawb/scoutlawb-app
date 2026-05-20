import { Activity, Radar } from 'lucide-react'
import { categories, categoryLabel } from '../data/categories'
import type { NetworkSignal, RepoStatus } from '../types/domain'

type OpportunityRadarProps = {
  signal: NetworkSignal
  status: RepoStatus
}

export function OpportunityRadar({ signal, status }: OpportunityRadarProps) {
  const rows = categories.map((category) => {
    const count = signal.categoryCounts[category.id]
    const max = Math.max(...Object.values(signal.categoryCounts), 1)
    const density = Math.round((count / max) * 100)
    const gap = Math.max(12, 100 - density)

    return {
      ...category,
      count,
      density,
      gap,
    }
  })

  return (
    <section className="radar-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Opportunity Radar</p>
          <h2>Build signal, not repo browsing</h2>
        </div>
        <div className="scan-badge">
          <Activity size={14} />
          {status.kind === 'loading' ? 'scanning' : `${signal.totalRepos.toLocaleString()} repos indexed`}
        </div>
      </div>

      <div className="metric-strip">
        <Metric label="Recently updated" value={signal.recentlyUpdated.toLocaleString()} />
        <Metric label="Stars tracked" value={signal.starsTracked.toLocaleString()} />
        <Metric label="Top category" value={categoryLabel(signal.topCategory)} />
        <Metric label="Signal source" value={status.kind === 'live' ? 'Live node' : 'Fallback sample'} />
      </div>

      <div className="radar-grid">
        {rows.map((row) => (
          <article key={row.id} className="radar-card">
            <div className="radar-card-head">
              <Radar size={15} />
              <span>{row.short}</span>
              <b>{row.gap}% gap</b>
            </div>
            <div className="bar-track" aria-label={`${row.label} density`}>
              <span style={{ width: `${Math.max(6, row.density)}%` }} />
            </div>
            <p>
              {row.count} repos detected.{' '}
              {row.gap > 70 ? 'Underbuilt lane.' : row.gap > 42 ? 'Room for focus.' : 'Needs a sharper wedge.'}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-cell">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
