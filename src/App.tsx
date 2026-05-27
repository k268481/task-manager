import { useState, useEffect, useRef } from 'react'
import type { Task, StoredData } from './types'
import { loadTasks, saveTasks } from './lib/storage'
import { exportToFile, validateImport } from './lib/jsonIO'
import { todayString } from './lib/date'
import { GROUP_NAMES, groupTasks } from './lib/group'
import { sortInGroup } from './lib/sort'
import { runCleanup } from './lib/cleanup'
import { Header } from './components/Header'
import { ManualModal } from './components/ManualModal'
import { TaskInput, type TaskInputHandle } from './components/TaskInput'
import { TaskGroup } from './components/TaskGroup'
import { CompletedSection } from './components/CompletedSection'
import { DetailPanel } from './components/DetailPanel'
import { ConfirmDialog } from './components/ConfirmDialog'
import { Toast } from './components/Toast'

// ===== 起動時の初期化（モジュール読み込み時に 1 回だけ実行） =====
type InitResult = {
  data: StoredData
  loadError: string | null
  cleanedCount: number
}

function initialize(): InitResult {
  const { data, error } = loadTasks()
  if (error) {
    return { data, loadError: error, cleanedCount: 0 }
  }
  const today = todayString()
  const { data: cleaned, clearedCount } = runCleanup(data, today)
  if (clearedCount > 0) {
    try { saveTasks(cleaned) } catch { /* 後続の useEffect で再試行・通知 */ }
  }
  return { data: cleaned, loadError: null, cleanedCount: clearedCount }
}

// React の StrictMode では useState 初期化関数が 2 回呼ばれることがある。
// その場合でも副作用（localStorage 書き込み）が二重実行されないよう
// モジュールスコープにキャッシュする。
const INIT = initialize()

type ToastItem = { id: string; message: string }
type ConfirmState = {
  message: string
  confirmLabel: string
  onConfirm: () => void
} | null

