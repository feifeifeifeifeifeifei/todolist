import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'
import settingsPic from './settings_pic.png'
import TodoTitle from './components/TodoTitle'
import TodoInput from './components/TodoInput'
import TodoLeftCount from './components/TodoLeftCount'
import TodoFilters from './components/TodoFilters'
import TodoClearActions from './components/TodoClearActions'
import TodoList from './components/TodoList'
import SettingsPanel from './components/SettingsPanel'
import { loadSettings, saveSettings } from './settings/storage.js'
import { applyThemeToDocument } from './settings/applyTheme.js'

function isTypingInField(target) {
  if (!(target instanceof Element)) return false
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
}

function App() {
  const addInputRef = useRef(null)
  const [settings, setSettings] = useState(() => loadSettings())
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [todos, setTodos] = useState(() => {
    const savedTodos = localStorage.getItem('todos')
    return savedTodos ? JSON.parse(savedTodos) : []
  })
  const [filterType, setFilterType] = useState('all')

  const [isComposing, setIsComposing] = useState(false)

  const [editingId, setEditingId] = useState(null)
  const [editingText, setEditingText] = useState('')

  const [clearedTodos, setClearedTodos] = useState([])

  const closeSettings = useCallback(() => setSettingsOpen(false), [])

  useEffect(() => {
    applyThemeToDocument(settings)
    saveSettings(settings)
  }, [settings])

  useEffect(() => {
    if (settings.appearance !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyThemeToDocument(settings)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [settings])

  const handleAddTodo = () => {
    if (inputValue.trim() === '') return

    const newTodo = {
      id: Date.now(),
      text: inputValue,
      completed: false,
    }

    setTodos((prevTodos) =>
      settings.insertPosition === 'top'
        ? [newTodo, ...prevTodos]
        : [...prevTodos, newTodo],
    )
    setInputValue('')
    if (settings.autoCloseAfterAdd) {
      setIsAddOpen(false)
    }
  }

  const handleDelete = (id) => {
    const newTodos = todos.filter((todo) => todo.id !== id)
    setTodos(newTodos)
  }

  const handleToggle = (id) => {
    const newTodos = todos.map((todo) => {
      if (todo.id === id) {
        return {
          ...todo,
          completed: !todo.completed,
        }
      }
      return todo
    })
    setTodos(newTodos)
  }

  const clearCompleted = () => {
    const hasCompleted = todos.filter((todo) => todo.completed)
    if (hasCompleted.length === 0) return
    setClearedTodos(hasCompleted)

    const newTodos = todos.filter((todo) => !todo.completed)
    setTodos(newTodos)
  }

  const handleUndoClearCompleted = () => {
    if (clearedTodos.length === 0) return
    setTodos((prev) =>
      settings.insertPosition === 'top'
        ? [...prev, ...clearedTodos]
        : [...clearedTodos, ...prev],
    )
    setClearedTodos([])
  }

  const handleReorder = (draggedId, targetId, position) => {
    if (draggedId === targetId) return
    setTodos((prev) => {
      const draggedIdx = prev.findIndex((t) => t.id === draggedId)
      if (draggedIdx === -1) return prev
      const dragged = prev[draggedIdx]
      const without = [...prev]
      without.splice(draggedIdx, 1)
      const targetIdx = without.findIndex((t) => t.id === targetId)
      if (targetIdx === -1) return prev
      const insertAt = position === 'before' ? targetIdx : targetIdx + 1
      without.splice(insertAt, 0, dragged)
      return without
    })
  }

  const handleStartEdit = (todo) => {
    setEditingId(todo.id)
    setEditingText(todo.text)
  }

  const handleSaveEdit = () => {
    const trimmedEdit = editingText.trim()
    if (trimmedEdit === '') return

    const newTodos = todos.map((todo) => {
      if (todo.id === editingId) {
        return {
          ...todo,
          text: trimmedEdit,
        }
      }
      return todo
    })

    setTodos(newTodos)
    setEditingId(null)
    setEditingText('')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingText('')
  }

  const handleSetColor = (id, color) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, color: color || undefined } : todo,
      ),
    )
  }

  const handleClearAllTodos = () => {
    const n = todos.length
    if (n === 0) return
    const ok = window.confirm(
      `Delete all ${n} task${n === 1 ? '' : 's'}? This cannot be undone.`,
    )
    if (!ok) return
    setTodos([])
    setClearedTodos([])
  }

  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos))
  }, [todos])

  useEffect(() => {
    if (!isAddOpen) return
    const id = requestAnimationFrame(() => addInputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [isAddOpen])

  useEffect(() => {
    if (!isAddOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setIsAddOpen(false)
        setInputValue('')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isAddOpen])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'n' || e.metaKey || e.ctrlKey || e.altKey) return
      if (settingsOpen) return
      if (isTypingInField(e.target)) return
      e.preventDefault()
      setIsAddOpen((wasOpen) => {
        if (wasOpen) {
          queueMicrotask(() => addInputRef.current?.focus())
        }
        return true
      })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [settingsOpen])

  const leftCount = todos.filter((todo) => !todo.completed).length

  let filteredTodos = todos
  if (filterType === 'active') {
    filteredTodos = todos.filter((todo) => !todo.completed)
  } else if (filterType === 'completed') {
    filteredTodos = todos.filter((todo) => todo.completed)
  }

  const completedCount = todos.filter((todo) => todo.completed).length

  return (
    <div className="app">
      <button
        type="button"
        className="app-settings-btn"
        onClick={() => setSettingsOpen(true)}
        aria-label="Open settings"
      >
        <img src={settingsPic} alt="" width={20} height={20} />
      </button>

      <TodoTitle showShortcutHint={settings.showShortcutHint} />

      <TodoInput
        isOpen={isAddOpen}
        onOpen={() => setIsAddOpen(true)}
        onClose={() => {
          setIsAddOpen(false)
          setInputValue('')
        }}
        inputRef={addInputRef}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        isComposing={isComposing}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={(e) => {
          setIsComposing(false)
          setInputValue(e.target.value)
        }}
        onAdd={handleAddTodo}
      />

      <TodoLeftCount leftCount={leftCount} />

      <TodoFilters filterType={filterType} onFilterChange={setFilterType} />

      <TodoClearActions
        completedCount={completedCount}
        clearedCount={clearedTodos.length}
        onClearCompleted={clearCompleted}
        onUndoClear={handleUndoClearCompleted}
      />

      <TodoList
        todos={filteredTodos}
        editingId={editingId}
        editingText={editingText}
        onEditingTextChange={(e) => setEditingText(e.target.value)}
        onSaveEdit={handleSaveEdit}
        onCancelEdit={handleCancelEdit}
        onStartEdit={handleStartEdit}
        onToggle={handleToggle}
        onDelete={handleDelete}
        todoColors={settings.todoColors}
        onSetColor={handleSetColor}
        onReorder={handleReorder}
      />

      <SettingsPanel
        open={settingsOpen}
        onClose={closeSettings}
        settings={settings}
        onPatch={(partial) => setSettings((s) => ({ ...s, ...partial }))}
        todoCount={todos.length}
        onClearAllTodos={handleClearAllTodos}
      />
    </div>
  )
}

export default App
