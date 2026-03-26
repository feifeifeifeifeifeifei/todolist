export const SETTINGS_STORAGE_KEY = 'todo-app-settings-v1'

export const DEFAULT_SETTINGS = {
  appearance: 'system',
  accent: 'purple',
  boldText: false,
  autoCloseAfterAdd: true,
  insertPosition: 'bottom',
  showShortcutHint: true,
  // todo item text + check circle color palette
  todoColors: [
    { id: 'c3', name: 'Black', hex: '#0f172a' },
    { id: 'c0', name: 'Purple', hex: '#aa3bff' },
    { id: 'c1', name: 'Pink', hex: '#db2777' },
    { id: 'c2', name: 'Blue', hex: '#2563eb' },
  ],
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

const TODO_COLOR_LIMIT = 8
const TODO_COLOR_MIN = 4

function isValidHexColor(v) {
  return typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v.trim())
}

function normalizeTodoColors(colors) {
  const input = Array.isArray(colors) ? colors : []
  const safe = input
    .map((c, idx) => ({
      id: typeof c?.id === 'string' && c.id ? c.id : `c_${idx}`,
      name: typeof c?.name === 'string' && c.name ? c.name : `Color ${idx + 1}`,
      hex: isValidHexColor(c?.hex) ? c.hex.trim() : '',
    }))
    .filter((c) => c.hex)

  // Ensure at least 4 colors and at most 8 colors
  const merged =
    safe.length >= TODO_COLOR_MIN
      ? safe.slice(0, TODO_COLOR_LIMIT)
      : [...(DEFAULT_SETTINGS.todoColors ?? []), ...safe].slice(0, TODO_COLOR_LIMIT)

  // Ensure first 4 exist
  if (merged.length < TODO_COLOR_MIN) {
    return [...DEFAULT_SETTINGS.todoColors].slice(0, TODO_COLOR_MIN)
  }

  // Migration: teal -> black, and move c3 to the first position.
  const idxC3 = merged.findIndex((c) => c.id === 'c3')
  if (idxC3 !== -1) {
    const c3 = merged[idxC3]
    const hex = (c3.hex ?? '').toLowerCase()
    const looksLikeOldTeal = hex === '#0d9488' || c3.name === 'Teal'
    if (looksLikeOldTeal) {
      merged[idxC3] = { ...c3, name: 'Black', hex: '#0f172a' }
    }
    const moved = merged.splice(idxC3, 1)[0]
    merged.unshift(moved)
  }

  // De-dup by hex (case-insensitive) to avoid "two Black" after migration.
  const seen = new Set()
  const deduped = []
  for (const c of merged) {
    const key = (c.hex ?? '').toLowerCase()
    if (!key) continue
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(c)
  }

  // If de-duping removed too many, refill to minimum 4 colors.
  if (deduped.length < TODO_COLOR_MIN) {
    const existing = new Set(deduped.map((c) => c.hex.toLowerCase()))
    for (const c of DEFAULT_SETTINGS.todoColors) {
      if (deduped.length >= TODO_COLOR_MIN) break
      const key = c.hex.toLowerCase()
      if (existing.has(key)) continue
      deduped.push(c)
      existing.add(key)
    }
  }

  return deduped.slice(0, TODO_COLOR_LIMIT)
}

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
  s.todoColors = normalizeTodoColors(s.todoColors)
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
