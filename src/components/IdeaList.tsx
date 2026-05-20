import { Copy, GitFork, TrendingUp } from 'lucide-react'
import { categoryLabel, categoryShort } from '../data/categories'
import type { Idea } from '../types/domain'

type IdeaListProps = {
  ideas: Idea[]
  selectedId?: string
  savedIds: string[]
  compareIds: string[]
  onSelect: (ideaId: string) => void
  onCopyPrompt: (idea: Idea) => void
  currentPage: number
  totalPages: number
  totalIdeas: number
  startRank: number
  onPageChange: (page: number) => void
  showHeading?: boolean
}

export function IdeaList({
  ideas,
  selectedId,
  savedIds,
  compareIds,
  onSelect,
  onCopyPrompt,
  currentPage,
  totalPages,
  totalIdeas,
  startRank,
  onPageChange,
  showHeading = true,
}: IdeaListProps) {
  return (
    <section className="opportunity-panel">
      {showHeading ? (
        <div className="module-heading">
          <div className="module-title">
            <TrendingUp size={15} />
            <h2>Opportunity gaps / recommended ideas</h2>
            <span>// {ideas.length} ranked · Playground-ready</span>
          </div>
        </div>
      ) : null}

      <div className="idea-grid">
        {ideas.length ? (
          ideas.map((idea, index) => (
            <article
              key={idea.id}
              className={`idea-card ${selectedId === idea.id ? 'active' : ''}`}
            >
              <button type="button" className="idea-select" onClick={() => onSelect(idea.id)}>
                <span className="rank">#{startRank + index}</span>
                <span className="idea-card-body">
                  <span className="idea-meta-line">
                    <em>{categoryShort(idea.category)}</em>
                    <b>score {idea.score}</b>
                    {idea.source === 'mimo' ? <em className="ai-tag">mimo</em> : null}
                  </span>
                  <strong>{idea.name}</strong>
                  <span>{idea.pitch}</span>
                </span>
              </button>

              <div className="idea-signal-row">
                <span>
                  <i>category</i>
                  {categoryLabel(idea.category)}
                </span>
                <span>
                  <i>repos</i>
                  {idea.crowdedness}
                </span>
                <span>
                  <i>use</i>
                  {idea.usefulnessScore}
                </span>
                <span>
                  <i>share</i>
                  {idea.shareabilityScore}
                </span>
              </div>

              <p className="signal-reason">{idea.crowdednessNote}</p>

              <div className="prompt-preview">
                <span>Suggested builder prompt</span>
                <p>{idea.prompt}</p>
              </div>

              <div className="idea-card-actions">
                <button type="button" className="console-button" onClick={() => onCopyPrompt(idea)}>
                  <Copy size={13} />
                  copy prompt
                </button>
                <button type="button" className="console-button subtle" onClick={() => onSelect(idea.id)}>
                  inspect
                </button>
                <div className="idea-flags">
                  {savedIds.includes(idea.id) ? <b>saved</b> : null}
                  {compareIds.includes(idea.id) ? (
                    <b>
                      <GitFork size={12} /> compare
                    </b>
                  ) : null}
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state">
            <strong>No matching ideas.</strong>
            <span>Loosen the filters or clear the search intent.</span>
          </div>
        )}
      </div>

      <div className="repo-pager" aria-label="Idea pagination">
        <button type="button" className="console-button subtle" disabled={currentPage <= 1} onClick={() => onPageChange(currentPage - 1)}>
          previous
        </button>
        <span>
          {ideas.length} shown · page {currentPage} / {totalPages} · {totalIdeas.toLocaleString()} ideas
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
