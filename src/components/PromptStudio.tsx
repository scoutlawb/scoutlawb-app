import { Copy, FileText } from 'lucide-react'
import type { Idea } from '../types/domain'

type PromptStudioProps = {
  idea: Idea
  onCopyPrompt: () => void
  onCopyBrief: () => void
}

export function PromptStudio({ idea, onCopyPrompt, onCopyBrief }: PromptStudioProps) {
  return (
    <section className="prompt-panel">
      <div className="module-heading compact">
        <div className="module-title">
          <h2>Prompt studio</h2>
          <span>// Playground-ready instruction</span>
        </div>
        <div className="prompt-actions">
          <button type="button" className="console-button" onClick={onCopyBrief}>
            <FileText size={14} />
            brief
          </button>
          <button type="button" className="primary-button" onClick={onCopyPrompt}>
            <Copy size={14} />
            copy
          </button>
        </div>
      </div>
      <pre className="prompt-box">{idea.prompt}</pre>
    </section>
  )
}
