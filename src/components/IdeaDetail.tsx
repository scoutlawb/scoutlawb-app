import { Bookmark, Clipboard, FileText, GitCompare } from 'lucide-react'
import { categoryLabel } from '../data/categories'
import type { Idea } from '../types/domain'

type IdeaDetailProps = {
  idea: Idea
  isSaved: boolean
  isCompared: boolean
  onCopyPrompt: () => void
  onCopyBrief: () => void
  onSave: () => void
  onCompare: () => void
}

export function IdeaDetail({
  idea,
  isSaved,
  isCompared,
  onCopyPrompt,
  onCopyBrief,
  onSave,
  onCompare,
}: IdeaDetailProps) {
  return (
    <section className="detail-panel">
      <div className="detail-hero">
        <div>
          <p className="module-kicker">Selected idea</p>
          <h2>{idea.name}</h2>
          <p>{idea.pitch}</p>
        </div>
        <span className={`crowd-pill ${idea.crowdedness}`}>{idea.crowdedness}</span>
      </div>

      <div className="score-grid">
        <Score label="Difficulty" value={idea.difficultyScore} />
        <Score label="Usefulness" value={idea.usefulnessScore} />
        <Score label="Shareability" value={idea.shareabilityScore} />
      </div>

      <div className="detail-grid">
        <InfoBlock label="Target user" value={idea.targetUser} />
        <InfoBlock label="Category" value={categoryLabel(idea.category)} />
        <InfoBlock label="Why GitLawb" value={idea.whyGitLawb} />
        <InfoBlock label="Why now" value={idea.whyNow} />
        <InfoBlock label="Crowdedness" value={idea.crowdednessNote} />
      </div>

      <div className="feature-block">
        <h3>Feature scope</h3>
        <ul>
          {idea.features.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </div>

      <div className="feature-block">
        <h3>Launch checklist</h3>
        <ul className="check-list">
          {idea.checklist.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="action-grid">
        <button type="button" className="primary-button" onClick={onCopyPrompt}>
          <Clipboard size={15} />
          copy prompt
        </button>
        <button type="button" className="console-button" onClick={onCopyBrief}>
          <FileText size={15} />
          copy brief
        </button>
        <button type="button" className={`console-button ${isSaved ? 'active' : ''}`} onClick={onSave}>
          <Bookmark size={15} />
          {isSaved ? 'saved' : 'save'}
        </button>
        <button type="button" className={`console-button ${isCompared ? 'active' : ''}`} onClick={onCompare}>
          <GitCompare size={15} />
          compare
        </button>
      </div>
    </section>
  )
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div className="score-cell">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-block">
      <span>{label}</span>
      <p>{value}</p>
    </div>
  )
}
