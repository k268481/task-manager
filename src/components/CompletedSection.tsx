import { useState } from 'react'
import type { Task } from '../types'
import { TaskItem } from './TaskItem'
import { moveNavFocus } from '../lib/navUtils'

type CompletedSectionProps = {
  tasks: Task[]
  onToggleComplete: (id: string) => void
  onToggleImportant: (id: string) => void
  onSelect: (id: string) => void
  onDeleteRequest: (id: string) => void
}

export function CompletedSection({
  tasks,
  onToggleComplete,
  onToggleImportant,
  onSelect,
  onDeleteRequest,
}: CompletedSectionProps) {
  const [open, setOpen] = useState(false)

  if (tasks.length === 0) return null

  return (
    <section className="task-group task-group--completed">
      <button
        type="button"
        className="task-group-heading"
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
        <span>完了</span>
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
