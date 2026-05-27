import type { Task } from '../types'
import { parseDate, isBefore, isSameDay, addDays, endOfWeekSunday, isBeforeOrSame } from './date'

export const GROUP_NAMES = ['期限切れ', '今日', '明日', '今週', 'それ以降', '期限なし'] as const
export type GroupName = (typeof GROUP_NAMES)[number]

/**
 * タスクがどのグループに属するかを返す。
 * 完了タスクはこの関数では判定しない（呼び出し側で除外すること）。
 */
export function groupOf(task: Task, today: Date): GroupName {
  if (task.dueDate === null) return '期限なし'

  const due = parseDate(task.dueDate)

  if (isBefore(due, today)) return '期限切れ'
  if (isSameDay(due, today)) return '今日'
  if (isSameDay(due, addDays(today, 1))) return '明日'

  // 月始まりの週の日曜
  const sundayThisWeek = endOfWeekSunday(today)
  if (isBeforeOrSame(due, sundayThisWeek)) return '今週'

  return 'それ以降'
}

/** 未完了タスクをグループ別に分類して返す */
export function groupTasks(tasks: Task[], today: Date): Record<GroupName, Task[]> {
  const result: Record<GroupName, Task[]> = {
    '期限切れ': [],
    '今日': [],
    '明日': [],
    '今週': [],
    'それ以降': [],
    '期限なし': [],
  }
  for (const task of tasks) {
    result[groupOf(task, today)].push(task)
  }
  return result
}
