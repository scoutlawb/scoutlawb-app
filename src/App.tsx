import { useMemo, useState } from 'react'
import { Activity, AtSign, GitBranch, TrendingUp } from 'lucide-react'
import { BuilderControls } from './components/BuilderControls'
import { CompareTray } from './components/CompareTray'
import { Header } from './components/Header'
import { IdeaDetail } from './components/IdeaDetail'
import { IdeaList } from './components/IdeaList'
import { MetricsStrip } from './components/MetricsStrip'
import { PromptStudio } from './components/PromptStudio'
import { RepoStream } from './components/RepoStream'
import { Toast } from './components/Toast'
import { categories } from './data/categories'
import { generateMimoIdeas } from './lib/ai'
import { buildLaunchBrief } from './lib/prompts'
import { repoSignalScore } from './lib/repos'
import { recommendIdeas } from './lib/scoring'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useRepos } from './hooks/useRepos'
import type { BuilderPreferences, Category, Difficulty, Idea, RepoSort, Toast as ToastType } from './types/domain'

type MainView = 'ideas' | 'repos'

const defaultPreferences: BuilderPreferences = {
  goals: ['useful', 'localFirst', 'noBackend'],
  categories: [],
  difficulty: 'any',
  query: '',
  customIdeaPrompt: '',
}

const REPOS_PER_PAGE = 10

const isCategory = (value: unknown): value is Category =>
  typeof value === 'string' && categories.some((category) => category.id === value)

const normalizeDifficulty = (value: unknown): Difficulty => {
  if (value === 'easy' || value === 'medium' || value === 'hard') return value
  return 'medium'
}

function clampScore(value: unknown, fallback: number) {
  const score = Number(value)
  if (!Number.isFinite(score)) return fallback
  return Math.max(1, Math.min(100, Math.round(score)))
}

function cleanAiText(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback
  const trimmed = value.trim()
  if (!trimmed || trimmed === '...' || /^(short name|one line|specific builder|why now|why gitlawb fits|kebab-case)$/i.test(trimmed)) {
    return fallback
  }
  return trimmed
}

function coerceMimoIdea(partial: Partial<Idea>, index: number, localFallback: Idea): Idea {
  const category = isCategory(partial.category) ? partial.category : localFallback.category
  const difficulty = normalizeDifficulty(partial.difficulty)
  const name = cleanAiText(partial.name, localFallback.name)
  const idea: Idea = {
    ...localFallback,
    id: partial.id ? `mimo-${partial.id}` : `mimo-${index}-${Date.now()}`,
    name,
    category,
    pitch: cleanAiText(partial.pitch, localFallback.pitch),
    targetUser: cleanAiText(partial.targetUser, localFallback.targetUser),
    whyGitLawb: cleanAiText(partial.whyGitLawb, localFallback.whyGitLawb),
    whyNow: cleanAiText(partial.whyNow, localFallback.whyNow),
    features: partial.features?.length ? partial.features : localFallback.features,
    checklist: partial.checklist?.length ? partial.checklist : localFallback.checklist,
    goals: localFallback.goals,
    difficulty,
    baseUsefulness: clampScore(partial.usefulnessScore, localFallback.baseUsefulness),
    baseShareability: clampScore(partial.shareabilityScore, localFallback.baseShareability),
    keywords: localFallback.keywords,
    score: clampScore(partial.score, 88 - index * 4),
    difficultyScore: difficulty === 'easy' ? 28 : difficulty === 'hard' ? 86 : 58,
    usefulnessScore: clampScore(partial.usefulnessScore, localFallback.usefulnessScore),
    shareabilityScore: clampScore(partial.shareabilityScore, localFallback.shareabilityScore),
    crowdedness:
      partial.crowdedness === 'open' || partial.crowdedness === 'warming' || partial.crowdedness === 'crowded'
        ? partial.crowdedness
        : localFallback.crowdedness,
    crowdednessNote: cleanAiText(partial.crowdednessNote, localFallback.crowdednessNote),
    prompt: cleanAiText(partial.prompt, localFallback.prompt.replace(localFallback.name, name)),
    source: 'mimo',
  }

  return idea
}

