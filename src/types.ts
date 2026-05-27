export type Task = {
  id: string;           // 一意 ID。crypto.randomUUID() で生成
  title: string;        // タイトル。必須、空文字列不可
  dueDate: string | null; // 期限。YYYY-MM-DD 形式、未設定なら null
  important: boolean;   // 重要フラグ
  memo: string;         // メモ。プレーンテキスト、未入力なら空文字列
  completed: boolean;   // 完了フラグ
  createdAt: string;    // 作成日時。ISO 8601（new Date().toISOString()）
  completedAt: string | null; // 完了した日時。未完了なら null
}

export type StoredData = {
  schemaVersion: 1;        // 将来のマイグレーションのため
  tasks: Task[];
  lastCleanupDate: string; // 14 日自動クリアの最終実行日（YYYY-MM-DD）
}
