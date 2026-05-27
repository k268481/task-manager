# task-manager 実装タスク

各フェーズは独立して着手可能。前のフェーズの「動作確認」が通ってから次へ進む。チェックボックスはこのファイルで進捗管理する。

詳細仕様は [SPEC.md](SPEC.md)、開発方針は [CLAUDE.md](CLAUDE.md) を参照。

---

## フェーズ 1: プロジェクト初期化

土台作り。ここで遅延すると後が辛いので、深く考えず最短経路で進める。

- [ ] `task-manager/` 直下で `npm create vite@latest . -- --template react-ts` を実行
- [ ] `npm install` で依存をインストール
- [ ] `npm run dev` が起動して Vite のデフォルトページが表示されることを確認
- [ ] ESLint または Biome を導入し、`npm run lint` で実行できる状態にする
- [ ] `package.json` に `typecheck`（`tsc --noEmit`）スクリプトを追加
- [ ] Vite のデフォルトテンプレに含まれる不要なファイル/CSS を削除（`assets/react.svg`、`App.css` の中身、`index.css` のデモスタイル、`App.tsx` のカウンタ等）
- [ ] `src/styles.css` を新設して `main.tsx` から import
- [ ] `App.tsx` を「タスク」というタイトルだけが表示される最小ページに置き換え
- [ ] `vite.config.ts` の `base` を `/` のままにしておく（GitHub Pages 用 base はフェーズ 7 で設定）

**動作確認:**
- `npm run dev` で空のページが表示される
- `npm run typecheck` がエラーなしで通る
- `npm run lint` がエラーなしで通る

---

## フェーズ 2: 型とデータ永続化

UI を書く前に、データ層を固める。純関数として書き、`src/lib/` に集約する。

- [ ] `src/types.ts` に `Task` 型と `StoredData` 型を定義（SPEC.md の 2 章どおり）
- [ ] `src/lib/storage.ts` に以下を実装:
  - [ ] `loadTasks(): StoredData` — localStorage から読み込み、失敗時は空の `StoredData` を返す
  - [ ] `saveTasks(data: StoredData): void` — localStorage に書き込み、例外は呼び出し側に投げる
  - [ ] localStorage キー名は SPEC.md どおり `task-manager:v1`
- [ ] `src/lib/jsonIO.ts` に以下を実装:
  - [ ] `exportToFile(data: StoredData): void` — `task-manager-YYYY-MM-DD.json` をダウンロードさせる
  - [ ] `validateImport(input: unknown): StoredData | { error: string }` — JSON のスキーマ検証
- [ ] App.tsx でマウント時に `loadTasks()` を呼び、`useState` に保持。変更時に `saveTasks()` を呼ぶ最小フロー
- [ ] 手元で localStorage を覗いて `task-manager:v1` キーに JSON が入ることを確認

**動作確認:**
- DevTools の Application → Local Storage で `task-manager:v1` が確認できる
- 手で localStorage を編集して reload しても、不正な JSON ならアプリが落ちない
- `typecheck` / `lint` がエラーなしで通る

---

## フェーズ 3: UI の骨組み

機能なしで画面の枠だけ作る。動的な部分はダミーデータでよい。

- [ ] `src/components/Header.tsx` — タイトルとエクスポート/インポートのボタン（クリックハンドラは空でよい）
- [ ] `src/components/TaskInput.tsx` — 上部の入力欄。Enter キーで onSubmit を呼ぶ
- [ ] `src/components/TaskGroup.tsx` — グループ見出しとタスク一覧の枠
- [ ] `src/components/TaskItem.tsx` — 1 件の表示（チェックボックス、★、タイトル）
- [ ] `src/components/CompletedSection.tsx` — 完了タスクの折りたたみセクション
- [ ] `src/components/DetailPanel.tsx` — 右側サイドパネルの枠（中身は後で詰める）
- [ ] `src/components/ConfirmDialog.tsx` — 確認モーダル
- [ ] `src/components/Toast.tsx` — トースト通知
- [ ] CSS で全体レイアウトを組む（ヘッダー固定、メインスクロール、サイドパネルは右からスライド）
- [ ] OS テーマ追従の CSS 変数を `styles.css` にセット（SPEC.md 8 章どおり）

**動作確認:**
- ダミーデータでヘッダー・入力欄・グループ別リスト・完了セクションが表示される
- OS のダーク/ライト設定を切り替えると、再読み込みなしで配色が変わる
- サイドパネルが右からスライドして開閉する（ダミーボタンで OK）

---

## フェーズ 4: コアロジック

純関数群を `src/lib/` に集約。手元でいくつかの fixture を用意して目視確認する（テストは書かない）。

- [ ] `src/lib/date.ts` に日付ユーティリティ:
  - [ ] `todayString(): string` — 今日を `YYYY-MM-DD` で返す
  - [ ] `parseDate(s: string): Date`
  - [ ] `addDays(d: Date, n: number): Date`
  - [ ] `endOfWeekSunday(d: Date): Date` — 月始まり週の日曜
  - [ ] `daysBetween(a: Date, b: Date): number`
