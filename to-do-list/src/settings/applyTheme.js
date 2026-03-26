import { DEFAULT_SETTINGS, normalizeSettings } from './storage.js'

export function resolveEffectiveTheme(appearance) {
  if (appearance === 'light') return 'light'
  if (appearance === 'dark') return 'dark'
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function applyThemeToDocument(settings) {
  const s = normalizeSettings(settings ?? {})
  const appearance = s.appearance
  const accent = s.accent
  const boldText = s.boldText

  const theme = resolveEffectiveTheme(appearance)
  document.documentElement.dataset.theme = theme
  document.documentElement.dataset.appearanceMode = appearance
  document.documentElement.style.colorScheme =
    theme === 'dark' ? 'dark' : 'light'
  document.documentElement.dataset.accent = accent
  document.documentElement.dataset.bold = boldText ? 'on' : 'off'
}
