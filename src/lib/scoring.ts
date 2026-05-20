import { ideaTemplates } from '../data/ideaTemplates'
import { buildPlaygroundPrompt } from './prompts'
import type { BuilderPreferences, Category, Crowdedness, Difficulty, Idea, IdeaTemplate, NetworkSignal } from '../types/domain'

const difficultyScore: Record<Difficulty, number> = {
  easy: 28,
  medium: 58,
  hard: 86,
}

function crowdednessFor(category: Category, signal: NetworkSignal): { crowdedness: Crowdedness; note: string } {
  const count = signal.categoryCounts[category]
  const share = signal.totalRepos ? count / signal.totalRepos : 0

  if (share >= 0.28 || count >= 30) {
    return {
      crowdedness: 'crowded',
      note: 'many adjacent repos already exist; the prompt needs a sharper angle.',
    }
  }

  if (share >= 0.12 || count >= 8) {
    return {
      crowdedness: 'warming',
      note: 'some activity exists, but there is still room for a focused build.',
    }
  }

  return {
    crowdedness: 'open',
    note: 'underbuilt relative to the current public network scan.',
  }
}

function goalMatch(template: IdeaTemplate, preferences: BuilderPreferences) {
  if (!preferences.goals.length) return 12
  return preferences.goals.reduce((score, goal) => score + (template.goals.includes(goal) ? 10 : -2), 0)
}

function difficultyMatch(template: IdeaTemplate, preferences: BuilderPreferences) {
  if (preferences.difficulty === 'any') return 0
  return template.difficulty === preferences.difficulty ? 12 : -18
}

function categoryMatch(template: IdeaTemplate, preferences: BuilderPreferences) {
  if (!preferences.categories.length) return 0
  return preferences.categories.includes(template.category) ? 18 : -40
}

function queryMatch(template: IdeaTemplate, query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return 0

  const text = `${template.name} ${template.pitch} ${template.targetUser} ${template.whyGitLawb} ${template.keywords.join(' ')}`.toLowerCase()
  return text.includes(normalized) ? 18 : -50
}

export function recommendIdeas(preferences: BuilderPreferences, signal: NetworkSignal): Idea[] {
  return ideaTemplates
    .map((template) => {
      const crowded = crowdednessFor(template.category, signal)
      const density = signal.totalRepos ? signal.categoryCounts[template.category] / signal.totalRepos : 0
      const gapBonus = crowded.crowdedness === 'open' ? 18 : crowded.crowdedness === 'warming' ? 7 : -10
      const usefulGoalBonus = template.goals.includes('useful') ? 4 : 0
      const score =
        template.baseUsefulness * 0.45 +
        template.baseShareability * 0.25 +
        goalMatch(template, preferences) +
        categoryMatch(template, preferences) +
        difficultyMatch(template, preferences) +
        queryMatch(template, preferences.query) +
        gapBonus +
        usefulGoalBonus -
        density * 12

      const partialIdea = {
        ...template,
        score: Math.round(Math.max(1, Math.min(100, score))),
        difficultyScore: difficultyScore[template.difficulty],
        usefulnessScore: Math.round(Math.max(1, Math.min(100, template.baseUsefulness + gapBonus / 3))),
        shareabilityScore: Math.round(Math.max(1, Math.min(100, template.baseShareability + (template.goals.includes('shareable') ? 4 : 0)))),
        crowdedness: crowded.crowdedness,
        crowdednessNote: crowded.note,
        source: 'local' as const,
      }

      return {
        ...partialIdea,
        prompt: buildPlaygroundPrompt(partialIdea, preferences, signal),
      }
    })
    .filter((idea) => idea.score > 0)
    .sort((a, b) => b.score - a.score)
}
