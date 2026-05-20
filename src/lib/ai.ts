import { categoryLabel } from '../data/categories'
import type { BuilderPreferences, Idea, NetworkSignal, Repo } from '../types/domain'

type ChatResponse = {
  choices?: { finish_reason?: string; message?: { content?: string; reasoning_content?: string }; text?: string }[]
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

  const variants = [cleaned]
  if (cleaned.startsWith('{{') && cleaned.endsWith('}}')) variants.push(cleaned.slice(1, -1))

  const start = cleaned.indexOf('{')
  if (start >= 0) {
    let depth = 0
    let inString = false
    let escaped = false
    for (let index = start; index < cleaned.length; index += 1) {
      const char = cleaned[index]
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        inString = !inString
      } else if (!inString && char === '{') {
        depth += 1
      } else if (!inString && char === '}') {
        depth -= 1
        if (depth === 0) {
          variants.push(cleaned.slice(start, index + 1))
          break
        }
      }
    }
  }

  for (const variant of variants) {
    try {
      return JSON.parse(variant)
    } catch {
      // Try the next cleaned variant.
    }
  }

  throw new Error('AI response was not valid JSON')
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
    'Return JSON only. Do not explain.',
    'Create exactly 3 concise app ideas for GitLawb Playground.',
    'They must be app/product ideas, not repo explorer ideas.',
    preferences.customIdeaPrompt.trim()
      ? `Custom direction: ${preferences.customIdeaPrompt.trim().slice(0, 240)}`
      : 'Use goals and network signal.',
    'JSON shape: {"ideas":[{"id":"kebab","name":"Name","category":"ai-agents","pitch":"short","targetUser":"short","whyGitLawb":"short","whyNow":"short","difficulty":"easy","usefulnessScore":88,"shareabilityScore":82,"crowdedness":"open","crowdednessNote":"short"}]}',
    'Allowed category values: ai-agents, web3-crypto, developer-utilities, productivity, games-experiments, education-knowledge, community-public-goods.',
    'Allowed difficulty: easy, medium, hard. Allowed crowdedness: open, warming, crowded.',
    'Use numeric scores from 1 to 100. Keep each string under 120 chars.',
    `Goals: ${preferences.goals.join(', ') || 'none'}. Categories: ${preferences.categories.join(', ') || 'all'}. Difficulty: ${preferences.difficulty}.`,
    `Network: ${signal.totalRepos} repos, ${signal.recentlyUpdated} recent, top ${categoryLabel(signal.topCategory)}.`,
    `Repo sample:\n${repoSample}`,
  ].join('\n\n')

  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 75_000)

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
        temperature: 0.2,
        max_tokens: 4000,
        messages: [
          {
            role: 'system',
            content: 'You are a concise product strategist. Return valid JSON only.',
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
