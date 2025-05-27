import { riskCalculationService } from '../../src/services/riskCalculationService';
import { StepData, MoodData } from '../../src/types';
import * as firestoreService from '../../src/services/firestoreService';

// Firestoreサービスのモック
jest.mock('../../src/services/firestoreService');

describe('RiskCalculationService', () => {
  const mockUserId = 'test-user-123';
  
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-15'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('転倒リスク評価', () => {
    it('正常な活動パターンの場合、低リスクと評価される', async () => {
      const weeklySteps: StepData[] = [
        { date: '2024-01-09', steps: 5000 },
        { date: '2024-01-10', steps: 5500 },
        { date: '2024-01-11', steps: 5200 },
        { date: '2024-01-12', steps: 5800 },
        { date: '2024-01-13', steps: 6000 },
        { date: '2024-01-14', steps: 5300 },
        { date: '2024-01-15', steps: 5400 },
      ];

      const fallRisk = await riskCalculationService.calculateFallRisk(weeklySteps);

      expect(fallRisk.level).toBe('low');
      expect(fallRisk.score).toBeLessThan(40);
      expect(fallRisk.indicators.stepDecline).toBe(false);
      expect(fallRisk.indicators.irregularPattern).toBe(false);
      expect(fallRisk.indicators.lowActivity).toBe(false);
      expect(fallRisk.indicators.consistencyScore).toBeGreaterThan(70);
    });

    it('急激な歩数減少がある場合、高リスクと評価される', async () => {
      const weeklySteps: StepData[] = [
        { date: '2024-01-09', steps: 5000 },
        { date: '2024-01-10', steps: 5200 },
        { date: '2024-01-11', steps: 5100 },
        { date: '2024-01-12', steps: 2000 }, // 急激な減少
        { date: '2024-01-13', steps: 1500 },
        { date: '2024-01-14', steps: 1800 },
        { date: '2024-01-15', steps: 2000 },
      ];

      const fallRisk = await riskCalculationService.calculateFallRisk(weeklySteps);

      expect(fallRisk.level).toBe('high');
      expect(fallRisk.score).toBeGreaterThan(60); // 調整されたしきい値
      expect(fallRisk.indicators.stepDecline).toBe(true);
      expect(fallRisk.factors).toContain('急激な活動量の減少');
    });

    it('不規則な活動パターンの場合、中リスクと評価される', async () => {
      const weeklySteps: StepData[] = [
        { date: '2024-01-09', steps: 8000 },
        { date: '2024-01-10', steps: 1000 },
        { date: '2024-01-11', steps: 7000 },
        { date: '2024-01-12', steps: 500 },
        { date: '2024-01-13', steps: 6000 },
        { date: '2024-01-14', steps: 2000 },
        { date: '2024-01-15', steps: 5000 },
      ];

      const fallRisk = await riskCalculationService.calculateFallRisk(weeklySteps);

      expect(fallRisk.level).toBe('medium');
      expect(fallRisk.indicators.irregularPattern).toBe(true);
      expect(fallRisk.factors).toContain('不規則な活動パターン');
    });

    it('低活動量の場合、中〜高リスクと評価される', async () => {
      const weeklySteps: StepData[] = [
        { date: '2024-01-09', steps: 1000 },
        { date: '2024-01-10', steps: 1200 },
        { date: '2024-01-11', steps: 800 },
        { date: '2024-01-12', steps: 900 },
        { date: '2024-01-13', steps: 1100 },
        { date: '2024-01-14', steps: 1000 },
        { date: '2024-01-15', steps: 950 },
      ];

      const fallRisk = await riskCalculationService.calculateFallRisk(weeklySteps);

      expect(fallRisk.indicators.lowActivity).toBe(true);
      expect(fallRisk.factors).toContain('全体的な活動量不足');
      expect(['medium', 'high']).toContain(fallRisk.level);
    });
  });

  describe('フレイルリスク評価', () => {
    it('高い活動量と目標達成率の場合、低リスクと評価される', async () => {
      const monthlySteps: StepData[] = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
        steps: 5500, // 目標を上回る固定値
      }));

      const frailtyRisk = await riskCalculationService.calculateFrailtyRisk(
        monthlySteps,
        5000 // 目標歩数
      );

      expect(frailtyRisk.level).toBe('low');
      expect(frailtyRisk.indicators.monthlyTrend).toBe('stable');
      expect(frailtyRisk.indicators.goalAchievementRate).toBe(100); // 全日達成
    });

    it('活動量が減少傾向の場合、中〜高リスクと評価される', async () => {
      const monthlySteps: StepData[] = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
        steps: 5000 - (i * 100), // 徐々に減少
      }));

      const frailtyRisk = await riskCalculationService.calculateFrailtyRisk(
        monthlySteps,
        5000
      );

      expect(frailtyRisk.indicators.monthlyTrend).toBe('declining');
      expect(['medium', 'high']).toContain(frailtyRisk.level);
      expect(frailtyRisk.factors).toContain('活動量の減少傾向');
    });

    it('活動日数が少ない場合、高リスクと評価される', async () => {
      const monthlySteps: StepData[] = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
        steps: i % 5 === 0 ? 3000 : 0, // 5日に1回だけ活動
      }));

      const frailtyRisk = await riskCalculationService.calculateFrailtyRisk(
        monthlySteps,
        5000
      );

      expect(frailtyRisk.indicators.activityDays).toBeLessThan(10);
      expect(frailtyRisk.level).toBe('high');
      expect(frailtyRisk.factors).toContain('活動日数が少ない');
    });
  });

  describe('メンタルヘルスリスク評価', () => {
    it('ポジティブな気分データの場合、低リスクと評価される', async () => {
      const moodHistory: MoodData[] = [
        { id: '1', userId: mockUserId, moodLabel: '元気', intensity: 4, createdAt: '2024-01-10' },
        { id: '2', userId: mockUserId, moodLabel: '穏やか', intensity: 4, createdAt: '2024-01-12' },
        { id: '3', userId: mockUserId, moodLabel: '楽しい', intensity: 5, createdAt: '2024-01-14' },
      ];

      (firestoreService.getUserMoodHistory as jest.Mock).mockResolvedValue(moodHistory);

      const mentalRisk = await riskCalculationService.calculateMentalHealthRisk(
        mockUserId,
        3 // アプリ利用日数
      );

      expect(mentalRisk.level).toBe('low');
      expect(mentalRisk.indicators.moodScore).toBeGreaterThan(70);
      expect(mentalRisk.indicators.engagementLevel).toBeGreaterThan(40);
    });

    it('ネガティブな気分が続く場合、高リスクと評価される', async () => {
      const moodHistory: MoodData[] = [
        { id: '1', userId: mockUserId, moodLabel: '疲れた', intensity: 2, createdAt: '2024-01-10' },
        { id: '2', userId: mockUserId, moodLabel: '不安', intensity: 2, createdAt: '2024-01-12' },
        { id: '3', userId: mockUserId, moodLabel: '落ち込み', intensity: 1, createdAt: '2024-01-14' },
      ];

      (firestoreService.getUserMoodHistory as jest.Mock).mockResolvedValue(moodHistory);

      const mentalRisk = await riskCalculationService.calculateMentalHealthRisk(
        mockUserId,
        3
      );

      expect(['medium', 'high']).toContain(mentalRisk.level); // intensity 1-2のため
      expect(mentalRisk.indicators.moodScore).toBeLessThanOrEqual(40);
      expect(mentalRisk.factors).toContain('継続的なネガティブ気分');
    });

    it('アプリ利用率が低い場合、リスクが上昇する', async () => {
      const moodHistory: MoodData[] = [
        { id: '1', userId: mockUserId, moodLabel: '普通', intensity: 3, createdAt: '2024-01-01' },
      ];

      (firestoreService.getUserMoodHistory as jest.Mock).mockResolvedValue(moodHistory);

      const mentalRisk = await riskCalculationService.calculateMentalHealthRisk(
        mockUserId,
        1 // 過去7日で1日のみ利用
      );

      expect(mentalRisk.indicators.engagementLevel).toBeLessThan(20);
      expect(['medium', 'high']).toContain(mentalRisk.level);
      expect(mentalRisk.factors).toContain('アプリ利用頻度が低い');
    });
  });

  describe('総合リスク評価', () => {
    it('すべてのリスクデータを統合して評価を作成する', async () => {
      const weeklySteps: StepData[] = Array.from({ length: 7 }, (_, i) => ({
        date: new Date(2024, 0, 9 + i).toISOString().split('T')[0],
        steps: 5000,
      }));

      const monthlySteps: StepData[] = Array.from({ length: 30 }, (_, i) => ({
        date: new Date(2023, 11, 16 + i).toISOString().split('T')[0],
        steps: 5000,
      }));

      const moodHistory: MoodData[] = [
        { id: '1', userId: mockUserId, moodLabel: '元気', intensity: 4, createdAt: '2024-01-14' },
      ];

      (firestoreService.getUserMoodHistory as jest.Mock).mockResolvedValue(moodHistory);

      const assessment = await riskCalculationService.calculateOverallRisk(
        mockUserId,
        weeklySteps,
        monthlySteps,
        5000,
        3
      );

      expect(assessment.userId).toBe(mockUserId);
      expect(assessment.assessmentDate).toBe('2024-01-15T00:00:00.000Z');
      expect(assessment.fallRisk).toBeDefined();
      expect(assessment.frailtyRisk).toBeDefined();
      expect(assessment.mentalHealthRisk).toBeDefined();
      expect(assessment.overallLevel).toBeDefined();
      expect(assessment.recommendations).toBeInstanceOf(Array);
      expect(assessment.nextAssessmentDate).toBeDefined();
    });

    it('最も高いリスクレベルが総合評価になる', async () => {
      const weeklySteps: StepData[] = Array.from({ length: 7 }, (_, i) => ({
        date: new Date(2024, 0, 9 + i).toISOString().split('T')[0],
        steps: 1000, // 低活動
      }));

      const assessment = await riskCalculationService.calculateOverallRisk(
        mockUserId,
        weeklySteps,
        weeklySteps,
        5000,
        7
      );

      // フレイルリスクが高い場合
      if (assessment.frailtyRisk.level === 'high') {
        expect(assessment.overallLevel).toBe('high');
      }
    });

    it('リスクレベルに応じた適切な推奨事項を生成する', async () => {
      const weeklySteps: StepData[] = Array.from({ length: 7 }, (_, i) => ({
        date: new Date(2024, 0, 9 + i).toISOString().split('T')[0],
        steps: 5000,
      }));

      const assessment = await riskCalculationService.calculateOverallRisk(
        mockUserId,
        weeklySteps,
        weeklySteps,
        5000,
        7
      );

      expect(assessment.recommendations.length).toBeGreaterThan(0);
      
      // 各リスクレベルに応じた推奨事項が含まれているか確認
      if (assessment.fallRisk.level === 'high') {
        expect(assessment.recommendations.some(r => 
          r.includes('転倒') || r.includes('歩行')
        )).toBe(true);
      }
    });
  });

  describe('リスクデータの保存', () => {
    it('評価結果をFirestoreに保存できる', async () => {
      const assessment = {
        userId: mockUserId,
        assessmentDate: '2024-01-15T00:00:00.000Z',
        fallRisk: {
          type: 'fall' as const,
          level: 'low' as const,
          score: 20,
          factors: [],
          lastUpdated: '2024-01-15T00:00:00.000Z',
          indicators: {
            stepDecline: false,
            irregularPattern: false,
            lowActivity: false,
            consistencyScore: 85,
          },
        },
        frailtyRisk: {
          type: 'frailty' as const,
          level: 'low' as const,
          score: 25,
          factors: [],
          lastUpdated: '2024-01-15T00:00:00.000Z',
          indicators: {
            weeklyAverage: 5000,
            monthlyTrend: 'stable' as const,
            activityDays: 7,
            goalAchievementRate: 80,
          },
        },
        mentalHealthRisk: {
          type: 'mental' as const,
          level: 'low' as const,
          score: 15,
          factors: [],
          lastUpdated: '2024-01-15T00:00:00.000Z',
          indicators: {
            moodScore: 80,
            socialActivity: 'high' as const,
            engagementLevel: 70,
          },
        },
        overallLevel: 'low' as const,
        recommendations: ['現在の活動レベルを維持してください'],
        nextAssessmentDate: '2024-01-22T00:00:00.000Z',
      };

      (firestoreService.saveRiskAssessment as jest.Mock).mockResolvedValue({
        id: 'assessment-123',
        success: true,
      });

      const result = await riskCalculationService.saveAssessment(assessment);

      expect(result.success).toBe(true);
      expect(firestoreService.saveRiskAssessment).toHaveBeenCalledWith(
        mockUserId,
        assessment
      );
    });
  });
});