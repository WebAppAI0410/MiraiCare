import * as Pedometer from 'expo-sensors/build/Pedometer';
import { pedometerService } from '../../src/services/pedometerService';
import { Alert } from 'react-native';

// モックの設定
jest.mock('expo-sensors/build/Pedometer');
jest.mock('../../src/services/firestoreService', () => ({
  firestoreService: {
    saveVitalData: jest.fn(),
    updateUserSettings: jest.fn(),
  },
}));
jest.spyOn(Alert, 'alert');

describe('PedometerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('初期化とパーミッション', () => {
    it('歩数計が利用可能か確認できる', async () => {
      (Pedometer.isAvailableAsync as jest.Mock).mockResolvedValue(true);
      
      const isAvailable = await pedometerService.isAvailable();
      
      expect(isAvailable).toBe(true);
      expect(Pedometer.isAvailableAsync).toHaveBeenCalled();
    });

    it('歩数計が利用不可の場合falseを返す', async () => {
      (Pedometer.isAvailableAsync as jest.Mock).mockResolvedValue(false);
      
      const isAvailable = await pedometerService.isAvailable();
      
      expect(isAvailable).toBe(false);
    });

    it('パーミッションを要求できる', async () => {
      (Pedometer.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
        granted: true,
      });
      
      const result = await pedometerService.requestPermissions();
      
      expect(result.granted).toBe(true);
      expect(Pedometer.requestPermissionsAsync).toHaveBeenCalled();
    });
  });

  describe('歩数データの取得', () => {
    it('今日の歩数を取得できる', async () => {
      const mockSteps = 5000;
      (Pedometer.getStepCountAsync as jest.Mock).mockResolvedValue({
        steps: mockSteps,
      });
      
      const steps = await pedometerService.getTodaySteps();
      
      expect(steps).toBe(mockSteps);
      expect(Pedometer.getStepCountAsync).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(Date)
      );
    });

    it('過去7日間の歩数履歴を取得できる', async () => {
      const mockHistory = [
        { date: '2024-01-20', steps: 5000 },
        { date: '2024-01-21', steps: 6000 },
        { date: '2024-01-22', steps: 4500 },
        { date: '2024-01-23', steps: 7000 },
        { date: '2024-01-24', steps: 5500 },
        { date: '2024-01-25', steps: 6500 },
        { date: '2024-01-26', steps: 8000 },
      ];

      // 各日のgetStepCountAsyncモックを設定
      (Pedometer.getStepCountAsync as jest.Mock)
        .mockResolvedValueOnce({ steps: 5000 })
        .mockResolvedValueOnce({ steps: 6000 })
        .mockResolvedValueOnce({ steps: 4500 })
        .mockResolvedValueOnce({ steps: 7000 })
        .mockResolvedValueOnce({ steps: 5500 })
        .mockResolvedValueOnce({ steps: 6500 })
        .mockResolvedValueOnce({ steps: 8000 });
      
      const history = await pedometerService.getWeeklyHistory();
      
      expect(history).toHaveLength(7);
      expect(history[6].steps).toBe(8000); // 最新日
      expect(Pedometer.getStepCountAsync).toHaveBeenCalledTimes(7);
    });

    it('歩数取得エラー時は0を返す', async () => {
      (Pedometer.getStepCountAsync as jest.Mock).mockRejectedValue(
        new Error('Sensor error')
      );
      
      const steps = await pedometerService.getTodaySteps();
      
      expect(steps).toBe(0);
    });
  });

  describe('リアルタイム歩数監視', () => {
    it('歩数の変化を監視できる', async () => {
      const mockCallback = jest.fn();
      const mockSubscription = { remove: jest.fn() };
      
      (Pedometer.watchStepCount as jest.Mock).mockReturnValue(mockSubscription);
      
      const subscription = await pedometerService.startWatching(mockCallback);
      
      expect(Pedometer.watchStepCount).toHaveBeenCalledWith(mockCallback);
      expect(subscription).toBe(mockSubscription);
    });

    it('監視を停止できる', async () => {
      const mockSubscription = { remove: jest.fn() };
      (Pedometer.watchStepCount as jest.Mock).mockReturnValue(mockSubscription);
      
      const subscription = await pedometerService.startWatching(jest.fn());
      await pedometerService.stopWatching(subscription);
      
      expect(mockSubscription.remove).toHaveBeenCalled();
    });
  });

  describe('歩数データの保存', () => {
    it('今日の歩数をFirestoreに保存できる', async () => {
      const userId = 'test-user-id';
      const steps = 5000;
      
      const { firestoreService } = require('../../src/services/firestoreService');
      (firestoreService.saveVitalData as jest.Mock).mockResolvedValue({
        id: 'vital-data-id',
        success: true,
      });
      
      await pedometerService.saveTodaySteps(userId, steps);
      
      expect(firestoreService.saveVitalData).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          type: 'steps',
          value: steps,
          unit: '歩',
        })
      );
    });

    it('歩数保存エラー時にエラーをスローする', async () => {
      const { firestoreService } = require('../../src/services/firestoreService');
      (firestoreService.saveVitalData as jest.Mock).mockRejectedValue(
        new Error('Save failed')
      );
      
      await expect(
        pedometerService.saveTodaySteps('user-id', 5000)
      ).rejects.toThrow('Save failed');
    });
  });

  describe('歩数目標と達成率', () => {
    it('歩数目標を設定できる', async () => {
      const userId = 'test-user-id';
      const target = 8000;
      
      const { firestoreService } = require('../../src/services/firestoreService');
      (firestoreService.updateUserSettings as jest.Mock).mockResolvedValue({
        success: true,
      });
      
      await pedometerService.setStepTarget(userId, target);
      
      expect(firestoreService.updateUserSettings).toHaveBeenCalledWith(
        userId,
        { stepTarget: target }
      );
    });

    it('歩数達成率を計算できる', () => {
      const current = 6000;
      const target = 8000;
      
      const percentage = pedometerService.calculateAchievementRate(current, target);
      
      expect(percentage).toBe(75);
    });

    it('目標を超えた場合は100%を上限とする', () => {
      const current = 10000;
      const target = 8000;
      
      const percentage = pedometerService.calculateAchievementRate(current, target);
      
      expect(percentage).toBe(100);
    });

    it('目標が0の場合は0%を返す', () => {
      const current = 5000;
      const target = 0;
      
      const percentage = pedometerService.calculateAchievementRate(current, target);
      
      expect(percentage).toBe(0);
    });
  });

  describe('歩行データの分析', () => {
    it('歩数から推定距離を計算できる', () => {
      const steps = 5000;
      const strideLength = 0.7; // メートル
      
      const distance = pedometerService.calculateDistance(steps, strideLength);
      
      expect(distance).toBe(3.5); // km
    });

    it('歩数から推定カロリーを計算できる', () => {
      const steps = 5000;
      const weight = 60; // kg
      
      const calories = pedometerService.calculateCalories(steps, weight);
      
      // 計算: 5000歩 × 0.05kcal = 250kcal
      expect(calories).toBe(250);
    });

    it('週間平均歩数を計算できる', () => {
      const weeklyData = [
        { date: '2024-01-20', steps: 5000 },
        { date: '2024-01-21', steps: 6000 },
        { date: '2024-01-22', steps: 4500 },
        { date: '2024-01-23', steps: 7000 },
        { date: '2024-01-24', steps: 5500 },
        { date: '2024-01-25', steps: 6500 },
        { date: '2024-01-26', steps: 8000 },
      ];
      
      const average = pedometerService.calculateWeeklyAverage(weeklyData);
      
      expect(average).toBe(6071); // 切り捨て
    });
  });

  describe('アラートと通知', () => {
    it('目標達成時に通知を表示する', async () => {
      await pedometerService.showAchievementAlert();
      
      expect(Alert.alert).toHaveBeenCalledWith(
        '🎉 目標達成！',
        '今日の歩数目標を達成しました！素晴らしい！',
        [{ text: 'OK' }]
      );
    });

    it('低活動警告を表示する', async () => {
      await pedometerService.showLowActivityWarning();
      
      expect(Alert.alert).toHaveBeenCalledWith(
        '⚠️ 活動量が少ないです',
        '健康のために、少し歩いてみませんか？',
        [
          { text: '後で', style: 'cancel' },
          { text: '歩く', onPress: expect.any(Function) }
        ]
      );
    });
  });
});