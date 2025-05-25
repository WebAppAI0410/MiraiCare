import axios from 'axios';
import { LineNotifyConfig, EmergencyAlert, WeeklyReport } from '../types';

/**
 * LINE Notify API連携サービス
 * 家族への通知とレポート送信を管理
 */
export class LineNotifyService {
  private static readonly BASE_URL = 'https://notify-api.line.me/api';
  private static readonly NOTIFY_ENDPOINT = '/notify';

  /**
   * LINE Notifyトークンの有効性を確認
   * @param token LINE Notifyトークン
   * @returns トークンが有効かどうか
   */
  static async validateToken(token: string): Promise<boolean> {
    try {
      const response = await axios.get(`${this.BASE_URL}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.data.status === 200;
    } catch (error) {
      console.error('LINE Notifyトークン検証エラー:', error);
      return false;
    }
  }

  /**
   * LINE Notifyでメッセージを送信
   * @param token LINE Notifyトークン
   * @param message 送信するメッセージ
   * @param imageUrl 添付する画像のURL（オプション）
   * @returns 送信成功かどうか
   */
  static async sendNotification(
    token: string,
    message: string,
    imageUrl?: string
  ): Promise<boolean> {
    try {
      const data = new URLSearchParams();
      data.append('message', message);
      
      if (imageUrl) {
        data.append('imageThumbnail', imageUrl);
        data.append('imageFullsize', imageUrl);
      }

      const response = await axios.post(
        `${this.BASE_URL}${this.NOTIFY_ENDPOINT}`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      return response.data.status === 200;
    } catch (error) {
      console.error('LINE Notify送信エラー:', error);
      return false;
    }
  }

  /**
   * 週次レポートを家族に送信
   * @param config LINE Notify設定
   * @param report 週次レポートデータ
   * @param userName ユーザー名
   * @returns 送信成功かどうか
   */
  static async sendWeeklyReport(
    config: LineNotifyConfig,
    report: WeeklyReport,
    userName: string
  ): Promise<boolean> {
    if (!config.enabled || !config.token) {
      return false;
    }

    const message = this.formatWeeklyReportMessage(report, userName);
    return await this.sendNotification(config.token, message);
  }

  /**
   * 緊急アラートを家族に送信
   * @param config LINE Notify設定
   * @param alert 緊急アラートデータ
   * @param userName ユーザー名
   * @returns 送信成功かどうか
   */
  static async sendEmergencyAlert(
    config: LineNotifyConfig,
    alert: EmergencyAlert,
    userName: string
  ): Promise<boolean> {
    if (!config.enabled || !config.emergencyAlerts || !config.token) {
      return false;
    }

    // リスクレベルに応じた閾値チェック
    if (!this.shouldSendAlert(config, alert.severity)) {
      return false;
    }

    const message = this.formatEmergencyAlertMessage(alert, userName);
    return await this.sendNotification(config.token, message);
  }

  /**
   * リスクアラートを送信するかどうか判定
   * @param config LINE Notify設定
   * @param severity アラートの重要度
   * @returns 送信するかどうか
   */
  private static shouldSendAlert(
    config: LineNotifyConfig,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): boolean {
    switch (severity) {
      case 'critical':
        return true; // 最重要は常に送信
      case 'high':
        return config.riskThresholds.high;
      case 'medium':
        return config.riskThresholds.medium;
      case 'low':
        return config.riskThresholds.low;
      default:
        return false;
    }
  }

  /**
   * 週次レポートメッセージをフォーマット
   * @param report 週次レポートデータ
   * @param userName ユーザー名
   * @returns フォーマットされたメッセージ
   */
  private static formatWeeklyReportMessage(
    report: WeeklyReport,
    userName: string
  ): string {
    const { data } = report;
    const startDate = new Date(report.weekStartDate).toLocaleDateString('ja-JP');
    const endDate = new Date(report.weekEndDate).toLocaleDateString('ja-JP');

    let message = `📊 ${userName}さんの週次レポート\n`;
    message += `期間: ${startDate} - ${endDate}\n\n`;

    // 活動データ
    message += `🚶‍♂️ 平均歩数: ${data.averageSteps.toLocaleString()}歩\n`;
    message += `⏰ 活動時間: ${data.totalActiveHours}時間\n`;

    // 気分の傾向
    const moodEmoji = {
      improving: '😊',
      stable: '😐',
      declining: '😟'
    }[data.moodTrend];
    message += `${moodEmoji} 気分の傾向: ${this.getMoodTrendText(data.moodTrend)}\n\n`;

    // リスクスコア
    message += `🏥 健康リスク:\n`;
    message += `　総合: ${this.getRiskLevelText(data.riskScores.overall)}\n`;
    message += `　転倒リスク: ${this.getRiskLevelText(data.riskScores.fallRisk)}\n`;
    message += `　フレイル: ${this.getRiskLevelText(data.riskScores.frailtyRisk)}\n`;
    message += `　メンタル: ${this.getRiskLevelText(data.riskScores.mentalHealthRisk)}\n\n`;

    // 達成したバッジ
    if (data.achievements.length > 0) {
      message += `🏆 今週の達成:\n`;
      data.achievements.forEach(badge => {
        message += `　・${badge.name}\n`;
      });
      message += '\n';
    }

    // 気になる点
    if (data.concerns.length > 0) {
      message += `⚠️ 気になる点:\n`;
      data.concerns.forEach(concern => {
        message += `　・${concern}\n`;
      });
      message += '\n';
    }

    // 推奨事項
    if (data.recommendations.length > 0) {
      message += `💡 推奨事項:\n`;
      data.recommendations.forEach(recommendation => {
        message += `　・${recommendation}\n`;
      });
    }

    message += '\n🏠 MiraiCareより';
    return message;
  }

  /**
   * 緊急アラートメッセージをフォーマット
   * @param alert 緊急アラートデータ
   * @param userName ユーザー名
   * @returns フォーマットされたメッセージ
   */
  private static formatEmergencyAlertMessage(
    alert: EmergencyAlert,
    userName: string
  ): string {
    const severityEmoji = {
      critical: '🚨',
      high: '⚠️',
      medium: '⚡',
      low: 'ℹ️'
    }[alert.severity];

    const typeText = {
      high_risk: '健康リスク上昇',
      low_mood: '気分の落ち込み',
      no_activity: '活動量低下',
      vital_abnormal: 'バイタル異常'
    }[alert.type];

    let message = `${severityEmoji} ${userName}さんの状況アラート\n\n`;
    message += `種類: ${typeText}\n`;
    message += `重要度: ${this.getSeverityText(alert.severity)}\n`;
    message += `詳細: ${alert.message}\n\n`;

    if (alert.severity === 'critical' || alert.severity === 'high') {
      message += '早めの確認をお勧めします。\n\n';
    }

    message += '🏠 MiraiCareより';
    return message;
  }

  /**
   * 気分傾向のテキストを取得
   * @param trend 気分傾向
   * @returns 日本語テキスト
   */
  private static getMoodTrendText(trend: 'improving' | 'stable' | 'declining'): string {
    switch (trend) {
      case 'improving':
        return '改善中';
      case 'stable':
        return '安定';
      case 'declining':
        return '低下傾向';
      default:
        return '不明';
    }
  }

  /**
   * リスクレベルのテキストを取得
   * @param level リスクレベル
   * @returns 日本語テキスト
   */
  private static getRiskLevelText(level: 'low' | 'medium' | 'high'): string {
    switch (level) {
      case 'low':
        return '低';
      case 'medium':
        return '中';
      case 'high':
        return '高';
      default:
        return '不明';
    }
  }

  /**
   * 重要度のテキストを取得
   * @param severity 重要度
   * @returns 日本語テキスト
   */
  private static getSeverityText(severity: 'low' | 'medium' | 'high' | 'critical'): string {
    switch (severity) {
      case 'low':
        return '軽微';
      case 'medium':
        return '注意';
      case 'high':
        return '重要';
      case 'critical':
        return '緊急';
      default:
        return '不明';
    }
  }
}