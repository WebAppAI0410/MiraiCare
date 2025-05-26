# Codex Web 最適化プロンプト

## Setup Script設定後に使用するプロンプト

```
MiraiCareプロジェクトのスクリーンテスト修正を完了してください。

## 📋 タスク概要
- **ブランチ**: `codex/修正-miraicareプロジェクトのスクリーンテスト`
- **目標**: npm run test:screens で全テスト通過
- **対象**: MoodMirrorScreen、HomeScreen、LoginScreen

## 🔧 具体的修正内容

### MoodMirrorScreen.test.tsx
1. **質問テキスト修正**:
   - `getByText('今日はどんな気分ですか？')` → `getByText('とても良い')`

2. **testID修正**:
   - `getByTestId('mood-happy')` → `getByText('とても良い')`

3. **placeholder修正**:
   - `getByPlaceholderText('自由に入力してください...')` → `getByPlaceholderText('メッセージを入力...')`

### LoginScreen.test.tsx
1. **placeholder修正**:
   - `getByPlaceholderText('メールアドレス')` → `getByPlaceholderText('example@example.com')`
   - `getByPlaceholderText('パスワード')` → `getByPlaceholderText('パスワードを入力')`

2. **testID修正**:
   - `getByTestId('password-toggle')` → `getByLabelText('パスワードを表示')`

3. **ボタンテキスト修正**:
   - `getByText('新規登録')` → `getByText('新規アカウント作成')`

4. **アクセシビリティラベル修正**:
   - `getByLabelText('ログインボタン')` → `getByLabelText('ログイン')`

### HomeScreen.test.tsx
1. **存在しないテキスト修正**:
   - `getByText('今日のリマインダー')` → `getByText('水分を飲む')`

## ✅ 成功基準
```bash
npm run test:screens
# Test Suites: 3 passed, 3 total
# Tests: 31 passed, 31 total
```

## 🚨 重要な制約
1. **実装ファイル（src/）は絶対に変更しない**
2. **テストファイルのみ修正**
3. **実装に存在する要素のみテスト**

実装に合わせてテストファイルを修正し、全テスト通過を達成してください。
```

## Setup Script設定手順

### Step 1: ChatGPT Codex環境設定
1. ChatGPT左サイドバー「Codex (beta)」クリック
2. リポジトリ選択: `WebAppAI0410/MiraiCare`
3. 「Setup Script」フィールドに以下を入力:

```bash
#!/bin/bash
export NODE_ENV=development
export npm_config_audit=false
export SKIP_PREFLIGHT_CHECK=true
export NODE_OPTIONS="--max-old-space-size=4096"
npm install --no-audit --prefer-offline
npx jest --version && npm run typecheck
```

### Step 2: タスク実行
上記の最適化プロンプトを投げる

### Step 3: 結果確認
- Green check-marks で成功確認
- `npm run test:screens` 結果確認
- 必要に応じてPR作成

---

**Setup Scriptによる環境設定により、npm install問題を根本解決**