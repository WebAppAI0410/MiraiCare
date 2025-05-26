# MiraiCare TDD開発計画

## 🎯 **テスト駆動開発 (TDD) 実行プラン**

### **開発フィロソフィー**
1. **Red**: 失敗するテストを書く
2. **Green**: テストを通す最小限のコードを書く  
3. **Refactor**: コードを改善する
4. **Repeat**: 次の機能で繰り返す

---

## 📋 **Phase 1: 基盤修復 (Week 1)**

### **Step 1.1: TypeScriptエラー完全修正**
**目標**: すべての型エラーを解決し、`npm run quality:check`を成功させる

#### TDDサイクル:
```bash
# Red: 現在のエラー状況確認
npm run typecheck  # 9個のエラー

# Green: 最小限の修正
1. Greetingコンポーネント作成
2. authService関数名統一
3. テスト関数引数修正

# Refactor: 型定義改善
- 一貫性のある型定義
- 適切なジェネリクス使用
```

### **Step 1.2: 基本テストスイート安定化**
**目標**: 全テストが通る基盤を構築

#### TDDサイクル:
```bash
# Red: 失敗テストの特定
npm run test:screens  # 27/31失敗
npm run test:services # 型エラー

# Green: モック改善
- 実装に合わせたテストデータ
- 適切なモック設定
- 非同期処理対応

# Refactor: テスト構造改善
- ヘルパー関数作成
- 共通セットアップ抽出
```

---

## 📱 **Phase 2: データ層実装 (Week 2-3)**

### **Step 2.1: Firebaseデータ連携**
**目標**: ユーザーデータの永続化

#### TDDサイクル 1: ユーザープロファイル
```typescript
// Red: テスト作成
describe('UserProfile Service', () => {
  it('should save user profile to Firestore', async () => {
    const profile = { name: 'テストユーザー', age: 70 };
    const result = await userService.saveProfile(profile);
    expect(result).toBeTruthy();
  });
});

// Green: 最小実装
import { doc, setDoc, getFirestore } from 'firebase/firestore';

export const userService = {
  async saveProfile(profile: UserProfile) {
    const db = getFirestore();
    return await setDoc(doc(db, 'profiles', profile.id), profile);
  }
};

// Refactor: エラーハンドリング・バリデーション追加
```

#### TDDサイクル 2: バイタルデータ
```typescript
// Red: バイタルデータテスト
it('should save vital data with timestamp', async () => {
  const vitalData = { steps: 5000, date: '2024-01-01', userId: 'test-user' };
  await vitalService.save(vitalData);
  const saved = await vitalService.getByDate('test-user', '2024-01-01');
  expect(saved.steps).toBe(5000);
});

// Green: バイタルサービス実装
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

// Refactor: データ構造最適化・インデックス設計
```

### **Step 2.2: センサーデータ取得**
**目標**: 実際の歩数データ取得

#### TDDサイクル:
```typescript
// Red: センサーテスト
it('should get step count from device', async () => {
  const steps = await sensorService.getStepCount();
  expect(typeof steps).toBe('number');
  expect(steps).toBeGreaterThanOrEqual(0);
});

// Green: Expo Pedometer実装
import { Pedometer } from 'expo-sensors';

// Refactor: エラーハンドリング・権限チェック
```

---

## 🤖 **Phase 3: AI機能実装 (Week 4)**

### **Step 3.1: GPT-4o連携**
**目標**: ムード・ミラー機能の完成

#### TDDサイクル:
```typescript
// Red: AI応答テスト
it('should generate mood analysis from GPT-4o', async () => {
  const moodInput = { feeling: 'happy', notes: '今日は散歩した' };
  const analysis = await aiService.analyzeMood(moodInput);
  expect(analysis.suggestion).toContain('素晴らしい');
});

// Green: OpenAI API連携
// Refactor: プロンプト最適化・レート制限対応
```

### **Step 3.2: リスクスコア計算**
**目標**: 歩数データから健康リスク算出

