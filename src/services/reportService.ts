import { StepData, MoodData, OverallRiskAssessment, RiskLevel } from '../types';
import { firestoreService } from './firestoreService';
import RNHTMLtoPDF from 'react-native-html-to-pdf';

export interface HealthReport {
  userId: string;
  reportType: 'daily' | 'weekly' | 'monthly';
  period: {
    start: string;
    end: string;
  };
  summary: {
    averageSteps: number;
    totalSteps: number;
    activeDays: number;
    averageMood?: number;
    currentRiskLevel?: RiskLevel;
  };
  stepAnalysis?: {
    dailyAverage: number;
    weeklyTrend: string;
    bestDay: { date: string; steps: number };
    worstDay: { date: string; steps: number };
    targetAchievementRate: number;
  };
  moodAnalysis?: {
    averageMood: number;
    moodTrend: string;
    highestMood: { date: string; score: number };
    lowestMood: { date: string; score: number };
  };
  riskSummary?: {
    currentLevel: RiskLevel;
    mainConcerns: string[];
    recommendations: string[];
    riskTrend: string;
  };
  generatedAt: string;
}

class ReportService {
  /**
   * 月間レポートを生成
   */
  async generateMonthlyReport(userId: string): Promise<HealthReport> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // データを並列で取得
    const [stepData, moodData, riskHistory, userSettings] = await Promise.all([
      firestoreService.getStepHistory(userId, 30),
      firestoreService.getUserMoodHistory(userId, 30),
      firestoreService.getRiskAssessmentHistory(userId, 30),
      firestoreService.getUserSettings(userId),
    ]);

    // 歩数データの分析
    const stepAnalysis = this.analyzeStepData(stepData, 8000); // デフォルト目標: 8000歩

    // 気分データの分析
    const moodAnalysis = this.analyzeMoodData(moodData);

    // リスク評価の分析
    const riskSummary = this.analyzeRiskData(riskHistory);

