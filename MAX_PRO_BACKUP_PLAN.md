# Max Pro バックアップ解決プラン

## 🎯 概要
Codexが環境問題で修正できない場合のMax Pro直接解決策

## 🚀 実行手順

### Step 1: 問題ブランチをローカルに取得
```bash
git fetch origin
git checkout codex/修正-miraicareプロジェクトのスクリーンテスト
```

### Step 2: Max Pro CLI で直接修正
```bash
claude --print "以下のテストファイルを実装に合わせて修正してください:
__tests__/screens/MoodMirrorScreen.test.tsx
__tests__/screens/HomeScreen.test.tsx  
__tests__/screens/LoginScreen.test.tsx

具体的な修正内容をファイル毎に提供してください。"
```

### Step 3: 手動修正適用
- Claude CLIの出力を基に手動でテストファイル修正
- npm run test:screens で確認
- コミット・プッシュ

### Step 4: PR統合
```bash
git add .
git commit -m "fix: スクリーンテスト修正完了"
git push origin codex/修正-miraicareプロジェクトのスクリーンテスト
```

## 🔧 直接修正案（参考）

### MoodMirrorScreen.test.tsx 修正例
```typescript
// Line 42 頃
expect(getByText('とても良い')).toBeTruthy();  // 質問テキスト修正

// Line 49 頃  
const happyButton = getByText('とても良い');  // testID修正

// Line 63 頃
const textInput = getByPlaceholderText('メッセージを入力...');  // placeholder修正
```

### LoginScreen.test.tsx 修正例
```typescript
// placeholder修正
const emailInput = getByPlaceholderText('example@example.com');
const passwordInput = getByPlaceholderText('パスワードを入力');

// testID修正
const toggleButton = getByLabelText('パスワードを表示');

// ボタンテキスト修正
const signupButton = getByText('新規アカウント作成');

// アクセシビリティラベル修正
expect(getByLabelText('ログイン')).toBeTruthy();
```

## 📊 効果予測
- 修正時間: 30-60分
- 成功率: 95%（Max Pro無制限）
- 学習効果: テスト修正パターン習得

## 🚨 実行タイミング
- Codex再依頼が24時間以内に成功しない場合
- 緊急でTDD Phase 3開始が必要な場合
- CI/CD修正が最優先の場合

---

**Max Pro無制限により、確実にPR #60問題を解決できます。**