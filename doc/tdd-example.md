# テスト駆動開発（TDD）実践例

## 例：新機能「健康スコア計算」の実装

### ステップ1: テストを書く（レッド）

```typescript
// __tests__/services/healthScore.test.ts
import { calculateHealthScore } from '../../src/services/healthScoreService';

describe('健康スコア計算', () => {
  it('歩数、心拍数、気分データから総合スコアを計算する', () => {
    const data = {
      steps: 8000,
      heartRate: 72,
      mood: 80,
    };
    
    const score = calculateHealthScore(data);
    
    expect(score).toBe(85);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
  
  it('データが不足している場合は計算可能な項目のみでスコアを出す', () => {
    const data = {
      steps: 5000,
      heartRate: null,
      mood: null,
    };
    
    const score = calculateHealthScore(data);
    
    expect(score).toBe(60);
  });
  
  it('異常値の場合は適切に処理する', () => {
    const data = {
      steps: -100,
      heartRate: 300,
      mood: 150,
    };
    
    const score = calculateHealthScore(data);
    
    expect(score).toBe(0);
  });
});
```

### ステップ2: 最小限の実装（グリーン）

```typescript
// src/services/healthScoreService.ts
export const calculateHealthScore = (data: {
  steps: number;
  heartRate: number | null;
  mood: number | null;
}): number => {
  // 最初は固定値を返す（テストが通る最小実装）
  if (data.steps === 8000 && data.heartRate === 72 && data.mood === 80) {
    return 85;
  }
  if (data.steps === 5000 && !data.heartRate && !data.mood) {
    return 60;
  }
  if (data.steps < 0 || (data.heartRate && data.heartRate > 200) || (data.mood && data.mood > 100)) {
    return 0;
  }
  return 50;
};
```

### ステップ3: リファクタリング

```typescript
// src/services/healthScoreService.ts
interface HealthData {
  steps: number;
  heartRate: number | null;
  mood: number | null;
}

const WEIGHT = {
  steps: 0.4,
  heartRate: 0.3,
  mood: 0.3,
};

const normalize = (value: number, min: number, max: number, optimal: number): number => {
  if (value < min || value > max) return 0;
  if (value <= optimal) {
    return (value - min) / (optimal - min) * 100;
  }
  return 100 - ((value - optimal) / (max - optimal) * 20);
};

export const calculateHealthScore = (data: HealthData): number => {
  let totalWeight = 0;
  let weightedSum = 0;

  // 歩数スコア（0-20000歩、最適: 8000歩）
  if (data.steps >= 0) {
    const stepScore = normalize(data.steps, 0, 20000, 8000);
    weightedSum += stepScore * WEIGHT.steps;
    totalWeight += WEIGHT.steps;
  }

  // 心拍数スコア（40-200bpm、最適: 60-80bpm）
  if (data.heartRate && data.heartRate > 0) {
    const hrScore = data.heartRate >= 60 && data.heartRate <= 80 
      ? 100 
      : normalize(data.heartRate, 40, 200, 70);
    weightedSum += hrScore * WEIGHT.heartRate;
    totalWeight += WEIGHT.heartRate;
  }

  // 気分スコア（0-100）
  if (data.mood && data.mood >= 0 && data.mood <= 100) {
    weightedSum += data.mood * WEIGHT.mood;
    totalWeight += WEIGHT.mood;
  }

  // 重み付き平均を計算
  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
};
```

### ステップ4: 追加のテストケース

```typescript
// より多くのエッジケースをカバー
describe('健康スコア計算 - エッジケース', () => {
  it('すべてのデータが最適値の場合は100点', () => {
    const data = {
      steps: 8000,
      heartRate: 70,
      mood: 100,
    };
    
    const score = calculateHealthScore(data);
    expect(score).toBe(100);
  });
  
  it('歩数が多すぎる場合もスコアが下がる', () => {
    const data = {
      steps: 15000,
      heartRate: 70,
      mood: 80,
    };
    
    const score = calculateHealthScore(data);
    expect(score).toBeLessThan(100);
    expect(score).toBeGreaterThan(70);
  });
});
```

## TDDのメリット

1. **設計の改善**: テストを先に書くことで、使いやすいAPIを設計できる
2. **バグの早期発見**: 実装中にバグを見つけやすい
3. **リファクタリングの安全性**: テストがあるので安心してコードを改善できる
4. **ドキュメント化**: テストがコードの使い方を示す

## VSCode拡張機能の推奨

- **Jest Runner**: テストを個別に実行
- **Coverage Gutters**: カバレッジを視覚的に表示
- **Test Explorer UI**: テスト一覧を表示

## コマンドライン活用

```bash
# TDDモードで開発（ファイル変更を監視）
npm run tdd

# 特定のテストファイルのみ実行
npm test -- healthScore.test.ts --watch

# カバレッジを確認しながら開発
npm test -- --coverage --watch
```

## 注意点

- テストは「何を」テストするかを明確に
- 実装の詳細ではなく、振る舞いをテスト
- モックは最小限に
- テストも保守対象 - きれいに保つ