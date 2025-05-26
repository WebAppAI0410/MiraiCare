// TDD Phase 2: データ統合テスト
// RED フェーズ: エンドツーエンドのデータフロー統合テスト

import { renderHook, act } from '@testing-library/react-native';
import { useStepCounter } from '../../src/hooks/useStepCounter';
import { firestoreService } from '../../src/services/firestoreService';
import { sensorService } from '../../src/services/sensorService';
import { signUpWithEmail, signInWithEmail } from '../../src/services/authService';
import type { UserProfile, StepCountData } from '../../src/types/userData';

// 統合テスト用のモック設定
jest.mock('../../src/config/firebase', () => ({
  db: {},
  auth: {},
  COLLECTIONS: {
    USER_PROFILES: 'user_profiles',
    VITAL_DATA: 'vital_data',
  }
}));

// Firebase SDK のモック
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn().mockResolvedValue({ id: 'mock-doc-id' }),
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
  writeBatch: jest.fn(() => ({
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    commit: jest.fn(),
  })),
}));

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  updateProfile: jest.fn(),
}));

jest.mock('expo-sensors', () => ({
  Pedometer: {
    isAvailableAsync: jest.fn().mockResolvedValue(true),
    getStepCountAsync: jest.fn().mockResolvedValue({ steps: 5000 }),
    watchStepCount: jest.fn(),
    requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true, status: 'granted' }),
  },
}));

