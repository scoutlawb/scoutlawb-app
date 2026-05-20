import { useEffect, useMemo, useState } from 'react'
import { readStorage, writeStorage } from '../lib/storage'

const legacyKeys: Record<string, string> = {
  'scoutLawb.preferences': 'gitlawbIdeaScout.preferences',
  'scoutLawb.repoSort': 'gitlawbIdeaScout.repoSort',
  'scoutLawb.mainView': 'gitlawbIdeaScout.mainView',
  'scoutLawb.savedIdeas': 'gitlawbIdeaScout.savedIdeas',
  'scoutLawb.compareIds': 'gitlawbIdeaScout.compareIds',
  'scoutLawb.repoCache': 'gitlawbIdeaScout.repoCache',
}

export function useLocalStorage<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => readStorage(key, readStorage(legacyKeys[key] || key, fallback)))
  const mergedValue = useMemo(
    () =>
      value &&
      fallback &&
      typeof value === 'object' &&
      typeof fallback === 'object' &&
      !Array.isArray(value) &&
      !Array.isArray(fallback)
        ? ({ ...fallback, ...value } as T)
        : value,
    [fallback, value],
  )

  useEffect(() => {
    writeStorage(key, mergedValue)
  }, [key, mergedValue])

  return [mergedValue, setValue] as const
}
