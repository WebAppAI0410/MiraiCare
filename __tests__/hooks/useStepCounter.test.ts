// useStepCounterフックテスト（TDD Phase 2）

import { renderHook, act } from '@testing-library/react-native';
import { useStepCounter } from '../../src/hooks/useStepCounter';
import * as sensorService from '../../src/services/sensorService';
import { StepCountData } from '../../src/types/userData';

// センサーサービスのモック
jest.mock('../../src/services/sensorService');
const mockSensorService = sensorService as jest.Mocked<typeof sensorService>;

describe('useStepCounter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('初期状態', () => {
    it('初期値が正しく設定される', () => {
      // When: フックを初期化
      const { result } = renderHook(() => useStepCounter());

      // Then: 初期状態が正しい
      expect(result.current.stepCount).toBe(0);
      expect(result.current.isTracking).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.lastUpdated).toBeNull();
    });
  });

  describe('startTracking', () => {
    it('トラッキングを開始できる', async () => {
      // Given: センサーサービスが成功を返す
      const mockSubscription = { remove: jest.fn() };
      mockSensorService.startStepCountTracking.mockResolvedValue({
        success: true,
        data: mockSubscription,
      });

      // When: フックを初期化してトラッキング開始
      const { result } = renderHook(() => useStepCounter());

      await act(async () => {
        await result.current.startTracking();
      });

      // Then: トラッキングが開始される
      expect(result.current.isTracking).toBe(true);
      expect(result.current.error).toBeNull();
      expect(mockSensorService.startStepCountTracking).toHaveBeenCalled();
    });

    it('トラッキング開始時のエラーを適切にハンドリングする', async () => {
      // Given: センサーサービスがエラーを返す
      mockSensorService.startStepCountTracking.mockResolvedValue({
        success: false,
        error: {
          code: 'SENSOR_UNAVAILABLE',
          message: 'センサーが利用できません',
          timestamp: Date.now(),
        },
      });

      // When: フックを初期化してトラッキング開始
      const { result } = renderHook(() => useStepCounter());

      await act(async () => {
        await result.current.startTracking();
      });

      // Then: エラーが適切に設定される
      expect(result.current.isTracking).toBe(false);
      expect(result.current.error).toEqual(
        expect.objectContaining({
          code: 'SENSOR_UNAVAILABLE',
          message: 'センサーが利用できません',
        })
      );
    });

    it('既にトラッキング中の場合は重複開始しない', async () => {
      // Given: センサーサービスが成功を返す
      const mockSubscription = { remove: jest.fn() };
      mockSensorService.startStepCountTracking.mockResolvedValue({
        success: true,
        data: mockSubscription,
      });

      // When: フックを初期化して2回トラッキング開始
      const { result } = renderHook(() => useStepCounter());

      await act(async () => {
        await result.current.startTracking();
      });

      await act(async () => {
        await result.current.startTracking();
      });

      // Then: 1回のみ呼ばれる
      expect(mockSensorService.startStepCountTracking).toHaveBeenCalledTimes(1);
    });
  });

  describe('stopTracking', () => {
    it('トラッキングを停止できる', async () => {
      // Given: トラッキングが開始されている
      const mockSubscription = { remove: jest.fn() };
      mockSensorService.startStepCountTracking.mockResolvedValue({
        success: true,
        data: mockSubscription,
      });

      const { result } = renderHook(() => useStepCounter());

      await act(async () => {
        await result.current.startTracking();
      });

      // When: トラッキングを停止
      act(() => {
        result.current.stopTracking();
      });

      // Then: トラッキングが停止される
      expect(result.current.isTracking).toBe(false);
      expect(mockSensorService.stopStepCountTracking).toHaveBeenCalledWith(mockSubscription);
    });

    it('トラッキングしていない場合でもエラーにならない', () => {
      // Given: トラッキングしていない状態
      const { result } = renderHook(() => useStepCounter());

      // When & Then: エラーにならない
      expect(() => {
        act(() => {
          result.current.stopTracking();
        });
      }).not.toThrow();
    });
  });

  describe('getCurrentSteps', () => {
    it('現在の歩数を取得できる', async () => {
      // Given: センサーサービスが歩数データを返す
      const mockStepData: StepCountData = {
        steps: 5000,
        timestamp: Date.now(),
      };
      mockSensorService.getCurrentStepCount.mockResolvedValue({
        success: true,
        data: mockStepData,
      });

      // When: フックを初期化して現在の歩数を取得
      const { result } = renderHook(() => useStepCounter());

      await act(async () => {
        await result.current.getCurrentSteps();
      });

      // Then: 歩数が更新される
      expect(result.current.stepCount).toBe(5000);
      expect(result.current.lastUpdated).toBeGreaterThan(0);
      expect(result.current.error).toBeNull();
    });

    it('歩数取得エラーを適切にハンドリングする', async () => {
      // Given: センサーサービスがエラーを返す
      mockSensorService.getCurrentStepCount.mockResolvedValue({
        success: false,
        error: {
          code: 'SENSOR_ERROR',
          message: '歩数取得エラー',
          timestamp: Date.now(),
        },
      });

      // When: フックを初期化して現在の歩数を取得
      const { result } = renderHook(() => useStepCounter());

      await act(async () => {
        await result.current.getCurrentSteps();
      });

      // Then: エラーが適切に設定される
      expect(result.current.error).toEqual(
        expect.objectContaining({
          code: 'SENSOR_ERROR',
          message: '歩数取得エラー',
        })
      );
    });
  });

  describe('歩数データコールバック', () => {
    it('トラッキング中の歩数更新を正しく処理する', async () => {
      // Given: センサーサービスが成功を返し、コールバックをキャプチャ
      let capturedCallback: ((data: StepCountData) => void) | undefined;
      const mockSubscription = { remove: jest.fn() };
      
      mockSensorService.startStepCountTracking.mockImplementation(async (callback) => {
        capturedCallback = callback;
        return {
          success: true,
          data: mockSubscription,
        };
      });

      // When: トラッキングを開始
      const { result } = renderHook(() => useStepCounter());

      await act(async () => {
        await result.current.startTracking();
      });

      // When: コールバックで歩数データを送信
      act(() => {
        capturedCallback?.({
          steps: 7500,
          timestamp: Date.now(),
        });
      });

      // Then: 歩数が更新される
      expect(result.current.stepCount).toBe(7500);
      expect(result.current.lastUpdated).toBeGreaterThan(0);
    });
  });

  describe('clearError', () => {
    it('エラーをクリアできる', async () => {
      // Given: エラーが設定されている状態
      mockSensorService.getCurrentStepCount.mockResolvedValue({
        success: false,
        error: {
          code: 'SENSOR_ERROR',
          message: 'テストエラー',
          timestamp: Date.now(),
        },
      });

      const { result } = renderHook(() => useStepCounter());

      await act(async () => {
        await result.current.getCurrentSteps();
      });

      expect(result.current.error).not.toBeNull();

      // When: エラーをクリア
      act(() => {
        result.current.clearError();
      });

      // Then: エラーがクリアされる
      expect(result.current.error).toBeNull();
    });
  });

  describe('自動クリーンアップ', () => {
    it('アンマウント時にトラッキングが停止される', async () => {
      // Given: トラッキングが開始されている
      const mockSubscription = { remove: jest.fn() };
      mockSensorService.startStepCountTracking.mockResolvedValue({
        success: true,
        data: mockSubscription,
      });

      const { result, unmount } = renderHook(() => useStepCounter());

      await act(async () => {
        await result.current.startTracking();
      });

      // When: コンポーネントをアンマウント
      unmount();

      // Then: トラッキングが停止される
      expect(mockSensorService.stopStepCountTracking).toHaveBeenCalledWith(mockSubscription);
    });
  });
});