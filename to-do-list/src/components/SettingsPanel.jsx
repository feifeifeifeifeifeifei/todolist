import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ACCENT_PRESETS } from '../settings/storage'

const SWATCH_HEX = {
  black: '#0f172a',
  purple: '#aa3bff',
  pink: '#f18cb9a7',
  blue: '#2563eb',
  teal: '#0d9488',
  orange: '#ea580c',
}

function SettingsToggle({ id, checked, onChange, label }) {
  return (
    <label className="settings-toggle" htmlFor={id}>
      <span className="settings-toggle-label">{label}</span>
      <span className="settings-toggle-switch">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="settings-toggle-slider" aria-hidden />
      </span>
    </label>
  )
}

export default function SettingsPanel({
  open,
  onClose,
  settings,
  onPatch,
  todoCount,
  onClearAllTodos,
}) {
  const MIN_TODO_COLORS = 4
  const MAX_TODO_COLORS = 8

  const todoColorPool = [
    '#0ea5e9',
    '#22c55e',
    '#f59e0b',
    '#f97316',
    '#ef4444',
    '#14b8a6',
    '#a855f7',
    '#f472b6',
    '#eab308',
    '#3b82f6',
    '#06b6d4',
    '#64748b',
  ]

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  const patch = (partial) => onPatch(partial)

  const addTodoColor = () => {
    if (settings.todoColors.length >= MAX_TODO_COLORS) return

    const used = new Set(settings.todoColors.map((c) => c.hex.toLowerCase()))
    const nextHex =
      todoColorPool.find((h) => !used.has(h.toLowerCase())) ??
      '#334155'

    const nextId = `c_${Date.now()}_${Math.random().toString(16).slice(2)}`
    const nextIndex = settings.todoColors.length + 1

    patch({
      todoColors: [
        ...settings.todoColors,
        {
          id: nextId,
          name: `Color ${nextIndex}`,
          hex: nextHex,
        },
      ],
    })
  }

  const updateTodoColorAt = (idx, partial) => {
    patch({
      todoColors: settings.todoColors.map((c, i) =>
        i === idx ? { ...c, ...partial } : c,
      ),
    })
  }

  const removeTodoColorAt = (idx) => {
    if (idx < MIN_TODO_COLORS) return
    if (settings.todoColors.length <= MIN_TODO_COLORS) return

    patch({
      todoColors: settings.todoColors.filter((_, i) => i !== idx),
    })
  }

  return createPortal(
    <div
      className="settings-modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="settings-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="settings-modal-header">
          <h2 id="settings-modal-title" className="settings-modal-title">
            Settings
          </h2>
          <button
            type="button"
            className="btn btn-ghost settings-modal-dismiss"
            onClick={onClose}
            aria-label="Close settings"
          >
            ×
          </button>
        </div>

        <div className="settings-modal-body">
          <section className="settings-section" aria-labelledby="settings-appearance">
            <h3 id="settings-appearance" className="settings-section-title">
              Look &amp; feel
            </h3>
            <p className="settings-hint">Appearance</p>
            <div className="segmented settings-segmented">
              <button
                type="button"
                className={settings.appearance === 'light' ? 'active' : ''}
                onClick={() => patch({ appearance: 'light' })}
              >
                Light
              </button>
              <button
                type="button"
                className={settings.appearance === 'system' ? 'active' : ''}
                onClick={() => patch({ appearance: 'system' })}
              >
                System
              </button>
              <button
                type="button"
                className={settings.appearance === 'dark' ? 'active' : ''}
                onClick={() => patch({ appearance: 'dark' })}
              >
                Dark
              </button>
            </div>
            <p className="settings-help">
              System follows your OS appearance (e.g. macOS / Windows light or
              dark mode).
            </p>

            <p className="settings-hint settings-hint-spaced">Theme color</p>
            <div className="settings-accent-grid">
              {ACCENT_PRESETS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  className={`settings-accent-swatch${settings.accent === id ? ' is-active' : ''}`}
                  style={{ '--swatch': SWATCH_HEX[id] }}
                  onClick={() => patch({ accent: id })}
                  aria-pressed={settings.accent === id}
                  aria-label={label}
                  title={label}
                >
                  <span className="settings-accent-dot" />
                  <span className="settings-accent-name">{label}</span>
                </button>
              ))}
            </div>

            <SettingsToggle
              id="settings-bold"
              label="Bold text"
              checked={settings.boldText}
              onChange={(v) => patch({ boldText: v })}
            />
          </section>

          <section className="settings-section" aria-labelledby="settings-tasks">
            <h3 id="settings-tasks" className="settings-section-title">
              Tasks
            </h3>
            <SettingsToggle
              id="settings-autoclose"
              label="Collapse add field after adding a task"
              checked={settings.autoCloseAfterAdd}
              onChange={(v) => patch({ autoCloseAfterAdd: v })}
            />
            <p className="settings-help">
              When off, the add row stays open so you can enter another task
              quickly.
            </p>

            <p className="settings-hint settings-hint-spaced">New tasks appear at</p>
            <div className="segmented settings-segmented">
              <button
                type="button"
                className={settings.insertPosition === 'bottom' ? 'active' : ''}
                onClick={() => patch({ insertPosition: 'bottom' })}
              >
                Bottom
              </button>
              <button
                type="button"
                className={settings.insertPosition === 'top' ? 'active' : ''}
                onClick={() => patch({ insertPosition: 'top' })}
              >
                Top
              </button>
            </div>
            <p className="settings-help">
              Top lists newest tasks first; bottom lists oldest first.
            </p>

            <SettingsToggle
              id="settings-shortcut-hint"
              label="Show “Press N to add” under the title"
              checked={settings.showShortcutHint}
              onChange={(v) => patch({ showShortcutHint: v })}
            />
          </section>

          <section
            className="settings-section"
            aria-labelledby="settings-todo-colors"
          >
            <h3
              id="settings-todo-colors"
              className="settings-section-title"
            >
              Todo colors
            </h3>
            <p className="settings-help">
              Pick colors for each todo (text + check circle). Min 4, max 8.
            </p>

            <div className="todo-color-editor-list">
              {settings.todoColors.map((c, idx) => {
                const canDelete = idx >= MIN_TODO_COLORS
                return (
                  <div key={c.id} className="todo-color-editor-row">
                    <span
                      className="todo-color-editor-swatch"
                      aria-hidden
                      style={{ background: c.hex }}
                    />

                    <input
                      className="todo-color-editor-name"
                      type="text"
                      value={c.name}
                      onChange={(e) =>
                        updateTodoColorAt(idx, { name: e.target.value })
                      }
                    />

                    <input
                      className="todo-color-editor-picker"
                      type="color"
                      value={c.hex}
                      onChange={(e) =>
                        updateTodoColorAt(idx, { hex: e.target.value })
                      }
                      aria-label={`Edit color ${c.name}`}
                    />

                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      disabled={!canDelete}
                      onClick={() => removeTodoColorAt(idx)}
                      title={canDelete ? 'Remove color' : 'At least 4 colors required'}
                    >
                      Delete
                    </button>
                  </div>
                )
              })}
            </div>

            <button
              type="button"
              className="btn btn-muted"
              disabled={settings.todoColors.length >= MAX_TODO_COLORS}
              onClick={addTodoColor}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Add color
            </button>
          </section>

          <section className="settings-section" aria-labelledby="settings-data">
            <h3 id="settings-data" className="settings-section-title">
              Data
            </h3>
            <p className="settings-help">
              You have <strong>{todoCount}</strong> task
              {todoCount === 1 ? '' : 's'}.
            </p>
            <button
              type="button"
              className="btn btn-danger"
              disabled={todoCount === 0}
              onClick={onClearAllTodos}
            >
              Clear all tasks…
            </button>
            <p className="settings-help settings-help-warn">
              This asks for confirmation and cannot be undone.
            </p>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  )
}
