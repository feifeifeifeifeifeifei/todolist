export const SETTINGS_STORAGE_KEY = 'todo-app-settings-v1'

export const DEFAULT_TODO_COLORS = ['#6b7280', '#3b82f6', '#f59e0b', '#ef4444']
export const MIN_TODO_COLORS = 4
export const MAX_TODO_COLORS = 8

export const DEFAULT_SETTINGS = {
  appearance: 'system',
  accent: 'purple',
  boldText: false,
  autoCloseAfterAdd: true,
  insertPosition: 'bottom',
  showShortcutHint: true,
  todoColors: [...DEFAULT_TODO_COLORS],
}

export const ACCENT_PRESETS = [
  { id: 'black', label: 'Black' },
  { id: 'purple', label: 'Purple' },
  { id: 'pink', label: 'Pink' },
  { id: 'blue', label: 'Blue' },
  { id: 'teal', label: 'Teal' },
  { id: 'orange', label: 'Orange' },
]

const ACCENT_IDS = new Set(ACCENT_PRESETS.map((a) => a.id))

export function normalizeSettings(partial) {
  const s = { ...DEFAULT_SETTINGS, ...partial }
  if (!ACCENT_IDS.has(s.accent)) s.accent = DEFAULT_SETTINGS.accent
  if (!['light', 'dark', 'system'].includes(s.appearance)) {
    s.appearance = DEFAULT_SETTINGS.appearance
  }
  if (s.insertPosition !== 'top' && s.insertPosition !== 'bottom') {
    s.insertPosition = DEFAULT_SETTINGS.insertPosition
  }
  s.boldText = Boolean(s.boldText)
  s.autoCloseAfterAdd = Boolean(s.autoCloseAfterAdd)
  s.showShortcutHint = Boolean(s.showShortcutHint)
  if (
    !Array.isArray(s.todoColors) ||
    s.todoColors.length < MIN_TODO_COLORS ||
    !s.todoColors.every((c) => typeof c === 'string')
  ) {
    s.todoColors = [...DEFAULT_TODO_COLORS]
  }
  if (s.todoColors.length > MAX_TODO_COLORS) {
    s.todoColors = s.todoColors.slice(0, MAX_TODO_COLORS)
  }
  return s
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw)
    return normalizeSettings(parsed)
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    /* ignore */
  }
}
