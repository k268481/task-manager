# task-manager — Claude Code 向けプロジェクト指針

このファイルは、本ディレクトリで Claude Code が作業するときの「最初に読むべき要約」です。詳細な仕様は [SPEC.md](SPEC.md)、実装手順は [TASKS.md](TASKS.md) を参照してください。

## このプロジェクトは何か

個人で使うシンプルなタスク管理アプリ。PC の Web ブラウザで動き、タスクの追加・完了・削除を中心に、期限・重要フラグ・メモを扱える。データはブラウザの localStorage に保存し、サーバーは持たない。

- 用途: 個人 1 人がブックマークから開いて毎日使う
- 想定環境: モダンな Chromium 系ブラウザ（Chrome / Edge / Arc 等）を主、Firefox / Safari でも動けばよい
- 想定規模: タスク件数は最大でも数百件

## ディレクトリ構成

```
task-manager/
├── CLAUDE.md          ← このファイル
├── SPEC.md            ← 機能仕様
├── TASKS.md           ← 実装タスクと進捗
├── package.json
├── vite.config.ts
├── tsconfig.json
├── .github/
│   └── workflows/
│       └── deploy.yml ← GitHub Pages 自動デプロイ
├── public/
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── components/
    ├── lib/           ← 期限グループ分け、ストレージ等の純関数
    ├── types.ts       ← Task 型など
    └── styles.css
```

## 技術スタック

- **Vite + React + TypeScript**（テンプレート: `react-ts`）
- スタイリング: 素の CSS（CSS Modules または単一の `styles.css`、好きなほう）
- リンタ: ESLint または Biome のどちらか一方
- パッケージマネージャ: npm
- デプロイ先: GitHub Pages（GitHub Actions で自動ビルド・デプロイ）

## よく使うコマンド

```bash
npm install         # 依存インストール
npm run dev         # 開発サーバー起動（http://localhost:5173）
npm run build       # 本番ビルド（dist/ に出力）
npm run preview     # build 結果のローカル確認
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint / Biome
```

## 開発方針

- **テストは書かない**。型チェック (`tsc`) と lint だけで守る。代わりに、ロジックは純関数として分離し、`src/lib/` に集約して目視で追えるようにする。
- **機能追加よりシンプルさを優先**。新しいオプションを思いついても、本当に必要か SPEC.md と照らしてから追加する。SPEC.md にない機能を勝手に増やさない。
- **再レンダリングや状態管理ライブラリは導入しない**。Redux / Zustand 等は不要。React の `useState` / `useReducer` だけで十分な規模。
- **依存ライブラリは最小限**。日付計算は標準の `Date` で書く（dayjs / date-fns は入れない）。UI ライブラリも入れない。
- **コメントは「なぜ」を書く時だけ**。型と命名で説明できる「何を」は書かない。

## データの不変条件

実装時に守るべき不変条件。バグの大半はここを破ったときに起きる。

- **タスクには必ずタイトルがある**（空文字列のタスクを保存しない）
- **完了フラグと削除は独立**（完了 = 別セクションに残る、削除 = 完全に消える）
- **削除は必ず確認ダイアログを経由**（誤クリック保護）。アンドゥはない
- **期限が 14 日以上前の未完了タスクは、起動時に期限が自動クリアされ「期限なし」グループに移る**
- **localStorage の読み書きは失敗しうる**（プライベートウィンドウ、容量超過等）。例外はアプリ全体を落とさないようにキャッチする
- **JSON インポート時は形式を検証**してから上書きする（壊れた JSON で既存データを潰さない）

## 参考リンク

- 仕様の詳細: [SPEC.md](SPEC.md)
- 実装タスクと進捗: [TASKS.md](TASKS.md)
- 仕様化プラン（背景・経緯）: `~/.claude/plans/pc-web-soft-lemon.md`

## デプロイルール
実装・修正が完了したら、必ず以下を実行すること：
1. `git add .`
2. `git commit -m "（変更内容を簡潔に）"`
3. `git push origin main`
4. GitHub Actionsが自動でビルド・デプロイを実行する
5. Actionsの完了をターミナルで確認する（`gh run watch`）

## コミットルール
- Co-authored-byは絶対に付けないこと
- コミットメッセージにClaudeやAIへの言及を含めないこと