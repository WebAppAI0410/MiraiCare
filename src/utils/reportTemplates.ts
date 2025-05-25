import { WeeklyReport, EmergencyAlert, NotificationTemplate } from '../types';

/**
 * レポートテンプレートユーティリティ
 * 各種通知メッセージのテンプレートを管理
 */
export class ReportTemplateService {
  /**
   * 週次レポートテンプレート
   */
  static readonly WEEKLY_REPORT_TEMPLATE: NotificationTemplate = {
    id: 'weekly_report_default',
    type: 'weekly_report',
    title: '週次レポート',
    message: `📊 {{userName}}さんの週次レポート
期間: {{startDate}} - {{endDate}}

🚶‍♂️ 平均歩数: {{averageSteps}}歩
⏰ 活動時間: {{activeHours}}時間
{{moodEmoji}} 気分の傾向: {{moodTrend}}

🏥 健康リスク:
　総合: {{overallRisk}}
　転倒リスク: {{fallRisk}}
　フレイル: {{frailtyRisk}}
　メンタル: {{mentalRisk}}

{{achievementsSection}}
{{concernsSection}}
{{recommendationsSection}}

🏠 MiraiCareより`,
    variables: [
      'userName', 'startDate', 'endDate', 'averageSteps', 'activeHours',
      'moodEmoji', 'moodTrend', 'overallRisk', 'fallRisk', 'frailtyRisk',
      'mentalRisk', 'achievementsSection', 'concernsSection', 'recommendationsSection'
    ]
  };

  /**
   * 緊急アラートテンプレート
   */
  static readonly EMERGENCY_TEMPLATES: Record<string, NotificationTemplate> = {
    high_risk: {
      id: 'emergency_high_risk',
      type: 'emergency_alert',
      title: '健康リスクアラート',
      message: `🚨 {{userName}}さんの健康リスクアラート

リスクタイプ: {{riskType}}
重要度: {{severity}}
詳細: {{message}}

{{urgencyMessage}}

🏠 MiraiCareより`,
      variables: ['userName', 'riskType', 'severity', 'message', 'urgencyMessage']
    },
    low_mood: {
      id: 'emergency_low_mood',
      type: 'emergency_alert',
      title: '気分アラート',
      message: `😟 {{userName}}さんの気分アラート

気分レベル: {{moodLevel}}/5
継続期間: {{duration}}
詳細: {{message}}

{{supportMessage}}

🏠 MiraiCareより`,
      variables: ['userName', 'moodLevel', 'duration', 'message', 'supportMessage']
    },
    no_activity: {
      id: 'emergency_no_activity',
      type: 'emergency_alert',
      title: '活動量アラート',
      message: `⚠️ {{userName}}さんの活動量アラート

活動レベル: {{activityLevel}}
最終活動: {{lastActivity}}
詳細: {{message}}

{{checkMessage}}

🏠 MiraiCareより`,
      variables: ['userName', 'activityLevel', 'lastActivity', 'message', 'checkMessage']
    },
    vital_abnormal: {
      id: 'emergency_vital_abnormal',
      type: 'emergency_alert',
      title: 'バイタルサインアラート',
      message: `🩺 {{userName}}さんのバイタルサインアラート

測定項目: {{vitalType}}
測定値: {{vitalValue}}
正常範囲: {{normalRange}}
詳細: {{message}}

{{actionMessage}}

🏠 MiraiCareより`,
      variables: ['userName', 'vitalType', 'vitalValue', 'normalRange', 'message', 'actionMessage']
    }
  };

