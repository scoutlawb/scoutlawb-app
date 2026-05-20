import { categoryLabel } from '../data/categories'
import type { BuilderPreferences, Idea, NetworkSignal, Repo } from '../types/domain'

type ChatResponse = {
  choices?: { message?: { content?: string; reasoning_content?: string }; text?: string }[]
  output_text?: string
}

const baseUrl = import.meta.env.VITE_MIMO_BASE_URL || 'https://token-plan-sgp.xiaomimimo.com/v1'
const model = (import.meta.env.VITE_MIMO_MODEL || 'mimo-v2.5-pro').toLowerCase()
const apiKey = import.meta.env.VITE_MIMO_API_KEY || ''

export const aiConfig = {
  baseUrl,
  model,
  enabled: Boolean(apiKey),
}

function assistantText(payload: ChatResponse) {
  return (
    payload.choices?.[0]?.message?.content ||
    payload.choices?.[0]?.text ||
    payload.output_text ||
    payload.choices?.[0]?.message?.reasoning_content ||
    ''
  )
}

function parseJson(text: string) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1))
    throw new Error('AI response was not valid JSON')
  }
}

export async function generateMimoIdeas({
  repos,
  preferences,
  signal,
}: {
  repos: Repo[]
  preferences: BuilderPreferences
  signal: NetworkSignal
}): Promise<Partial<Idea>[]> {
  if (!apiKey) throw new Error('MiMo API key is not configured')

  const repoSample = repos
    .slice(0, 5)
    .map((repo) => `${repo.name}:${categoryLabel(repo.category)}:${repo.stars}`)
    .join('\n')

  const prompt = [
    'Return final minified JSON only. No analysis, no markdown.',
    'The product is ScoutLawb. Generate exactly 3 GitLawb Playground app ideas, not repo explorer ideas.',
    'Keep all strings under 90 chars.',
    'Never use placeholder values like "short name", "...", "one line", or "kebab-case".',
    preferences.customIdeaPrompt.trim()
      ? `Custom direction: ${preferences.customIdeaPrompt.trim()}`
      : 'Infer opportunities from goals and network signal.',
    'Return an object with an ideas array. Each idea needs keys: id, name, category, pitch, targetUser, whyGitLawb, whyNow, difficulty, usefulnessScore, shareabilityScore, crowdedness, crowdednessNote.',
    `Selected goals: ${preferences.goals.join(', ') || 'none'}.`,
    `Selected categories: ${preferences.categories.join(', ') || 'all'}.`,
    `Difficulty filter: ${preferences.difficulty}.`,
    `Network: ${signal.totalRepos} repos, ${signal.recentlyUpdated} recently updated, top category ${categoryLabel(signal.topCategory)}.`,
    `Repo sample: ${repoSample}`,
  ].join('\n\n')

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 30_000)

  let response: Response
  try {
    response = await fetch(`${String(baseUrl).replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.45,
        max_tokens: 1600,
        messages: [
          {
            role: 'system',
            content:
              'You are a GitLawb Playground product strategist. Write compact, practical, buildable project ideas. Return final JSON only.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('MiMo request timed out. Local ideas are still available.', { cause: error })
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    const message = errorText.match(/"message"\s*:\s*"([^"]+)"/)?.[1]
    throw new Error(message ? `MiMo API ${response.status}: ${message}` : `MiMo API ${response.status}`)
  }

  const payload = (await response.json()) as ChatResponse
  const text = assistantText(payload)
  if (!text.trim()) throw new Error('MiMo returned an empty response')
  const parsed = parseJson(text) as { ideas?: Partial<Idea>[] }
  return parsed.ideas || []
}
