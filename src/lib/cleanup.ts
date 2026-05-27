import type { StoredData } from '../types'
import { parseDate, daysBetween } from './date'

type CleanupResult = {
  data: StoredData
  clearedCount: number
}

/**
 * 14 日以上前の期限を持つ未完了タスクの dueDate を null にクリアする。
 * - 同日の再実行は lastCleanupDate を見てスキップする。
 * - 変更があれば lastCleanupDate を today で更新する。
 */
export function runCleanup(data: StoredData, today: string): CleanupResult {
  // 同日は再実行しない
  if (data.lastCleanupDate === today) {
    return { data, clearedCount: 0 }
  }

  const todayDate = parseDate(today)
  let clearedCount = 0

  const tasks = data.tasks.map((task) => {
    if (task.completed) return task
    if (task.dueDate === null) return task

    const due = parseDate(task.dueDate)
    // due が today より 14 日以上前
    if (daysBetween(due, todayDate) >= 14) {
      clearedCount++
      return { ...task, dueDate: null }
    }
    return task
  })

  return {
    data: { ...data, tasks, lastCleanupDate: today },
    clearedCount,
  }
}
