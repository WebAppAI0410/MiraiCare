import { supabase } from '../config/supabase';
import { 
  WeeklyReport, 
  VitalData, 
  MoodData, 
  RiskScore, 
  Badge, 
  User 
} from '../types';

/**
 * 週次レポート生成サービス
 * ユーザーの健康データを分析して週次レポートを作成
 */
export class ReportGeneratorService {
  /**
   * 週次レポートを生成
   * @param userId ユーザーID
   * @param weekStartDate 週の開始日
   * @param weekEndDate 週の終了日
   * @returns 生成された週次レポート
   */
  static async generateWeeklyReport(
    userId: string,
    weekStartDate: Date,
    weekEndDate: Date
  ): Promise<WeeklyReport | null> {
    try {
      // データ収集
      const vitalData = await this.getVitalData(userId, weekStartDate, weekEndDate);
      const moodData = await this.getMoodData(userId, weekStartDate, weekEndDate);
      const riskScores = await this.getRiskScores(userId);
      const achievements = await this.getWeeklyAchievements(userId, weekStartDate, weekEndDate);

      // データ分析
      const averageSteps = this.calculateAverageSteps(vitalData);
      const totalActiveHours = this.calculateActiveHours(vitalData);
      const moodTrend = this.analyzeMoodTrend(moodData);
      const concerns = this.identifyConcerns(vitalData, moodData, riskScores);
      const recommendations = this.generateRecommendations(vitalData, moodData, riskScores);

      // レポート作成
      const report: WeeklyReport = {
        id: this.generateReportId(),
        userId,
        weekStartDate: weekStartDate.toISOString(),
        weekEndDate: weekEndDate.toISOString(),
        data: {
          averageSteps,
          totalActiveHours,
          moodTrend,
          riskScores,
          achievements,
          concerns,
          recommendations,
        },
        createdAt: new Date().toISOString(),
      };

      // データベースに保存
      await this.saveReport(report);

      return report;
    } catch (error) {
      console.error('週次レポート生成エラー:', error);
      return null;
    }
  }

