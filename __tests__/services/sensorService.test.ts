// センサーサービステスト（TDD Phase 2）

import { 
  startStepCountTracking,
  stopStepCountTracking,
  getCurrentStepCount,
  getStepCountHistory 
} from '../../src/services/sensorService';
import { StepCountData, SensorError } from '../../src/types/userData';

// Expo Sensorsのモック
const mockRequestPermissionsAsync = jest.fn();
const mockIsAvailableAsync = jest.fn();
const mockGetStepCountAsync = jest.fn();
const mockWatchStepCount = jest.fn();

jest.mock('expo-sensors', () => ({
  Pedometer: {
    requestPermissionsAsync: () => mockRequestPermissionsAsync(),
    isAvailableAsync: () => mockIsAvailableAsync(),
    getStepCountAsync: (start: Date, end: Date) => mockGetStepCountAsync(start, end),
    watchStepCount: (callback: (result: any) => void) => mockWatchStepCount(callback),
  },
}));

describe('SensorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('startStepCountTracking', () => {
    it('歩数トラッキングを開始できる', async () => {
      // Given: センサーが利用可能で権限がある
      mockIsAvailableAsync.mockResolvedValue(true);
      mockRequestPermissionsAsync.mockResolvedValue({ status: 'granted' });
      mockWatchStepCount.mockReturnValue({ remove: jest.fn() });

      // When: トラッキングを開始
      const result = await startStepCountTracking((data: StepCountData) => {
        console.log('Steps:', data.steps);
      });

      // Then: 正常に開始される
      expect(result.success).toBe(true);
      expect(mockIsAvailableAsync).toHaveBeenCalled();
      expect(mockRequestPermissionsAsync).toHaveBeenCalled();
      expect(mockWatchStepCount).toHaveBeenCalled();
    });

    it('センサーが利用できない場合はエラーを返す', async () => {
      // Given: センサーが利用できない
      mockIsAvailableAsync.mockResolvedValue(false);

      // When: トラッキングを開始
      const result = await startStepCountTracking(() => {});

      // Then: エラーが返される
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SENSOR_UNAVAILABLE');
      expect(result.error?.message).toContain('歩数センサーが利用できません');
    });

    it('権限が拒否された場合はエラーを返す', async () => {
      // Given: センサーは利用可能だが権限が拒否
      mockIsAvailableAsync.mockResolvedValue(true);
      mockRequestPermissionsAsync.mockResolvedValue({ status: 'denied' });

      // When: トラッキングを開始
      const result = await startStepCountTracking(() => {});

      // Then: エラーが返される
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PERMISSION_DENIED');
      expect(result.error?.message).toContain('歩数センサーの権限が必要です');
    });
  });

  describe('stopStepCountTracking', () => {
    it('歩数トラッキングを停止できる', () => {
      // Given: トラッキングが開始されている
      const mockRemove = jest.fn();
      const subscription = { remove: mockRemove };

      // When: トラッキングを停止
      stopStepCountTracking(subscription);

      // Then: 正常に停止される
      expect(mockRemove).toHaveBeenCalled();
    });

    it('無効なサブスクリプションでもエラーにならない', () => {
      // Given: 無効なサブスクリプション
      const invalidSubscription = null;

      // When & Then: エラーにならない
      expect(() => {
        stopStepCountTracking(invalidSubscription);
      }).not.toThrow();
    });
  });

  describe('getCurrentStepCount', () => {
    it('現在の歩数を取得できる', async () => {
      // Given: センサーが利用可能で歩数データがある
      mockIsAvailableAsync.mockResolvedValue(true);
      mockGetStepCountAsync.mockResolvedValue({
        steps: 5000,
      });

      // When: 現在の歩数を取得
      const result = await getCurrentStepCount();

      // Then: 正しく取得される
      expect(result.success).toBe(true);
      expect(result.data?.steps).toBe(5000);
      expect(result.data?.timestamp).toBeGreaterThan(0);
    });

    it('センサーが利用できない場合はエラーを返す', async () => {
      // Given: センサーが利用できない
      mockIsAvailableAsync.mockResolvedValue(false);

      // When: 現在の歩数を取得
      const result = await getCurrentStepCount();

      // Then: エラーが返される
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SENSOR_UNAVAILABLE');
    });

    it('Expo Sensorsエラーを適切にハンドリングする', async () => {
      // Given: Expo Sensorsがエラーを投げる
      mockIsAvailableAsync.mockResolvedValue(true);
      mockGetStepCountAsync.mockRejectedValue(new Error('Sensor error'));

      // When: 現在の歩数を取得
      const result = await getCurrentStepCount();

      // Then: エラーが適切にハンドリングされる
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SENSOR_ERROR');
      expect(result.error?.message).toContain('歩数の取得に失敗しました');
    });
  });

  describe('getStepCountHistory', () => {
    it('指定期間の歩数履歴を取得できる', async () => {
      // Given: センサーが利用可能で履歴データがある
      mockIsAvailableAsync.mockResolvedValue(true);
      mockGetStepCountAsync.mockResolvedValue({
        steps: 8000,
      });

      // When: 履歴を取得（過去7日間）
      const result = await getStepCountHistory(7);

      // Then: 正しく取得される
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(7);
      expect(result.data?.[0]).toEqual(
        expect.objectContaining({
          steps: expect.any(Number),
          timestamp: expect.any(Number),
        })
      );
    });

    it('履歴取得中のエラーを適切にハンドリングする', async () => {
      // Given: センサーは利用可能だが履歴取得でエラー
      mockIsAvailableAsync.mockResolvedValue(true);
      mockGetStepCountAsync.mockRejectedValue(new Error('History error'));

      // When: 履歴を取得
      const result = await getStepCountHistory(7);

      // Then: エラーが適切にハンドリングされる
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SENSOR_ERROR');
    });

    it('不正な日数パラメータをバリデーションする', async () => {
      // Given: 不正な日数パラメータ
      const invalidDays = -1;

      // When: 履歴を取得
      const result = await getStepCountHistory(invalidDays);

      // Then: バリデーションエラーが返される
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_PARAMETER');
      expect(result.error?.message).toContain('日数は1以上である必要があります');
    });

    it('最大日数制限をチェックする', async () => {
      // Given: 最大日数を超えるパラメータ
      const tooManyDays = 366;

      // When: 履歴を取得
      const result = await getStepCountHistory(tooManyDays);

      // Then: 制限エラーが返される
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_PARAMETER');
      expect(result.error?.message).toContain('日数は365日以下である必要があります');
    });
  });
});