- [ ] `src/lib/group.ts` に `groupOf(task, today): GroupName` を実装（SPEC.md 5 章）
- [ ] `src/lib/sort.ts` に `sortInGroup(tasks): Task[]`（重要が上、その後 createdAt 昇順）
- [ ] `src/lib/cleanup.ts` に 14 日自動クリア処理:
  - [ ] `runCleanup(data: StoredData, today: string): { data: StoredData; clearedCount: number }`
  - [ ] `lastCleanupDate` と今日を比較して、同日なら何もしない
- [ ] アプリ起動時に `runCleanup` を呼び、結果を state に反映。クリアがあればトーストを出す
- [ ] App から `groupOf` と `sortInGroup` を使って実データをグループ別に表示

**動作確認:**
- 期限を「今日」「明日」「3 日後」「先週」「先月」に設定したタスクを手で作り、正しいグループに入る
- 「先月」のタスクは起動時に期限がクリアされて「期限なし」に移る
- リロードしても同日中はクリア処理が再実行されない（DevTools で localStorage を見て `lastCleanupDate` が今日になっていることを確認）

---

## フェーズ 5: 操作ハンドラ

ユーザーが触る部分を一通り動くようにする。

- [ ] 入力欄: Enter でタスク追加（タイトル空ならスキップ、入力欄はクリア＆フォーカス維持）
- [ ] チェックボックス: クリックで `completed` トグル。完了したタスクは「完了」セクションへ
- [ ] ★アイコン: クリックで `important` トグル。グループ内の並びが即変わる
- [ ] タスク本体クリック: サイドパネルが開き、選択中タスクの全項目を表示
- [ ] サイドパネル内の編集:
  - [ ] タイトル: テキスト入力、blur または Enter で確定
  - [ ] 期限: `今日` / `明日` / `今週末` / カレンダー / クリア の各ボタン
  - [ ] 重要: チェックボックス
  - [ ] メモ: textarea（プレーンテキスト）
  - [ ] 削除ボタン: 確認ダイアログ → OK で削除しサイドパネルを閉じる
- [ ] エクスポートボタン: `task-manager-YYYY-MM-DD.json` をダウンロード
- [ ] インポートボタン: ファイル選択 → バリデーション → 確認ダイアログ → 置き換え
- [ ] グループ見出し: クリックで開閉、状態は記憶しなくてよい（リロードで全展開に戻る）
- [ ] 完了セクション: 同様にクリックで開閉

**動作確認:**
- 一連の操作（追加 → 期限設定 → 重要トグル → 完了 → 削除）が破綻なく動く
- JSON エクスポート → 別ブラウザ/別シークレットウィンドウでインポート → 同じデータが復元される
- 削除確認ダイアログでキャンセルすると削除されない

---

## フェーズ 6: キーボード操作

マウスなしで主要操作が完結することを目指す。

- [ ] タスク行を Tab で辿れるよう `tabIndex={0}` をセット
- [ ] ↑ / ↓ で前後のタスク行へフォーカス移動（同セクション内で完結すればよい）
- [ ] Space で完了トグル（ブラウザ標準のスクロールを `preventDefault`）
- [ ] Delete キーで削除確認ダイアログを開く
- [ ] Esc でサイドパネル/ダイアログを閉じる
- [ ] フォーカスリングがダーク/ライト両方で見やすく出るよう CSS で調整
- [ ] 入力欄に Cmd/Ctrl+N でフォーカス … は **やらない**（SPEC.md の操作表にないため）

**動作確認:**
- マウスを触らず Tab → タスク選択 → Space で完了 → Delete で削除確認 が完結する
- サイドパネル表示中に Esc で閉じる
- 入力欄からタスクリストへ Tab で移れる

---

## フェーズ 7: 配布

GitHub Pages 上で動かして完了。

- [ ] GitHub に新規リポジトリ作成（リポジトリ名は決める）
- [ ] `git init` してコミット、リモートに push
- [ ] `vite.config.ts` の `base` を `/<repo-name>/` に書き換え
- [ ] `.github/workflows/deploy.yml` を作成（SPEC.md 9 章どおり）:
  - [ ] `npm ci → npm run typecheck → npm run lint → npm run build`
  - [ ] `actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4`
- [ ] GitHub リポジトリの Settings → Pages → Source を「GitHub Actions」に変更
- [ ] `main` に push し、Actions のワークフローが緑になることを確認
- [ ] 公開 URL を開いてブックマークに登録
- [ ] 公開先で 1 周操作（追加 / 完了 / 削除 / エクスポート / インポート）して動作確認

**動作確認:**
- ブックマークから `https://<username>.github.io/<repo>/` を開き、即操作可能
- localStorage にデータが保存される
- リロードしても消えない

---

## 完了後にやってもよい（このバージョンの範囲外）

これらは SPEC.md の非目標に含まれるか、あるいは様子を見て判断する次バージョンの候補。

- 検索 / フィルタ
- 繰り返しタスク
- リマインダ通知
- クラウド同期
- PWA 化（オフライン動作、ホーム画面追加）
- タグ
- サブタスク

増やすときは SPEC.md の非目標から外して、ここに着地させる。
