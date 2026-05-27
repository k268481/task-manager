import type { StoredData } from '../types'

const STORAGE_KEY = 'task-manager:v1'

const EMPTY_DATA: StoredData = {
  schemaVersion: 1,
  tasks: [],
  lastCleanupDate: '',
}

/**
 * localStorage からデータを読み込む。
 * パース失敗・schemaVersion 不正の場合は空の StoredData を返す。
 * 戻り値の error フィールドが存在するときはトースト通知が必要。
 */
export function loadTasks(): { data: StoredData; error?: string } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === null) {
      return { data: { ...EMPTY_DATA } }
    }
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      (parsed as Record<string, unknown>).schemaVersion !== 1
    ) {
      return {
        data: { ...EMPTY_DATA },
        error: 'データを読み込めませんでした',
      }
    }
    return { data: parsed as StoredData }
  } catch {
    return {
      data: { ...EMPTY_DATA },
      error: 'データを読み込めませんでした',
    }
  }
}

/**
 * localStorage にデータを書き込む。
 * QuotaExceededError などの例外は呼び出し側に投げる。
 */
export function saveTasks(data: StoredData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}
