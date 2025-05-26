// TDD Phase 2: useStepCounterカスタムHookテスト
// RED フェーズ: 失敗するテストを先に作成

import { renderHook, act } from '@testing-library/react-native';
import { useStepCounter } from '../../src/hooks/useStepCounter';

// モックの設定
jest.mock('../../src/services/sensorService', () => ({
  sensorService: {
    isPedometerAvailable: jest.fn(),
    getCurrentStepCount: jest.fn(),
    getTodayStepCount: jest.fn(),
    getWeeklyStepCount: jest.fn(),
    startStepCountMonitoring: jest.fn(),
    stopStepCountMonitoring: jest.fn(),
    requestSensorPermissions: jest.fn(),
  },
}));

jest.mock('../../src/services/firestoreService', () => ({
  firestoreService: {
    addStepCount: jest.fn(),
    getStepCountByDate: jest.fn(),
    getStepCountRange: jest.fn(),
  },
}));

describe('useStepCounter Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基本的な状態管理', () => {
    test('初期状態の確認', () => {
      // RED: この実装はまだ存在しない
      const { result } = renderHook(() => useStepCounter('test-user-123'));

      expect(result.current).toEqual(expect.objectContaining({
        steps: 0,
        isLoading: false,
        error: null,
        isMonitoring: false,
        permissionStatus: 'undetermined',
        sensorAvailable: false,
      }));
    });

    test('ユーザーIDの変更対応', () => {
      // RED: この実装はまだ存在しない
      const { result, rerender } = renderHook(
        ({ userId }) => useStepCounter(userId),
        { initialProps: { userId: 'user-1' } }
      );

      expect(result.current.userId).toBe('user-1');

      rerender({ userId: 'user-2' });
      expect(result.current.userId).toBe('user-2');
    });
  });

  describe('センサー権限管理', () => {
    test('requestPermission - 権限要求', async () => {
      // RED: この実装はまだ存在しない
      const { result } = renderHook(() => useStepCounter('test-user-123'));

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(result.current.permissionStatus).not.toBe('undetermined');
    });

    test('権限許可時の状態更新', async () => {
      // RED: この実装はまだ存在しない
      const mockSensorService = require('../../src/services/sensorService').sensorService;
      mockSensorService.requestSensorPermissions.mockResolvedValue({
        granted: true,
        status: 'granted'
      });

      const { result } = renderHook(() => useStepCounter('test-user-123'));

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(result.current.permissionStatus).toBe('granted');
    });

    test('権限拒否時の状態更新', async () => {
      // RED: この実装はまだ存在しない
      const mockSensorService = require('../../src/services/sensorService').sensorService;
      mockSensorService.requestSensorPermissions.mockResolvedValue({
        granted: false,
        status: 'denied'
      });

      const { result } = renderHook(() => useStepCounter('test-user-123'));

      await act(async () => {
        await result.current.requestPermission();
      });

      expect(result.current.permissionStatus).toBe('denied');
      expect(result.current.error).toContain('権限が拒否されました');
    });
  });

  describe('歩数データ取得', () => {
    test('fetchCurrentSteps - 現在の歩数取得', async () => {
      // RED: この実装はまだ存在しない
      const mockSensorService = require('../../src/services/sensorService').sensorService;
      mockSensorService.getCurrentStepCount.mockResolvedValue({
        data: { steps: 5000 },
        error: null,
        timestamp: new Date(),
      });

      const { result } = renderHook(() => useStepCounter('test-user-123'));

      await act(async () => {
        await result.current.fetchCurrentSteps();
      });

      expect(result.current.steps).toBe(5000);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    test('fetchTodaySteps - 今日の歩数取得', async () => {
      // RED: この実装はまだ存在しない
      const mockStepData = {
        userId: 'test-user-123',
        steps: 8000,
        date: '2024-01-15',
        startTime: new Date(),
        endTime: new Date(),
        timestamp: Date.now(),
      };

      const mockSensorService = require('../../src/services/sensorService').sensorService;
      mockSensorService.getTodayStepCount.mockResolvedValue({
        data: mockStepData,
        error: null,
        timestamp: new Date(),
      });

      const { result } = renderHook(() => useStepCounter('test-user-123'));

      await act(async () => {
        await result.current.fetchTodaySteps();
      });

      expect(result.current.steps).toBe(8000);
      expect(result.current.todayData).toEqual(mockStepData);
    });

    test('fetchWeeklySteps - 週間歩数取得', async () => {
      // RED: この実装はまだ存在しない
      const mockWeeklyData = [
        { date: '2024-01-15', steps: 5000 },
        { date: '2024-01-16', steps: 6000 },
        { date: '2024-01-17', steps: 7000 },
      ];

      const mockSensorService = require('../../src/services/sensorService').sensorService;
      mockSensorService.getWeeklyStepCount.mockResolvedValue({
        data: mockWeeklyData,
        error: null,
        timestamp: new Date(),
      });

      const { result } = renderHook(() => useStepCounter('test-user-123'));

      await act(async () => {
        await result.current.fetchWeeklySteps();
      });

      expect(result.current.weeklyData).toEqual(mockWeeklyData);
    });

    test('データ取得エラーハンドリング', async () => {
      // RED: この実装はまだ存在しない
      const mockSensorService = require('../../src/services/sensorService').sensorService;
      mockSensorService.getCurrentStepCount.mockResolvedValue({
        data: null,
        error: 'センサーエラー',
        timestamp: new Date(),
      });

      const { result } = renderHook(() => useStepCounter('test-user-123'));

      await act(async () => {
        await result.current.fetchCurrentSteps();
      });

      expect(result.current.error).toBe('センサーエラー');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('リアルタイム監視', () => {
    test('startMonitoring - リアルタイム監視開始', async () => {
      // RED: この実装はまだ存在しない
      const mockSubscription = { remove: jest.fn() };
      const mockSensorService = require('../../src/services/sensorService').sensorService;
      mockSensorService.startStepCountMonitoring.mockReturnValue(mockSubscription);

      const { result } = renderHook(() => useStepCounter('test-user-123'));

      await act(async () => {
        result.current.startMonitoring();
      });

      expect(result.current.isMonitoring).toBe(true);
      expect(mockSensorService.startStepCountMonitoring).toHaveBeenCalled();
    });

    test('stopMonitoring - リアルタイム監視停止', () => {
      // RED: この実装はまだ存在しない
      const { result } = renderHook(() => useStepCounter('test-user-123'));

      act(() => {
        result.current.stopMonitoring();
      });

      expect(result.current.isMonitoring).toBe(false);
    });

    test('リアルタイムデータ更新', async () => {
      // RED: この実装はまだ存在しない
      const mockCallback = jest.fn();
      const mockSensorService = require('../../src/services/sensorService').sensorService;
      
      mockSensorService.startStepCountMonitoring.mockImplementation((callback) => {
        // データ更新をシミュレート
        setTimeout(() => {
          callback({ steps: 1000, timestamp: new Date() });
        }, 100);
        return { remove: jest.fn() };
      });

      const { result } = renderHook(() => useStepCounter('test-user-123'));

      await act(async () => {
        result.current.startMonitoring();
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      expect(result.current.steps).toBe(1000);
    });
  });

  describe('データ永続化', () => {
    test('saveToFirestore - Firestoreへの保存', async () => {
      // RED: この実装はまだ存在しない
      const mockFirestoreService = require('../../src/services/firestoreService').firestoreService;
      mockFirestoreService.addStepCount.mockResolvedValue('step-count-id');

      const { result } = renderHook(() => useStepCounter('test-user-123'));

      // まず歩数データを設定
      await act(async () => {
        result.current.setSteps(5000);
        await result.current.saveToFirestore();
      });

      expect(mockFirestoreService.addStepCount).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'test-user-123',
          steps: 5000,
        })
      );
    });

    test('loadFromFirestore - Firestoreからの読み込み', async () => {
      // RED: この実装はまだ存在しない
      const mockStepData = {
        userId: 'test-user-123',
        steps: 7000,
        date: '2024-01-15',
        startTime: new Date(),
        endTime: new Date(),
        timestamp: Date.now(),
      };

      const mockFirestoreService = require('../../src/services/firestoreService').firestoreService;
      mockFirestoreService.getStepCountByDate.mockResolvedValue(mockStepData);

      const { result } = renderHook(() => useStepCounter('test-user-123'));

      await act(async () => {
        await result.current.loadFromFirestore('2024-01-15');
      });

      expect(result.current.steps).toBe(7000);
      expect(result.current.todayData).toEqual(mockStepData);
    });

    test('自動保存機能', async () => {
      // RED: この実装はまだ存在しない
      const mockFirestoreService = require('../../src/services/firestoreService').firestoreService;
      mockFirestoreService.addStepCount.mockResolvedValue('step-count-id');

      const { result } = renderHook(() => 
        useStepCounter('test-user-123', { autoSave: true, autoSaveInterval: 100 })
      );

      await act(async () => {
        result.current.setSteps(3000);
        await new Promise(resolve => setTimeout(resolve, 150));
      });

      expect(mockFirestoreService.addStepCount).toHaveBeenCalled();
    });
  });

  describe('設定とオプション', () => {
    test('カスタム設定での初期化', () => {
      // RED: この実装はまだ存在しない
      const options = {
        autoStart: true,
        autoSave: true,
        autoSaveInterval: 5000,
        monitoringInterval: 1000,
      };

      const { result } = renderHook(() => 
        useStepCounter('test-user-123', options)
      );

      expect(result.current.options).toEqual(expect.objectContaining(options));
    });

    test('resetSteps - 歩数リセット', () => {
      // RED: この実装はまだ存在しない
      const { result } = renderHook(() => useStepCounter('test-user-123'));

      act(() => {
        result.current.setSteps(5000);
        result.current.resetSteps();
      });

      expect(result.current.steps).toBe(0);
    });

    test('setSteps - 手動歩数設定', () => {
      // RED: この実装はまだ存在しない
      const { result } = renderHook(() => useStepCounter('test-user-123'));

      act(() => {
        result.current.setSteps(2500);
      });

      expect(result.current.steps).toBe(2500);
    });
  });

  describe('クリーンアップとメモリ管理', () => {
    test('アンマウント時のリソース解放', () => {
      // RED: この実装はまだ存在しない
      const mockSensorService = require('../../src/services/sensorService').sensorService;
      const mockSubscription = { remove: jest.fn() };
      mockSensorService.startStepCountMonitoring.mockReturnValue(mockSubscription);

      const { result, unmount } = renderHook(() => useStepCounter('test-user-123'));

      act(() => {
        result.current.startMonitoring();
      });

      unmount();

      expect(mockSubscription.remove).toHaveBeenCalled();
    });

    test('メモリリーク防止', () => {
      // RED: この実装はまだ存在しない
      const { result, unmount } = renderHook(() => useStepCounter('test-user-123'));

      // リソースを複数作成
      act(() => {
        result.current.startMonitoring();
        result.current.startMonitoring(); // 重複作成
      });

      // アンマウント時にすべて解放されることを確認
      expect(() => unmount()).not.toThrow();
    });
  });
});