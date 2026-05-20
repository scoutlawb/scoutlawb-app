import type { Category, GoalKey } from '../types/domain'

export const categories: { id: Category; label: string; short: string }[] = [
  { id: 'ai-agents', label: 'AI agents', short: 'agents' },
  { id: 'web3-crypto', label: 'Web3 / crypto tools', short: 'web3' },
  { id: 'developer-utilities', label: 'Developer utilities', short: 'devtools' },
  { id: 'productivity', label: 'Productivity tools', short: 'productivity' },
  { id: 'games-experiments', label: 'Games / experiments', short: 'games' },
  { id: 'education-knowledge', label: 'Education / knowledge', short: 'knowledge' },
  { id: 'community-public-goods', label: 'Community / public goods', short: 'public goods' },
]

export const goalOptions: { id: GoalKey; label: string; description: string }[] = [
  { id: 'easy', label: 'easy to build', description: 'Small scope, fast Playground output.' },
  { id: 'shareable', label: 'high shareability', description: 'Built-in launch hook or result card.' },
  { id: 'useful', label: 'useful for GitLawb users', description: 'Solves an immediate builder workflow.' },
  { id: 'hackathon', label: 'hackathon-friendly', description: 'Demoable in one sitting.' },
  { id: 'agentNative', label: 'agent-native', description: 'Designed around AI-agent repo workflows.' },
  { id: 'localFirst', label: 'local-first', description: 'Works without accounts or remote storage.' },
  { id: 'noBackend', label: 'no backend', description: 'Static deployable and browser-persistent.' },
]

export const categoryLabel = (category: Category) =>
  categories.find((item) => item.id === category)?.label ?? category

export const categoryShort = (category: Category) =>
  categories.find((item) => item.id === category)?.short ?? category
