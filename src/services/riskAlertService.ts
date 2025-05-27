import { OverallRiskAssessment, RiskLevel } from '../types';
import { notificationService } from './notificationService';
import { firestoreService } from './firestoreService';
import * as Notifications from 'expo-notifications';

interface RiskAlertConfig {
  title: string;
  body: string;
  priority: Notifications.AndroidNotificationPriority;
}

class RiskAlertService {
  private readonly riskAlertConfigs: Record<RiskLevel, RiskAlertConfig | null> = {
    high: {
      title: '⚠️ 健康リスクアラート',
      body: '健康状態に注意が必要です。詳細を確認してください。',
      priority: 'high' as Notifications.AndroidNotificationPriority,
    },
    medium: {
      title: '📊 健康状態の確認',
      body: '健康指標に変化が見られます。アプリで詳細をご確認ください。',
      priority: 'default' as Notifications.AndroidNotificationPriority,
    },
    low: null, // 低リスクでは通知しない
  };

  /**
   * リスク評価に基づいて適切なアラート通知を送信
   */
  async checkAndSendRiskAlerts(
    userId: string,
    assessment: OverallRiskAssessment
  ): Promise<void> {
    try {
      // ユーザー設定を確認
      const userSettings = await firestoreService.getUserSettings(userId);
      
      if (!userSettings?.notifications?.enabled || !userSettings?.notifications?.riskAlerts) {
        console.log('Risk alerts are disabled for user:', userId);
        return;
      }

      const config = this.riskAlertConfigs[assessment.overallRiskLevel];
      
      if (!config) {
        // 低リスクの場合は通知しない
        return;
      }

      // 通知を送信
      const notificationId = await notificationService.scheduleNotification({
        title: config.title,
        body: config.body,
        data: {
          type: 'risk-alert',
          userId,
          riskLevel: assessment.overallRiskLevel,
          assessmentId: assessment.assessmentDate,
        },
        priority: config.priority,
        trigger: null, // 即座に送信
      });

      // 通知履歴を保存
      if (notificationId) {
        await firestoreService.saveNotificationHistory({
          userId,
          notificationId,
          type: 'risk-alert',
          riskLevel: assessment.overallRiskLevel,
          sentAt: new Date().toISOString(),
          assessment,
        });
      }
    } catch (error) {
      console.error('Failed to send risk alert:', error);
    }
  }

  /**
   * 特定のリスクに基づいた詳細なアラートメッセージを生成
   */
  getSpecificRiskAlerts(assessment: OverallRiskAssessment): string[] {
    const alerts: string[] = [];

    // 転倒リスクのアラート
    if (assessment.fallRisk.level === 'high') {
      if (assessment.fallRisk.indicators.stepDecline) {
        alerts.push('歩数の急激な減少が検出されました。転倒リスクにご注意ください。');
      }
      if (assessment.fallRisk.indicators.irregularPattern) {
        alerts.push('活動パターンが不規則です。規則正しい生活を心がけましょう。');
      }
    }

    // フレイルリスクのアラート
    if (assessment.frailtyRisk.level === 'high') {
      if (assessment.frailtyRisk.indicators.weeklyAverage < 3000) {
        alerts.push('活動量が低下しています。適度な運動を心がけましょう。');
      }
      if (assessment.frailtyRisk.indicators.activeDays < 4) {
        alerts.push('活動日数が少なくなっています。毎日少しずつでも体を動かしましょう。');
      }
    }

    // メンタルヘルスリスクのアラート
    if (assessment.mentalHealthRisk.level === 'high') {
      if (assessment.mentalHealthRisk.indicators.moodScore < 40) {
        alerts.push('気分の低下が続いています。必要に応じて専門家にご相談ください。');
      }
      if (assessment.mentalHealthRisk.indicators.appEngagement < 2) {
        alerts.push('アプリの利用が減っています。健康管理を継続しましょう。');
      }
    }

    return alerts;
  }

  /**
   * 定期的なリスクチェックをスケジュール
   */
  async schedulePeriodicRiskCheck(userId: string): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📋 定期健康チェック',
          body: '健康状態を確認しましょう',
          data: { type: 'periodic-check', userId },
        },
        trigger: {
          hour: 10,
          minute: 0,
          repeats: true,
        },
      });
    } catch (error) {
      console.error('Failed to schedule periodic risk check:', error);
    }
  }

  /**
   * リスクレベルの変化を検出して通知
   */
  async notifyRiskLevelChange(
    userId: string,
    previousLevel: RiskLevel,
    currentLevel: RiskLevel
  ): Promise<void> {
    const levelPriority: Record<RiskLevel, number> = {
      high: 3,
      medium: 2,
      low: 1,
    };

    // リスクレベルが上昇した場合のみ通知
    if (levelPriority[currentLevel] > levelPriority[previousLevel]) {
      const title = currentLevel === 'high' 
        ? '⚠️ リスクレベルが上昇しました'
        : '📈 健康指標に変化があります';
      
      const body = `リスクレベルが「${this.getRiskLevelText(previousLevel)}」から「${this.getRiskLevelText(currentLevel)}」に変化しました。`;

      await notificationService.scheduleNotification({
        title,
        body,
        data: {
          type: 'risk-level-change',
          userId,
          previousLevel,
          currentLevel,
        },
        priority: currentLevel === 'high' ? 'high' : 'default',
        trigger: null,
      });
    }
  }

  /**
   * リスクレベルの日本語表記を取得
   */
  private getRiskLevelText(level: RiskLevel): string {
    const levelTexts: Record<RiskLevel, string> = {
      high: '高',
      medium: '中',
      low: '低',
    };
    return levelTexts[level];
  }
}

export const riskAlertService = new RiskAlertService();