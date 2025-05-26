// TDD Phase 2: Expo Sensorsセンサーサービステスト
// RED フェーズ: 失敗するテストを先に作成

import { sensorService } from '../../src/services/sensorService';
import type { SensorResult, SensorAvailability, StepCountData } from '../../src/types/userData';

// Expo Sensors のモック
jest.mock('expo-sensors', () => ({
  Pedometer: {
    isAvailableAsync: jest.fn(),
    getStepCountAsync: jest.fn(),
    watchStepCount: jest.fn(),
    requestPermissionsAsync: jest.fn(),
  },
  Accelerometer: {
    isAvailableAsync: jest.fn(),
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
    setUpdateInterval: jest.fn(),
  },
  Gyroscope: {
    isAvailableAsync: jest.fn(),
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
  },
  Magnetometer: {
    isAvailableAsync: jest.fn(),
    addListener: jest.fn(),
    removeAllListeners: jest.fn(),
  },
}));

describe('SensorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('センサー可用性チェック', () => {
    test('checkSensorAvailability - 全センサーの可用性確認', async () => {
      // RED: この実装はまだ存在しない
      await expect(sensorService.checkSensorAvailability())
        .resolves.toEqual(expect.objectContaining({
          pedometer: expect.any(Boolean),
          accelerometer: expect.any(Boolean),
          gyroscope: expect.any(Boolean),
          magnetometer: expect.any(Boolean),
        }));
    });

    test('isPedometerAvailable - 歩数計センサーの可用性確認', async () => {
      // RED: この実装はまだ存在しない
      await expect(sensorService.isPedometerAvailable())
        .resolves.toBe(true);
    });

    test('センサー未対応デバイスでの処理', async () => {
      // RED: この実装はまだ存在しない
      const mockUnavailable = jest.fn().mockResolvedValue(false);
      jest.doMock('expo-sensors', () => ({
        Pedometer: { isAvailableAsync: mockUnavailable },
      }));

      await expect(sensorService.isPedometerAvailable())
        .resolves.toBe(false);
    });
  });

  describe('歩数計操作', () => {
    const mockStartDate = new Date('2024-01-15T00:00:00');
    const mockEndDate = new Date('2024-01-15T23:59:59');

    test('getStepCount - 期間内歩数データ取得', async () => {
      // RED: この実装はまだ存在しない
      await expect(sensorService.getStepCount(mockStartDate, mockEndDate))
        .resolves.toEqual(expect.objectContaining({
          data: expect.objectContaining({
            steps: expect.any(Number),
          }),
          error: null,
          timestamp: expect.any(Date),
        }));
    });

    test('getCurrentStepCount - 現在の歩数取得', async () => {
      // RED: この実装はまだ存在しない
      await expect(sensorService.getCurrentStepCount())
        .resolves.toEqual(expect.objectContaining({
          data: expect.objectContaining({
            steps: expect.any(Number),
          }),
          error: null,
        }));
    });

    test('getTodayStepCount - 今日の歩数取得', async () => {
      // RED: この実装はまだ存在しない
      await expect(sensorService.getTodayStepCount())
        .resolves.toEqual(expect.objectContaining({
          data: expect.objectContaining({
            steps: expect.any(Number),
            date: expect.any(String),
          }),
          error: null,
        }));
    });

    test('getWeeklyStepCount - 週間歩数データ取得', async () => {
      // RED: この実装はまだ存在しない
      await expect(sensorService.getWeeklyStepCount())
        .resolves.toEqual(expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              date: expect.any(String),
              steps: expect.any(Number),
            })
          ]),
          error: null,
        }));
    });

    test('歩数計エラーハンドリング', async () => {
      // RED: この実装はまだ存在しない
      const mockError = new Error('センサーアクセスエラー');
      jest.doMock('expo-sensors', () => ({
        Pedometer: {
          getStepCountAsync: jest.fn().mockRejectedValue(mockError),
        },
      }));

      await expect(sensorService.getStepCount(mockStartDate, mockEndDate))
        .resolves.toEqual(expect.objectContaining({
          data: null,
          error: expect.stringContaining('歩数データの取得に失敗'),
        }));
    });
  });

  describe('リアルタイム歩数監視', () => {
    test('startStepCountMonitoring - 歩数監視開始', () => {
      const mockCallback = jest.fn();

      // RED: この実装はまだ存在しない
      expect(() => {
        const subscription = sensorService.startStepCountMonitoring(mockCallback);
        expect(subscription).toEqual(expect.objectContaining({
          remove: expect.any(Function),
        }));
      }).not.toThrow();
    });

    test('stopStepCountMonitoring - 歩数監視停止', () => {
      // RED: この実装はまだ存在しない
      expect(() => {
        sensorService.stopStepCountMonitoring();
      }).not.toThrow();
    });

    test('リアルタイムデータのコールバック呼び出し', (done) => {
      const mockCallback = jest.fn((data) => {
        expect(data).toEqual(expect.objectContaining({
          steps: expect.any(Number),
          timestamp: expect.any(Date),
        }));
        done();
      });

      // RED: この実装はまだ存在しない
      const subscription = sensorService.startStepCountMonitoring(mockCallback);
      
      // モックデータを送信
      setTimeout(() => {
        // センサーからのデータ受信シミュレーション
        expect(mockCallback).toHaveBeenCalled();
        subscription.remove();
      }, 100);
    });
  });

  describe('権限管理', () => {
    test('requestSensorPermissions - センサー権限要求', async () => {
      // RED: この実装はまだ存在しない
      await expect(sensorService.requestSensorPermissions())
        .resolves.toEqual(expect.objectContaining({
          granted: expect.any(Boolean),
          status: expect.any(String),
        }));
    });

    test('権限拒否時の処理', async () => {
      // RED: この実装はまだ存在しない
      jest.doMock('expo-sensors', () => ({
        Pedometer: {
          requestPermissionsAsync: jest.fn().mockResolvedValue({
            granted: false,
            status: 'denied'
          }),
        },
      }));

      await expect(sensorService.requestSensorPermissions())
        .resolves.toEqual(expect.objectContaining({
          granted: false,
          status: 'denied',
        }));
    });
  });

  describe('加速度センサー', () => {
    test('startAccelerometerMonitoring - 加速度センサー監視開始', () => {
      const mockCallback = jest.fn();

      // RED: この実装はまだ存在しない
      expect(() => {
        const subscription = sensorService.startAccelerometerMonitoring(mockCallback);
        expect(subscription).toEqual(expect.objectContaining({
          remove: expect.any(Function),
        }));
      }).not.toThrow();
    });

    test('getAccelerometerData - 加速度データ取得', () => {
      const mockCallback = jest.fn();

      // RED: この実装はまだ存在しない
      const subscription = sensorService.startAccelerometerMonitoring(mockCallback);
      
      // 加速度データのフォーマット確認
      setTimeout(() => {
        expect(mockCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            x: expect.any(Number),
            y: expect.any(Number),
            z: expect.any(Number),
            timestamp: expect.any(Number),
          })
        );
        subscription.remove();
      }, 100);
    });

    test('setAccelerometerInterval - 更新間隔設定', () => {
      // RED: この実装はまだ存在しない
      expect(() => {
        sensorService.setAccelerometerInterval(100); // 100ms
      }).not.toThrow();
    });
  });

  describe('センサーデータ統合', () => {
    test('createStepCountData - 歩数データオブジェクト作成', () => {
      const userId = 'test-user-123';
      const steps = 5000;
      const date = '2024-01-15';

      // RED: この実装はまだ存在しない
      expect(sensorService.createStepCountData(userId, steps, date))
        .toEqual(expect.objectContaining({
          userId,
          steps,
          date,
          startTime: expect.any(Date),
          endTime: expect.any(Date),
          timestamp: expect.any(Number),
        }));
    });

    test('formatSensorData - センサーデータのフォーマット', () => {
      const rawData = { steps: 5000 };
      const userId = 'test-user-123';

      // RED: この実装はまだ存在しない
      expect(sensorService.formatSensorData(rawData, userId))
        .toEqual(expect.objectContaining({
          userId,
          type: 'steps',
          value: 5000,
          unit: 'steps',
          source: 'sensor',
          measuredAt: expect.any(Date),
        }));
    });
  });

  describe('エラーハンドリング', () => {
    test('センサー未対応エラー', async () => {
      // RED: この実装はまだ存在しない
      jest.doMock('expo-sensors', () => ({
        Pedometer: {
          isAvailableAsync: jest.fn().mockResolvedValue(false),
        },
      }));

      await expect(sensorService.getStepCount(new Date(), new Date()))
        .resolves.toEqual(expect.objectContaining({
          data: null,
          error: expect.stringContaining('歩数計が利用できません'),
        }));
    });

    test('ネットワークエラー処理', async () => {
      // RED: この実装はまだ存在しない
      jest.doMock('expo-sensors', () => ({
        Pedometer: {
          getStepCountAsync: jest.fn().mockRejectedValue(new Error('Network error')),
        },
      }));

      await expect(sensorService.getCurrentStepCount())
        .resolves.toEqual(expect.objectContaining({
          data: null,
          error: expect.any(String),
        }));
    });

    test('タイムアウトエラー処理', async () => {
      // RED: この実装はまだ存在しない
      jest.doMock('expo-sensors', () => ({
        Pedometer: {
          getStepCountAsync: jest.fn().mockImplementation(
            () => new Promise((resolve) => {
              setTimeout(() => resolve({ steps: 1000 }), 10000); // 10秒待機
            })
          ),
        },
      }));

      await expect(sensorService.getCurrentStepCount())
        .resolves.toEqual(expect.objectContaining({
          data: null,
          error: expect.stringContaining('タイムアウト'),
        }));
    }, 6000); // テストタイムアウト: 6秒
  });

  describe('デバイス互換性', () => {
    test('iOS デバイスでの動作確認', async () => {
      // RED: この実装はまだ存在しない
      // プラットフォーム固有の処理をテスト
      jest.doMock('expo-constants', () => ({
        default: {
          platform: { ios: {} }
        }
      }));

      await expect(sensorService.checkSensorAvailability())
        .resolves.toEqual(expect.objectContaining({
          pedometer: expect.any(Boolean),
        }));
    });

    test('Android デバイスでの動作確認', async () => {
      // RED: この実装はまだ存在しない
      jest.doMock('expo-constants', () => ({
        default: {
          platform: { android: {} }
        }
      }));

      await expect(sensorService.checkSensorAvailability())
        .resolves.toEqual(expect.objectContaining({
          pedometer: expect.any(Boolean),
        }));
    });
  });
});