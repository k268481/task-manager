/**
 * 画面上のすべてのキーナビ対象要素を DOM 上の順序で返す。
 *
 * 順序（上から下へ）:
 *   タスク入力タイトル → タスク入力メモ →
 *   セクション見出し → そのセクション内タスク行 →
 *   次のセクション見出し → … （繰り返し）
 */
export function getAllNavItems(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      '[data-nav-id="task-input-title"], [data-nav-id="task-input-memo"], .task-group-heading, .task-item'
    )
  )
}

/**
 * from 要素（または from の最近祖先のナビ対象）から direction 方向に 1 つ移動する。
 * □ / ☆ など .task-item の子ボタンを渡した場合は親の .task-item として扱う。
 */
export function moveNavFocus(from: HTMLElement, direction: 'up' | 'down') {
  const all = getAllNavItems()
  // 子ボタン（□ ☆）から呼ばれた場合は、親の .task-item を検索対象にする
  const target = all.includes(from)
    ? from
    : (from.closest<HTMLElement>('.task-item, .task-group-heading, [data-nav-id]') ?? from)
  const idx = all.indexOf(target)
  if (idx === -1) return
  if (direction === 'up') {
    // 先頭なら末尾へ循環
    const prev = idx > 0 ? idx - 1 : all.length - 1
    all[prev].focus()
  } else {
    // 末尾なら先頭（タスク追加入力欄）へ循環
    const next = idx < all.length - 1 ? idx + 1 : 0
    all[next].focus()
  }
}
