import type { Task } from '../types'

/**
 * グループ内のタスクをソートして返す。
 * 1. 重要なタスクが上（important === true が先）
 * 2. 同じ重要度内で createdAt の昇順
 */
export function sortInGroup(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.important !== b.important) {
      return a.important ? -1 : 1
    }
    return a.createdAt.localeCompare(b.createdAt)
  })
}
