import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { ACCENT_PRESETS, MIN_TODO_COLORS, MAX_TODO_COLORS } from '../settings/storage'

const SWATCH_HEX = {
  black: '#0f172a',
  purple: '#aa3bff',
  pink: '#f18cb9a7',
  blue: '#2563eb',
  teal: '#0d9488',
  orange: '#ea580c',
}

function TodoColorEditor({ colors, onChange }) {
  const pickerRef = useRef(null)
  const editIndexRef = useRef(-1)

  const canRemove = colors.length > MIN_TODO_COLORS
  const canAdd = colors.length < MAX_TODO_COLORS

  const handleColorChange = (index, hex) => {
    const next = [...colors]
    next[index] = hex
    onChange(next)
  }

  const handleRemove = (index) => {
    if (!canRemove) return
    const next = colors.filter((_, i) => i !== index)
    onChange(next)
  }

  const handleAdd = () => {
    if (!canAdd) return
    onChange([...colors, '#9333ea'])
  }

  const openPicker = (index) => {
    editIndexRef.current = index
    if (pickerRef.current) {
      pickerRef.current.value = colors[index]
      pickerRef.current.click()
    }
  }

  const onPickerInput = (e) => {
    const idx = editIndexRef.current
    if (idx < 0 || idx >= colors.length) return
    handleColorChange(idx, e.target.value)
  }

  return (
    <div className="todo-color-editor">
      <input
        ref={pickerRef}
        type="color"
        className="todo-color-editor-hidden-picker"
        aria-hidden
        tabIndex={-1}
        onInput={onPickerInput}
      />
      <div className="todo-color-editor-grid">
        {colors.map((hex, i) => (
          <div key={i} className="todo-color-editor-item">
            <button
              type="button"
              className="todo-color-editor-swatch"
              style={{ '--dot': hex }}
              title={`Edit ${hex}`}
              aria-label={`Edit color ${i + 1}`}
              onClick={() => openPicker(i)}
            />
            {canRemove && (
              <button
                type="button"
                className="todo-color-editor-remove"
                title="Remove"
                aria-label={`Remove color ${i + 1}`}
                onClick={() => handleRemove(i)}
              >
                ×
              </button>
            )}
          </div>
        ))}
        {canAdd && (
          <button
            type="button"
            className="todo-color-editor-add"
            title="Add color"
            aria-label="Add color"
            onClick={handleAdd}
          >
            +
          </button>
        )}
      </div>
      <p className="settings-help">
        Click a circle to change its color. {MIN_TODO_COLORS}–{MAX_TODO_COLORS} colors allowed.
      </p>
    </div>
  )
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

            <p className="settings-hint settings-hint-spaced">Task label colors</p>
            <TodoColorEditor
              colors={settings.todoColors}
              onChange={(next) => patch({ todoColors: next })}
            />
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
