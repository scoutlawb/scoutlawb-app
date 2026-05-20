import { Activity, Copy, Star } from 'lucide-react'
import { categoryLabel } from '../data/categories'
import { buildRepoIdeaPrompt } from '../lib/prompts'
import { repoSignalLabel, repoSignalScore } from '../lib/repos'
import type { NetworkSignal, Repo, RepoStatus } from '../types/domain'

type RepoStreamProps = {
  repos: Repo[]
  status: RepoStatus
  signal: NetworkSignal
  onCopyText: (text: string, message: string) => void
  currentPage: number
  totalPages: number
  totalRepos: number
  onPageChange: (page: number) => void
  showHeading?: boolean
}

function formatRelative(value: string) {
  const time = new Date(value).getTime()
  if (!Number.isFinite(time)) return 'unknown'
  const delta = Date.now() - time
  if (delta < 60_000) return 'now'
  if (delta < 3_600_000) return `${Math.round(delta / 60_000)}m ago`
  if (delta < 86_400_000) return `${Math.round(delta / 3_600_000)}h ago`
  return `${Math.round(delta / 86_400_000)}d ago`
}

function shortDid(value: string, fallback: string) {
  if (!value) return fallback
  if (value.length <= 22) return value
  return `${value.slice(0, 14)}...${value.slice(-6)}`
}

export function RepoStream({
  repos,
  status,
  signal,
  onCopyText,
  currentPage,
  totalPages,
  totalRepos,
  onPageChange,
  showHeading = true,
}: RepoStreamProps) {
  return (
    <section className="repo-stream">
      {showHeading ? (
        <div className="module-heading sticky-heading">
          <div className="module-title">
            <Activity size={15} />
            <h2>Live repo stream</h2>
            <span>// {status.kind === 'loading' ? 'syncing public node' : `${repos.length} shown`}</span>
          </div>
          <div className="stream-state">
            <i className={status.kind === 'live' ? 'ok' : 'sample'} />
            {status.kind === 'live' ? 'live' : status.kind === 'loading' ? 'syncing' : status.kind === 'snapshot' ? 'snapshot' : 'sample'}
          </div>
        </div>
      ) : null}

      <div className="repo-table-head" aria-hidden="true">
        <span>repo · owner did</span>
        <span>category</span>
        <span>updated</span>
        <span>stars</span>
        <span>signal</span>
      </div>

      <div className="repo-list">
        {repos.length ? (
          repos.map((repo, index) => {
            const signalName = repoSignalLabel(repo)
            const cloneText = repo.cloneUrl || `gitlawb clone ${repo.owner}/${repo.name}`

            return (
              <article className={`repo-row ${index % 2 ? 'alt' : ''}`} key={repo.id}>
                <div className="repo-row-main">
                  <div className="repo-identity">
                    <div>
                      {repo.repoUrl ? (
                        <a href={repo.repoUrl} target="_blank" rel="noreferrer">
                          {repo.name}
                        </a>
                      ) : (
                        <strong>{repo.name}</strong>
                      )}
                      <code>{shortDid(repo.ownerDid, repo.owner)}</code>
                    </div>
                    <p>{repo.description}</p>
                  </div>

                  <span className="repo-category">{categoryLabel(repo.category)}</span>
                  <span className="repo-updated">{formatRelative(repo.updatedAt)}</span>
                  <span className="repo-stars">
                    <Star size={13} />
                    {repo.stars.toLocaleString()}
                  </span>
                  <span className={`repo-signal ${signalName}`}>● {signalName} {repoSignalScore(repo)}</span>
                </div>

                <div className="repo-command-row">
                  <code>
                    <span>$</span> {cloneText}
                  </code>
                  <button type="button" className="console-button" onClick={() => onCopyText(cloneText, 'Clone command copied')}>
                    <Copy size={13} />
                    copy clone
                  </button>
                  <button
                    type="button"
                    className="console-button primary-action"
                    onClick={() => onCopyText(buildRepoIdeaPrompt(repo, signal), 'Repo-based Playground prompt copied')}
                  >
                    <Copy size={13} />
                    copy project prompt
                  </button>
                  {repo.repoUrl ? (
                    <a className="console-button subtle" href={repo.repoUrl} target="_blank" rel="noreferrer">
                      open
                    </a>
                  ) : (
                    <button
                      type="button"
                      className="console-button subtle"
                      onClick={() => onCopyText(cloneText, 'GitLawb clone URL copied')}
                    >
                      copy url
                    </button>
                  )}
                </div>
              </article>
            )
          })
        ) : (
          <div className="empty-state stream-empty">
            <strong>No matching repos in this scan.</strong>
            <span>Adjust filters or widen the search.</span>
          </div>
        )}
      </div>

      <div className="repo-pager" aria-label="Repo pagination">
        <button type="button" className="console-button subtle" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>
          previous
        </button>
        <span>
          page {currentPage} / {totalPages} · {totalRepos.toLocaleString()} repos
        </span>
        <button
          type="button"
          className="console-button subtle"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          next
        </button>
      </div>
    </section>
  )
}
