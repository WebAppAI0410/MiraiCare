# MiraiCare Codex エージェント指示書

## プロジェクト概要
高齢者向けヘルスケアSaaSアプリケーション（React Native + TypeScript + Firebase）

## 🚨 重要: 環境セットアップ手順

### 1. 環境変数設定（最優先）
```bash
# Codex環境で必須設定
export NODE_ENV=development
export npm_config_audit=false
export npm_config_fund=false
export npm_config_prefer_offline=true
export SKIP_PREFLIGHT_CHECK=true
export EXPO_NO_TELEMETRY=1
export JEST_WORKER_ID=1
export NODE_OPTIONS="--max-old-space-size=4096"
```

### 2. 必須初期化コマンド
```bash
# 依存関係インストール（必須）
npm install --no-audit --prefer-offline

# インストール確認
npx jest --version
npx eslint --version  
npx tsc --version
```

### 3. テスト実行前の確認
```bash
# TypeScriptエラーチェック
npm run typecheck

# ESLintチェック  
npm run lint

# テスト実行
npm run test:screens
```

## プロジェクト構造
```
src/
├── screens/           # React Nativeスクリーンコンポーネント
├── services/          # API・データサービス
├── types/             # TypeScript型定義
├── hooks/             # カスタムReact Hooks
└── config/            # Firebase・設定ファイル

__tests__/
├── screens/           # スクリーンコンポーネントテスト  
├── services/          # サービステスト
└── integration/       # 統合テスト
```

## 作業制約事項

### ✅ 許可される操作
- テストファイルの修正
- TypeScript型定義の追加・修正
- 設定ファイル調整
- ドキュメント更新

### ❌ 禁止される操作
- 実装ファイル（src/）の変更
- package.jsonの依存関係変更
- ビルド設定の変更
- 本番環境影響を与える変更

## テスト修正ガイドライン

### React Native Testing Library使用
```typescript
// 推奨パターン
import { render, fireEvent } from '@testing-library/react-native';

// 要素取得方法の優先順位
1. getByText('実際の表示テキスト')
2. getByLabelText('アクセシビリティラベル')  
3. getByPlaceholderText('実際のplaceholder')
4. getByTestId('testid') // 最後の手段
```

### 失敗パターン対応
```typescript
// ❌ 失敗例
expect(getByText('存在しないテキスト')).toBeTruthy();
expect(getByTestId('存在しないtestID')).toBeTruthy();

// ✅ 修正例  
expect(getByText('実装に存在するテキスト')).toBeTruthy();
expect(getByLabelText('実装のアクセシビリティラベル')).toBeTruthy();
```

## 品質基準
- TypeScriptエラー: 0個
- ESLint警告: 許容範囲
- テスト成功率: 100%
- アクセシビリティ: 要件遵守

## デバッグ支援
```bash
# テスト失敗時のデバッグ
npm run test:screens -- --verbose
npm run test:screens -- --no-coverage

# 特定テストファイルのみ実行
npx jest __tests__/screens/MoodMirrorScreen.test.tsx
```

## 成功基準
```bash
npm run test:screens
# Test Suites: 3 passed, 3 total
# Tests: 31 passed, 31 total
```