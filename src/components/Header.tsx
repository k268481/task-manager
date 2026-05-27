type HeaderProps = {
  onExport: () => void
  onImport: () => void
  onManual: () => void
}

export function Header({ onExport, onImport, onManual }: HeaderProps) {
  return (
    <header className="header">
      <div className="header-brand">
        <h1 className="header-title">タスク管理表</h1>
        <button
          type="button"
          className="btn-manual"
          onClick={onManual}
          aria-label="取扱説明書を開く"
          title="取扱説明書"
        >
          ?
        </button>
      </div>
      <div className="header-actions">
        <button type="button" className="btn-ghost" onClick={onImport}>
          予定を開く
        </button>
        <button type="button" className="btn-primary" onClick={onExport}>
          名前を付けて保存
        </button>
      </div>
    </header>
  )
}
