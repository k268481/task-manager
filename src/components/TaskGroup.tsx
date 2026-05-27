import { useState } from 'react'
import type { Task } from '../types'
import { TaskItem } from './TaskItem'
import { moveNavFocus } from '../lib/navUtils'

type TaskGroupProps = {
  label: string
  tasks: Task[]
  overdue?: boolean
  onToggleComplete: (id: string) => void
  onToggleImportant: (id: string) => void
  onSelect: (id: string) => void
  onDeleteRequest: (id: string) => void
}

export function TaskGroup({
  label,
  tasks,
  overdue = false,
  onToggleComplete,
  onToggleImportant,
  onSelect,
  onDeleteRequest,
}: TaskGroupProps) {
  const [open, setOpen] = useState(true)

  if (tasks.length === 0) return null

  return (
    <section className="task-group">
      <button
        type="button"
        className={`task-group-heading${overdue ? ' task-group-heading--overdue' : ''}`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault()
            moveNavFocus(e.currentTarget, e.key === 'ArrowUp' ? 'up' : 'down')
          }
        }}
        aria-expanded={open}
      >
        <span className="task-group-arrow">{open ? '▼' : '▶'}</span>
        <span>{label}</span>
        <span className="task-group-count">({tasks.length})</span>
      </button>
      {open && (
        <div className="task-group-list" role="rowgroup">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleComplete={onToggleComplete}
              onToggleImportant={onToggleImportant}
              onSelect={onSelect}
              onDeleteRequest={onDeleteRequest}
            />
          ))}
        </div>
      )}
    </section>
  )
}
