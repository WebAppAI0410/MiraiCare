import {
  StepData,
  MoodData,
  RiskLevel,
  FallRisk,
  FrailtyRisk,
  MentalHealthRisk,
  OverallRiskAssessment,
} from '../types';
import { getUserMoodHistory, saveRiskAssessment } from './firestoreService';

class RiskCalculationService {
  // リスクレベルのしきい値
  private readonly RISK_THRESHOLDS = {
    low: 30,
    medium: 60,
  };

  // 推奨歩数
  private readonly RECOMMENDED_DAILY_STEPS = 4000;
  
  // 活動パターンの評価基準
  private readonly ACTIVITY_THRESHOLDS = {
    veryLow: 1000,
    low: 2000,
    moderate: 4000,
    high: 6000,
  };

  /**
   * 転倒リスクを計算
   */
  async calculateFallRisk(weeklySteps: StepData[]): Promise<FallRisk> {
    const now = new Date().toISOString();
    
    // 指標の計算
    const indicators = {
      stepDecline: this.detectStepDecline(weeklySteps),
      irregularPattern: this.detectIrregularPattern(weeklySteps),
      lowActivity: this.detectLowActivity(weeklySteps),
      consistencyScore: this.calculateConsistencyScore(weeklySteps),
    };

    // スコアの計算（0-100）
    let score = 0;
    const factors: string[] = [];

    if (indicators.stepDecline) {
      score += 35;
      factors.push('急激な活動量の減少');
    }

    if (indicators.irregularPattern) {
      score += 25;
      factors.push('不規則な活動パターン');
    }

    if (indicators.lowActivity) {
      score += 30;
      factors.push('全体的な活動量不足');
    }

    // 一貫性スコアの反映（低いほどリスク増加）
    score += Math.max(0, 100 - indicators.consistencyScore) * 0.1;

    // リスクレベルの判定
    const level = this.determineRiskLevel(score);

    return {
      type: 'fall',
      level,
      score: Math.min(100, Math.round(score)),
      factors,
      lastUpdated: now,
      indicators,
    };
  }

  /**
   * フレイルリスクを計算
   */
  async calculateFrailtyRisk(
    monthlySteps: StepData[],
    stepTarget: number
  ): Promise<FrailtyRisk> {
    const now = new Date().toISOString();
    
    // 最近7日間のデータを抽出
    const recentSteps = monthlySteps.slice(-7);
    
    // 指標の計算
    const indicators = {
      weeklyAverage: this.calculateAverage(recentSteps),
      monthlyTrend: this.calculateMonthlyTrend(monthlySteps),
      activityDays: this.countActivityDays(recentSteps),
      goalAchievementRate: this.calculateGoalAchievementRate(recentSteps, stepTarget),
    };

    // スコアの計算
    let score = 0;
    const factors: string[] = [];

    // 週間平均歩数による評価
    if (indicators.weeklyAverage < this.ACTIVITY_THRESHOLDS.veryLow) {
      score += 40;
      factors.push('極めて低い活動量');
    } else if (indicators.weeklyAverage < this.ACTIVITY_THRESHOLDS.low) {
      score += 30;
      factors.push('低い活動量');
    } else if (indicators.weeklyAverage < this.ACTIVITY_THRESHOLDS.moderate) {
      score += 15;
    }

    // 月間トレンドによる評価
    if (indicators.monthlyTrend === 'declining') {
      score += 25;
      factors.push('活動量の減少傾向');
    } else if (indicators.monthlyTrend === 'improving') {
      score -= 10; // 改善傾向はスコアを下げる
    }

    // 活動日数による評価
    if (indicators.activityDays < 3) {
      score += 30;
      factors.push('活動日数が少ない');
    } else if (indicators.activityDays < 5) {
      score += 15;
      factors.push('活動日数がやや少ない');
    }

    // 目標達成率による評価
    if (indicators.goalAchievementRate < 30) {
      score += 20;
      factors.push('目標達成率が低い');
    } else if (indicators.goalAchievementRate > 70) {
      score -= 10; // 高い達成率はスコアを下げる
    }

    const level = this.determineRiskLevel(score);

    return {
      type: 'frailty',
      level,
      score: Math.min(100, Math.max(0, Math.round(score))),
      factors,
      lastUpdated: now,
      indicators,
    };
  }

