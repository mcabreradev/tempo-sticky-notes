export const THEME_STORAGE_KEY = 'sticky-notes-theme-v1'

export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const

export type ThemePreference = (typeof THEME_PREFERENCES)[number]

export type ResolvedTheme = 'light' | 'dark'

export const THEME_LABELS: Record<ThemePreference, string> = {
  system: 'System theme',
  light: 'Light theme',
  dark: 'Dark theme',
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return (
    typeof value === 'string' &&
    (THEME_PREFERENCES as readonly string[]).includes(value)
  )
}

export function parseThemePreference(raw: string | null): ThemePreference {
  return isThemePreference(raw) ? raw : 'system'
}

export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (preference === 'system') {
    return systemPrefersDark ? 'dark' : 'light'
  }
  return preference
}

export function loadThemePreference(
  storage: Storage = window.localStorage,
): ThemePreference {
  try {
    return parseThemePreference(storage.getItem(THEME_STORAGE_KEY))
  } catch (error) {
    console.warn('[theme] reading the preference failed:', error)
    return 'system'
  }
}

export function saveThemePreference(
  preference: ThemePreference,
  storage: Storage = window.localStorage,
): void {
  try {
    storage.setItem(THEME_STORAGE_KEY, preference)
  } catch (error) {
    console.warn('[theme] saving the preference failed:', error)
  }
}

// The resolved theme, not the preference, is what CSS keys off; the preference
// stays on the root as well so the control can render its checked option.
export function applyTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  const resolved = resolveTheme(preference, systemPrefersDark)
  const root = document.documentElement
  root.dataset.theme = resolved
  root.dataset.themePreference = preference
  return resolved
}