  /**
   * バイタルデータを取得
   * @param userId ユーザーID
   * @param startDate 開始日
   * @param endDate 終了日
   * @returns バイタルデータ配列
   */
  private static async getVitalData(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<VitalData[]> {
    const { data, error } = await supabase
      .from('vital_data')
      .select('*')
      .eq('userId', userId)
      .gte('measuredAt', startDate.toISOString())
      .lte('measuredAt', endDate.toISOString())
      .order('measuredAt', { ascending: true });

    if (error) {
      console.error('バイタルデータ取得エラー:', error);
      return [];
    }

    return data || [];
  }

  /**
   * 気分データを取得
   * @param userId ユーザーID
   * @param startDate 開始日
   * @param endDate 終了日
   * @returns 気分データ配列
   */
  private static async getMoodData(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<MoodData[]> {
    const { data, error } = await supabase
      .from('mood_data')
      .select('*')
      .eq('userId', userId)
      .gte('createdAt', startDate.toISOString())
      .lte('createdAt', endDate.toISOString())
      .order('createdAt', { ascending: true });

    if (error) {
      console.error('気分データ取得エラー:', error);
      return [];
    }

    return data || [];
  }

  /**
   * 最新のリスクスコアを取得
   * @param userId ユーザーID
   * @returns 最新のリスクスコア
   */
  private static async getRiskScores(userId: string): Promise<RiskScore> {
    const { data, error } = await supabase
      .from('risk_scores')
      .select('*')
      .eq('userId', userId)
      .order('lastUpdated', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      console.error('リスクスコア取得エラー:', error);
      return {
        overall: 'low',
        fallRisk: 'low',
        frailtyRisk: 'low',
        mentalHealthRisk: 'low',
        lastUpdated: new Date().toISOString(),
      };
    }

    return data;
  }

  /**
   * 週の達成バッジを取得
   * @param userId ユーザーID
   * @param startDate 開始日
   * @param endDate 終了日
   * @returns 達成バッジ配列
   */
  private static async getWeeklyAchievements(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Badge[]> {
    const { data, error } = await supabase
      .from('user_badges')
      .select('badges(*)')
      .eq('userId', userId)
      .gte('unlockedAt', startDate.toISOString())
      .lte('unlockedAt', endDate.toISOString());

    if (error) {
      console.error('バッジ取得エラー:', error);
      return [];
    }

    return data?.map(item => item.badges) || [];
  }

  /**
   * 平均歩数を計算
   * @param vitalData バイタルデータ配列
   * @returns 平均歩数
   */
  private static calculateAverageSteps(vitalData: VitalData[]): number {
    const stepsData = vitalData.filter(data => data.type === 'steps');
    if (stepsData.length === 0) return 0;

    const totalSteps = stepsData.reduce((sum, data) => sum + data.value, 0);
    return Math.round(totalSteps / stepsData.length);
  }

  /**
   * 総活動時間を計算（簡易実装）
   * @param vitalData バイタルデータ配列
   * @returns 総活動時間（時間）
   */
  private static calculateActiveHours(vitalData: VitalData[]): number {
    // 簡易実装: 歩数データがある時間帯を活動時間とする
    const activeDays = new Set(
      vitalData
        .filter(data => data.type === 'steps' && data.value > 100)
        .map(data => new Date(data.measuredAt).toDateString())
    );

    return activeDays.size * 8; // 1日8時間の活動を仮定
  }

  /**
   * 気分の傾向を分析
   * @param moodData 気分データ配列
   * @returns 気分の傾向
   */
  private static analyzeMoodTrend(
    moodData: MoodData[]
  ): 'improving' | 'stable' | 'declining' {
    if (moodData.length < 2) return 'stable';

    // 前半と後半の平均気分値を比較
    const midpoint = Math.floor(moodData.length / 2);
    const firstHalf = moodData.slice(0, midpoint);
    const secondHalf = moodData.slice(midpoint);

    const firstHalfAvg = firstHalf.reduce((sum, mood) => sum + mood.intensity, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, mood) => sum + mood.intensity, 0) / secondHalf.length;

    const difference = secondHalfAvg - firstHalfAvg;

    if (difference > 0.5) return 'improving';
    if (difference < -0.5) return 'declining';
    return 'stable';
  }

  /**
   * 気になる点を特定
   * @param vitalData バイタルデータ
   * @param moodData 気分データ
   * @param riskScores リスクスコア
   * @returns 気になる点の配列
   */
  private static identifyConcerns(
    vitalData: VitalData[],
    moodData: MoodData[],
    riskScores: RiskScore
  ): string[] {
    const concerns: string[] = [];

    // 歩数チェック
    const averageSteps = this.calculateAverageSteps(vitalData);
    if (averageSteps < 3000) {
      concerns.push('歩数が推奨値を下回っています');
    }

    // 気分チェック
    const recentMoods = moodData.slice(-3);
    const lowMoodCount = recentMoods.filter(mood => mood.intensity <= 2).length;
    if (lowMoodCount >= 2) {
      concerns.push('気分の落ち込みが続いています');
    }

    // リスクスコアチェック
    if (riskScores.overall === 'high') {
      concerns.push('総合的な健康リスクが高くなっています');
    }
    if (riskScores.fallRisk === 'high') {
      concerns.push('転倒リスクが高くなっています');
    }
    if (riskScores.mentalHealthRisk === 'high') {
      concerns.push('メンタルヘルスのリスクが高くなっています');
    }

    return concerns;
  }

  /**
   * 推奨事項を生成
   * @param vitalData バイタルデータ
   * @param moodData 気分データ
   * @param riskScores リスクスコア
   * @returns 推奨事項の配列
   */
  private static generateRecommendations(
    vitalData: VitalData[],
    moodData: MoodData[],
    riskScores: RiskScore
  ): string[] {
    const recommendations: string[] = [];

    // 歩数改善提案
    const averageSteps = this.calculateAverageSteps(vitalData);
    if (averageSteps < 6000) {
      recommendations.push('1日10分程度の散歩から始めてみましょう');
    }

    // 気分改善提案
    const moodTrend = this.analyzeMoodTrend(moodData);
    if (moodTrend === 'declining') {
      recommendations.push('音楽を聴いたり、趣味の時間を作ってみましょう');
    }

    // リスク別推奨事項
    if (riskScores.fallRisk === 'medium' || riskScores.fallRisk === 'high') {
      recommendations.push('バランス運動や筋力トレーニングを取り入れましょう');
    }

    if (riskScores.mentalHealthRisk === 'medium' || riskScores.mentalHealthRisk === 'high') {
      recommendations.push('家族や友人とのコミュニケーションを大切にしましょう');
    }

    // 一般的な健康維持提案
    recommendations.push('規則正しい生活リズムを心がけましょう');
    recommendations.push('水分補給を忘れずに行いましょう');

    return recommendations;
  }

  /**
   * レポートIDを生成
   * @returns ユニークなレポートID
   */
  private static generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * レポートをデータベースに保存
   * @param report 週次レポート
   */
  private static async saveReport(report: WeeklyReport): Promise<void> {
    const { error } = await supabase
      .from('weekly_reports')
      .insert([report]);

    if (error) {
      console.error('レポート保存エラー:', error);
      throw error;
    }
  }

  /**
   * 今週の開始日（月曜日）を取得
   * @param date 基準日
   * @returns 今週の月曜日
   */
  static getWeekStartDate(date: Date = new Date()): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 月曜日を週の開始とする
    return new Date(d.setDate(diff));
  }

  /**
   * 今週の終了日（日曜日）を取得
   * @param date 基準日
   * @returns 今週の日曜日
   */
  static getWeekEndDate(date: Date = new Date()): Date {
    const startDate = this.getWeekStartDate(date);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    return endDate;
  }
}