  /**
   * 週次レポートメッセージを生成
   * @param report 週次レポートデータ
   * @param userName ユーザー名
   * @returns フォーマットされたメッセージ
   */
  static formatWeeklyReport(report: WeeklyReport, userName: string): string {
    const template = this.WEEKLY_REPORT_TEMPLATE.message;
    const { data } = report;

    // 日付フォーマット
    const startDate = new Date(report.weekStartDate).toLocaleDateString('ja-JP');
    const endDate = new Date(report.weekEndDate).toLocaleDateString('ja-JP');

    // 気分の絵文字
    const moodEmoji = this.getMoodEmoji(data.moodTrend);

    // リスクレベルテキスト
    const riskTexts = {
      overallRisk: this.getRiskLevelText(data.riskScores.overall),
      fallRisk: this.getRiskLevelText(data.riskScores.fallRisk),
      frailtyRisk: this.getRiskLevelText(data.riskScores.frailtyRisk),
      mentalRisk: this.getRiskLevelText(data.riskScores.mentalHealthRisk),
    };

    // セクション生成
    const achievementsSection = this.formatAchievementsSection(data.achievements);
    const concernsSection = this.formatConcernsSection(data.concerns);
    const recommendationsSection = this.formatRecommendationsSection(data.recommendations);

    // テンプレート変数置換
    return template
      .replace('{{userName}}', userName)
      .replace('{{startDate}}', startDate)
      .replace('{{endDate}}', endDate)
      .replace('{{averageSteps}}', data.averageSteps.toLocaleString())
      .replace('{{activeHours}}', data.totalActiveHours.toString())
      .replace('{{moodEmoji}}', moodEmoji)
      .replace('{{moodTrend}}', this.getMoodTrendText(data.moodTrend))
      .replace('{{overallRisk}}', riskTexts.overallRisk)
      .replace('{{fallRisk}}', riskTexts.fallRisk)
      .replace('{{frailtyRisk}}', riskTexts.frailtyRisk)
      .replace('{{mentalRisk}}', riskTexts.mentalRisk)
      .replace('{{achievementsSection}}', achievementsSection)
      .replace('{{concernsSection}}', concernsSection)
      .replace('{{recommendationsSection}}', recommendationsSection);
  }

  /**
   * 緊急アラートメッセージを生成
   * @param alert 緊急アラートデータ
   * @param userName ユーザー名
   * @returns フォーマットされたメッセージ
   */
  static formatEmergencyAlert(alert: EmergencyAlert, userName: string): string {
    const template = this.EMERGENCY_TEMPLATES[alert.type];
    if (!template) {
      return this.formatGenericAlert(alert, userName);
    }

    let message = template.message;

    // 基本変数
    message = message
      .replace('{{userName}}', userName)
      .replace('{{message}}', alert.message);

    // アラート種別に応じた特殊処理
    switch (alert.type) {
      case 'high_risk':
        message = message
          .replace('{{riskType}}', this.getRiskTypeText(alert.type))
          .replace('{{severity}}', this.getSeverityText(alert.severity))
          .replace('{{urgencyMessage}}', this.getUrgencyMessage(alert.severity));
        break;

      case 'low_mood':
        const moodData = alert.data as any;
        message = message
          .replace('{{moodLevel}}', moodData?.intensity?.toString() || '不明')
          .replace('{{duration}}', this.calculateMoodDuration(moodData))
          .replace('{{supportMessage}}', this.getSupportMessage());
        break;

      case 'no_activity':
        const activityData = alert.data as any;
        message = message
          .replace('{{activityLevel}}', this.getActivityLevelText(activityData))
          .replace('{{lastActivity}}', this.formatLastActivity(activityData))
          .replace('{{checkMessage}}', this.getCheckMessage());
        break;

      case 'vital_abnormal':
        const vitalData = alert.data as any;
        message = message
          .replace('{{vitalType}}', this.getVitalTypeText(vitalData?.type))
          .replace('{{vitalValue}}', `${vitalData?.value || '不明'}${vitalData?.unit || ''}`)
          .replace('{{normalRange}}', this.getNormalRange(vitalData?.type))
          .replace('{{actionMessage}}', this.getActionMessage(alert.severity));
        break;
    }

    return message;
  }

  /**
   * 達成セクションをフォーマット
   */
  private static formatAchievementsSection(achievements: any[]): string {
    if (achievements.length === 0) return '';

    let section = '🏆 今週の達成:\n';
    achievements.forEach(badge => {
      section += `　・${badge.name}\n`;
    });
    return section + '\n';
  }

  /**
   * 気になる点セクションをフォーマット
   */
  private static formatConcernsSection(concerns: string[]): string {
    if (concerns.length === 0) return '';

    let section = '⚠️ 気になる点:\n';
    concerns.forEach(concern => {
      section += `　・${concern}\n`;
    });
    return section + '\n';
  }

  /**
   * 推奨事項セクションをフォーマット
   */
  private static formatRecommendationsSection(recommendations: string[]): string {
    if (recommendations.length === 0) return '';

    let section = '💡 推奨事項:\n';
    recommendations.forEach(recommendation => {
      section += `　・${recommendation}\n`;
    });
    return section;
  }

  /**
   * 気分の絵文字を取得
   */
  private static getMoodEmoji(trend: 'improving' | 'stable' | 'declining'): string {
    const emojiMap = {
      improving: '😊',
      stable: '😐',
      declining: '😟'
    };
    return emojiMap[trend] || '😐';
  }

