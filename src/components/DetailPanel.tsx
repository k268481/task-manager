import { useEffect, useRef } from 'react'
import type { Task } from '../types'

type DetailPanelProps = {
  task: Task | null
  onClose: () => void
  onDone: () => void
  onUpdate: (id: string, patch: Partial<Task>) => void
  onDeleteRequest: (id: string) => void
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
 * パネル内のナビゲーション対象要素を DOM から収集する。
 * クリアボタンは dueDate がある場合のみ現れるため、毎回クエリして取得する。
 *
 * 順番:
 *   タイトル → 今日 → 明日 → 今週末 → 📅 → [クリア] → □完了 → ☆重要 → メモ
 */
function getPanelNavItems(panelEl: HTMLElement): HTMLElement[] {
  return Array.from(
    panelEl.querySelectorAll<HTMLElement>(
      '#panel-title, .due-buttons > button, .panel-toggles > button, #panel-memo'
    )
  )
}

/**
 * パネル内の ↑↓ キーナビゲーション。
 * textarea は先頭（↑）または末尾（↓）にいるときだけ移動する。
 */
function handlePanelArrowNav(
  e: React.KeyboardEvent<HTMLElement>,
  panelEl: HTMLElement | null
) {
  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
  if (!panelEl) return

  const active = document.activeElement as HTMLElement
  const items = getPanelNavItems(panelEl)
  const idx = items.indexOf(active)
  if (idx === -1) return

  // textarea は境界にいるときだけ移動
  if (active.tagName === 'TEXTAREA') {
    const ta = active as HTMLTextAreaElement
    if (e.key === 'ArrowUp'   && ta.selectionStart !== 0)             return
    if (e.key === 'ArrowDown' && ta.selectionEnd   !== ta.value.length) return
  }

  e.preventDefault()

  const nextIdx = e.key === 'ArrowUp' ? idx - 1 : idx + 1
  if (nextIdx >= 0 && nextIdx < items.length) {
    items[nextIdx].focus()
  }
}

export function DetailPanel({ task, onClose, onDone, onUpdate, onDeleteRequest }: DetailPanelProps) {
  const dateInputRef = useRef<HTMLInputElement>(null)
  const panelRef     = useRef<HTMLElement>(null)

  // パネルが開いたとき（マウント時）タイトル欄に自動フォーカス
  useEffect(() => {
    const titleEl = panelRef.current?.querySelector<HTMLElement>('#panel-title')
    // 短い遅延でスライドインアニメーション後にフォーカスを当てる
    const timer = setTimeout(() => titleEl?.focus(), 50)
    return () => clearTimeout(timer)
  }, [])

  // Esc → 閉じる  /  Ctrl+Enter → 完了
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        onDone()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onDone])

  if (!task) return null

  return (
    <>
      <div className="panel-overlay" onClick={onClose} aria-hidden="true" />

      <aside
        ref={panelRef}
        className="detail-panel"
        aria-label="タスク詳細"
        onKeyDown={(e) => {
          // ↑↓ ナビゲーション
          handlePanelArrowNav(e, panelRef.current)
          // Enter でトグルボタンを切り替え（Space と同じ動作にする）
          if (e.key === 'Enter') {
            const active = document.activeElement
            if (active instanceof HTMLButtonElement && active.closest('.panel-toggles')) {
              e.preventDefault()
              active.click()
            }
          }
        }}
      >
        {/* タイトル */}
        <div className="panel-field">
          <label className="panel-label" htmlFor="panel-title">タイトル</label>
          <input
            id="panel-title"
            type="text"
            className="panel-input"
            defaultValue={task.title}
            onBlur={(e) => {
              const v = e.currentTarget.value.trim()
              if (v !== '' && v !== task.title) onUpdate(task.id, { title: v })
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
            }}
          />
        </div>

        {/* 期限 */}
        <div className="panel-field">
          <span className="panel-label">期限</span>
          {/* .due-buttons 直下の <button> が ↑↓ の対象になる */}
          <div className="due-buttons">
            <button type="button" className="btn-ghost btn-sm" onClick={() => onUpdate(task.id, { dueDate: todayStr() })}>今日</button>
            <button type="button" className="btn-ghost btn-sm" onClick={() => onUpdate(task.id, { dueDate: tomorrowStr() })}>明日</button>
            <button type="button" className="btn-ghost btn-sm" onClick={() => onUpdate(task.id, { dueDate: thisWeekendStr() })}>今週末（土曜日）</button>
            <button
              type="button"
              className="btn-ghost btn-sm"
              onClick={() => dateInputRef.current?.showPicker?.()}
              aria-label="カレンダーで選択"
            >
              📅
            </button>
            <input
              ref={dateInputRef}
              type="date"
              className="date-input-hidden"
              value={task.dueDate ?? ''}
              onChange={(e) => onUpdate(task.id, { dueDate: e.target.value || null })}
            />
            {task.dueDate && (
              <button type="button" className="btn-ghost btn-sm" onClick={() => onUpdate(task.id, { dueDate: null })}>クリア</button>
            )}
          </div>
          {task.dueDate && (
            <p className="panel-due-value">{task.dueDate}</p>
          )}
        </div>

        {/* 完了 / 重要 — 横並びトグル */}
        <div className="panel-field">
          <div className="panel-toggles">
            {/* 完了トグル（hidden checkbox を button で包む） */}
            <button
              type="button"
              className={`panel-toggle-btn${task.completed ? ' panel-toggle-btn--done' : ''}`}
              tabIndex={-1}
              aria-pressed={task.completed}
              aria-label={task.completed ? '未完了に戻す' : '完了にする'}
              onClick={() => {
                const completed = !task.completed
                onUpdate(task.id, {
                  completed,
                  completedAt: completed ? new Date().toISOString() : null,
                })
              }}
            >
              {task.completed ? '☑' : '☐'} 完了
            </button>

            {/* 重要トグル */}
            <button
              id="panel-star"
              type="button"
              className={`panel-toggle-btn${task.important ? ' panel-toggle-btn--star' : ''}`}
              tabIndex={-1}
              aria-pressed={task.important}
              aria-label={task.important ? '重要を解除' : '重要にする'}
              onClick={() => onUpdate(task.id, { important: !task.important })}
            >
              {task.important ? '★' : '☆'} 重要
            </button>
          </div>
        </div>

        {/* メモ */}
        <div className="panel-field panel-field--grow">
          <label className="panel-label" htmlFor="panel-memo">
            メモ
            <span className="panel-label-hint">（Ctrl+Enter で完了して戻る）</span>
          </label>
          <textarea
            id="panel-memo"
            className="panel-textarea"
            defaultValue={task.memo}
            onBlur={(e) => {
              const v = e.currentTarget.value
              if (v !== task.memo) onUpdate(task.id, { memo: v })
            }}
          />
        </div>

        {/* アクション */}
        <div className="panel-actions">
          <button type="button" className="btn-danger" onClick={() => onDeleteRequest(task.id)}>
            削除
          </button>
          <div className="panel-actions-right">
            <button type="button" className="btn-ghost" onClick={onClose}>閉じる</button>
            <button type="button" className="btn-primary" onClick={onDone}>完了</button>
          </div>
        </div>
      </aside>
    </>
  )
}