describe('データフロー統合テスト', () => {
  const testUser = {
    email: 'test@miraicare.com',
    password: 'password123',
    fullName: 'テストユーザー',
    age: 65,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('完全なユーザージャーニー', () => {
    test('ユーザー登録→歩数取得→データ保存→取得確認の完全フロー', async () => {
      // Step 1: ユーザー登録
      const mockUser: UserProfile = {
        id: 'test-user-123',
        email: testUser.email,
        fullName: testUser.fullName,
        age: testUser.age,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // 認証モックの設定
      const mockAuthResult = {
        user: { uid: 'test-user-123', email: testUser.email, displayName: testUser.fullName }
      };
      
      jest.mocked(require('firebase/auth').createUserWithEmailAndPassword)
        .mockResolvedValue(mockAuthResult);
      jest.mocked(require('firebase/auth').updateProfile).mockResolvedValue(undefined);

      // Step 2: ユーザー登録実行
      const registeredUser = await signUpWithEmail(
        testUser.email,
        testUser.password,
        testUser.fullName
      );

      expect(registeredUser).toEqual(expect.objectContaining({
        id: 'test-user-123',
        email: testUser.email,
        fullName: testUser.fullName,
      }));

      // Step 3: ユーザープロファイルをFirestoreに保存
      const userProfileId = await firestoreService.createUserProfile(mockUser);
      expect(userProfileId).toBeDefined();

      // Step 4: 歩数計Hookの初期化
      const { result } = renderHook(() => useStepCounter(mockUser.id, {
        autoStart: false,
        autoSave: true,
      }));

      // Step 5: センサー権限要求
      await act(async () => {
        await result.current.requestPermission();
      });

      expect(result.current.permissionStatus).toBe('granted');

      // Step 6: 現在の歩数取得
      await act(async () => {
        await result.current.fetchCurrentSteps();
      });

      expect(result.current.steps).toBe(5000);

      // Step 7: データをFirestoreに保存
      await act(async () => {
        await result.current.saveToFirestore();
      });

      // Step 8: 保存されたデータの確認
      const today = new Date().toISOString().split('T')[0];
      await act(async () => {
        await result.current.loadFromFirestore(today);
      });

      expect(result.current.steps).toBe(5000);
      expect(result.current.todayData).toEqual(expect.objectContaining({
        userId: mockUser.id,
        steps: 5000,
        date: today,
      }));
    });
  });

  describe('リアルタイムデータ同期', () => {
    test('センサー監視→リアルタイム更新→自動保存のフロー', async () => {
      const userId = 'test-user-realtime';
      let stepCountCallback: (data: { steps: number; timestamp: Date }) => void;

      // Pedometerモックの設定
      jest.mocked(require('expo-sensors').Pedometer.watchStepCount)
        .mockImplementation((callback) => {
          stepCountCallback = callback;
          return { remove: jest.fn() };
        });

      const { result } = renderHook(() => useStepCounter(userId, {
        autoSave: true,
        autoSaveInterval: 100,
      }));

      // 権限要求
      await act(async () => {
        await result.current.requestPermission();
      });

      // リアルタイム監視開始
      act(() => {
        result.current.startMonitoring();
      });

      expect(result.current.isMonitoring).toBe(true);

      // センサーからのデータ更新をシミュレート
      await act(async () => {
        stepCountCallback!({ steps: 1500, timestamp: new Date() });
        await new Promise(resolve => setTimeout(resolve, 150)); // 自動保存待機
      });

      expect(result.current.steps).toBe(1500);

      // 自動保存の確認（モックが呼ばれたかチェック）
      expect(require('firebase/firestore').addDoc).toHaveBeenCalled();
    });
  });

  describe('データ一貫性テスト', () => {
    test('複数のデータソースからの一貫性確保', async () => {
      const userId = 'test-user-consistency';

      // 異なるタイミングでの歩数データ
      const sensorData = { steps: 3000 };
      const firestoreData: StepCountData = {
        userId,
        steps: 2500,
        date: '2024-01-15',
        startTime: new Date('2024-01-15T00:00:00'),
        endTime: new Date('2024-01-15T23:59:59'),
        timestamp: Date.now(),
      };

      // Firestoreモックの設定
      jest.spyOn(firestoreService, 'getStepCountByDate')
        .mockResolvedValue(firestoreData);

      // センサーモックの設定
      jest.spyOn(sensorService, 'getCurrentStepCount')
        .mockResolvedValue({
          data: sensorData,
          error: null,
          timestamp: new Date(),
        });

      const { result } = renderHook(() => useStepCounter(userId));

      // Firestoreからデータロード
      await act(async () => {
        await result.current.loadFromFirestore('2024-01-15');
      });

      expect(result.current.steps).toBe(2500); // Firestoreの値

      // センサーから最新データ取得
      await act(async () => {
        await result.current.fetchCurrentSteps();
      });

      expect(result.current.steps).toBe(3000); // センサーの値に更新
    });
  });

  describe('エラー復旧とフォルトトレランス', () => {
    test('ネットワークエラー→復旧→データ同期のフロー', async () => {
      const userId = 'test-user-error-recovery';

      // 最初はエラーを返すように設定
      let shouldError = true;
      jest.spyOn(firestoreService, 'addStepCount')
        .mockImplementation(async () => {
          if (shouldError) {
            throw new Error('ネットワークエラー');
          }
          return 'success-id';
        });

      const { result } = renderHook(() => useStepCounter(userId));

      // 歩数設定
      act(() => {
        result.current.setSteps(4000);
      });

      // 保存試行（エラーになる）
      await act(async () => {
        await result.current.saveToFirestore();
      });

      expect(result.current.error).toContain('データの保存に失敗しました');

      // ネットワーク復旧をシミュレート
      shouldError = false;

      // 再試行
      await act(async () => {
        await result.current.saveToFirestore();
      });

      // エラーがクリアされることを確認
      expect(result.current.error).toBeNull();
    });
  });

  describe('権限管理統合テスト', () => {
    test('権限拒否→再要求→機能復旧のフロー', async () => {
      const userId = 'test-user-permission';
      
      // 最初は権限拒否
      jest.mocked(require('expo-sensors').Pedometer.requestPermissionsAsync)
        .mockResolvedValueOnce({ granted: false, status: 'denied' });

      const { result } = renderHook(() => useStepCounter(userId));

      // 権限要求（拒否される）
      await act(async () => {
        await result.current.requestPermission();
      });

      expect(result.current.permissionStatus).toBe('denied');
      expect(result.current.error).toContain('権限が拒否されました');

      // 権限許可に変更
      jest.mocked(require('expo-sensors').Pedometer.requestPermissionsAsync)
        .mockResolvedValueOnce({ granted: true, status: 'granted' });

      // 再要求
      await act(async () => {
        await result.current.requestPermission();
      });

      expect(result.current.permissionStatus).toBe('granted');
      expect(result.current.error).toBeNull();

      // 機能が使用可能になることを確認
      await act(async () => {
        await result.current.fetchCurrentSteps();
      });

      expect(result.current.steps).toBe(5000);
    });
  });

  describe('週間データ統合テスト', () => {
    test('週間データ取得→統計計算→表示の統合フロー', async () => {
      const userId = 'test-user-weekly';
      
      // 週間データモック
      const weeklyMockData = [
        { userId, steps: 4000, date: '2024-01-15', startTime: new Date(), endTime: new Date(), timestamp: Date.now() },
        { userId, steps: 5000, date: '2024-01-16', startTime: new Date(), endTime: new Date(), timestamp: Date.now() },
        { userId, steps: 6000, date: '2024-01-17', startTime: new Date(), endTime: new Date(), timestamp: Date.now() },
      ];

      jest.spyOn(sensorService, 'getWeeklyStepCount')
        .mockResolvedValue({
          data: weeklyMockData,
          error: null,
          timestamp: new Date(),
        });

      const { result } = renderHook(() => useStepCounter(userId));

      // 週間データ取得
      await act(async () => {
        await result.current.fetchWeeklySteps();
      });

      expect(result.current.weeklyData).toHaveLength(3);
      expect(result.current.weeklyData?.[0].steps).toBe(4000);
      expect(result.current.weeklyData?.[2].steps).toBe(6000);

      // 統計情報取得
      const stats = await firestoreService.getDataStats(userId, 'steps');
      
      expect(stats).toEqual(expect.objectContaining({
        totalRecords: expect.any(Number),
        averageValue: expect.any(Number),
        maxValue: expect.any(Number),
        minValue: expect.any(Number),
      }));
    });
  });

  describe('バッチ操作統合テスト', () => {
    test('複数データの一括処理', async () => {
      const userId = 'test-user-batch';
      
      const batchOperations = [
        {
          type: 'create' as const,
          collection: 'vital_data',
          data: {
            userId,
            type: 'steps',
            value: 3000,
            unit: 'steps',
            source: 'sensor',
            measuredAt: new Date(),
          }
        },
        {
          type: 'create' as const,
          collection: 'vital_data',
          data: {
            userId,
            type: 'steps',
            value: 4000,
            unit: 'steps',
            source: 'sensor',
            measuredAt: new Date(),
          }
        }
      ];

      // バッチ処理実行
      await expect(firestoreService.batchWrite(batchOperations))
        .resolves.toBeUndefined();

      // Firestoreモックが適切に呼ばれたことを確認
      expect(require('firebase/firestore').writeBatch).toHaveBeenCalled();
    });
  });

  describe('リソース管理とクリーンアップ', () => {
    test('Hook アンマウント時のリソース解放', () => {
      const userId = 'test-user-cleanup';
      
      const mockSubscription = { remove: jest.fn() };
      jest.mocked(require('expo-sensors').Pedometer.watchStepCount)
        .mockReturnValue(mockSubscription);

      const { result, unmount } = renderHook(() => useStepCounter(userId));

      // 監視開始
      act(() => {
        result.current.startMonitoring();
      });

      expect(result.current.isMonitoring).toBe(true);

      // Hook アンマウント
      unmount();

      // リソースが解放されることを確認
      expect(mockSubscription.remove).toHaveBeenCalled();
    });
  });
});