    const report: HealthReport = {
      userId,
      reportType: 'monthly',
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      },
      summary: {
        averageSteps: stepAnalysis.dailyAverage,
        totalSteps: stepAnalysis.totalSteps,
        activeDays: stepAnalysis.activeDays,
        averageMood: moodAnalysis?.averageMood,
        currentRiskLevel: riskSummary?.currentLevel,
      },
      stepAnalysis,
      moodAnalysis,
      riskSummary,
      generatedAt: new Date().toISOString(),
    };

    return report;
  }

  /**
   * 週間レポートを生成
   */
  async generateWeeklyReport(userId: string): Promise<HealthReport> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const [stepData, moodData, riskHistory] = await Promise.all([
      firestoreService.getStepHistory(userId, 7),
      firestoreService.getUserMoodHistory(userId, 7),
      firestoreService.getRiskAssessmentHistory(userId, 7),
    ]);

    const stepAnalysis = this.analyzeStepData(stepData, 8000);
    const moodAnalysis = this.analyzeMoodData(moodData);
    const riskSummary = this.analyzeRiskData(riskHistory);

    return {
      userId,
      reportType: 'weekly',
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      },
      summary: {
        averageSteps: stepAnalysis.dailyAverage,
        totalSteps: stepAnalysis.totalSteps,
        activeDays: stepAnalysis.activeDays,
        averageMood: moodAnalysis?.averageMood,
        currentRiskLevel: riskSummary?.currentLevel,
      },
      stepAnalysis,
      moodAnalysis,
      riskSummary,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * 歩数データを分析
   */
  private analyzeStepData(stepData: StepData[], targetSteps: number) {
    if (!stepData || stepData.length === 0) {
      return {
        dailyAverage: 0,
        totalSteps: 0,
        activeDays: 0,
        weeklyTrend: 'no_data',
        bestDay: { date: '', steps: 0 },
        worstDay: { date: '', steps: 0 },
        targetAchievementRate: 0,
      };
    }

    const totalSteps = stepData.reduce((sum, day) => sum + day.steps, 0);
    const dailyAverage = Math.round(totalSteps / stepData.length);
    const activeDays = stepData.filter(day => day.steps > 0).length;
    
    // 目標達成日数
    const targetAchievedDays = stepData.filter(day => day.steps >= targetSteps).length;
    const targetAchievementRate = (targetAchievedDays / stepData.length) * 100;

    // 最高・最低記録
    const sortedBySteps = [...stepData].sort((a, b) => b.steps - a.steps);
    const bestDay = sortedBySteps[0];
    const worstDay = sortedBySteps[sortedBySteps.length - 1];

    // トレンド分析（簡易版）
    const firstWeekAvg = this.calculateAverage(stepData.slice(0, 7));
    const lastWeekAvg = this.calculateAverage(stepData.slice(-7));
    let weeklyTrend = 'stable';
    if (lastWeekAvg > firstWeekAvg * 1.1) weeklyTrend = 'improving';
    else if (lastWeekAvg < firstWeekAvg * 0.9) weeklyTrend = 'declining';

    return {
      dailyAverage,
      totalSteps,
      activeDays,
      weeklyTrend,
      bestDay: { date: bestDay.date, steps: bestDay.steps },
      worstDay: { date: worstDay.date, steps: worstDay.steps },
      targetAchievementRate: Math.round(targetAchievementRate * 10) / 10,
    };
  }

  /**
   * 気分データを分析
   */
  private analyzeMoodData(moodData: MoodData[]) {
    if (!moodData || moodData.length === 0) {
      return undefined;
    }

    const moodScores = moodData.map(m => m.mood);
    const averageMood = Math.round(
      moodScores.reduce((sum, score) => sum + score, 0) / moodScores.length
    );

    // 最高・最低記録
    const sortedByMood = [...moodData].sort((a, b) => b.mood - a.mood);
    const highestMood = sortedByMood[0];
    const lowestMood = sortedByMood[sortedByMood.length - 1];

    // トレンド分析
    const firstHalfAvg = this.calculateMoodAverage(moodData.slice(0, Math.floor(moodData.length / 2)));
    const secondHalfAvg = this.calculateMoodAverage(moodData.slice(Math.floor(moodData.length / 2)));
    let moodTrend = 'stable';
    if (secondHalfAvg > firstHalfAvg + 5) moodTrend = 'improving';
    else if (secondHalfAvg < firstHalfAvg - 5) moodTrend = 'declining';

    return {
      averageMood,
      moodTrend,
      highestMood: { 
        date: new Date(highestMood.createdAt).toISOString().split('T')[0], 
        score: highestMood.mood 
      },
      lowestMood: { 
        date: new Date(lowestMood.createdAt).toISOString().split('T')[0], 
        score: lowestMood.mood 
      },
    };
  }

  /**
   * リスク評価データを分析
   */
  private analyzeRiskData(riskHistory: OverallRiskAssessment[]) {
    if (!riskHistory || riskHistory.length === 0) {
      return undefined;
    }

    const latestAssessment = riskHistory[0];
    const mainConcerns = latestAssessment.priorityRisks || [];
    
    // リスクトレンド分析
    let riskTrend = 'stable';
    if (riskHistory.length > 1) {
      const previousLevel = riskHistory[1].overallRiskLevel;
      const currentLevel = latestAssessment.overallRiskLevel;
      
      const levelValues = { low: 1, medium: 2, high: 3 };
      if (levelValues[currentLevel] > levelValues[previousLevel]) {
        riskTrend = 'worsening';
      } else if (levelValues[currentLevel] < levelValues[previousLevel]) {
        riskTrend = 'improving';
      }
    }

    return {
      currentLevel: latestAssessment.overallRiskLevel,
      mainConcerns,
      recommendations: latestAssessment.recommendations || [],
      riskTrend,
    };
  }

  /**
   * レポートをPDF形式でエクスポート
   */
  async exportToPDF(report: HealthReport): Promise<string> {
    const html = this.generateReportHTML(report);
    
    const options = {
      html,
      fileName: `health_report_${report.period.start}_${report.period.end}`,
      directory: 'Documents',
    };

    try {
      const pdf = await RNHTMLtoPDF.convert(options);
      return pdf.filePath || '';
    } catch (error) {
      console.error('PDF生成エラー:', error);
      throw new Error('PDFの生成に失敗しました');
    }
  }

  /**
   * レポートのHTML生成
   */
  private generateReportHTML(report: HealthReport): string {
    const reportTypeText = {
      daily: '日次',
      weekly: '週間',
      monthly: '月間',
    };

    return `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: sans-serif; padding: 20px; }
    h1 { color: #333; }
    .section { margin: 20px 0; }
    .metric { margin: 10px 0; }
    .label { font-weight: bold; }
    .value { color: #007AFF; }
  </style>
</head>
<body>
  <h1>${reportTypeText[report.reportType]}健康レポート</h1>
  <p>期間: ${report.period.start} 〜 ${report.period.end}</p>
  
  <div class="section">
    <h2>サマリー</h2>
    <div class="metric">
      <span class="label">平均歩数:</span>
      <span class="value">${report.summary.averageSteps.toLocaleString()}歩/日</span>
    </div>
    <div class="metric">
      <span class="label">総歩数:</span>
      <span class="value">${report.summary.totalSteps.toLocaleString()}歩</span>
    </div>
    ${report.summary.averageMood ? `
    <div class="metric">
      <span class="label">平均気分スコア:</span>
      <span class="value">${report.summary.averageMood}点</span>
    </div>
    ` : ''}
  </div>
  
  ${report.stepAnalysis ? `
  <div class="section">
    <h2>歩数分析</h2>
    <div class="metric">
      <span class="label">最高記録:</span>
      <span class="value">${report.stepAnalysis.bestDay.steps.toLocaleString()}歩 (${report.stepAnalysis.bestDay.date})</span>
    </div>
    <div class="metric">
      <span class="label">目標達成率:</span>
      <span class="value">${report.stepAnalysis.targetAchievementRate}%</span>
    </div>
  </div>
  ` : ''}
  
  <p style="margin-top: 40px; font-size: 12px; color: #666;">
    生成日時: ${new Date(report.generatedAt).toLocaleString('ja-JP')}
  </p>
</body>
</html>
    `;
  }

  /**
   * レポート履歴を取得
   */
  async getReportHistory(userId: string): Promise<HealthReport[]> {
    // TODO: Firestoreからレポート履歴を取得する実装
    return [];
  }

  /**
   * レポートを表示用にフォーマット
   */
  formatReportForDisplay(report: HealthReport): string {
    const reportTypeText = {
      daily: '日次レポート',
      weekly: '週間レポート',
      monthly: '月間レポート',
    };

    let formatted = `${reportTypeText[report.reportType]}\n`;
    formatted += `期間: ${report.period.start} 〜 ${report.period.end}\n\n`;
    
    formatted += `【サマリー】\n`;
    formatted += `平均歩数: ${report.summary.averageSteps.toLocaleString()}歩/日\n`;
    formatted += `総歩数: ${report.summary.totalSteps.toLocaleString()}歩\n`;
    formatted += `活動日数: ${report.summary.activeDays}日\n`;
    
    if (report.summary.averageMood) {
      formatted += `平均気分: ${report.summary.averageMood}点\n`;
    }
    
    if (report.stepAnalysis) {
      formatted += `\n【歩数分析】\n`;
      formatted += `目標達成率: ${report.stepAnalysis.targetAchievementRate}%\n`;
      formatted += `最高記録: ${report.stepAnalysis.bestDay.steps.toLocaleString()}歩 (${report.stepAnalysis.bestDay.date})\n`;
      formatted += `最低記録: ${report.stepAnalysis.worstDay.steps.toLocaleString()}歩 (${report.stepAnalysis.worstDay.date})\n`;
    }

    return formatted;
  }

  /**
   * ヘルパー関数: 平均を計算
   */
  private calculateAverage(data: StepData[]): number {
    if (data.length === 0) return 0;
    return data.reduce((sum, item) => sum + item.steps, 0) / data.length;
  }

  private calculateMoodAverage(data: MoodData[]): number {
    if (data.length === 0) return 0;
    return data.reduce((sum, item) => sum + item.mood, 0) / data.length;
  }
}

export const reportService = new ReportService();