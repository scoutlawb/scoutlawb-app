import { useCallback, useEffect, useMemo, useState } from 'react'
import { buildNetworkSignal, fetchBundledRepos, fetchPublicRepos, getSampleRepos, readRepoCache, writeRepoCache } from '../lib/repos'
import type { Repo, RepoStatus } from '../types/domain'

export function useRepos() {
  const [repos, setRepos] = useState<Repo[]>([])
  const [status, setStatus] = useState<RepoStatus>({ kind: 'loading', label: 'Syncing' })
  const [syncMeta, setSyncMeta] = useState({ lastSyncAt: new Date().toISOString(), latencyMs: 0 })

  const loadRepos = useCallback(async () => {
    const cache = readRepoCache()
    let fallbackRepos = cache?.repos || []

    if (cache) {
      setRepos(cache.repos)
      setSyncMeta({ lastSyncAt: new Date(cache.fetchedAt).toISOString(), latencyMs: 0 })
      if (cache.isFresh) {
        setStatus({ kind: 'live', label: 'Cached' })
        return
      }
    }

    if (!cache) {
      const snapshotController = new AbortController()
      const snapshotTimeout = window.setTimeout(() => snapshotController.abort(), 3000)

      try {
        const bundledRepos = await fetchBundledRepos(snapshotController.signal)
        fallbackRepos = bundledRepos
        setRepos(bundledRepos)
        setSyncMeta({ lastSyncAt: new Date().toISOString(), latencyMs: 0 })
        setStatus({
          kind: 'snapshot',
          label: 'Snapshot',
          message: `Using ${bundledRepos.length.toLocaleString()} bundled GitLawb repo signals while the live node sync runs.`,
        })
      } catch {
        fallbackRepos = getSampleRepos()
        setRepos(fallbackRepos)
        setSyncMeta({ lastSyncAt: new Date().toISOString(), latencyMs: 0 })
        setStatus({
          kind: 'sample',
          label: 'Sample Data',
          message: 'Bundled repo snapshot is unavailable. Showing minimal sample signal data.',
        })
      } finally {
        window.clearTimeout(snapshotTimeout)
      }
    }

    if (cache || !fallbackRepos.length) {
      setStatus({ kind: 'loading', label: cache ? 'Updating' : 'Syncing' })
    }
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 20_000)
    const startedAt = performance.now()

    try {
      const liveRepos = await fetchPublicRepos(controller.signal, fallbackRepos)
      writeRepoCache(liveRepos)
      setRepos(liveRepos)
      setSyncMeta({ lastSyncAt: new Date().toISOString(), latencyMs: Math.round(performance.now() - startedAt) })
      setStatus({ kind: 'live', label: 'Live' })
    } catch (error) {
      if (fallbackRepos.length) {
        setRepos(fallbackRepos)
        setSyncMeta({
          lastSyncAt: cache ? new Date(cache.fetchedAt).toISOString() : new Date().toISOString(),
          latencyMs: cache ? Math.round(performance.now() - startedAt) : 0,
        })
        if (cache) {
          setStatus({
            kind: 'sample',
            label: 'Cached',
            message: `Live fetch blocked or slow. Showing ${fallbackRepos.length.toLocaleString()} cached repos.`,
          })
        } else {
          setStatus({
            kind: 'snapshot',
            label: 'Snapshot',
            message: `Live fetch blocked or slow. Showing ${fallbackRepos.length.toLocaleString()} bundled repo signals.`,
          })
        }
      } else {
        setRepos(getSampleRepos())
        setSyncMeta({ lastSyncAt: new Date().toISOString(), latencyMs: Math.round(performance.now() - startedAt) })
        setStatus({
          kind: 'sample',
          label: 'Sample Data',
          message:
            error instanceof Error
              ? `Live fetch blocked or slow: ${error.message}. Showing bundled signal data.`
              : 'Live fetch blocked or slow. Showing bundled signal data.',
        })
      }
    } finally {
      window.clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    const id = window.setTimeout(() => {
      void loadRepos()
    }, 0)

    return () => window.clearTimeout(id)
  }, [loadRepos])

  const signal = useMemo(() => buildNetworkSignal(repos, syncMeta), [repos, syncMeta])

  return {
    repos,
    status,
    signal,
    refresh: loadRepos,
  }
}
