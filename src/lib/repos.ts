import { categories } from '../data/categories'
import { sampleRepos } from '../data/sampleRepos'
import type { Category, NetworkSignal, Repo, RepoApiItem } from '../types/domain'

export const NODE_API = 'https://node.gitlawb.com/api/v1/repos'
const NODE_PROXY_API = '/api/gitlawb/repos'
const REPO_CACHE_KEY = 'scoutLawb.repoCache'
const LEGACY_REPO_CACHE_KEY = 'gitlawbIdeaScout.repoCache'
const REPO_CACHE_TTL = 5 * 60 * 1000

const emptyCounts = () =>
  Object.fromEntries(categories.map((category) => [category.id, 0])) as Record<Category, number>

export function ownerShort(ownerDid = '') {
  return ownerDid.split(':').pop() || 'unknown'
}

function repoText(repo: Pick<RepoApiItem, 'name' | 'description' | 'owner_did'>) {
  return `${repo.name ?? ''} ${repo.description ?? ''} ${repo.owner_did ?? ''}`.toLowerCase()
}

export function deriveCategory(repo: RepoApiItem): Category {
  const text = repoText(repo)
  if (/\b(ai|agent|llm|bot|model|claude|gpt|intelligence|prompt)\b/.test(text)) return 'ai-agents'
  if (/\b(crypto|wallet|token|base|yield|airdrop|trading|chain|web3|defi)\b/.test(text)) return 'web3-crypto'
  if (/\b(cli|npm|deploy|code|debug|test|review|dev|repo|git|captcha|browser|sdk|tool)\b/.test(text)) {
    return 'developer-utilities'
  }
  if (/\b(task|planner|kanban|journal|checklist|studio|reminder|repair|health|food)\b/.test(text)) {
    return 'productivity'
  }
  if (/\b(game|runner|arcade|play|experiment)\b/.test(text)) return 'games-experiments'
  if (/\b(lesson|learn|wiki|knowledge|education|study|course)\b/.test(text)) return 'education-knowledge'
  if (/\b(community|public|grant|goods|civic|dao|collab)\b/.test(text)) return 'community-public-goods'
  return 'developer-utilities'
}

export function normalizeRepo(repo: RepoApiItem): Repo {
  const name = repo.name || 'untitled'
  const owner = ownerShort(repo.owner_did)
  const cloneUrl = repo.clone_url || ''
  const webUrl = repo.html_url || repo.web_url || ''

  return {
    id: repo.id || `${owner}/${name}`,
    name,
    owner,
    ownerDid: repo.owner_did || '',
    description: repo.description || 'No public description yet.',
    stars: Number(repo.star_count || 0),
    cloneUrl,
    repoUrl: webUrl.endsWith('.git') ? '' : webUrl,
    updatedAt: repo.updated_at || repo.created_at || '',
    category: deriveCategory(repo),
  }
}

function sortRepos(repos: Repo[]) {
  return [...repos].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export function mergeRepos(existingRepos: Repo[], incomingRepos: Repo[]) {
  const reposById = new Map<string, Repo>()
  ;[...existingRepos, ...incomingRepos].forEach((repo) => reposById.set(repo.id, repo))
  return sortRepos([...reposById.values()])
}

export function readRepoCache() {
  try {
    const cache = JSON.parse(localStorage.getItem(REPO_CACHE_KEY) || localStorage.getItem(LEGACY_REPO_CACHE_KEY) || 'null') as {
      fetchedAt?: number
      repos?: Repo[]
    } | null
    if (!cache || !Array.isArray(cache.repos) || typeof cache.fetchedAt !== 'number') return null
    return { fetchedAt: cache.fetchedAt, repos: sortRepos(cache.repos), isFresh: Date.now() - cache.fetchedAt < REPO_CACHE_TTL }
  } catch {
    return null
  }
}

export function writeRepoCache(repos: Repo[]) {
  localStorage.setItem(REPO_CACHE_KEY, JSON.stringify({ fetchedAt: Date.now(), repos: sortRepos(repos) }))
}

async function fetchRepoItems(url: string, signal: AbortSignal): Promise<Repo[]> {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal,
  })

  if (!response.ok) throw new Error(`${url === NODE_PROXY_API ? 'GitLawb proxy' : 'GitLawb API'} ${response.status}`)

  const payload = (await response.json()) as RepoApiItem[] | { repos?: RepoApiItem[] }
  const repos = Array.isArray(payload) ? payload : payload.repos || []

  return repos.map(normalizeRepo)
}

export async function fetchPublicRepos(signal: AbortSignal, cachedRepos: Repo[] = []): Promise<Repo[]> {
  try {
    return mergeRepos(cachedRepos, await fetchRepoItems(NODE_PROXY_API, signal))
  } catch (proxyError) {
    try {
      return mergeRepos(cachedRepos, await fetchRepoItems(NODE_API, signal))
    } catch (directError) {
      const proxyMessage = proxyError instanceof Error ? proxyError.message : 'proxy failed'
      const directMessage = directError instanceof Error ? directError.message : 'direct fetch failed'
      throw new Error(`${proxyMessage}; ${directMessage}`, { cause: directError })
    }
  }
}

export function getSampleRepos(): Repo[] {
  return sampleRepos.map(normalizeRepo)
}

export function buildNetworkSignal(
  repos: Repo[],
  meta: { lastSyncAt?: string; latencyMs?: number } = {},
): NetworkSignal {
  const categoryCounts = emptyCounts()
  const categoryStars = emptyCounts()
  const categoryDensity = emptyCounts()
  const recentCutoff = Date.now() - 1000 * 60 * 60 * 24 * 7
  const updated24hCutoff = Date.now() - 1000 * 60 * 60 * 24

  repos.forEach((repo) => {
    categoryCounts[repo.category] += 1
    categoryStars[repo.category] += repo.stars
  })

  categories.forEach((category) => {
    categoryDensity[category.id] = repos.length ? Math.round((categoryCounts[category.id] / repos.length) * 100) : 0
  })

  const topCategory =
    categories
      .map((category) => category.id)
      .sort((a, b) => categoryCounts[b] - categoryCounts[a])[0] || 'developer-utilities'

  return {
    totalRepos: repos.length,
    recentlyUpdated: repos.filter((repo) => new Date(repo.updatedAt).getTime() > recentCutoff).length,
    updated24h: repos.filter((repo) => new Date(repo.updatedAt).getTime() > updated24hCutoff).length,
    starsTracked: repos.reduce((sum, repo) => sum + repo.stars, 0),
    topCategory,
    categoryCounts,
    categoryStars,
    categoryDensity,
    lastSyncAt: meta.lastSyncAt || new Date().toISOString(),
    latencyMs: meta.latencyMs ?? 0,
  }
}

export function repoSignalScore(repo: Repo) {
  const updated = new Date(repo.updatedAt).getTime()
  const ageHours = Number.isFinite(updated) ? (Date.now() - updated) / 36e5 : 9999
  const recency = ageHours < 24 ? 45 : ageHours < 24 * 7 ? 26 : ageHours < 24 * 30 ? 12 : 0
  const stars = Math.min(35, Math.log10(repo.stars + 1) * 14)
  const description = repo.description && repo.description !== 'No public description yet.' ? 10 : 0
  const clone = repo.cloneUrl ? 10 : 0

  return Math.round(Math.min(100, recency + stars + description + clone))
}

export function repoSignalLabel(repo: Repo) {
  const score = repoSignalScore(repo)
  if (score >= 74) return 'high'
  if (score >= 52) return 'rising'
  if (score >= 28) return 'steady'
  return 'quiet'
}
