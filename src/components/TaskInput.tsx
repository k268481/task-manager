import { useRef, useImperativeHandle, forwardRef, useState } from 'react'
import { moveNavFocus } from '../lib/navUtils'

type TaskInputProps = {
  onSubmit: (title: string, memo: string, dueDate: string | null, important: boolean, completed: boolean) => void
}

export type TaskInputHandle = {
  focusTitle: () => void
  focusMemo: () => void
}

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function tomorrowStr(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function thisWeekendStr(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? 6 : day === 6 ? 0 : 6 - day
  d.setDate(d.getDate() + diff)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * フォーム内のキーナビ対象要素を DOM 順で返す。
 *
 * 順番:
 *   タイトル → 今日 → 明日 → 今週末 → 📅 → [クリア] → □完了 → ☆重要 → メモ
 */
function getInputNavItems(wrapEl: HTMLElement): HTMLElement[] {
  return Array.from(
    wrapEl.querySelectorAll<HTMLElement>(
      '[data-nav-id="task-input-title"], .task-input-due-buttons > button, .task-input-toggles > button, [data-nav-id="task-input-memo"]'
    )
  )
}

/**
 * タスク追加フォーム。
 *
 * キー操作（フォーム内）:
 *   タイトル Enter / ↓          → 次の要素（今日ボタン）へ
 *   タイトル ↑                  → ナビリスト末尾（最後のタスク行）へ循環
 *   各ボタン ↑↓                 → フォーム内を移動
 *   メモ欄 ↑ (先頭)             → 直前の要素（重要ボタン）へ
 *   メモ欄 ↓ (末尾)             → 最初のセクション見出しへ循環
 *   Ctrl+Enter (任意の場所)      → タスクを送信
 *   Esc                          → タイトル欄へ戻る
 */
export const TaskInput = forwardRef<TaskInputHandle, TaskInputProps>(
  function TaskInput({ onSubmit }, ref) {
    const titleRef    = useRef<HTMLInputElement>(null)
    const memoRef     = useRef<HTMLTextAreaElement>(null)
    const dateInputRef = useRef<HTMLInputElement>(null)
    const wrapRef     = useRef<HTMLDivElement>(null)

    const [dueDate,   setDueDate]   = useState<string | null>(null)
    const [important, setImportant] = useState(false)
    const [completed, setCompleted] = useState(false)

    useImperativeHandle(ref, () => ({
      focusTitle: () => titleRef.current?.focus(),
      focusMemo:  () => memoRef.current?.focus(),
    }))

    function reset() {
      if (titleRef.current)  titleRef.current.value  = ''
      if (memoRef.current)   memoRef.current.value   = ''
      setDueDate(null)
      setImportant(false)
      setCompleted(false)
    }

    function submit() {
      const title = titleRef.current?.value.trim() ?? ''
      if (title === '') { titleRef.current?.focus(); return }
      const memo = memoRef.current?.value ?? ''
      onSubmit(title, memo, dueDate, important, completed)
      reset()
      titleRef.current?.focus()
    }

    function handleWrapKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
      const active = document.activeElement as HTMLElement
      const wrap = wrapRef.current
      if (!wrap) return

      // Ctrl+Enter → 送信
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        submit()
        return
      }

      // Esc → タイトルへ戻る
      if (e.key === 'Escape') {
        e.preventDefault()
        titleRef.current?.focus()
        return
      }

      // タイトルで Enter → 次の要素へ（↓ と同じ）
      if (e.key === 'Enter' && active === titleRef.current) {
        e.preventDefault()
        const items = getInputNavItems(wrap)
        const idx = items.indexOf(active)
        if (idx !== -1 && idx < items.length - 1) items[idx + 1].focus()
        return
      }

      // ↑↓ ナビゲーション
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return

      const items = getInputNavItems(wrap)
      const idx   = items.indexOf(active)
      if (idx === -1) return

      // textarea は境界にいるときだけ移動
      if (active.tagName === 'TEXTAREA') {
        const ta = active as HTMLTextAreaElement
        if (e.key === 'ArrowUp'   && ta.selectionStart !== 0)              return
        if (e.key === 'ArrowDown' && ta.selectionEnd   !== ta.value.length) return
      }

      e.preventDefault()

      if (e.key === 'ArrowUp') {
        if (idx === 0) {
          // 先頭（タイトル）→ グローバルナビで末尾へ循環
          moveNavFocus(active, 'up')
        } else {
          items[idx - 1].focus()
        }
      } else {
        if (idx === items.length - 1) {
          // 末尾（メモ）→ グローバルナビで最初のセクションへ循環
          moveNavFocus(active, 'down')
        } else {
          items[idx + 1].focus()
        }
      }
    }

    const today   = todayStr()
    const tomorrow = tomorrowStr()
    const weekend  = thisWeekendStr()

    return (
      <div className="task-input-wrap" ref={wrapRef} onKeyDown={handleWrapKeyDown}>
        <div className="task-input-fields">
          {/* タイトル */}
          <input
            ref={titleRef}
            data-nav-id="task-input-title"
            type="text"
            className="task-input"
            placeholder="タスクを追加"
            aria-label="新しいタスクのタイトル"
          />

          {/* 期限 */}
          <div className="task-input-section">
            <span className="task-input-label">期限</span>
            <div className="task-input-due-buttons">
              <button
                type="button"
                className={`btn-ghost btn-sm${dueDate === today ? ' btn-active' : ''}`}
                onClick={() => setDueDate(v => v === today ? null : today)}
              >今日</button>
              <button
                type="button"
                className={`btn-ghost btn-sm${dueDate === tomorrow ? ' btn-active' : ''}`}
                onClick={() => setDueDate(v => v === tomorrow ? null : tomorrow)}
              >明日</button>
              <button
                type="button"
                className={`btn-ghost btn-sm${dueDate === weekend ? ' btn-active' : ''}`}
                onClick={() => setDueDate(v => v === weekend ? null : weekend)}
              >今週末</button>
              <button
                type="button"
                className="btn-ghost btn-sm"
                onClick={() => dateInputRef.current?.showPicker?.()}
                aria-label="カレンダーで選択"
              >📅</button>
              <input
                ref={dateInputRef}
                type="date"
                className="date-input-hidden"
                value={dueDate ?? ''}
                onChange={(e) => setDueDate(e.target.value || null)}
              />
              {dueDate && (
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  onClick={() => setDueDate(null)}
                >クリア</button>
              )}
            </div>
            {dueDate && <p className="task-input-due-value">{dueDate}</p>}
          </div>

          {/* 完了 / 重要 トグル */}
          <div className="task-input-toggles">
            <button
              type="button"
              className={`panel-toggle-btn${completed ? ' panel-toggle-btn--done' : ''}`}
              aria-pressed={completed}
              aria-label={completed ? '未完了に戻す' : '完了にする'}
              onClick={() => setCompleted(v => !v)}
            >
              {completed ? '☑' : '☐'} 完了
            </button>
            <button
              type="button"
              className={`panel-toggle-btn${important ? ' panel-toggle-btn--star' : ''}`}
              aria-pressed={important}
              aria-label={important ? '重要を解除' : '重要にする'}
              onClick={() => setImportant(v => !v)}
            >
              {important ? '★' : '☆'} 重要
            </button>
          </div>

          {/* メモ */}
          <textarea
            ref={memoRef}
            data-nav-id="task-input-memo"
            className="task-input-memo"
            placeholder="メモ（任意）"
            rows={2}
            aria-label="新しいタスクのメモ"
          />
        </div>

        <button
          type="button"
          className="btn-primary task-input-add"
          onClick={submit}
        >
          追加
        </button>
      </div>
    )
  }
)
