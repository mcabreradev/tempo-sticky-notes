import { THEME_LABELS, THEME_PREFERENCES } from '../app/theme'
import type { ThemePreference } from '../app/theme'

const GLYPHS: Record<ThemePreference, string> = {
  system: '◐',
  light: '☀',
  dark: '☾',
}

interface ThemeToggleProps {
  preference: ThemePreference
  onSelect: (preference: ThemePreference) => void
}

export function ThemeToggle({ preference, onSelect }: ThemeToggleProps) {
  return (
    <div
      className="theme-toggle"
      role="radiogroup"
      aria-label="Theme"
      data-testid="theme-toggle"
    >
      {THEME_PREFERENCES.map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={preference === option}
          aria-label={THEME_LABELS[option]}
          data-testid={`theme-${option}`}
          className={`theme-toggle__option${
            preference === option ? ' is-active' : ''
          }`}
          onClick={() => onSelect(option)}
        >
          <span aria-hidden>{GLYPHS[option]}</span>
        </button>
      ))}
    </div>
  )
}