  /**
   * 気分傾向のテキストを取得
   */
  private static getMoodTrendText(trend: 'improving' | 'stable' | 'declining'): string {
    const textMap = {
      improving: '改善中',
      stable: '安定',
      declining: '低下傾向'
    };
    return textMap[trend] || '不明';
  }

  /**
   * リスクレベルのテキストを取得
   */
  private static getRiskLevelText(level: 'low' | 'medium' | 'high'): string {
    const textMap = {
      low: '低',
      medium: '中',
      high: '高'
    };
    return textMap[level] || '不明';
  }

  /**
   * 重要度のテキストを取得
   */
  private static getSeverityText(severity: 'low' | 'medium' | 'high' | 'critical'): string {
    const textMap = {
      low: '軽微',
      medium: '注意',
      high: '重要',
      critical: '緊急'
    };
    return textMap[severity] || '不明';
  }

  /**
   * 汎用アラートメッセージを生成
   */
  private static formatGenericAlert(alert: EmergencyAlert, userName: string): string {
    const severityEmoji = {
      critical: '🚨',
      high: '⚠️',
      medium: '⚡',
      low: 'ℹ️'
    }[alert.severity] || '⚠️';

    return `${severityEmoji} ${userName}さんの状況アラート

種類: ${this.getRiskTypeText(alert.type)}
重要度: ${this.getSeverityText(alert.severity)}
詳細: ${alert.message}

🏠 MiraiCareより`;
  }

  /**
   * リスクタイプのテキストを取得
   */
  private static getRiskTypeText(type: string): string {
    const typeMap: { [key: string]: string } = {
      high_risk: '健康リスク上昇',
      low_mood: '気分の落ち込み',
      no_activity: '活動量低下',
      vital_abnormal: 'バイタル異常'
    };
    return typeMap[type] || type;
  }

  /**
   * 緊急度メッセージを取得
   */
  private static getUrgencyMessage(severity: string): string {
    if (severity === 'critical' || severity === 'high') {
      return '早めの確認をお勧めします。';
    }
    return '様子を見守ってください。';
  }

  /**
   * サポートメッセージを取得
   */
  private static getSupportMessage(): string {
    return '声をかけたり、一緒に過ごす時間を作ってみてください。';
  }

  /**
   * チェックメッセージを取得
   */
  private static getCheckMessage(): string {
    return '様子を確認してみてください。';
  }

  /**
   * アクションメッセージを取得
   */
  private static getActionMessage(severity: string): string {
    if (severity === 'critical') {
      return '医療機関への相談を検討してください。';
    } else if (severity === 'high') {
      return '継続して様子を見守ってください。';
    }
    return '経過を観察してください。';
  }

  /**
   * 気分継続期間を計算（簡易実装）
   */
  private static calculateMoodDuration(moodData: any): string {
    return '数日間'; // 実際の実装では過去データと比較
  }

  /**
   * 活動レベルテキストを取得
   */
  private static getActivityLevelText(activityData: any): string {
    return '低下'; // 実際の実装では活動データを分析
  }

  /**
   * 最終活動時刻をフォーマット
   */
  private static formatLastActivity(activityData: any): string {
    return '今朝'; // 実際の実装では最終活動時刻を計算
  }

  /**
   * バイタルタイプのテキストを取得
   */
  private static getVitalTypeText(type?: string): string {
    const typeMap: { [key: string]: string } = {
      heart_rate: '心拍数',
      blood_pressure: '血圧',
      steps: '歩数'
    };
    return typeMap[type || ''] || '不明';
  }

  /**
   * 正常範囲を取得
   */
  private static getNormalRange(type?: string): string {
    const rangeMap: { [key: string]: string } = {
      heart_rate: '60-100bpm',
      blood_pressure: '120/80mmHg以下',
      steps: '5000歩以上'
    };
    return rangeMap[type || ''] || '医師にご相談ください';
  }

  /**
   * カスタムテンプレートを作成
   * @param type テンプレートタイプ
   * @param title タイトル
   * @param message メッセージテンプレート
   * @param variables 変数リスト
   * @returns 新しいテンプレート
   */
  static createCustomTemplate(
    type: 'weekly_report' | 'emergency_alert' | 'risk_alert',
    title: string,
    message: string,
    variables: string[]
  ): NotificationTemplate {
    return {
      id: `custom_${type}_${Date.now()}`,
      type,
      title,
      message,
      variables
    };
  }

  /**
   * テンプレート変数を置換
   * @param template テンプレート文字列
   * @param variables 変数オブジェクト
   * @returns 置換後の文字列
   */
  static replaceVariables(
    template: string,
    variables: { [key: string]: string }
  ): string {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value);
    });
    return result;
  }
}