function App() {
  const [storedData, setStoredData] = useState<StoredData>(INIT.data)
  const loadErrorRef = useRef(INIT.loadError !== null)

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [confirmState, setConfirmState] = useState<ConfirmState>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [showManual, setShowManual] = useState(false)

  // タスク入力欄への参照（DetailPanel の「完了」後にフォーカスを戻す）
  const taskInputRef = useRef<TaskInputHandle>(null)

  const selectedTask = storedData.tasks.find((t) => t.id === selectedTaskId) ?? null

  /** パネルを閉じてタスク入力欄にフォーカスを戻す */
  function handlePanelDone() {
    setSelectedTaskId(null)
    // DOM の更新後にフォーカスを当てる
    requestAnimationFrame(() => taskInputRef.current?.focusTitle())
  }

  // 起動時トースト（loadError / cleanedCount）を 1 回だけ表示
  const startupToastShownRef = useRef(false)
  useEffect(() => {
    if (startupToastShownRef.current) return
    startupToastShownRef.current = true
    if (INIT.loadError) {
      addToast(INIT.loadError)
    } else if (INIT.cleanedCount > 0) {
      addToast(`${INIT.cleanedCount} 件の古い期限をクリアしました`)
    }
  }, [])

  // データが変化するたびに localStorage に書き込む
  useEffect(() => {
    if (loadErrorRef.current) return // 読み込み失敗時は上書きしない
    try {
      saveTasks(storedData)
    } catch (e) {
      addToast('保存に失敗しました')
      console.warn(e)
    }
  }, [storedData])

  function addToast(message: string) {
    setToasts((prev) => [...prev, { id: crypto.randomUUID(), message }])
  }

  function dismissToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  // ===== タスク CRUD =====

  function handleAddTask(
    title: string,
    memo: string = '',
    dueDate: string | null = null,
    important: boolean = false,
    completed: boolean = false,
  ) {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      dueDate,
      important,
      memo,
      completed,
      createdAt: new Date().toISOString(),
      completedAt: completed ? new Date().toISOString() : null,
    }
    setStoredData((prev) => ({ ...prev, tasks: [...prev.tasks, newTask] }))
  }

  function handleToggleComplete(id: string) {
    setStoredData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              completed: !t.completed,
              completedAt: !t.completed ? new Date().toISOString() : null,
            }
          : t
      ),
    }))
    // 完了したタスクのパネルが開いていたら閉じる
    if (selectedTaskId === id) setSelectedTaskId(null)
  }

  function handleToggleImportant(id: string) {
    setStoredData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === id ? { ...t, important: !t.important } : t
      ),
    }))
  }

  function handleUpdateTask(id: string, patch: Partial<Task>) {
    setStoredData((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }))
  }

  function handleDeleteRequest(id: string) {
    setConfirmState({
      message: 'このタスクを削除します。よろしいですか？',
      confirmLabel: '削除する',
      onConfirm: () => {
        setStoredData((prev) => ({
          ...prev,
          tasks: prev.tasks.filter((t) => t.id !== id),
        }))
        if (selectedTaskId === id) setSelectedTaskId(null)
        setConfirmState(null)
      },
    })
  }

  // ===== エクスポート / インポート =====

  function handleExport() {
    exportToFile(storedData)
  }

  function handleImport() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const json: unknown = JSON.parse(text)
        const result = validateImport(json)
        if ('error' in result) {
          addToast(result.error)
          return
        }
        setConfirmState({
          message: '現在のタスクは置き換えられます。よろしいですか？',
          confirmLabel: '置き換える',
          onConfirm: () => {
            setStoredData(result)
            setSelectedTaskId(null)
            setConfirmState(null)
          },
        })
      } catch {
        addToast('ファイルの読み込みに失敗しました')
      }
    }
    input.click()
  }

  // ===== グループ分けとソート =====

  const today = new Date()
  const incompleteTasks = storedData.tasks.filter((t) => !t.completed)
  const completedTasks = sortInGroup(storedData.tasks.filter((t) => t.completed))
  const grouped = groupTasks(incompleteTasks, today)

  return (
    <div className="app">
      <Header onExport={handleExport} onImport={handleImport} onManual={() => setShowManual(true)} />

      <div className="main-layout">
        <div className="task-list-area">
          {/* 入力欄: スクロールに巻き込まれない固定エリア */}
          <TaskInput ref={taskInputRef} onSubmit={handleAddTask} />

          {/* タスクリスト: 独立スクロール領域 */}
          <div className="task-scroll-body">
            {storedData.tasks.length === 0 ? (
              <div className="empty-state">タスクを追加してみましょう</div>
            ) : (
              <>
                {GROUP_NAMES.map((name) => (
                  <TaskGroup
                    key={name}
                    label={name}
                    tasks={sortInGroup(grouped[name])}
                    overdue={name === '期限切れ'}
                    onToggleComplete={handleToggleComplete}
                    onToggleImportant={handleToggleImportant}
                    onSelect={setSelectedTaskId}
                    onDeleteRequest={handleDeleteRequest}
                  />
                ))}
                <CompletedSection
                  tasks={completedTasks}
                  onToggleComplete={handleToggleComplete}
                  onToggleImportant={handleToggleImportant}
                  onSelect={setSelectedTaskId}
                  onDeleteRequest={handleDeleteRequest}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* key={selectedTask.id} でタスク切り替え時に確実に再マウントし、defaultValue をリセットする */}
      <DetailPanel
        key={selectedTask?.id ?? 'none'}
        task={selectedTask}
        onClose={() => setSelectedTaskId(null)}
        onDone={handlePanelDone}
        onUpdate={handleUpdateTask}
        onDeleteRequest={handleDeleteRequest}
      />

      {confirmState && (
        <ConfirmDialog
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(null)}
        />
      )}

      {showManual && <ManualModal onClose={() => setShowManual(false)} />}

      <div className="toast-container">
        {toasts.map((t) => (
          <Toast key={t.id} message={t.message} onDismiss={() => dismissToast(t.id)} />
        ))}
      </div>
    </div>
  )
}

export default App
