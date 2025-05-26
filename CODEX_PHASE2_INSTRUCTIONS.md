# Codex Phase 2 指示書 - Firebase データ層実装

## 🎯 Codex側で実行すべきタスク

### **Task 1: Firebase Firestoreサービス作成**

```
MiraiCareプロジェクト(React Native + TypeScript + Firebase)で以下を実装してください:

## 要件
1. Firestoreを使用したユーザープロファイルサービス
2. バイタルデータ(歩数)の保存・取得機能
3. Jest テストケース付き
4. TypeScript型定義完備
5. エラーハンドリング実装

## ファイル構成
src/services/firestoreService.ts
src/types/userData.ts
__tests__/services/firestoreService.test.ts

## 機能要件
- ユーザープロファイル: { id, name, age, createdAt, updatedAt }
- バイタルデータ: { userId, steps, date, timestamp }
- CRUD操作全般
- データバリデーション
- オフライン対応考慮

## 既存コード参考
Firebase設定: src/config/firebase.ts
認証サービス: src/services/authService.ts
型定義例: src/types/index.ts

## 品質要件
- TypeScriptエラー0個
- ESLint準拠
- Jest テストカバレッジ90%以上
- エラーハンドリング必須
- 日本語コメント必須
```

### **Task 2: Expo Sensorsセンサー連携**

```
MiraiCareプロジェクト(React Native + Expo + TypeScript)で以下を実装してください:

## 要件
1. Expo Pedometer(歩数計)を使用した歩数取得
2. デバイス権限管理
3. リアルタイムデータ更新
4. Jest テストケース付き
5. モックデータ対応

## ファイル構成
src/services/sensorService.ts
src/hooks/useStepCounter.ts
__tests__/services/sensorService.test.ts
__tests__/hooks/useStepCounter.test.ts

## 機能要件
- 日別歩数取得: getTodaySteps()
- 期間指定取得: getStepsByDateRange(start, end)
- リアルタイム監視: useStepCounter() Hook
- 権限チェック: checkPermissions()
- エラーハンドリング

## 技術要件
- expo-sensors Pedometer使用
- React Native Hooks活用
- TypeScript型安全性
- 権限要求処理
- バックグラウンド対応検討

## 品質要件
- デバイス互換性テスト
- 権限拒否時の適切な処理
- モックデータでのテスト
- パフォーマンス最適化
- 日本語コメント必須
```

### **Task 3: データ統合テスト作成**

```
MiraiCareプロジェクト統合テストスイート作成:

## 要件
1. Firestore + センサー統合テスト
2. エンドツーエンドデータフロー検証
3. モック環境での完全テスト
4. CI/CD対応

## テストシナリオ
1. ユーザー登録 → プロファイル保存 → バイタルデータ記録
2. 歩数取得 → Firestore保存 → データ取得確認
3. オフライン → オンライン復帰 → データ同期
4. エラー状況での堅牢性確認

## ファイル構成
__tests__/integration/dataFlow.test.ts
__tests__/integration/sensorIntegration.test.ts
__tests__/mocks/firestoreMock.ts
__tests__/mocks/sensorMock.ts

## 品質基準
- 全シナリオテスト成功
- モック環境完全動作
- エラーケース網羅
- パフォーマンス測定
- ドキュメント化
```

## 📋 作業順序と優先度

### **高優先度 (Phase 2必須)**
1. **Task 1**: Firestoreサービス (最重要)
2. **Task 2**: センサー連携 (機能要件)
3. **Task 3**: 統合テスト (品質保証)

### **実行手順**
1. Task 1完了後 → npm run test:services で確認
2. Task 2完了後 → npm run test:sensors で確認 
3. Task 3完了後 → npm run test:integration で確認
4. 全完了後 → npm run quality:check で最終確認

## 🔧 Codex出力の期待値

### **ファイル群**
- `src/services/firestoreService.ts` (200-300行)
- `src/services/sensorService.ts` (150-200行)
- `src/hooks/useStepCounter.ts` (100-150行)
- `src/types/userData.ts` (50-100行)
- テストファイル群 (各100-200行)

### **品質チェックポイント**
```typescript
// 期待される型定義例
interface UserProfile {
  id: string;
  name: string;
  age: number;
  createdAt: Date;
  updatedAt: Date;
}

interface VitalData {
  userId: string;
  steps: number;
  date: string; // YYYY-MM-DD
  timestamp: number;
}

// 期待されるサービス例
export const firestoreService = {
  async saveUserProfile(profile: UserProfile): Promise<void>
  async getUserProfile(userId: string): Promise<UserProfile | null>
  async saveVitalData(data: VitalData): Promise<void>
  async getVitalDataByDate(userId: string, date: string): Promise<VitalData[]>
}
```

## 🚨 注意事項

### **Codex側でやってはいけないこと**
- Firebase設定の変更 (既存のfirebase.tsを維持)
- 依存関係の追加 (package.jsonは変更しない)
- ビルド設定の変更

### **必須実装項目**
- エラーハンドリング
- TypeScript型安全性
- Jest テストケース
- 日本語コメント
- アクセシビリティ対応

### **Claude CLI側で後処理する項目**
- 依存関係の最終調整
- 品質チェック実行
- 統合テスト検証
- コミット作成