function App() {
  const { repos, status, signal, refresh } = useRepos()
  const [preferences, setPreferences] = useLocalStorage('scoutLawb.preferences', defaultPreferences)
  const [repoSort, setRepoSort] = useLocalStorage<RepoSort>('scoutLawb.repoSort', 'latest')
  const [mainView, setMainView] = useLocalStorage<MainView>('scoutLawb.mainView', 'ideas')
  const [repoPage, setRepoPage] = useState(1)
  const [savedIds, setSavedIds] = useLocalStorage<string[]>('scoutLawb.savedIdeas', [])
  const [compareIds, setCompareIds] = useLocalStorage<string[]>('scoutLawb.compareIds', [])
  const [selectedId, setSelectedId] = useState<string>()
  const [toast, setToast] = useState<ToastType>()
  const [mimoIdeas, setMimoIdeas] = useState<Idea[]>([])
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)

  const localIdeas = useMemo(() => recommendIdeas(preferences, signal), [preferences, signal])
  const ideas = useMemo(
    () =>
      mimoIdeas.length
        ? [...mimoIdeas, ...localIdeas.filter((idea) => !mimoIdeas.some((mimo) => mimo.name === idea.name))]
        : localIdeas,
    [localIdeas, mimoIdeas],
  )
  const selectedIdea = ideas.find((idea) => idea.id === selectedId) || ideas[0]
  const comparedIdeas = ideas.filter((idea) => compareIds.includes(idea.id))
  const filteredRepos = useMemo(() => {
    const query = preferences.query.trim().toLowerCase()
    const sorted = repos.filter((repo) => {
      const categoryMatch = !preferences.categories.length || preferences.categories.includes(repo.category)
      const queryMatch =
        !query ||
        `${repo.name} ${repo.owner} ${repo.ownerDid} ${repo.description} ${repo.category}`.toLowerCase().includes(query)

      return categoryMatch && queryMatch
    })

    return [...sorted].sort((a, b) => {
      if (repoSort === 'stars') return b.stars - a.stars
      if (repoSort === 'name') return a.name.localeCompare(b.name)
      if (repoSort === 'signal') return repoSignalScore(b) - repoSignalScore(a)
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })
  }, [preferences.categories, preferences.query, repoSort, repos])
  const totalRepoPages = Math.max(1, Math.ceil(filteredRepos.length / REPOS_PER_PAGE))
  const clampedRepoPage = Math.min(repoPage, totalRepoPages)
  const pagedRepos = filteredRepos.slice((clampedRepoPage - 1) * REPOS_PER_PAGE, clampedRepoPage * REPOS_PER_PAGE)

  const notify = (message: string) => {
    const nextToast = { id: Date.now(), message }
    setToast(nextToast)
    window.setTimeout(() => {
      setToast((current) => (current?.id === nextToast.id ? undefined : current))
    }, 2300)
  }

  const copyText = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text)
      notify(message)
    } catch {
      notify('Clipboard blocked by browser permissions')
    }
  }

  const toggleSaved = (idea: Idea) => {
    setSavedIds((current) => (current.includes(idea.id) ? current.filter((id) => id !== idea.id) : [...current, idea.id]))
    notify(savedIds.includes(idea.id) ? 'Idea removed from saved list' : 'Idea saved locally')
  }

  const toggleCompared = (idea: Idea) => {
    setCompareIds((current) => {
      if (current.includes(idea.id)) return current.filter((id) => id !== idea.id)
      return [...current.slice(-2), idea.id]
    })
    notify(compareIds.includes(idea.id) ? 'Removed from compare tray' : 'Added to compare tray')
  }

  const exportSaved = () => {
    const saved = ideas.filter((idea) => savedIds.includes(idea.id))
    const payload = saved.length ? saved : ideas.slice(0, 3)
    void copyText(payload.map(buildLaunchBrief).join('\n\n---\n\n'), 'Markdown brief pack copied')
  }

  const generateAI = async () => {
    setIsGeneratingAI(true)
    try {
      const generated = await generateMimoIdeas({ repos, preferences, signal })
      const coerced = generated.slice(0, 3).map((idea, index) => coerceMimoIdea(idea, index, localIdeas[index] || localIdeas[0]))
      if (!coerced.length) throw new Error('MiMo returned no ideas')
      setMimoIdeas(coerced)
      setSelectedId(coerced[0].id)
      notify('MiMo generated fresh Playground ideas')
    } catch (error) {
      notify(error instanceof Error ? `MiMo failed: ${error.message}` : 'MiMo generation failed')
    } finally {
      setIsGeneratingAI(false)
    }
  }

  if (!selectedIdea) {
    return (
      <div className="app-shell">
        <Header status={status} signal={signal} onRefresh={refresh} />
        <main className="empty-app">
          <strong>No idea signal yet.</strong>
          <button type="button" className="primary-button" onClick={refresh}>
            Refresh scan
          </button>
        </main>
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Header status={status} signal={signal} onRefresh={refresh} />
      <MetricsStrip signal={signal} status={status} opportunityCount={ideas.length} savedCount={savedIds.length} />
      {status.kind === 'sample' || status.kind === 'error' ? <div className="state-banner">{status.message}</div> : null}
      <main className="cockpit-layout">
        <BuilderControls
          preferences={preferences}
          onChange={setPreferences}
          repoSort={repoSort}
          onRepoSortChange={setRepoSort}
          onExportSaved={exportSaved}
          onGenerateAI={generateAI}
          isGeneratingAI={isGeneratingAI}
        />

        <div className="main-stack">
          <section className="intel-panel">
            <div className="module-heading intel-heading">
              <div className="module-title">
                {mainView === 'ideas' ? <TrendingUp size={15} /> : <Activity size={15} />}
                <h2>{mainView === 'ideas' ? 'Opportunity gaps / recommended ideas' : 'Live repo stream'}</h2>
                <span>
                  //{' '}
                  {mainView === 'ideas'
                    ? `${ideas.length} ranked · Playground-ready`
                    : `${filteredRepos.length} repos · ${
                        status.kind === 'live' ? 'live node' : status.kind === 'snapshot' ? 'snapshot data' : 'sample data'
                      }`}
                </span>
              </div>
              <div className="view-tabs" role="tablist" aria-label="Build intelligence view">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mainView === 'ideas'}
                  className={mainView === 'ideas' ? 'active' : ''}
                  onClick={() => setMainView('ideas')}
                >
                  <TrendingUp size={13} />
                  ideas
                  <b>{ideas.length}</b>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mainView === 'repos'}
                  className={mainView === 'repos' ? 'active' : ''}
                  onClick={() => setMainView('repos')}
                >
                  <Activity size={13} />
                  live repos
                  <b>{filteredRepos.length}</b>
                </button>
              </div>
            </div>
            {mainView === 'ideas' ? (
              <IdeaList
                ideas={ideas}
                selectedId={selectedIdea.id}
                savedIds={savedIds}
                compareIds={compareIds}
                onSelect={setSelectedId}
                onCopyPrompt={(idea) => void copyText(idea.prompt, 'Playground prompt copied')}
                showHeading={false}
              />
            ) : (
              <RepoStream
                repos={pagedRepos}
                status={status}
                signal={signal}
                currentPage={clampedRepoPage}
                totalPages={totalRepoPages}
                totalRepos={filteredRepos.length}
                onPageChange={setRepoPage}
                onCopyText={(text, message) => void copyText(text, message)}
                showHeading={false}
              />
            )}
          </section>
        </div>

        <div className="side-stack">
          <PromptStudio
            idea={selectedIdea}
            onCopyPrompt={() => void copyText(selectedIdea.prompt, 'Playground prompt copied')}
            onCopyBrief={() => void copyText(buildLaunchBrief(selectedIdea), 'Launch brief copied')}
          />
          <IdeaDetail
            idea={selectedIdea}
            isSaved={savedIds.includes(selectedIdea.id)}
            isCompared={compareIds.includes(selectedIdea.id)}
            onCopyPrompt={() => void copyText(selectedIdea.prompt, 'Playground prompt copied')}
            onCopyBrief={() => void copyText(buildLaunchBrief(selectedIdea), 'Launch brief copied')}
            onSave={() => toggleSaved(selectedIdea)}
            onCompare={() => toggleCompared(selectedIdea)}
          />
          <CompareTray ideas={comparedIdeas} onClear={() => setCompareIds([])} />
        </div>
      </main>
      <footer className="app-footer">
        <span>ScoutLawb</span>
        <div className="footer-links">
          <a href="https://github.com/scoutlawb/scoutlawb-app" target="_blank" rel="noreferrer">
            <GitBranch size={14} />
            GitHub
          </a>
          <a href="https://x.com/scoutlawb" target="_blank" rel="noreferrer">
            <AtSign size={14} />
            X
          </a>
        </div>
      </footer>
      <Toast toast={toast} />
    </div>
  )
}

export default App
