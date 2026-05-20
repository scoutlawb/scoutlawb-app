import { categoryLabel } from '../data/categories'
import type { NetworkSignal, RepoStatus } from '../types/domain'

type MetricsStripProps = {
  signal: NetworkSignal
  status: RepoStatus
  opportunityCount: number
  savedCount: number
}

export function MetricsStrip({ signal, status, opportunityCount, savedCount }: MetricsStripProps) {
  const metrics = [
    {
      label: 'Repos indexed',
      value: signal.totalRepos.toLocaleString(),
      delta: status.kind === 'live' ? 'live node' : status.kind === 'snapshot' ? 'prefetched snapshot' : 'offline sample',
    },
    { label: 'Updated 24h', value: signal.updated24h.toLocaleString(), delta: `${signal.recentlyUpdated} this week`, positive: true },
    { label: 'Stars tracked', value: signal.starsTracked.toLocaleString(), delta: 'public signal', positive: true },
    { label: 'Top category', value: categoryLabel(signal.topCategory), delta: `${signal.categoryDensity[signal.topCategory]}% share` },
    { label: 'Opportunity gaps', value: opportunityCount.toLocaleString(), delta: 'ranked ideas', warn: true },
    { label: 'Saved ideas', value: savedCount.toLocaleString(), delta: 'localStorage' },
  ]

  return (
    <section className="metrics-strip" aria-label="GitLawb network metrics">
      {metrics.map((metric) => (
        <div className="metric-cell" key={metric.label}>
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
          <em className={metric.warn ? 'warn' : metric.positive ? 'positive' : ''}>{metric.delta}</em>
        </div>
      ))}
    </section>
  )
}
