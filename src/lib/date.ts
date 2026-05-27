/** 今日の日付を YYYY-MM-DD 形式で返す */
export function todayString(): string {
  const d = new Date()
  return formatDate(d)
}

/** Date を YYYY-MM-DD 形式の文字列に変換する */
export function formatDate(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/**
 * YYYY-MM-DD 文字列を Date（ローカル時刻の 0 時）に変換する。
 * タイムゾーンのずれを避けるため new Date(s) ではなく手動でパースする。
 */
export function parseDate(s: string): Date {
  const [yyyy, mm, dd] = s.split('-').map(Number)
  return new Date(yyyy, mm - 1, dd)
}

/** Date に n 日加算した新しい Date を返す */
export function addDays(d: Date, n: number): Date {
  const result = new Date(d)
  result.setDate(result.getDate() + n)
  return result
}

/**
 * 月曜始まりの週における、今週の日曜日（週末）を返す。
 * 例: 水曜 → その週の日曜
 *     日曜 → その日自身
 */
export function endOfWeekSunday(d: Date): Date {
  const day = d.getDay() // 0=日, 1=月, ..., 6=土
  // 月始まりで考えると日曜は「7日目」= day===0 なら +0, それ以外は 7-day 後
  const daysToSunday = day === 0 ? 0 : 7 - day
  return addDays(d, daysToSunday)
}

/**
 * a から b までの日数差を返す（切り捨て）。
 * b が a より後なら正、前なら負。
 */
export function daysBetween(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.floor((b.getTime() - a.getTime()) / msPerDay)
}

/** 2 つの Date が同じ日かどうかを返す */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** a が b より前（同日は含まない）か */
export function isBefore(a: Date, b: Date): boolean {
  return a < b && !isSameDay(a, b)
}

/** a が b 以前（同日を含む）か */
export function isBeforeOrSame(a: Date, b: Date): boolean {
  return a <= b || isSameDay(a, b)
}
