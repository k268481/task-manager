import { useEffect } from 'react'

type ToastProps = {
  message: string
  onDismiss: () => void
  /** 自動消去するまでのミリ秒（デフォルト 4000）*/
  duration?: number
}

export function Toast({ message, onDismiss, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [onDismiss, duration])

  return (
    <div className="toast" role="alert" aria-live="polite">
      <span>{message}</span>
      <button type="button" className="toast-close" onClick={onDismiss} aria-label="閉じる">
        ✕
      </button>
    </div>
  )
}
