import type { Task } from '../types'
import { moveNavFocus } from '../lib/navUtils'

type TaskItemProps = {
  task: Task
  onToggleComplete: (id: string) => void
  onToggleImportant: (id: string) => void
  onSelect: (id: string) => void
  onDeleteRequest: (id: string) => void
}

export function TaskItem({
  task,
  onToggleComplete,
  onToggleImportant,
  onSelect,
  onDeleteRequest,
}: TaskItemProps) {

  // ===== タスク行本体のキーハンドラ =====
  function handleRowKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    switch (e.key) {
      case ' ':
        e.preventDefault()
        onToggleComplete(task.id)
        break
      case 'Delete':
        onDeleteRequest(task.id)
        break
      case 'Enter':
        onSelect(task.id)
        requestAnimationFrame(() => {
          document.querySelector<HTMLElement>('#panel-title')?.focus()
        })
        break
      case 'ArrowUp':
        e.preventDefault()
        moveNavFocus(e.currentTarget, 'up')
        break
      case 'ArrowDown':
        e.preventDefault()
        moveNavFocus(e.currentTarget, 'down')
        break
      case 'ArrowLeft':
        e.preventDefault()
        e.currentTarget.querySelector<HTMLElement>('.task-checkbox')?.focus()
        break
      case 'ArrowRight':
        e.preventDefault()
        e.currentTarget.querySelector<HTMLElement>('.task-star')?.focus()
        break
    }
  }

  // ===== □ 完了ボタンのキーハンドラ =====
  function handleCheckboxKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    e.stopPropagation()

    switch (e.key) {
      case ' ':
      case 'Enter':
        e.preventDefault()
        onToggleComplete(task.id)
        break
      case 'ArrowRight':
        e.preventDefault()
        e.currentTarget.closest<HTMLElement>('.task-item')
          ?.querySelector<HTMLElement>('.task-star')?.focus()
        break
      case 'ArrowLeft':
      case 'Escape':
        e.preventDefault()
        e.currentTarget.closest<HTMLElement>('.task-item')?.focus()
        break
      case 'ArrowUp':
        e.preventDefault()
        moveNavFocus(e.currentTarget, 'up')
        break
      case 'ArrowDown':
        e.preventDefault()
        moveNavFocus(e.currentTarget, 'down')
        break
    }
  }

  // ===== ☆ 重要ボタンのキーハンドラ =====
  function handleStarKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    e.stopPropagation()

    switch (e.key) {
      case ' ':
      case 'Enter':
        e.preventDefault()
        onToggleImportant(task.id)
        break
      case 'ArrowLeft':
        e.preventDefault()
        e.currentTarget.closest<HTMLElement>('.task-item')
          ?.querySelector<HTMLElement>('.task-checkbox')?.focus()
        break
      case 'ArrowRight':
      case 'Escape':
        e.preventDefault()
        e.currentTarget.closest<HTMLElement>('.task-item')?.focus()
        break
      case 'ArrowUp':
        e.preventDefault()
        moveNavFocus(e.currentTarget, 'up')
        break
      case 'ArrowDown':
        e.preventDefault()
        moveNavFocus(e.currentTarget, 'down')
        break
    }
  }

  return (
    <div
      className={`task-item${task.completed ? ' task-item--completed' : ''}`}
      tabIndex={0}
      onKeyDown={handleRowKeyDown}
      role="row"
      aria-label={task.title}
    >
      <button
        type="button"
        className="task-checkbox"
        aria-label={task.completed ? '未完了に戻す' : '完了にする'}
        aria-pressed={task.completed}
        tabIndex={-1}
        onKeyDown={handleCheckboxKeyDown}
        onClick={(e) => { e.stopPropagation(); onToggleComplete(task.id) }}
      >
        {task.completed ? '☑' : '☐'}
      </button>

      <button
        type="button"
        className={`task-star${task.important ? ' task-star--on' : ''}`}
        aria-label={task.important ? '重要を解除' : '重要にする'}
        aria-pressed={task.important}
        tabIndex={-1}
        onKeyDown={handleStarKeyDown}
        onClick={(e) => { e.stopPropagation(); onToggleImportant(task.id) }}
      >
        {task.important ? '★' : '☆'}
      </button>

      <span
        className="task-title"
        onClick={() => onSelect(task.id)}
        role="button"
        tabIndex={-1}
      >
        {task.title}
      </span>
    </div>
  )
}
