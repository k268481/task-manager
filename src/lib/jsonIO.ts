import type { StoredData } from '../types'

/** 今日の日付を YYYY-MM-DD 形式で返す */
function todayString(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/** StoredData を task-manager-YYYY-MM-DD.json としてダウンロードさせる */
export function exportToFile(data: StoredData): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `task-manager-${todayString()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * インポートする JSON のスキーマを検証する。
 * 問題があれば { error: string }、問題なければ StoredData を返す。
 */
export function validateImport(input: unknown): StoredData | { error: string } {
  if (typeof input !== 'object' || input === null) {
    return { error: 'ファイルの形式が正しくありません' }
  }
  const obj = input as Record<string, unknown>

  if (obj.schemaVersion !== 1) {
    return { error: 'サポートされていないバージョンのデータです' }
  }

  if (!Array.isArray(obj.tasks)) {
    return { error: 'tasks フィールドが配列ではありません' }
  }

  for (const item of obj.tasks) {
    if (typeof item !== 'object' || item === null) {
      return { error: 'tasks の要素が不正です' }
    }
    const t = item as Record<string, unknown>
    if (typeof t.id !== 'string') return { error: 'tasks[].id が不正です' }
    if (typeof t.title !== 'string') return { error: 'tasks[].title が不正です' }
    if (typeof t.completed !== 'boolean') return { error: 'tasks[].completed が不正です' }
  }

  return input as StoredData
}
