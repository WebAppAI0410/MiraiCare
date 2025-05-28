import { reportService } from '../../src/services/reportService';
import { firestoreService } from '../../src/services/firestoreService';
import { StepData, MoodData, OverallRiskAssessment } from '../../src/types';

// モックの設定
jest.mock('../../src/services/firestoreService', () => ({
  firestoreService: {
    getStepHistory: jest.fn(),
    getUserMoodHistory: jest.fn(),
    getRiskAssessmentHistory: jest.fn(),
    getUserSettings: jest.fn(),
  }
}));

// react-native-html-to-pdfのモック
jest.mock('react-native-html-to-pdf', () => ({
  convert: jest.fn().mockResolvedValue({ filePath: '/path/to/report.pdf' }),
}));

const { firestoreService: mockFirestoreService } = require('../../src/services/firestoreService');

describe('ReportService', () => {
  const mockUserId = 'test-user-123';
  const mockDate = new Date('2024-01-15');

  beforeEach(() => {
    jest.clearAllMocks();
    jest.setSystemTime(mockDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('generateMonthlyReport', () => {
    const mockStepData: StepData[] = [
      { date: '2024-01-01', steps: 5000, userId: mockUserId },
      { date: '2024-01-02', steps: 7000, userId: mockUserId },
      { date: '2024-01-03', steps: 6000, userId: mockUserId },
      { date: '2024-01-04', steps: 8000, userId: mockUserId },
      { date: '2024-01-05', steps: 4000, userId: mockUserId },
    ];

    const mockMoodData: MoodData[] = [
      { id: '1', userId: mockUserId, mood: 80, energy: 70, createdAt: '2024-01-01T10:00:00Z', note: 'Good' },
      { id: '2', userId: mockUserId, mood: 60, energy: 50, createdAt: '2024-01-03T10:00:00Z', note: 'OK' },
      { id: '3', userId: mockUserId, mood: 90, energy: 85, createdAt: '2024-01-05T10:00:00Z', note: 'Great' },
    ];

    const mockRiskAssessment: OverallRiskAssessment = {
      userId: mockUserId,
      assessmentDate: '2024-01-15T10:00:00Z',
      overallLevel: 'medium',
      overallRiskLevel: 'medium',
      overallRiskScore: 45,
      priorityRisks: ['fall'],
      recommendations: ['適度な運動を心がけましょう'],
      nextAssessmentDate: '2024-02-15T10:00:00Z',
      fallRisk: {
        type: 'fall',
        level: 'medium',
        score: 45,
        factors: ['歩数の減少'],
        lastUpdated: '2024-01-15T10:00:00Z',
        indicators: {
          stepDecline: true,
          irregularPattern: false,
          lowActivity: false,
          consistencyScore: 0.7,
        },
      },
      frailtyRisk: {
        type: 'frailty',
        level: 'low',
        score: 20,
        factors: [],
        lastUpdated: '2024-01-15T10:00:00Z',
        indicators: {
          weeklyAverage: 6000,
          monthlyTrend: 'stable' as const,
          activeDays: 5,
          activityDays: 5,
          goalAchievementRate: 62.5,
          stepTarget: 8000,
        },
      },
      mentalHealthRisk: {
        type: 'mentalHealth',
        level: 'low',
        score: 25,
        factors: [],
        lastUpdated: '2024-01-15T10:00:00Z',
        indicators: {
          moodScore: 77,
          appEngagement: 3,
          lastMoodUpdate: '2024-01-05T10:00:00Z',
        },
      },
    };

    beforeEach(() => {
      mockFirestoreService.getStepHistory.mockResolvedValue(mockStepData);
      mockFirestoreService.getUserMoodHistory.mockResolvedValue(mockMoodData);
      mockFirestoreService.getRiskAssessmentHistory.mockResolvedValue([mockRiskAssessment]);
      mockFirestoreService.getUserSettings.mockResolvedValue({
        fullName: '山田太郎',
        birthDate: '1950-01-01',
      });
    });

    it('月間レポートを生成する', async () => {
      const report = await reportService.generateMonthlyReport(mockUserId);

      expect(report).toMatchObject({
        userId: mockUserId,
        reportType: 'monthly',
        period: {
          start: expect.any(String),
          end: expect.any(String),
        },
        summary: {
          averageSteps: 6000,
          totalSteps: 30000,
          activeDays: 5,
          averageMood: 77,
          currentRiskLevel: 'medium',
        },
        generatedAt: expect.any(String),
      });
    });

    it('歩数データの統計を正しく計算する', async () => {
      const report = await reportService.generateMonthlyReport(mockUserId);

      expect(report.stepAnalysis).toMatchObject({
        dailyAverage: 6000,
        weeklyTrend: expect.any(String),
        bestDay: { date: '2024-01-04', steps: 8000 },
        worstDay: { date: '2024-01-05', steps: 4000 },
        targetAchievementRate: 20, // 1/5 days achieved 8000 steps
      });
    });

    it('気分データの分析を含む', async () => {
      const report = await reportService.generateMonthlyReport(mockUserId);

      expect(report.moodAnalysis).toMatchObject({
        averageMood: 77,
        moodTrend: expect.any(String),
        highestMood: { date: '2024-01-05', score: 90 },
        lowestMood: { date: '2024-01-03', score: 60 },
      });
    });

    it('リスク評価のサマリーを含む', async () => {
      const report = await reportService.generateMonthlyReport(mockUserId);

      expect(report.riskSummary).toMatchObject({
        currentLevel: 'medium',
        mainConcerns: ['fall'],
        recommendations: ['適度な運動を心がけましょう'],
        riskTrend: expect.any(String),
      });
    });
  });

  describe('generateWeeklyReport', () => {
    it('週間レポートを生成する', async () => {
      const mockWeeklySteps: StepData[] = [
        { date: '2024-01-09', steps: 5000, userId: mockUserId },
        { date: '2024-01-10', steps: 7000, userId: mockUserId },
        { date: '2024-01-11', steps: 6000, userId: mockUserId },
        { date: '2024-01-12', steps: 8000, userId: mockUserId },
        { date: '2024-01-13', steps: 4000, userId: mockUserId },
        { date: '2024-01-14', steps: 9000, userId: mockUserId },
        { date: '2024-01-15', steps: 7500, userId: mockUserId },
      ];

      mockFirestoreService.getStepHistory.mockResolvedValue(mockWeeklySteps);
      mockFirestoreService.getUserMoodHistory.mockResolvedValue([]);
      mockFirestoreService.getRiskAssessmentHistory.mockResolvedValue([]);

      const report = await reportService.generateWeeklyReport(mockUserId);

      expect(report).toMatchObject({
        reportType: 'weekly',
        summary: {
          averageSteps: 6643,
          totalSteps: 46500,
          activeDays: 7,
        },
      });
    });
  });

  describe('exportToPDF', () => {
    it('レポートをPDF形式でエクスポートする', async () => {
      const mockReport = {
        userId: mockUserId,
        reportType: 'monthly' as const,
        period: {
          start: '2024-01-01',
          end: '2024-01-31',
        },
        summary: {
          averageSteps: 6000,
          totalSteps: 180000,
          activeDays: 25,
          averageMood: 75,
          currentRiskLevel: 'low' as const,
        },
        generatedAt: '2024-01-31T23:59:59Z',
      };

      const pdfPath = await reportService.exportToPDF(mockReport);

      expect(pdfPath).toBe('/path/to/report.pdf');
    });
  });

  describe('getReportHistory', () => {
    it('過去のレポート履歴を取得する', async () => {
      const reports = await reportService.getReportHistory(mockUserId);

      expect(Array.isArray(reports)).toBe(true);
      expect(reports.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('formatReportForDisplay', () => {
    it('レポートを表示用にフォーマットする', () => {
      const mockReport = {
        userId: mockUserId,
        reportType: 'monthly' as const,
        period: {
          start: '2024-01-01',
          end: '2024-01-31',
        },
        summary: {
          averageSteps: 6543,
          totalSteps: 202833,
          activeDays: 28,
          averageMood: 78,
          currentRiskLevel: 'low' as const,
        },
        stepAnalysis: {
          dailyAverage: 6543,
          weeklyTrend: 'improving',
          bestDay: { date: '2024-01-15', steps: 12000 },
          worstDay: { date: '2024-01-03', steps: 2000 },
          targetAchievementRate: 45.2,
        },
        generatedAt: '2024-01-31T23:59:59Z',
      };

      const formatted = reportService.formatReportForDisplay(mockReport);

      expect(formatted).toContain('月間レポート');
      expect(formatted).toContain('平均歩数: 6,543歩/日');
      expect(formatted).toContain('総歩数: 202,833歩');
      expect(formatted).toContain('活動日数: 28日');
      expect(formatted).toContain('目標達成率: 45.2%');
    });
  });
});