  /**
   * メンタルヘルスリスクを計算
   */
  async calculateMentalHealthRisk(
    userId: string,
    appUsageDays: number
  ): Promise<MentalHealthRisk> {
    const now = new Date().toISOString();
    
    // 過去7日間のムードデータを取得
    const moodHistory = await getUserMoodHistory(userId, 7);
    
    // 指標の計算
    const indicators = {
      moodScore: this.calculateMoodScore(moodHistory),
      socialActivity: this.determineSocialActivityLevel(appUsageDays),
      engagementLevel: this.calculateEngagementLevel(appUsageDays),
    };

    // スコアの計算
    let score = 0;
    const factors: string[] = [];

    // ムードスコアによる評価
    if (indicators.moodScore <= 40) {
      score += 40;
      factors.push('継続的なネガティブ気分');
    } else if (indicators.moodScore < 60) {
      score += 25;
      factors.push('気分の低下傾向');
    } else if (indicators.moodScore > 80) {
      score -= 10; // ポジティブな気分はスコアを下げる
    }

    // アプリ利用率による評価
    if (indicators.engagementLevel < 20) {
      score += 30;
      factors.push('アプリ利用頻度が低い');
    } else if (indicators.engagementLevel < 40) {
      score += 15;
      factors.push('アプリ利用頻度がやや低い');
    }

    // 社会活動レベルによる評価
    if (indicators.socialActivity === 'low') {
      score += 20;
      factors.push('社会的つながりが少ない');
    }

    const level = this.determineRiskLevel(score);

    return {
      type: 'mental',
      level,
      score: Math.min(100, Math.max(0, Math.round(score))),
      factors,
      lastUpdated: now,
      indicators,
    };
  }

  /**
   * 総合リスク評価を実施
   */
  async calculateOverallRisk(
    userId: string,
    weeklySteps: StepData[],
    monthlySteps: StepData[],
    stepTarget: number,
    appUsageDays: number
  ): Promise<OverallRiskAssessment> {
    // 各リスクを計算
    const [fallRisk, frailtyRisk, mentalHealthRisk] = await Promise.all([
      this.calculateFallRisk(weeklySteps),
      this.calculateFrailtyRisk(monthlySteps, stepTarget),
      this.calculateMentalHealthRisk(userId, appUsageDays),
    ]);

    // 総合リスクレベルの決定（最も高いリスクレベルを採用）
    const riskLevels = [fallRisk.level, frailtyRisk.level, mentalHealthRisk.level];
    let overallLevel: RiskLevel = 'low';
    
    if (riskLevels.includes('high')) {
      overallLevel = 'high';
    } else if (riskLevels.includes('medium')) {
      overallLevel = 'medium';
    }

    // 推奨事項の生成
    const recommendations = this.generateRecommendations(
      fallRisk,
      frailtyRisk,
      mentalHealthRisk
    );

    // 次回評価日の設定（1週間後）
    const nextAssessmentDate = new Date();
    nextAssessmentDate.setDate(nextAssessmentDate.getDate() + 7);

    return {
      userId,
      assessmentDate: new Date().toISOString(),
      fallRisk,
      frailtyRisk,
      mentalHealthRisk,
      overallLevel,
      recommendations,
      nextAssessmentDate: nextAssessmentDate.toISOString(),
    };
  }

  /**
   * 評価結果を保存
   */
  async saveAssessment(assessment: OverallRiskAssessment): Promise<{ success: boolean; id?: string }> {
    try {
      const result = await saveRiskAssessment(assessment.userId, assessment);
      return result;
    } catch (error) {
      console.error('リスク評価の保存エラー:', error);
      return { success: false };
    }
  }

  // ヘルパーメソッド

  private detectStepDecline(weeklySteps: StepData[]): boolean {
    if (weeklySteps.length < 2) return false;
    
    // 最初の3日間の平均と最後の3日間の平均を比較
    const firstDays = weeklySteps.slice(0, 3);
    const lastDays = weeklySteps.slice(-3);
    
    const firstAvg = this.calculateAverage(firstDays);
    const lastAvg = this.calculateAverage(lastDays);
    
    // 50%以上の減少を検出
    return lastAvg < firstAvg * 0.5;
  }

  private detectIrregularPattern(weeklySteps: StepData[]): boolean {
    if (weeklySteps.length < 3) return false;
    
    const steps = weeklySteps.map(d => d.steps);
    const mean = steps.reduce((a, b) => a + b, 0) / steps.length;
    
    // 標準偏差を計算
    const variance = steps.reduce((sum, step) => sum + Math.pow(step - mean, 2), 0) / steps.length;
    const stdDev = Math.sqrt(variance);
    
    // 変動係数が50%以上の場合、不規則と判定
    return (stdDev / mean) > 0.5;
  }

  private detectLowActivity(weeklySteps: StepData[]): boolean {
    const avg = this.calculateAverage(weeklySteps);
    return avg < this.ACTIVITY_THRESHOLDS.low;
  }

