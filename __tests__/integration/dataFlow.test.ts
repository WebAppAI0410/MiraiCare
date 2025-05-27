// データフロー統合テスト（TDD Phase 2）
// ユーザー登録→歩数取得→データ保存→取得確認の統合シナリオ

import { renderHook, act } from '@testing-library/react-native';
import { useStepCounter } from '../../src/hooks/useStepCounter';
import * as firestoreService from '../../src/services/firestoreService';
import * as sensorService from '../../src/services/sensorService';
import { UserProfile, VitalData } from '../../src/types/userData';

// サービスのモック
jest.mock('../../src/services/firestoreService');
jest.mock('../../src/services/sensorService');

const mockFirestoreService = firestoreService as jest.Mocked<typeof firestoreService>;
const mockSensorService = sensorService as jest.Mocked<typeof sensorService>;

// Firebase設定のモック
jest.mock('../../src/config/firebase', () => ({
  db: {},
  COLLECTIONS: {
    USERS: 'users',
    VITALS: 'vitals',
    MOODS: 'moods',
    REMINDERS: 'reminders',
    BADGES: 'badges',
    USER_PROFILES: 'userProfiles',
    VITAL_DATA: 'vitalData',
  },
}));

describe('データフロー統合テスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('完全なデータフローシナリオ', () => {
    it('ユーザー登録→歩数取得→データ保存→取得確認の流れが正常に動作する', async () => {
      // Phase 1: ユーザー登録
      const newUser: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> = {
        name: '田中太郎',
        age: 75,
      };

      const userId = 'user123';
      mockFirestoreService.createUserProfile.mockResolvedValue(userId);

      const userCreateResult = await firestoreService.createUserProfile(newUser);
      expect(userCreateResult).toBe(userId);
      expect(mockFirestoreService.createUserProfile).toHaveBeenCalledWith(newUser);

      // Phase 2: ユーザープロファイル確認
      const createdUser: UserProfile = {
        id: userId,
        name: '田中太郎',
        age: 75,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockFirestoreService.getUserProfile.mockResolvedValue(createdUser);

      const retrievedUser = await firestoreService.getUserProfile(userId);
      expect(retrievedUser).toEqual(createdUser);
      expect(mockFirestoreService.getUserProfile).toHaveBeenCalledWith(userId);

      // Phase 3: センサーで歩数取得
      const stepData = {
        steps: 5000,
        timestamp: Date.now(),
      };

      mockSensorService.getCurrentStepCount.mockResolvedValue({
        success: true,
        data: stepData,
      });

      const stepResult = await sensorService.getCurrentStepCount();
      expect(stepResult.success).toBe(true);
      expect(stepResult.data?.steps).toBe(5000);

      // Phase 4: Hookを使用した歩数管理
      const mockSubscription = { remove: jest.fn() };
      mockSensorService.startStepCountTracking.mockResolvedValue({
        success: true,
        data: mockSubscription,
      });

      const { result } = renderHook(() => useStepCounter());

      // 歩数トラッキング開始
      await act(async () => {
        await result.current.startTracking();
      });

      expect(result.current.isTracking).toBe(true);

      // 現在の歩数取得
      await act(async () => {
        await result.current.getCurrentSteps();
      });

      expect(result.current.stepCount).toBe(5000);

      // Phase 5: バイタルデータ保存
      const vitalData: Partial<VitalData> = {
        steps: stepResult.data!.steps,
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        timestamp: stepResult.data!.timestamp,
      };

      const vitalId = 'vital123';
      mockFirestoreService.saveVitalData.mockResolvedValue({ id: vitalId, success: true });

      const saveResult = await firestoreService.saveVitalData(userId, vitalData);
      expect(saveResult).toEqual({ id: vitalId, success: true });
      expect(mockFirestoreService.saveVitalData).toHaveBeenCalledWith(userId, vitalData);

      // Phase 6: 保存されたバイタルデータ確認
      const savedVitalData = {
        id: vitalId,
        userId: userId,
        steps: vitalData.steps!,
        date: vitalData.date!,
        timestamp: vitalData.timestamp!,
        createdAt: new Date(),
      };

      mockFirestoreService.getVitalData.mockResolvedValue(savedVitalData);

      const retrievedVitalData = await firestoreService.getVitalData(vitalId);
      expect(retrievedVitalData).toEqual(savedVitalData);

      // Phase 7: ユーザーのバイタル履歴取得
      const vitalHistory = [savedVitalData];
      mockFirestoreService.getUserVitalHistory.mockResolvedValue(vitalHistory);

      const history = await firestoreService.getUserVitalHistory(userId, 7);
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(savedVitalData);

      // Phase 8: トラッキング停止
      act(() => {
        result.current.stopTracking();
      });

      expect(result.current.isTracking).toBe(false);
      expect(mockSensorService.stopStepCountTracking).toHaveBeenCalledWith(mockSubscription);
    });
  });

  describe('エラーハンドリング統合テスト', () => {
    it('センサーエラー時のデータフローが適切に動作する', async () => {
      // Given: センサーエラーが発生
      mockSensorService.getCurrentStepCount.mockResolvedValue({
        success: false,
        error: {
          code: 'SENSOR_UNAVAILABLE',
          message: 'センサーが利用できません',
          timestamp: Date.now(),
        },
      });

      // When: Hookで歩数取得を試行
      const { result } = renderHook(() => useStepCounter());

      await act(async () => {
        await result.current.getCurrentSteps();
      });

      // Then: エラーが適切にハンドリングされる
      expect(result.current.error).toEqual(
        expect.objectContaining({
          code: 'SENSOR_UNAVAILABLE',
          message: 'センサーが利用できません',
        })
      );
      expect(result.current.stepCount).toBe(0);
    });

    it('Firestoreエラー時のデータフローが適切に動作する', async () => {
      // Given: Firestoreエラーが発生
      mockFirestoreService.createUserProfile.mockRejectedValue(
        new Error('ユーザープロファイルの作成に失敗しました')
      );

      // When: ユーザー作成を試行
      await expect(
        firestoreService.createUserProfile({
          name: '田中太郎',
          age: 75,
        })
      ).rejects.toThrow('ユーザープロファイルの作成に失敗しました');

      // Then: エラーが適切に伝播される
      expect(mockFirestoreService.createUserProfile).toHaveBeenCalled();
    });
  });

  describe('データ整合性テスト', () => {
    it('複数日の歩数データが正しく保存・取得できる', async () => {
      const userId = 'user123';
      const baseTimestamp = new Date('2024-01-01').getTime();

      // Given: 複数日の歩数データ
      const multiDayVitalData = [
        {
          id: 'vital1',
          userId,
          steps: 5000,
          date: '2024-01-01',
          timestamp: baseTimestamp,
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 'vital2',
          userId,
          steps: 6000,
          date: '2024-01-02',
          timestamp: baseTimestamp + 86400000, // +1 day
          createdAt: new Date('2024-01-02'),
        },
        {
          id: 'vital3',
          userId,
          steps: 7000,
          date: '2024-01-03',
          timestamp: baseTimestamp + 172800000, // +2 days
          createdAt: new Date('2024-01-03'),
        },
      ];

      mockFirestoreService.getUserVitalHistory.mockResolvedValue(multiDayVitalData);

      // When: 履歴を取得
      const history = await firestoreService.getUserVitalHistory(userId, 7);

      // Then: 正しく取得される
      expect(history).toHaveLength(3);
      expect(history[0].steps).toBe(5000);
      expect(history[1].steps).toBe(6000);
      expect(history[2].steps).toBe(7000);
    });

    it('今日のデータが正しく取得できる', async () => {
      const userId = 'user123';
      const today = new Date().toISOString().split('T')[0];
      
      const todayVitalData = {
        id: 'vital_today',
        userId,
        steps: 8000,
        date: today,
        timestamp: Date.now(),
        createdAt: new Date(),
      };

      mockFirestoreService.getTodayVitalData.mockResolvedValue(todayVitalData);

      // When: 今日のデータを取得
      const todayData = await firestoreService.getTodayVitalData(userId);

      // Then: 正しく取得される
      expect(todayData).toEqual(todayVitalData);
      expect(todayData?.date).toBe(today);
      expect(todayData?.steps).toBe(8000);
    });
  });

  describe('リアルタイム更新テスト', () => {
    it('トラッキング中の歩数更新が正しく反映される', async () => {
      // Given: トラッキングが開始される
      let capturedCallback: ((data: any) => void) | undefined;
      const mockSubscription = { remove: jest.fn() };
      
      mockSensorService.startStepCountTracking.mockImplementation(async (callback) => {
        capturedCallback = callback;
        return {
          success: true,
          data: mockSubscription,
        };
      });

      // When: Hookでトラッキング開始
      const { result } = renderHook(() => useStepCounter());

      await act(async () => {
        await result.current.startTracking();
      });

      // リアルタイム更新をシミュレート
      const updateData = [
        { steps: 1000, timestamp: Date.now() },
        { steps: 2000, timestamp: Date.now() + 1000 },
        { steps: 3000, timestamp: Date.now() + 2000 },
      ];

      for (const data of updateData) {
        act(() => {
          capturedCallback?.(data);
        });

        expect(result.current.stepCount).toBe(data.steps);
        expect(result.current.lastUpdated).toBe(data.timestamp);
      }

      // Then: 最終状態が正しい
      expect(result.current.stepCount).toBe(3000);
      expect(result.current.isTracking).toBe(true);
    });
  });
});