import { useEffect, useRef, useState } from 'react'

type ManualModalProps = {
  onClose: () => void
}

type Section = {
  id: string
  title: string
  content: React.ReactNode
}

const SECTIONS: Section[] = [
  {
    id: 'add',
    title: '📝 タスクの追加',
    content: (
      <ul className="manual-list">
        <li>画面上部の入力欄にタスクのタイトルを入力してください。</li>
        <li><kbd>Enter</kbd> または <kbd>↓</kbd> でメモ欄に移動できます。</li>
        <li>メモ欄で <kbd>Ctrl</kbd>+<kbd>Enter</kbd> を押すとタスクが追加されます。</li>
        <li>「追加」ボタンをクリックしても追加できます。</li>
      </ul>
    ),
  },
  {
    id: 'edit',
    title: '✏️ タスクの編集',
    content: (
      <ul className="manual-list">
        <li>タスク名をクリック、または <kbd>Enter</kbd> キーで詳細パネルが開きます。</li>
        <li>パネルでタイトル・期限・メモを編集できます。</li>
        <li><kbd>Ctrl</kbd>+<kbd>Enter</kbd> で編集を完了してパネルを閉じます。</li>
        <li><kbd>Esc</kbd> でパネルを閉じます。</li>
      </ul>
    ),
  },
  {
    id: 'status',
    title: '☑ 完了・重要の切り替え',
    content: (
      <ul className="manual-list">
        <li>タスク行の <strong>☐</strong>（左端）をクリックすると完了/未完了を切り替えます。</li>
        <li>タスク行の <strong>☆</strong> をクリックすると重要/通常を切り替えます。</li>
        <li>詳細パネル内の「☐ 完了」ボタンでも完了を切り替えられます。</li>
        <li>詳細パネル内の「☆ 重要」ボタンでも重要を切り替えられます。</li>
      </ul>
    ),
  },
  {
    id: 'keyboard',
    title: '⌨️ キーボード操作',
    content: (
      <table className="manual-table">
        <thead>
          <tr><th>キー</th><th>動作</th></tr>
        </thead>
        <tbody>
          <tr><td><kbd>↑</kbd> <kbd>↓</kbd></td><td>タスク間・入力欄を移動</td></tr>
          <tr><td><kbd>←</kbd> <kbd>→</kbd></td><td>タスク行内で ☐ / ☆ にフォーカス移動</td></tr>
          <tr><td><kbd>Space</kbd></td><td>タスクを完了/未完了に切り替え</td></tr>
          <tr><td><kbd>Enter</kbd></td><td>タスクの詳細パネルを開く</td></tr>
          <tr><td><kbd>Delete</kbd></td><td>タスクの削除確認ダイアログを開く</td></tr>
          <tr><td><kbd>Ctrl</kbd>+<kbd>Enter</kbd></td><td>タスク追加 / パネルを閉じて戻る</td></tr>
          <tr><td><kbd>Esc</kbd></td><td>パネルを閉じる / メモ欄からタイトルへ戻る</td></tr>
        </tbody>
      </table>
    ),
  },
  {
    id: 'sections',
    title: '📂 セクションの折りたたみ',
    content: (
      <ul className="manual-list">
        <li>「今日」「明日」「今週末」などのセクション名をクリックすると折りたたみ・展開できます。</li>
        <li>セクションにフォーカスして <kbd>Enter</kbd> でも切り替えられます。</li>
        <li>「完了」セクションは初期状態で折りたたまれています。</li>
      </ul>
    ),
  },
  {
    id: 'duedate',
    title: '📅 期限の設定',
    content: (
      <ul className="manual-list">
        <li>詳細パネルの「今日」「明日」「今週末」ボタンで素早く期限を設定できます。</li>
        <li>📅 ボタンでカレンダーから日付を選べます。</li>
        <li>「クリア」ボタンで期限を削除します。</li>
        <li>14日以上前の期限は起動時に自動的にクリアされます。</li>
      </ul>
    ),
  },
  {
    id: 'save',
    title: '💾 データの保存・読み込み',
    content: (
      <ul className="manual-list">
        <li>タスクはブラウザに自動保存されます（手動保存は不要です）。</li>
        <li>「名前を付けて保存」でタスクをJSONファイルとしてエクスポートできます。</li>
        <li>「予定を開く」でJSONファイルからタスクを読み込めます（現在のデータは置き換えられます）。</li>
      </ul>
    ),
  },
]

export function ManualModal({ onClose }: ManualModalProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(SECTIONS.map((s) => s.id))
  )
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  // Esc で閉じる & 開いた時に閉じるボタンへフォーカス
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    const timer = setTimeout(() => closeButtonRef.current?.focus(), 50)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      clearTimeout(timer)
    }
  }, [onClose])

  function toggleSection(id: string) {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="manual-modal"
        role="dialog"
        aria-modal="true"
        aria-label="取扱説明書"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="manual-header">
          <h2 className="manual-title">📖 取扱説明書</h2>
          <button
            ref={closeButtonRef}
            type="button"
            className="btn-ghost btn-sm"
            onClick={onClose}
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        <div className="manual-body">
          {SECTIONS.map((section) => {
            const isOpen = openSections.has(section.id)
            return (
              <div key={section.id} className="manual-section">
                <button
                  type="button"
                  className="manual-section-heading"
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={isOpen}
                >
                  <span className="task-group-arrow">{isOpen ? '▼' : '▶'}</span>
                  <span>{section.title}</span>
                </button>
                {isOpen && (
                  <div className="manual-section-body">{section.content}</div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
