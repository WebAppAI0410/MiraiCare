# MiraiCare - 高齢者向けヘルスケアSaaS

## プロジェクト概要
React Native + TypeScript + Supabaseを使用した高齢者向けヘルスケアアプリケーション

## 重要な指針
- **テスト駆動開発（TDD）を必須としてください**
- TypeScriptエラーの修正を最優先してください
- 依存関係の問題を特定し、package.jsonに必要なパッケージを追加してください
- コードは簡潔で明快に書いてください
- 日本語でコメントを追加してください
- PRを作成する際は、必ずコミットを作成してからPRを作成してください
- プロジェクトの概要はREADMEファイルに書いてあります。

## 技術スタック
- **フロントエンド**: React Native + TypeScript + Expo
- **バックエンド**: Firebase (Firestore + Auth + Cloud Functions + Storage)
- **認証方式**: 6桁認証コード（メール送信）
- **状態管理**: Zustand
- **ナビゲーション**: React Navigation
- **テスト**: Jest + React Native Testing Library
- **リンター**: ESLint + Prettier

## 開発コマンド
- `npm install`: 依存関係のインストール
- `npm start`: Expo開発サーバー起動
- `npm run lint`: ESLintチェック
- `npm run lint:fix`: ESLint自動修正
- `npm test`: テスト実行
- `npm run typecheck`: TypeScript型チェック
- `npx tsc --noEmit`: TypeScriptコンパイルチェック

## 最適化ワークフロー (Claude Max Pro契約済み)
- **設計・実装**: Claude CLI (無制限利用)
- **テスト・修正**: Codex Web (ChatGPT Pro)
- **品質保証**: CLI + Codex統合
- **月額固定コスト**: $100 (Max Pro) + $200 (既存)
- **効率向上**: 開発時間37%削減、コスト30%削減

## 対応すべき問題
1. 不足している依存関係の追加（@supabase/supabase-js、@testing-library/react-native、@types/jest、eslint、jest）
2. TypeScript型定義の修正
3. 不足ファイルの作成（src/navigation/AppNavigator.tsx等）
4. ESLintとJestの設定修正

## ワークフロー
- PRを作成する前に必ずコミットを作成してください
- コミットメッセージは日本語で記述してください
- 各修正後にテストを実行して確認してください
- TypeScriptエラーがないことを確認してください

## 作業手順（TDDベース）
1. **テスト作成**: 実装前に失敗するテストを書く
2. **最小実装**: テストが通る最小限のコードを書く
3. **リファクタリング**: テストが通る状態を保ちながらコードを整理
4. **テスト実行**: すべてのテストが通ることを確認
5. **コミット**: テストと実装を一緒にコミット
6. **PR作成**: テスト結果を含めてPRを作成

## 重要：PR作成について
- 必ずコミットを作成してからPRを作成してください
- PRタイトルは日本語で記述してください
- PR説明には実装内容と変更点を詳しく記載してください

## コードスタイル
- TypeScriptを使用し、型安全性を重視
- 関数コンポーネントとHooksを使用
- 日本語コメントを推奨
- ファイル名はPascalCase（コンポーネント）またはcamelCase（ユーティリティ）

## プロジェクト構造
```
src/
├── components/     # 再利用可能なコンポーネント
├── screens/        # 画面コンポーネント
├── navigation/     # ナビゲーション設定
├── services/       # API呼び出し
├── stores/         # 状態管理
├── types/          # TypeScript型定義
├── hooks/          # カスタムHooks
├── utils/          # ユーティリティ関数
└── config/         # 設定ファイル
```

## テスト駆動開発（TDD）ガイドライン

### 基本原則
1. **レッド・グリーン・リファクタリングサイクル**
   - レッド：失敗するテストを最初に書く
   - グリーン：テストが通る最小限の実装をする
   - リファクタリング：コードを整理する

2. **テストカバレッジ目標**
   - 単体テスト：80%以上
   - 統合テスト：主要フローを網羅
   - E2Eテスト：クリティカルパスをカバー

3. **テスト作成タイミング**
   - 新機能実装前にテストを書く
   - バグ修正時は再現テストを先に書く
   - リファクタリング前にテストを整備

### テスト種別と責任範囲

#### 1. 単体テスト（Unit Tests）
```typescript
// __tests__/components/Button.test.tsx
// - コンポーネントの表示
// - プロップスの動作
// - イベントハンドリング
```

#### 2. 統合テスト（Integration Tests）
```typescript
// __tests__/integration/authFlow.test.ts
// - 複数コンポーネントの連携
// - API通信
// - 状態管理
```

#### 3. E2Eテスト（End-to-End Tests）
```typescript
// e2e/userJourney.test.ts
// - ユーザージャーニー全体
// - 実際の環境での動作
```

### テスト書き方の指針

