# Codex: スクリーンテスト修正タスク

## 🎯 修正目的
PR #56のCI/CD失敗を解決し、スクリーンテストを実装に合わせて修正

## 📋 問題箇所

### 失敗テスト一覧
```bash
# 27テスト失敗、4テスト成功
npm run test:screens

主な失敗理由:
1. MoodMirrorScreen: 質問テキスト「今日はどんな気分ですか？」が存在しない
2. HomeScreen: 「今日のリマインダー」テキストが存在しない  
3. テストIDが実装と不整合
```

## 🔧 修正要件

### Task 1: MoodMirrorScreen テスト修正
**ファイル**: `__tests__/screens/MoodMirrorScreen.test.tsx`

```typescript
// 問題: 期待するテキストが実装と異なる
expect(getByText('今日はどんな気分ですか？')).toBeTruthy(); // ❌

// 修正方針: 実際の表示テキストに合わせる
// 実装確認: src/screens/MoodMirrorScreen.tsx を参照
// 実際の質問テキストまたは要素を特定して修正
```

### Task 2: HomeScreen テスト修正  
**ファイル**: `__tests__/screens/HomeScreen.test.tsx`

```typescript
// 問題: 期待するテキストが実装と異なる
expect(getByText('今日のリマインダー')).toBeTruthy(); // ❌

// 修正方針: 実装に存在する要素に合わせる
// 実装確認: src/screens/HomeScreen.tsx を参照
```

### Task 3: testID不整合修正
```typescript
// 問題: testIDが実装に存在しない
expect(getByTestId('mood-happy')).toBeTruthy(); // ❌

// 修正方針: 実装されたtestIDまたは代替手段を使用
```

## 📖 修正手順

### Step 1: 実装ファイル確認
```bash
# 実装内容を確認
src/screens/MoodMirrorScreen.tsx
src/screens/HomeScreen.tsx
src/screens/ActivityScreen.tsx
```

### Step 2: テスト修正
```bash
# テストファイルを実装に合わせて修正
__tests__/screens/MoodMirrorScreen.test.tsx
__tests__/screens/HomeScreen.test.tsx
__tests__/screens/ActivityScreen.test.tsx
```

### Step 3: 検証
```bash
npm run test:screens  # ✅ 全テスト通過を目指す
```

## 🎯 成功基準

### 期待結果
```bash
npm run test:screens
# Test Suites: 3 passed, 3 total  
# Tests: 31 passed, 31 total
# Snapshots: 0 total
```

### 品質要件
- 実装内容を変更しない
- テストロジックを維持
- アクセシビリティテストを保持
- React Native Testing Library ベストプラクティス遵守

## 🚨 制約事項

### やってはいけないこと
- 実装ファイル(src/screens/*)の変更
- テストの削除
- アクセシビリティ要件の緩和

### 必須実装
- 実装に存在する要素のテスト
- エラーハンドリングテスト
- ユーザーインタラクションテスト
- アクセシビリティテスト

## 📋 完了確認

### CLI検証コマンド
```bash
npm run test:screens     # ✅ 全テスト通過
npm run typecheck       # ✅ TypeScriptエラーなし  
npm run lint           # ⚠️ 警告のみ（許容範囲）
```

### 最終確認事項
- [ ] 全スクリーンテスト通過
- [ ] 実装変更なし
- [ ] テストロジック維持
- [ ] TypeScriptエラーなし

---
**優先度**: High  
**想定時間**: 1-2時間  
**依存関係**: PR #56 のマージ準備