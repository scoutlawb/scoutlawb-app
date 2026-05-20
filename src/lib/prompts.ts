import { categoryLabel } from '../data/categories'
import type { BuilderPreferences, Idea, NetworkSignal, Repo } from '../types/domain'

export function buildPlaygroundPrompt(idea: Omit<Idea, 'prompt'>, preferences: BuilderPreferences, signal: NetworkSignal) {
  const selectedGoals = preferences.goals.length ? preferences.goals.join(', ') : 'useful, local-first, no backend'
  const customDirection = preferences.customIdeaPrompt.trim()

  return [
    `Build a production-ready single-page web app called "${idea.name}" for GitLawb Playground.`,
    '',
    `Target user: ${idea.targetUser}`,
    `One-line pitch: ${idea.pitch}`,
    `Why it fits GitLawb: ${idea.whyGitLawb}`,
    `Network context: ${categoryLabel(idea.category)} currently has ${signal.categoryCounts[idea.category]} public repos in the scan, with a crowdedness signal of ${idea.crowdedness}.`,
    `Builder goals to prioritize: ${selectedGoals}.`,
    ...(customDirection ? [`Custom builder direction: ${customDirection}`, ''] : ['']),
    'Core workflow:',
    '1. User opens the app and immediately sees the main working surface, not a marketing page.',
    '2. User enters or selects the minimum useful inputs.',
    '3. App generates a polished output that can be copied, saved locally, or exported as markdown.',
    '4. App handles empty states, reset states, and mobile layout cleanly.',
    '',
    'Required features:',
    ...idea.features.map((feature) => `- ${feature}`),
    '',
    'Data and persistence:',
    '- Use bundled sample data where needed.',
    '- Store user-created state in localStorage.',
    '- Do not require accounts, API keys, or backend services.',
    '',
    'UI direction:',
    '- Compact GitLawb-native developer cockpit.',
    '- Dark protocol lab aesthetic with green, cyan, and amber signal colors.',
    '- Dense but readable panels, thin borders, short copy, and no generic SaaS hero.',
    '',
    'Production constraints:',
    '- Responsive desktop and mobile layout.',
    '- Accessible buttons and form labels.',
    '- Clear loading, empty, and error states.',
    '- No fake write actions to GitLawb and no claim that repos are created automatically.',
  ].join('\n')
}

export function buildLaunchBrief(idea: Idea) {
  return [
    `# ${idea.name}`,
    '',
    `**Pitch:** ${idea.pitch}`,
    `**Target user:** ${idea.targetUser}`,
    `**Category:** ${categoryLabel(idea.category)}`,
    '',
    '## Why GitLawb',
    idea.whyGitLawb,
    '',
    '## Why Now',
    idea.whyNow,
    '',
    '## Feature Scope',
    ...idea.features.map((feature) => `- ${feature}`),
    '',
    '## Scores',
    `- Difficulty: ${idea.difficultyScore}/100`,
    `- Usefulness: ${idea.usefulnessScore}/100`,
    `- Shareability: ${idea.shareabilityScore}/100`,
    `- Crowdedness: ${idea.crowdedness} - ${idea.crowdednessNote}`,
    '',
    '## Launch Checklist',
    ...idea.checklist.map((item) => `- [ ] ${item}`),
    '',
    '## GitLawb Playground Prompt',
    '```txt',
    idea.prompt,
    '```',
  ].join('\n')
}

export function buildRepoIdeaPrompt(repo: Repo, signal: NetworkSignal) {
  return [
    `Use the public GitLawb repo "${repo.name}" as market signal for a new GitLawb Playground project idea.`,
    '',
    `Repo owner DID: ${repo.ownerDid || repo.owner}`,
    `Repo category: ${categoryLabel(repo.category)}`,
    `Repo description: ${repo.description}`,
    `Repo stars: ${repo.stars}`,
    `Network context: ${signal.categoryCounts[repo.category]} repos detected in this category, ${signal.updated24h} repos updated in the last 24h.`,
    '',
    'Generate a different, launch-ready app idea for GitLawb Playground. Do not clone the repo directly.',
    'Include target user, core workflow, feature scope, localStorage persistence, responsive UI direction, and production constraints.',
  ].join('\n')
}
