import { ChevronDown, Search, SlidersHorizontal, Sparkles, Target } from 'lucide-react'
import { categories, goalOptions } from '../data/categories'
import type { BuilderPreferences, Category, Difficulty, GoalKey, RepoSort } from '../types/domain'

type BuilderControlsProps = {
  preferences: BuilderPreferences
  onChange: (preferences: BuilderPreferences) => void
  repoSort: RepoSort
  onRepoSortChange: (sort: RepoSort) => void
  onExportSaved: () => void
  onGenerateAI: () => void
  isGeneratingAI: boolean
}

const difficulties: { id: Difficulty | 'any'; label: string }[] = [
  { id: 'any', label: 'any' },
  { id: 'easy', label: 'easy' },
  { id: 'medium', label: 'medium' },
  { id: 'hard', label: 'hard' },
]

const sortOptions: { id: RepoSort; label: string }[] = [
  { id: 'latest', label: 'recently updated' },
  { id: 'stars', label: 'stars' },
  { id: 'signal', label: 'signal score' },
  { id: 'name', label: 'name' },
]

export function BuilderControls({
  preferences,
  onChange,
  repoSort,
  onRepoSortChange,
  onExportSaved,
  onGenerateAI,
  isGeneratingAI,
}: BuilderControlsProps) {
  const toggleGoal = (goal: GoalKey) => {
    const goals = preferences.goals.includes(goal)
      ? preferences.goals.filter((item) => item !== goal)
      : [...preferences.goals, goal]
    onChange({ ...preferences, goals })
  }

  const toggleCategory = (category: Category) => {
    const categories = preferences.categories.includes(category)
      ? preferences.categories.filter((item) => item !== category)
      : [...preferences.categories, category]
    onChange({ ...preferences, categories })
  }

  return (
    <aside className="control-rail">
      <section className="rail-section">
        <div className="rail-title">
          <Search size={14} />
          Public scan
        </div>
        <label className="field-control search-field">
          <span>Search repo, owner DID, tag, prompt</span>
          <input
            value={preferences.query}
            placeholder="agent, wallet, playground..."
            onChange={(event) => onChange({ ...preferences, query: event.target.value })}
          />
        </label>
        <label className="field-control select-wrap">
          <span>Sort repo stream</span>
          <select value={repoSort} onChange={(event) => onRepoSortChange(event.target.value as RepoSort)}>
            {sortOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown size={13} />
        </label>
      </section>

      <section className="rail-section">
        <div className="rail-title">
          <Target size={14} />
          Builder goals
        </div>
        <div className="goal-stack">
          {goalOptions.map((goal) => {
            const active = preferences.goals.includes(goal.id)
            return (
              <button
                key={goal.id}
                type="button"
                className={`toggle-row ${active ? 'active' : ''}`}
                onClick={() => toggleGoal(goal.id)}
              >
                <span>
                  <strong>{goal.label}</strong>
                  <small>{goal.description}</small>
                </span>
                <i aria-hidden="true" />
              </button>
            )
          })}
        </div>
      </section>

      <section className="rail-section">
        <div className="rail-title">
          <SlidersHorizontal size={14} />
          Filters
        </div>
        <label className="field-control select-wrap">
          <span>Difficulty</span>
          <select
            value={preferences.difficulty}
            onChange={(event) =>
              onChange({ ...preferences, difficulty: event.target.value as BuilderPreferences['difficulty'] })
            }
          >
            {difficulties.map((difficulty) => (
              <option key={difficulty.id} value={difficulty.id}>
                {difficulty.label}
              </option>
            ))}
          </select>
          <ChevronDown size={13} />
        </label>
        <div className="chip-grid">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`chip ${preferences.categories.includes(category.id) ? 'active' : ''}`}
              onClick={() => toggleCategory(category.id)}
            >
              {category.short}
            </button>
          ))}
        </div>
      </section>

      <section className="rail-section scout-note">
        <div className="rail-title">Idea generator</div>
        <label className="field-control prompt-field">
          <span>Custom prompt direction</span>
          <textarea
            value={preferences.customIdeaPrompt}
            placeholder="example: generate no-backend hackathon ideas focused on wallet UX and shareable demos..."
            rows={5}
            onChange={(event) => onChange({ ...preferences, customIdeaPrompt: event.target.value })}
          />
        </label>
        <button type="button" className="primary-button wide-action" onClick={onGenerateAI} disabled={isGeneratingAI}>
          <Sparkles size={14} className={isGeneratingAI ? 'spin' : ''} />
          {isGeneratingAI ? 'asking mimo' : 'generate with mimo'}
        </button>
        <button type="button" className="console-button wide-action" onClick={onExportSaved}>
          export saved briefs
        </button>
      </section>

      <section className="rail-section scout-note">
        <div className="rail-title">Scout brief</div>
        <p>
          ScoutLawb tracks public repos, builder activity, category gaps, and clone-ready signals. Use it to decide what
          to build next and copy prompts into GitLawb Playground.
        </p>
      </section>
    </aside>
  )
}