1. **AAAパターンを使用**
   ```typescript
   it('認証コードを正しく検証する', async () => {
     // Arrange（準備）
     const code = '123456';
     
     // Act（実行）
     const result = await verifyCode(code);
     
     // Assert（検証）
     expect(result).toBe(true);
   });
   ```

2. **テスト名は日本語で分かりやすく**
   - ✅ `'メールアドレスが無効な場合エラーを表示'`
   - ❌ `'test email validation'`

3. **モックは最小限に**
   - 必要な部分のみモック化
   - 可能な限り実際の実装を使用

### テストコマンド
```bash
# 全テスト実行
npm test

# 特定ファイルのテスト
npm test SignupScreen.test.tsx

# カバレッジレポート
npm test -- --coverage

# ウォッチモード
npm test -- --watch

# Cloud Functionsのテスト
cd functions && npm test
```

### テストチェックリスト
- [ ] 正常系テストがある
- [ ] エラー系テストがある
- [ ] エッジケースがカバーされている
- [ ] モックが適切に設定されている
- [ ] テストが独立している（他のテストに依存しない）
- [ ] テストが高速に実行される

## 現在の課題
1. **テストカバレッジの向上**: 新機能すべてにテストを追加
2. **E2Eテストの導入**: DetoxまたはMaestroを検討
3. **CI/CDでのテスト自動化**: GitHub Actionsでのテスト実行

## 作業指針
- TypeScriptエラーを最優先で修正
- 段階的に問題を解決（依存関係 → 型定義 → ファイル作成 → 設定）
- 各修正後にテストを実行して確認
- コミットメッセージは日本語で明確に記述

## 注意事項
- React Native特有の設定に注意
- Supabaseの認証とデータベース接続を考慮
- モバイル環境での動作を重視
- 高齢者向けUIのアクセシビリティを考慮

## コーディング標準

### TypeScript
- 厳密なTypeScript設定を維持する
- すべての型を明示的に定義する
- `any`型の使用を避ける
- インターフェースとタイプエイリアスを適切に使用する

### React Native
- 関数コンポーネントとHooksを使用する
- プロップスの型定義を必須とする
- アクセシビリティ要件を満たす（accessibilityLabel、accessibilityRole等）
- パフォーマンスを考慮したコンポーネント設計

### ファイル構造
```
src/
├── components/     # 再利用可能なコンポーネント
├── screens/        # 画面コンポーネント
├── navigation/     # ナビゲーション設定
├── services/       # API呼び出しとビジネスロジック
├── stores/         # 状態管理（Zustand）
├── hooks/          # カスタムHooks
├── types/          # TypeScript型定義
├── utils/          # ユーティリティ関数
└── config/         # 設定ファイル
```

## レビュー基準

### 必須チェック項目
- [ ] TypeScriptエラーがない
- [ ] ESLintエラーがない
- [ ] テストが通る
- [ ] アクセシビリティ要件を満たす
- [ ] セキュリティベストプラクティスに従う
- [ ] パフォーマンスへの影響を考慮

### コードレビューポイント
- 可読性と保守性
- エラーハンドリングの適切性
- セキュリティ脆弱性の有無
- パフォーマンスの最適化
- テストカバレッジ

## プロジェクト固有のルール

### 依存関係管理
- 必要最小限の依存関係のみ追加
- セキュリティ脆弱性のあるパッケージは使用しない
- 定期的な依存関係の更新

### エラーハンドリング
- すべてのAPI呼び出しでエラーハンドリングを実装
- ユーザーフレンドリーなエラーメッセージ
- ログ記録の適切な実装

### セキュリティ
- 機密情報をコードに含めない
- 適切な認証・認可の実装
- データ暗号化の考慮

## 好ましいパターン

### 状態管理
```typescript
// Zustandを使用した状態管理
import { create } from 'zustand';

interface UserStore {
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
```

### API呼び出し
```typescript
// サービス層でのAPI呼び出し
export const userService = {
  async getUser(id: string): Promise<User> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to fetch user:', error);
      throw new Error('ユーザー情報の取得に失敗しました');
    }
  }
};
```

### コンポーネント設計
```typescript
// 適切なプロップス型定義とアクセシビリティ
interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  disabled = false,
  variant = 'primary'
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={[styles.button, styles[variant], disabled && styles.disabled]}
    >
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
};
```

## 自動修正の優先順位

1. **高優先度**: セキュリティ脆弱性、TypeScriptエラー
2. **中優先度**: ESLintエラー、テスト失敗
3. **低優先度**: コードスタイル、最適化提案

## 制約事項

- 既存の機能を破壊しない
- パフォーマンスを悪化させない
- セキュリティレベルを下げない
- アクセシビリティ要件を満たす
- プロジェクトの依存関係ポリシーに従う