import { riskAlertService } from '../../src/services/riskAlertService';
import { OverallRiskAssessment, RiskLevel } from '../../src/types';
import * as Notifications from 'expo-notifications';

// モックの設定
jest.mock('../../src/services/notificationService', () => ({
  notificationService: {
    scheduleNotification: jest.fn(),
    setupNotificationListeners: jest.fn(),
  }
}));

jest.mock('../../src/services/firestoreService', () => ({
  firestoreService: {
    getUserSettings: jest.fn(),
    saveNotificationHistory: jest.fn(),
  }
}));

jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn(),
}));

// モックされたモジュールのインポート
const { notificationService } = require('../../src/services/notificationService');
const { firestoreService } = require('../../src/services/firestoreService');

describe('RiskAlertService', () => {
  const mockUserId = 'test-user-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
    // デフォルトのモック実装
    notificationService.scheduleNotification.mockResolvedValue('notification-id');
    
    firestoreService.getUserSettings.mockResolvedValue({
      notifications: {
        enabled: true,
        hydrationReminder: true,
        medicationReminder: true,
        dailyReport: true,
        riskAlerts: true,
      }
    });
    
    firestoreService.saveNotificationHistory.mockResolvedValue(true);
  });

  describe('checkAndSendRiskAlerts', () => {
    const createMockRiskAssessment = (overallLevel: RiskLevel): OverallRiskAssessment => ({
      userId: mockUserId,
      assessmentDate: new Date().toISOString(),
      overallRiskLevel: overallLevel,
      overallRiskScore: overallLevel === 'high' ? 70 : overallLevel === 'medium' ? 40 : 20,
      priorityRisks: [],
      recommendations: [],
      fallRisk: {
        type: 'fall',
        level: overallLevel,
        score: 50,
        factors: [],
        lastUpdated: new Date().toISOString(),
        indicators: {
          stepDecline: false,
          irregularPattern: false,
          lowActivity: false,
          consistencyScore: 0.8,
        },
      },
      frailtyRisk: {
        type: 'frailty',
        level: 'low',
        score: 20,
        factors: [],
        lastUpdated: new Date().toISOString(),
        indicators: {
          weeklyAverage: 5000,
          monthlyTrend: 0,
          activeDays: 6,
          stepTarget: 5000,
        },
      },
      mentalHealthRisk: {
        type: 'mentalHealth',
        level: 'low',
        score: 20,
        factors: [],
        lastUpdated: new Date().toISOString(),
        indicators: {
          moodScore: 70,
          appEngagement: 5,
          lastMoodUpdate: new Date().toISOString(),
        },
      },
    });

    it('高リスクの場合、緊急通知を送信する', async () => {
      const highRiskAssessment = createMockRiskAssessment('high');
      
      await riskAlertService.checkAndSendRiskAlerts(mockUserId, highRiskAssessment);
      
      expect(notificationService.scheduleNotification).toHaveBeenCalledWith({
        title: '⚠️ 健康リスクアラート',
        body: '健康状態に注意が必要です。詳細を確認してください。',
        data: { 
          type: 'risk-alert',
          userId: mockUserId,
          riskLevel: 'high',
          assessmentId: expect.any(String),
        },
        priority: 'high',
        trigger: null, // 即座に送信
      });
    });

    it('中リスクの場合、注意喚起通知を送信する', async () => {
      const mediumRiskAssessment = createMockRiskAssessment('medium');
      
      await riskAlertService.checkAndSendRiskAlerts(mockUserId, mediumRiskAssessment);
      
      expect(notificationService.scheduleNotification).toHaveBeenCalledWith({
        title: '📊 健康状態の確認',
        body: '健康指標に変化が見られます。アプリで詳細をご確認ください。',
        data: { 
          type: 'risk-alert',
          userId: mockUserId,
          riskLevel: 'medium',
          assessmentId: expect.any(String),
        },
        priority: 'default',
        trigger: null,
      });
    });

    it('低リスクの場合、通知を送信しない', async () => {
      const lowRiskAssessment = createMockRiskAssessment('low');
      
      await riskAlertService.checkAndSendRiskAlerts(mockUserId, lowRiskAssessment);
      
      expect(notificationService.scheduleNotification).not.toHaveBeenCalled();
    });

    it('通知が無効の場合、通知を送信しない', async () => {
      firestoreService.getUserSettings.mockResolvedValue({
        notifications: {
          enabled: false,
          riskAlerts: true,
        }
      });
      
      const highRiskAssessment = createMockRiskAssessment('high');
      
      await riskAlertService.checkAndSendRiskAlerts(mockUserId, highRiskAssessment);
      
      expect(notificationService.scheduleNotification).not.toHaveBeenCalled();
    });

    it('リスクアラートが無効の場合、通知を送信しない', async () => {
      firestoreService.getUserSettings.mockResolvedValue({
        notifications: {
          enabled: true,
          riskAlerts: false,
        }
      });
      
      const highRiskAssessment = createMockRiskAssessment('high');
      
      await riskAlertService.checkAndSendRiskAlerts(mockUserId, highRiskAssessment);
      
      expect(notificationService.scheduleNotification).not.toHaveBeenCalled();
    });

    it('通知履歴を保存する', async () => {
      const highRiskAssessment = createMockRiskAssessment('high');
      const notificationId = 'test-notification-123';
      notificationService.scheduleNotification.mockResolvedValue(notificationId);
      
      await riskAlertService.checkAndSendRiskAlerts(mockUserId, highRiskAssessment);
      
      expect(firestoreService.saveNotificationHistory).toHaveBeenCalledWith({
        userId: mockUserId,
        notificationId,
        type: 'risk-alert',
        riskLevel: 'high',
        sentAt: expect.any(String),
        assessment: highRiskAssessment,
      });
    });
  });

  describe('getSpecificRiskAlerts', () => {
    it('転倒リスクが高い場合、特定のアラートメッセージを返す', () => {
      const assessment: OverallRiskAssessment = createMockRiskAssessment('high');
      assessment.fallRisk.level = 'high';
      assessment.fallRisk.indicators.stepDecline = true;
      
      const alerts = riskAlertService.getSpecificRiskAlerts(assessment);
      
      expect(alerts).toContain('歩数の急激な減少が検出されました。転倒リスクにご注意ください。');
    });

    it('フレイルリスクが高い場合、特定のアラートメッセージを返す', () => {
      const assessment: OverallRiskAssessment = createMockRiskAssessment('high');
      assessment.frailtyRisk.level = 'high';
      assessment.frailtyRisk.indicators.weeklyAverage = 2000;
      
      const alerts = riskAlertService.getSpecificRiskAlerts(assessment);
      
      expect(alerts).toContain('活動量が低下しています。適度な運動を心がけましょう。');
    });

    it('メンタルヘルスリスクが高い場合、特定のアラートメッセージを返す', () => {
      const assessment: OverallRiskAssessment = createMockRiskAssessment('high');
      assessment.mentalHealthRisk.level = 'high';
      assessment.mentalHealthRisk.indicators.moodScore = 30;
      
      const alerts = riskAlertService.getSpecificRiskAlerts(assessment);
      
      expect(alerts).toContain('気分の低下が続いています。必要に応じて専門家にご相談ください。');
    });
  });

  describe('schedulePeriodicRiskCheck', () => {
    it('定期的なリスクチェックをスケジュールする', async () => {
      await riskAlertService.schedulePeriodicRiskCheck(mockUserId);
      
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: '📋 定期健康チェック',
          body: '健康状態を確認しましょう',
          data: { type: 'periodic-check', userId: mockUserId },
        },
        trigger: {
          hour: 10,
          minute: 0,
          repeats: true,
        },
      });
    });
  });

  const createMockRiskAssessment = (overallLevel: RiskLevel): OverallRiskAssessment => ({
    userId: mockUserId,
    assessmentDate: new Date().toISOString(),
    overallRiskLevel: overallLevel,
    overallRiskScore: overallLevel === 'high' ? 70 : overallLevel === 'medium' ? 40 : 20,
    priorityRisks: [],
    recommendations: [],
    fallRisk: {
      type: 'fall',
      level: overallLevel,
      score: 50,
      factors: [],
      lastUpdated: new Date().toISOString(),
      indicators: {
        stepDecline: false,
        irregularPattern: false,
        lowActivity: false,
        consistencyScore: 0.8,
      },
    },
    frailtyRisk: {
      type: 'frailty',
      level: 'low',
      score: 20,
      factors: [],
      lastUpdated: new Date().toISOString(),
      indicators: {
        weeklyAverage: 5000,
        monthlyTrend: 0,
        activeDays: 6,
        stepTarget: 5000,
      },
    },
    mentalHealthRisk: {
      type: 'mentalHealth',
      level: 'low',
      score: 20,
      factors: [],
      lastUpdated: new Date().toISOString(),
      indicators: {
        moodScore: 70,
        appEngagement: 5,
        lastMoodUpdate: new Date().toISOString(),
      },
    },
  });
});