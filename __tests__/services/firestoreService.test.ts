// TDD Phase 2: Firebase Firestoreサービステスト
// RED フェーズ: 失敗するテストを先に作成

import { firestoreService } from '../../src/services/firestoreService';
import type { 
  UserProfile, 
  VitalData, 
  StepCountData,
  HeartRateData,
  BloodPressureData,
  QueryOptions 
} from '../../src/types/userData';

// モックの設定
jest.mock('../../src/config/firebase', () => ({
  db: {},
  COLLECTIONS: {
    USER_PROFILES: 'user_profiles',
    VITAL_DATA: 'vital_data',
  }
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
}));

describe('FirestoreService', () => {
  const mockUserId = 'test-user-123';
  const mockUserProfile: UserProfile = {
    id: mockUserId,
    email: 'test@example.com',
    fullName: 'テストユーザー',
    age: 65,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockVitalData: VitalData = {
    userId: mockUserId,
    type: 'steps',
    value: 5000,
    unit: 'steps',
    measuredAt: new Date(),
    source: 'sensor',
    createdAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UserProfile操作', () => {
    test('createUserProfile - ユーザープロファイルの作成', async () => {
      // RED: この実装はまだ存在しない
      await expect(firestoreService.createUserProfile(mockUserProfile))
        .resolves.toBeDefined();
    });

    test('getUserProfile - ユーザープロファイルの取得', async () => {
      // RED: この実装はまだ存在しない
      await expect(firestoreService.getUserProfile(mockUserId))
        .resolves.toEqual(expect.objectContaining({
          id: mockUserId,
          email: expect.any(String),
        }));
    });

    test('updateUserProfile - ユーザープロファイルの更新', async () => {
      const updates = { fullName: '更新されたユーザー', age: 66 };
      
      // RED: この実装はまだ存在しない
      await expect(firestoreService.updateUserProfile(mockUserId, updates))
        .resolves.toBeDefined();
    });

    test('deleteUserProfile - ユーザープロファイルの削除', async () => {
      // RED: この実装はまだ存在しない
      await expect(firestoreService.deleteUserProfile(mockUserId))
        .resolves.toBeUndefined();
    });

    test('getUserProfile - 存在しないユーザーでnullを返す', async () => {
      // RED: この実装はまだ存在しない
      await expect(firestoreService.getUserProfile('non-existent-user'))
        .resolves.toBeNull();
    });
  });

  describe('VitalData操作', () => {
    test('addVitalData - バイタルデータの追加', async () => {
      // RED: この実装はまだ存在しない
      await expect(firestoreService.addVitalData(mockVitalData))
        .resolves.toBeDefined();
    });

    test('getVitalData - ユーザーのバイタルデータ取得', async () => {
      // RED: この実装はまだ存在しない
      await expect(firestoreService.getVitalData(mockUserId))
        .resolves.toEqual(expect.arrayContaining([
          expect.objectContaining({
            userId: mockUserId,
            type: expect.any(String),
            value: expect.any(Number),
          })
        ]));
    });

    test('getVitalDataByType - タイプ別バイタルデータ取得', async () => {
      // RED: この実装はまだ存在しない
      await expect(firestoreService.getVitalDataByType(mockUserId, 'steps'))
        .resolves.toEqual(expect.arrayContaining([
          expect.objectContaining({
            type: 'steps',
          })
        ]));
    });

    test('updateVitalData - バイタルデータの更新', async () => {
      const vitalId = 'vital-123';
      const updates = { value: 6000 };
      
      // RED: この実装はまだ存在しない
      await expect(firestoreService.updateVitalData(vitalId, updates))
        .resolves.toBeDefined();
    });

    test('deleteVitalData - バイタルデータの削除', async () => {
      const vitalId = 'vital-123';
      
      // RED: この実装はまだ存在しない
      await expect(firestoreService.deleteVitalData(vitalId))
        .resolves.toBeUndefined();
    });
  });

  describe('StepCountData特化操作', () => {
    const mockStepData: StepCountData = {
      userId: mockUserId,
      steps: 8000,
      date: '2024-01-15',
      startTime: new Date('2024-01-15T00:00:00'),
      endTime: new Date('2024-01-15T23:59:59'),
      timestamp: Date.now(),
    };

    test('addStepCount - 歩数データの追加', async () => {
      // RED: この実装はまだ存在しない
      await expect(firestoreService.addStepCount(mockStepData))
        .resolves.toBeDefined();
    });

    test('getStepCountByDate - 日付別歩数データ取得', async () => {
      // RED: この実装はまだ存在しない
      await expect(firestoreService.getStepCountByDate(mockUserId, '2024-01-15'))
        .resolves.toEqual(expect.objectContaining({
          steps: expect.any(Number),
          date: '2024-01-15',
        }));
    });

    test('getStepCountRange - 期間別歩数データ取得', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      
      // RED: この実装はまだ存在しない
      await expect(firestoreService.getStepCountRange(mockUserId, startDate, endDate))
        .resolves.toEqual(expect.arrayContaining([
          expect.objectContaining({
            date: expect.any(String),
            steps: expect.any(Number),
          })
        ]));
    });
  });

  describe('HeartRateData操作', () => {
    const mockHeartRateData: HeartRateData = {
      userId: mockUserId,
      heartRate: 75,
      measuredAt: new Date(),
      source: 'device',
    };

    test('addHeartRate - 心拍数データの追加', async () => {
      // RED: この実装はまだ存在しない
      await expect(firestoreService.addHeartRate(mockHeartRateData))
        .resolves.toBeDefined();
    });

    test('getHeartRateData - 心拍数データ取得', async () => {
      // RED: この実装はまだ存在しない
      await expect(firestoreService.getHeartRateData(mockUserId))
        .resolves.toEqual(expect.arrayContaining([
          expect.objectContaining({
            heartRate: expect.any(Number),
            source: expect.any(String),
          })
        ]));
    });
  });

  describe('BloodPressureData操作', () => {
    const mockBloodPressureData: BloodPressureData = {
      userId: mockUserId,
      systolic: 120,
      diastolic: 80,
      pulse: 70,
      measuredAt: new Date(),
      notes: 'テスト測定',
    };

    test('addBloodPressure - 血圧データの追加', async () => {
      // RED: この実装はまだ存在しない
      await expect(firestoreService.addBloodPressure(mockBloodPressureData))
        .resolves.toBeDefined();
    });

    test('getBloodPressureData - 血圧データ取得', async () => {
      // RED: この実装はまだ存在しない
      await expect(firestoreService.getBloodPressureData(mockUserId))
        .resolves.toEqual(expect.arrayContaining([
          expect.objectContaining({
            systolic: expect.any(Number),
            diastolic: expect.any(Number),
          })
        ]));
    });
  });

  describe('高度なクエリ操作', () => {
    test('queryVitalData - 条件付きクエリ', async () => {
      const options: QueryOptions = {
        limit: 10,
        orderBy: { field: 'measuredAt', direction: 'desc' },
        where: [
          { field: 'type', operator: '==', value: 'steps' },
          { field: 'value', operator: '>', value: 1000 }
        ]
      };

      // RED: この実装はまだ存在しない
      await expect(firestoreService.queryVitalData(mockUserId, options))
        .resolves.toEqual(expect.arrayContaining([
          expect.objectContaining({
            type: 'steps',
            value: expect.any(Number),
          })
        ]));
    });

    test('getDataStats - データ統計の取得', async () => {
      // RED: この実装はまだ存在しない
      await expect(firestoreService.getDataStats(mockUserId, 'steps'))
        .resolves.toEqual(expect.objectContaining({
          totalRecords: expect.any(Number),
          averageValue: expect.any(Number),
          maxValue: expect.any(Number),
          minValue: expect.any(Number),
        }));
    });
  });

  describe('リアルタイム監視', () => {
    test('subscribeToUserProfile - ユーザープロファイル監視', () => {
      const mockCallback = jest.fn();
      
      // RED: この実装はまだ存在しない
      expect(() => {
        const unsubscribe = firestoreService.subscribeToUserProfile(mockUserId, mockCallback);
        expect(typeof unsubscribe).toBe('function');
      }).not.toThrow();
    });

    test('subscribeToVitalData - バイタルデータ監視', () => {
      const mockCallback = jest.fn();
      
      // RED: この実装はまだ存在しない
      expect(() => {
        const unsubscribe = firestoreService.subscribeToVitalData(mockUserId, mockCallback);
        expect(typeof unsubscribe).toBe('function');
      }).not.toThrow();
    });
  });

  describe('バッチ操作', () => {
    test('batchWrite - バッチ書き込み操作', async () => {
      const operations = [
        {
          type: 'create' as const,
          collection: 'vital_data',
          data: mockVitalData
        },
        {
          type: 'update' as const,
          collection: 'user_profiles',
          docId: mockUserId,
          data: { fullName: '更新されたユーザー' }
        }
      ];

      // RED: この実装はまだ存在しない
      await expect(firestoreService.batchWrite(operations))
        .resolves.toBeUndefined();
    });
  });

  describe('エラーハンドリング', () => {
    test('Firebase エラーのハンドリング', async () => {
      // RED: この実装はまだ存在しない
      // 存在しないコレクションにアクセスした場合のエラーハンドリング
      await expect(firestoreService.getUserProfile('invalid-user'))
        .rejects.toThrow('ユーザー情報の取得に失敗しました');
    });

    test('ネットワークエラーのハンドリング', async () => {
      // RED: この実装はまだ存在しない
      // ネットワークエラーシミュレーション
      jest.mock('firebase/firestore', () => ({
        ...jest.requireActual('firebase/firestore'),
        getDoc: jest.fn().mockRejectedValue(new Error('Network error'))
      }));

      await expect(firestoreService.getUserProfile(mockUserId))
        .rejects.toThrow();
    });
  });

  describe('パフォーマンステスト', () => {
    test('大量データの処理性能', async () => {
      const startTime = Date.now();
      
      // RED: この実装はまだ存在しない
      // 1000件のデータを追加する性能テスト
      const promises = Array.from({ length: 1000 }, (_, i) => 
        firestoreService.addVitalData({
          ...mockVitalData,
          value: i,
        })
      );

      await expect(Promise.all(promises)).resolves.toBeDefined();
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // 5秒以内に完了することを期待
      expect(executionTime).toBeLessThan(5000);
    });
  });
});