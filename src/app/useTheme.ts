import { useCallback, useEffect, useState } from 'react'
import {
  applyTheme,
  loadThemePreference,
  saveThemePreference,
} from './theme'
import type { ThemePreference } from './theme'

const DARK_QUERY = '(prefers-color-scheme: dark)'

// Older engines and jsdom expose the listener API under the legacy names.
function subscribeToScheme(onChange: () => void): () => void {
  const media = window.matchMedia(DARK_QUERY)
  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }
  media.addListener(onChange)
  return () => media.removeListener(onChange)
}

export function useTheme(): {
  preference: ThemePreference
  selectTheme: (preference: ThemePreference) => void
} {
  const [preference, setPreference] = useState<ThemePreference>(() =>
    loadThemePreference(),
  )

  useEffect(() => {
    const sync = () =>
      applyTheme(preference, window.matchMedia(DARK_QUERY).matches)
    sync()
    // Only System mode follows the operating system; an explicit choice stays.
    if (preference !== 'system') {
      return
    }
    return subscribeToScheme(sync)
  }, [preference])

  const selectTheme = useCallback((next: ThemePreference) => {
    saveThemePreference(next)
    setPreference(next)
  }, [])

  return { preference, selectTheme }
}
