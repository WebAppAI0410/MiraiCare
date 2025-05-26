# Codex PR #60 完全修正指示書

## 🎯 タスク概要
PR #60のスクリーンテスト修正を完了し、CI/CDテスト通過を達成

## 🚨 **重要: 作業開始前に必須実行**

### 環境変数設定（コピペ実行）
```bash
export NODE_ENV=development
export npm_config_audit=false
export npm_config_fund=false
export npm_config_prefer_offline=true
export SKIP_PREFLIGHT_CHECK=true
export EXPO_NO_TELEMETRY=1
export JEST_WORKER_ID=1
export NODE_OPTIONS="--max-old-space-size=4096"
```

### 依存関係インストール（コピペ実行）
```bash
npm install --no-audit --prefer-offline

# 確認コマンド
npx jest --version
npx eslint --version
npm run typecheck
```

## 📋 修正対象

### 対象ブランチ
- **ブランチ**: `codex/修正-miraicareプロジェクトのスクリーンテスト`
- **PR**: #60

### 失敗テスト一覧
1. **MoodMirrorScreen**: 質問テキスト・testID不整合
2. **HomeScreen**: 表示ラベル・要素不整合  
3. **LoginScreen**: placeholder・ボタンテキスト不整合

## 🔧 具体的修正内容

### MoodMirrorScreen.test.tsx
```typescript
// ❌ 修正前
expect(getByText('今日はどんな気分ですか？')).toBeTruthy();
expect(getByTestId('mood-happy')).toBeTruthy();
expect(getByPlaceholderText('自由に入力してください...')).toBeTruthy();

// ✅ 修正後
expect(getByText('こんにちは！今日もあなたの気持ちをお聞かせください。3つの簡単な質問をさせていただきますね。')).toBeTruthy();
expect(getByText('とても良い')).toBeTruthy();  // testIDではなくテキストで取得
expect(getByPlaceholderText('メッセージを入力...')).toBeTruthy();
```

### HomeScreen.test.tsx
```typescript
// ❌ 修正前
expect(getByText('今日のリマインダー')).toBeTruthy();

// ✅ 修正後
expect(getByText('水分を飲む')).toBeTruthy();  // 実際のリマインダーボタン
expect(getByText('服薬確認')).toBeTruthy();
```

### LoginScreen.test.tsx
```typescript
// ❌ 修正前
getByPlaceholderText('メールアドレス')
getByPlaceholderText('パスワード')
getByTestId('password-toggle')
getByText('新規登録')
getByLabelText('ログインボタン')

// ✅ 修正後
getByPlaceholderText('example@example.com')
getByPlaceholderText('パスワードを入力')
getByLabelText('パスワードを表示')  // testIDではなくaccessibilityLabel
getByText('新規アカウント作成')
getByLabelText('ログイン')  // 実際のaccessibilityLabel
```

## ✅ 成功基準

### テスト実行確認
```bash
npm run test:screens
# 期待結果:
# Test Suites: 3 passed, 3 total
# Tests: 31 passed, 31 total
# Snapshots: 0 total
```

### 品質チェック
```bash
npm run typecheck  # ✅ エラー0個
npm run lint      # ⚠️ 警告のみ（許容）
```

## 🚨 重要な注意事項

### 修正原則
1. **実装ファイル（src/）は変更しない**
2. **テストコードのみ修正**
3. **実装に存在する要素のみテスト**
4. **testIDがない場合は代替手段使用**

### エラー対応
```bash
# npm install失敗時
npm cache clean --force
npm install --no-audit --prefer-offline

# jest not found時
npx jest --version
./node_modules/.bin/jest --version

# 権限エラー時
chmod +x node_modules/.bin/jest
```

## 📖 実装参照

### 実装確認方法
現在のブランチ `codex/修正-miraicareプロジェクトのスクリーンテスト` で以下を確認：

1. **src/screens/MoodMirrorScreen.tsx**: 実際の質問テキスト・UI要素
2. **src/screens/HomeScreen.tsx**: 実際のリマインダー表示内容
3. **src/screens/LoginScreen.tsx**: 実際のplaceholder・ボタンテキスト

### デバッグコマンド
```bash
# 特定テストファイルのみ実行
npx jest __tests__/screens/MoodMirrorScreen.test.tsx --verbose

# テスト出力詳細表示
npm run test:screens -- --verbose --no-coverage
```

---

**このガイドに従って修正することで、PR #60のCI/CDテスト通過を達成できます。**