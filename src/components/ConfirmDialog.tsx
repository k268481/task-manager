import { useEffect } from 'react'

type ConfirmDialogProps = {
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ message, confirmLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  // Esc キーでキャンセル
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  return (
    <div className="dialog-backdrop" onClick={onCancel} aria-modal="true" role="dialog">
      <div
        className="dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="dialog-message">{message}</p>
        <div className="dialog-actions">
          <button type="button" className="btn-ghost" onClick={onCancel}>
            キャンセル
          </button>
          <button type="button" className="btn-danger" onClick={onConfirm} autoFocus>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