  private calculateConsistencyScore(weeklySteps: StepData[]): number {
    if (weeklySteps.length === 0) return 0;
    
    // 日々の活動の一貫性を評価（0-100）
    const steps = weeklySteps.map(d => d.steps);
    const mean = steps.reduce((a, b) => a + b, 0) / steps.length;
    
    if (mean === 0) return 0;
    
    const variance = steps.reduce((sum, step) => sum + Math.pow(step - mean, 2), 0) / steps.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean; // 変動係数
    
    // 変動係数が小さいほど高スコア
    return Math.max(0, Math.min(100, 100 - (cv * 100)));
  }

  private calculateAverage(steps: StepData[]): number {
    if (steps.length === 0) return 0;
    return Math.round(steps.reduce((sum, d) => sum + d.steps, 0) / steps.length);
  }

  private calculateMonthlyTrend(monthlySteps: StepData[]): 'improving' | 'stable' | 'declining' {
    if (monthlySteps.length < 14) return 'stable';
    
    // 前半と後半の平均を比較
    const midPoint = Math.floor(monthlySteps.length / 2);
    const firstHalf = monthlySteps.slice(0, midPoint);
    const secondHalf = monthlySteps.slice(midPoint);
    
    const firstAvg = this.calculateAverage(firstHalf);
    const secondAvg = this.calculateAverage(secondHalf);
    
    const changeRate = (secondAvg - firstAvg) / firstAvg;
    
    if (changeRate > 0.1) return 'improving';
    if (changeRate < -0.1) return 'declining';
    return 'stable';
  }

  private countActivityDays(steps: StepData[]): number {
    // 1000歩以上を活動日とカウント
    return steps.filter(d => d.steps >= this.ACTIVITY_THRESHOLDS.veryLow).length;
  }

  private calculateGoalAchievementRate(steps: StepData[], target: number): number {
    if (steps.length === 0 || target === 0) return 0;
    
    const achievedDays = steps.filter(d => d.steps >= target).length;
    return Math.round((achievedDays / steps.length) * 100);
  }

  private calculateMoodScore(moodHistory: MoodData[]): number {
    if (moodHistory.length === 0) return 50; // デフォルト値
    
    // intensity（1-5）を0-100スケールに変換（1=0, 5=100）
    const scores = moodHistory.map(mood => mood.intensity * 20);
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }

  private determineSocialActivityLevel(appUsageDays: number): 'high' | 'moderate' | 'low' {
    if (appUsageDays >= 5) return 'high';
    if (appUsageDays >= 3) return 'moderate';
    return 'low';
  }

  private calculateEngagementLevel(appUsageDays: number): number {
    // 過去7日間の利用日数を0-100スケールに変換
    return Math.round((appUsageDays / 7) * 100);
  }

  private determineRiskLevel(score: number): RiskLevel {
    if (score < this.RISK_THRESHOLDS.low) return 'low';
    if (score < this.RISK_THRESHOLDS.medium) return 'medium';
    return 'high';
  }

  private generateRecommendations(
    fallRisk: FallRisk,
    frailtyRisk: FrailtyRisk,
    mentalHealthRisk: MentalHealthRisk
  ): string[] {
    const recommendations: string[] = [];

    // 転倒リスクに基づく推奨事項
    if (fallRisk.level === 'high') {
      recommendations.push('転倒予防のため、規則的な歩行習慣を心がけてください');
      if (fallRisk.indicators.irregularPattern) {
        recommendations.push('毎日同じ時間帯に散歩をすることをお勧めします');
      }
    } else if (fallRisk.level === 'medium') {
      recommendations.push('歩行時は無理をせず、安全な環境で活動してください');
    }

    // フレイルリスクに基づく推奨事項
    if (frailtyRisk.level === 'high') {
      recommendations.push('筋力維持のため、少しずつ活動量を増やしましょう');
      if (frailtyRisk.indicators.activityDays < 3) {
        recommendations.push('週に最低3日は軽い運動を心がけてください');
      }
    } else if (frailtyRisk.level === 'medium') {
      recommendations.push('現在の活動レベルを維持し、徐々に歩数を増やしてみましょう');
    }

    // メンタルヘルスリスクに基づく推奨事項
    if (mentalHealthRisk.level === 'high') {
      recommendations.push('気分の記録を続けて、心の健康を見守りましょう');
      if (mentalHealthRisk.indicators.engagementLevel < 30) {
        recommendations.push('アプリの機能を活用して、日々の気分を記録してください');
      }
    }

    // 全体的に良好な場合
    if (recommendations.length === 0) {
      recommendations.push('現在の活動レベルを維持してください');
      recommendations.push('定期的な健康チェックを続けましょう');
    }

    return recommendations;
  }
}

export const riskCalculationService = new RiskCalculationService();