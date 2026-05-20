import type { Idea } from '../types/domain'

type CompareTrayProps = {
  ideas: Idea[]
  onClear: () => void
}

export function CompareTray({ ideas, onClear }: CompareTrayProps) {
  if (!ideas.length) return null

  return (
    <section className="compare-tray">
      <div>
        <p className="module-kicker">Compare tray</p>
        <strong>{ideas.length} idea{ideas.length === 1 ? '' : 's'} queued</strong>
      </div>
      <div className="compare-items">
        {ideas.map((idea) => (
          <span key={idea.id}>
            {idea.name} <b>{idea.score}</b>
          </span>
        ))}
      </div>
      <button type="button" className="ghost-button" onClick={onClear}>
        Clear
      </button>
    </section>
  )
}
