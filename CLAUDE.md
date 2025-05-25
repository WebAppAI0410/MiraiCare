# MiraiCare - 高齢者向けヘルスケアSaaS

## プロジェクト概要
React Native + TypeScript + Supabaseを使用した高齢者向けヘルスケアアプリケーション

## 技術スタック
- **フロントエンド**: React Native + TypeScript
- **バックエンド**: Supabase
- **テスト**: Jest + @testing-library/react-native
- **リンター**: ESLint
- **ビルド**: EAS Build

## 重要なコマンド
- `npm install`: 依存関係のインストール
- `npm test`: テスト実行
- `npm run lint`: ESLintチェック
- `npm run typecheck`: TypeScriptチェック
- `npx expo start`: 開発サーバー起動
- `eas build`: プロダクションビルド

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

## 現在の課題
1. **依存関係不足**: @supabase/supabase-js、@testing-library/react-native、@types/jest、eslint、jest
2. **TypeScript型定義**: jest、describe、it、expectの型定義が不足
3. **不足ファイル**: src/navigation/AppNavigator.tsx等
4. **設定ファイル**: ESLintとJestの設定が不完全

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