export type Category =
  | 'ai-agents'
  | 'web3-crypto'
  | 'developer-utilities'
  | 'productivity'
  | 'games-experiments'
  | 'education-knowledge'
  | 'community-public-goods'

export type Difficulty = 'easy' | 'medium' | 'hard'

export type RepoSort = 'latest' | 'stars' | 'name' | 'signal'

export type GoalKey =
  | 'easy'
  | 'shareable'
  | 'useful'
  | 'hackathon'
  | 'agentNative'
  | 'localFirst'
  | 'noBackend'

export type Crowdedness = 'open' | 'warming' | 'crowded'

export type RepoApiItem = {
  id?: string
  name?: string
  owner_did?: string
  description?: string | null
  star_count?: number | null
  clone_url?: string | null
  html_url?: string | null
  web_url?: string | null
  url?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type Repo = {
  id: string
  name: string
  owner: string
  ownerDid: string
  description: string
  stars: number
  cloneUrl: string
  repoUrl: string
  updatedAt: string
  category: Category
}

export type BuilderPreferences = {
  goals: GoalKey[]
  categories: Category[]
  difficulty: Difficulty | 'any'
  query: string
  customIdeaPrompt: string
}

export type NetworkSignal = {
  totalRepos: number
  recentlyUpdated: number
  updated24h: number
  starsTracked: number
  topCategory: Category
  categoryCounts: Record<Category, number>
  categoryStars: Record<Category, number>
  categoryDensity: Record<Category, number>
  lastSyncAt: string
  latencyMs: number
}

export type IdeaTemplate = {
  id: string
  name: string
  category: Category
  pitch: string
  targetUser: string
  whyGitLawb: string
  whyNow: string
  features: string[]
  checklist: string[]
  goals: GoalKey[]
  difficulty: Difficulty
  baseUsefulness: number
  baseShareability: number
  keywords: string[]
}

export type Idea = IdeaTemplate & {
  score: number
  difficultyScore: number
  usefulnessScore: number
  shareabilityScore: number
  crowdedness: Crowdedness
  crowdednessNote: string
  prompt: string
  source?: 'local' | 'mimo'
}

export type RepoStatus =
  | { kind: 'loading'; label: 'Syncing' | 'Updating' }
  | { kind: 'live'; label: 'Live' | 'Cached' }
  | { kind: 'snapshot'; label: 'Snapshot'; message: string }
  | { kind: 'sample'; label: 'Sample Data' | 'Cached'; message: string }
  | { kind: 'error'; label: 'Error'; message: string }

export type Toast = {
  id: number
  message: string
}