#### TDDサイクル:
```typescript
// Red: リスク計算テスト
it('should calculate fall risk from step data', () => {
  const weeklySteps = [3000, 2500, 4000, 3500, 2000, 1500, 2800];
  const riskScore = riskCalculator.calculateFallRisk(weeklySteps);
  expect(riskScore.level).toBe('medium');
  expect(riskScore.score).toBeGreaterThan(0.3);
});

// Green: リスク計算アルゴリズム実装
// Refactor: 医学的根拠に基づく調整
```

---

## 🔔 **Phase 4: 通知システム (Week 5)**

### **Step 4.1: FCM通知**
**目標**: 水分・服薬リマインダー

#### TDDサイクル:
```typescript
// Red: 通知テスト
it('should send water reminder notification', async () => {
  await notificationService.scheduleWaterReminder('09:00');
  const scheduled = await notificationService.getScheduled();
  expect(scheduled).toHaveLength(1);
  expect(scheduled[0].title).toContain('水分補給');
});

// Green: Expo Notifications実装
// Refactor: 時間帯最適化・個人設定対応
```

### **Step 4.2: バッジシステム**
**目標**: 目標達成時の称賛機能

#### TDDサイクル:
```typescript
// Red: バッジテスト
it('should award badge for daily goal completion', async () => {
  await vitalService.save({ steps: 8000, date: today });
  const badges = await badgeService.checkEarnedBadges(userId);
  expect(badges).toContainEqual({ type: 'daily_steps', earned: true });
});

// Green: バッジ判定ロジック
// Refactor: 多様なバッジ種類・レベル分け
```

---

## 🎥 **Phase 5: 高度機能 (Week 6+)**

### **Step 5.1: カメラOCR (服薬確認)**
```typescript
// Red: OCRテスト
it('should recognize pill count from camera image', async () => {
  const mockImage = createMockPillImage(3); // 3錠の画像
  const result = await ocrService.countPills(mockImage);
  expect(result.count).toBe(3);
  expect(result.confidence).toBeGreaterThan(0.8);
});

// Green: React Native Vision実装
// Refactor: 精度向上・複数薬剤対応
```

### **Step 5.2: LINE連携**
```typescript
// Red: LINE通知テスト
it('should send weekly report via LINE', async () => {
  const weeklyData = await reportService.generateWeeklyReport(userId);
  await lineService.sendReport(lineToken, weeklyData);
  expect(lineService.lastSent).toBeTruthy();
});

// Green: LINE Notify API実装
// Refactor: グラフ生成・家族向けメッセージ
```

---

## 🎯 **TDD成功メトリクス**

### **各Phase完了基準**
```bash
# Phase 1完了
npm run quality:check  # ✅ エラー0個
npm run test:coverage  # ✅ 80%以上

# Phase 2完了  
npm run test:integration  # ✅ Firestore接続テスト成功
実機テスト: 歩数データ取得確認

# Phase 3完了
npm run test:ai  # ✅ AI機能テスト成功
実機テスト: ムード分析動作確認

# Phase 4完了
npm run test:notifications  # ✅ 通知テスト成功  
実機テスト: リマインダー受信確認

# Phase 5完了
npm run test:e2e  # ✅ E2Eテスト成功
実機テスト: 全機能統合確認
```

### **継続的品質保証**
```bash
# 毎日実行
npm run quality:check
npm run test:watch

# 機能追加時
npm run test:coverage
git commit  # テスト成功時のみ

# PR作成時  
npm run test:e2e
Claude Code Action自動修正
```

---

## 🚀 **実行開始コマンド**

```bash
# Phase 1開始
npm run test:unit  # 現状確認
npm run typecheck  # エラー特定

# TDDサイクル開始
# 1. Red: 失敗テスト作成
# 2. Green: 最小実装
# 3. Refactor: 改善
# 4. Commit: 成功時のみ

# 次のPhaseへ
git push origin main  # CI成功確認
```

**このTDD計画により、確実で保守性の高いMVPを6週間で完成させます。**