import { 
  RiskLevel, 
  RiskScore, 
  HealthDataPoint, 
  WeeklyHealthData,
  RiskWeights,
  AgeBasedStandards 
} from '../types';

class RiskCalculationService {
  private static instance: RiskCalculationService;

  // デフォルトの重み係数
  private readonly defaultWeights: RiskWeights = {
    stepVariability: 0.3,
    averageSteps: 0.4,
    trendDirection: 0.2,
    consistency: 0.1,
  };

  // 年齢別基準値（65歳以上の高齢者向け）
  private readonly ageStandards: AgeBasedStandards = {
    targetSteps: 4000,           // 高齢者の推奨歩数
    minimumSteps: 1500,          // 最低限必要な歩数
    riskThresholds: {
      low: 25,      // 25点未満: 低リスク
      medium: 60,   // 25-60点: 中リスク
      high: 100,    // 60点以上: 高リスク
    },
  };

  public static getInstance(): RiskCalculationService {
    if (!RiskCalculationService.instance) {
      RiskCalculationService.instance = new RiskCalculationService();
    }
    return RiskCalculationService.instance;
  }

  /**
   * 総合リスクスコアの計算
   */
  calculateRiskScore(
    healthData: WeeklyHealthData,
    userAge?: number,
    customWeights?: Partial<RiskWeights>
  ): RiskScore {
    try {
      const weights = { ...this.defaultWeights, ...customWeights };
      
      // 各リスク要素を計算
      const stepRisk = this.calculateStepBasedRisk(healthData, weights);
      const frailtyRisk = this.calculateFrailtyRisk(healthData);
      const fallRisk = this.calculateFallRisk(healthData);
      
      // 総合リスクレベルを決定
      const overallRisk = this.determineOverallRisk(stepRisk, frailtyRisk, fallRisk);
      
      return {
        overall: overallRisk,
        fallRisk,
        frailtyRisk,
        mentalHealthRisk: this.calculateMentalHealthRisk(healthData), // 歩数パターンから推定
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('リスクスコア計算エラー:', error);
      return this.getDefaultRiskScore();
    }
  }

  /**
   * 歩数ベースのリスク計算
   */
  private calculateStepBasedRisk(
    healthData: WeeklyHealthData,
    weights: RiskWeights
  ): number {
    const { steps, averageSteps } = healthData;
    
    if (steps.length === 0) return 100; // データなしは最高リスク

    // 1. 平均歩数リスク
    const averageRisk = this.calculateAverageStepsRisk(averageSteps);
    
    // 2. 歩数のばらつきリスク
    const variabilityRisk = this.calculateStepVariabilityRisk(steps);
    
    // 3. トレンドリスク（最近3日間の傾向）
    const trendRisk = this.calculateTrendRisk(steps);
    
    // 4. 継続性リスク（ゼロ歩数の日の割合）
    const consistencyRisk = this.calculateConsistencyRisk(steps);

    // 重み付け合計
    const totalRisk = 
      averageRisk * weights.averageSteps +
      variabilityRisk * weights.stepVariability +
      trendRisk * weights.trendDirection +
      consistencyRisk * weights.consistency;

    return Math.min(Math.max(totalRisk, 0), 100);
  }

  /**
   * 平均歩数からのリスク計算
   */
  private calculateAverageStepsRisk(averageSteps: number): number {
    const { targetSteps, minimumSteps } = this.ageStandards;
    
    if (averageSteps >= targetSteps) return 0;           // 目標達成: リスクなし
    if (averageSteps >= targetSteps * 0.8) return 20;   // 目標の80%以上: 低リスク
    if (averageSteps >= minimumSteps) return 50;        // 最低基準以上: 中リスク
    
    return 80; // 最低基準未満: 高リスク
  }

  /**
   * 歩数のばらつきからのリスク計算
   */
  private calculateStepVariabilityRisk(steps: HealthDataPoint[]): number {
    if (steps.length < 2) return 0;

    const values = steps.map(s => s.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    
    // 変動係数（CV = SD/Mean）を計算
    const coefficientOfVariation = mean > 0 ? (standardDeviation / mean) * 100 : 100;
    
    // CVが高いほどリスクが高い
    if (coefficientOfVariation > 80) return 70;  // 極めて不安定
    if (coefficientOfVariation > 60) return 50;  // 不安定
    if (coefficientOfVariation > 40) return 30;  // やや不安定
    if (coefficientOfVariation > 25) return 15;  // 軽度不安定
    
    return 0; // 安定
  }

  /**
   * 歩数トレンドからのリスク計算
   */
  private calculateTrendRisk(steps: HealthDataPoint[]): number {
    if (steps.length < 3) return 0;

    // 最近3日間の歩数
    const recentSteps = steps.slice(-3).map(s => s.value);
    
    // 線形回帰で傾きを計算
    const slope = this.calculateLinearRegressionSlope(recentSteps);
    
    // 傾きが負の場合（減少トレンド）はリスクが高い
    if (slope < -200) return 60;      // 急激な減少
    if (slope < -100) return 40;      // 中程度の減少
    if (slope < -50) return 20;       // 軽度の減少
    if (slope > 100) return 0;        // 増加トレンド（良好）
    
    return 10; // 横ばい
  }

  /**
   * 継続性リスク計算
   */
  private calculateConsistencyRisk(steps: HealthDataPoint[]): number {
    const { minimumSteps } = this.ageStandards;
    const lowActivityDays = steps.filter(s => s.value < minimumSteps).length;
    const lowActivityRatio = lowActivityDays / steps.length;
    
    if (lowActivityRatio > 0.6) return 80;  // 60%以上が低活動
    if (lowActivityRatio > 0.4) return 50;  // 40-60%が低活動
    if (lowActivityRatio > 0.2) return 25;  // 20-40%が低活動
    
    return 0; // 20%未満が低活動
  }

  /**
   * フレイルリスクの計算
   */
  private calculateFrailtyRisk(healthData: WeeklyHealthData): RiskLevel {
    const { averageSteps } = healthData;
    const riskScore = this.calculateStepBasedRisk(healthData, this.defaultWeights);
    
    // フレイル基準（日本老年医学会基準を参考）
    if (averageSteps < 1500 || riskScore > 70) return 'high';
    if (averageSteps < 2500 || riskScore > 40) return 'medium';
    
    return 'low';
  }

  /**
   * 転倒リスクの計算
   */
  private calculateFallRisk(healthData: WeeklyHealthData): RiskLevel {
    const { steps } = healthData;
    
    // 歩行パターンの不安定性から転倒リスクを評価
    const variabilityRisk = this.calculateStepVariabilityRisk(steps);
    const consistencyRisk = this.calculateConsistencyRisk(steps);
    
    const combinedRisk = (variabilityRisk + consistencyRisk) / 2;
    
    if (combinedRisk > 60) return 'high';
    if (combinedRisk > 30) return 'medium';
    
    return 'low';
  }

  /**
   * メンタルヘルスリスクの計算（歩数パターンから推定）
   */
  private calculateMentalHealthRisk(healthData: WeeklyHealthData): RiskLevel {
    const { steps, averageSteps } = healthData;
    
    // 急激な活動量低下はメンタルヘルス悪化の兆候
    const trendRisk = this.calculateTrendRisk(steps);
    const averageRisk = this.calculateAverageStepsRisk(averageSteps);
    
    const mentalRisk = (trendRisk + averageRisk) / 2;
    
    if (mentalRisk > 50) return 'high';
    if (mentalRisk > 25) return 'medium';
    
    return 'low';
  }

  /**
   * 総合リスクレベルの決定
   */
  private determineOverallRisk(
    stepRisk: number,
    frailtyRisk: RiskLevel,
    fallRisk: RiskLevel
  ): RiskLevel {
    // リスクレベルを数値に変換
    const riskToNumber = (risk: RiskLevel): number => {
      switch (risk) {
        case 'low': return 1;
        case 'medium': return 2;
        case 'high': return 3;
        default: return 1;
      }
    };

    const frailtyScore = riskToNumber(frailtyRisk) * 30;
    const fallScore = riskToNumber(fallRisk) * 25;
    const combinedScore = (stepRisk + frailtyScore + fallScore) / 3;

    const { riskThresholds } = this.ageStandards;
    
    if (combinedScore >= riskThresholds.high) return 'high';
    if (combinedScore >= riskThresholds.medium) return 'medium';
    
    return 'low';
  }

  /**
   * 線形回帰の傾きを計算
   */
  private calculateLinearRegressionSlope(values: number[]): number {
    const n = values.length;
    const xSum = (n * (n - 1)) / 2; // 0, 1, 2, ... n-1の合計
    const ySum = values.reduce((a, b) => a + b, 0);
    const xySum = values.reduce((sum, y, x) => sum + x * y, 0);
    const xxSum = (n * (n - 1) * (2 * n - 1)) / 6; // 0^2 + 1^2 + ... + (n-1)^2

    const slope = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum);
    return slope;
  }

  /**
   * デフォルトリスクスコア（エラー時）
   */
  private getDefaultRiskScore(): RiskScore {
    return {
      overall: 'medium',
      fallRisk: 'medium',
      frailtyRisk: 'medium',
      mentalHealthRisk: 'medium',
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * リスクレベルの説明文を取得
   */
  getRiskDescription(riskLevel: RiskLevel, riskType: keyof RiskScore): string {
    const descriptions = {
      low: {
        overall: '現在の健康状態は良好です。この調子で生活習慣を維持しましょう。',
        fallRisk: '転倒リスクは低い状態です。現在の運動習慣を継続してください。',
        frailtyRisk: 'フレイルのリスクは低く、身体機能が維持されています。',
        mentalHealthRisk: 'メンタルヘルスは良好な状態です。',
      },
      medium: {
        overall: '健康状態に注意が必要です。生活習慣の見直しを検討しましょう。',
        fallRisk: '転倒リスクがやや高まっています。バランス運動を取り入れましょう。',
        frailtyRisk: 'フレイルの兆候があります。適度な運動と栄養管理を心がけましょう。',
        mentalHealthRisk: 'メンタルヘルスに注意が必要です。十分な休息を取りましょう。',
      },
      high: {
        overall: '健康状態が心配です。医療専門家への相談をお勧めします。',
        fallRisk: '転倒リスクが高い状態です。安全な環境作りと専門家への相談を検討してください。',
        frailtyRisk: 'フレイルのリスクが高いです。医師と相談して対策を立てましょう。',
        mentalHealthRisk: 'メンタルヘルスのケアが必要です。専門家のサポートを受けることをお勧めします。',
      },
    };

    return descriptions[riskLevel][riskType as keyof typeof descriptions.low] || '';
  }

  /**
   * 改善提案の生成
   */
  generateImprovementSuggestions(riskScore: RiskScore): string[] {
    const suggestions: string[] = [];

    if (riskScore.overall === 'high' || riskScore.fallRisk === 'high') {
      suggestions.push('医療専門家への相談を検討してください');
      suggestions.push('転倒防止のため、住環境の安全点検を行いましょう');
    }

    if (riskScore.frailtyRisk === 'medium' || riskScore.frailtyRisk === 'high') {
      suggestions.push('軽い筋力トレーニングを日常に取り入れましょう');
      suggestions.push('タンパク質を意識的に摂取しましょう');
    }

    if (riskScore.mentalHealthRisk === 'medium' || riskScore.mentalHealthRisk === 'high') {
      suggestions.push('社会的活動への参加を検討しましょう');
      suggestions.push('十分な睡眠と規則正しい生活リズムを心がけましょう');
    }

    // 基本的な提案
    suggestions.push('毎日の歩数を記録して、活動量を意識しましょう');
    suggestions.push('バランスの良い食事を心がけましょう');

    return suggestions;
  }
}

export default RiskCalculationService.getInstance();