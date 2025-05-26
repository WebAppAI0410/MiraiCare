// Firestoreサービステスト（TDD Phase 2）

import { 
  createUserProfile, 
  getUserProfile, 
  updateUserProfile, 
  deleteUserProfile,
  saveVitalData,
  getVitalData,
  getUserVitalHistory 
} from '../../src/services/firestoreService';
import { UserProfile, VitalData } from '../../src/types/userData';

// モックの設定
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

// Firestore関数のモック
const mockAddDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockUpdateDoc = jest.fn();
const mockDeleteDoc = jest.fn();
const mockCollection = jest.fn();
const mockDoc = jest.fn();
const mockQuery = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockGetDocs = jest.fn();
const mockServerTimestamp = jest.fn(() => new Date());

jest.mock('firebase/firestore', () => ({
  addDoc: (collection: any, data: any) => mockAddDoc(collection, data),
  getDoc: (docRef: any) => mockGetDoc(docRef),
  updateDoc: (docRef: any, data: any) => mockUpdateDoc(docRef, data),
  deleteDoc: (docRef: any) => mockDeleteDoc(docRef),
  collection: (db: any, path: string) => mockCollection(db, path),
  doc: (db: any, path: string, id: string) => mockDoc(db, path, id),
  query: (...args: any[]) => mockQuery(...args),
  where: (field: string, op: string, value: any) => mockWhere(field, op, value),
  orderBy: (field: string, direction?: string) => mockOrderBy(field, direction),
  getDocs: (query: any) => mockGetDocs(query),
  serverTimestamp: () => mockServerTimestamp(),
}));

describe('FirestoreService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UserProfile関連', () => {
    const mockUserProfile: UserProfile = {
      id: 'user123',
      name: '田中太郎',
      age: 75,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    describe('createUserProfile', () => {
      it('新しいユーザープロファイルを作成できる', async () => {
        // Given: モックが成功を返すように設定
        mockAddDoc.mockResolvedValue({ id: 'user123' });

        // When: ユーザープロファイルを作成
        const result = await createUserProfile({
          name: '田中太郎',
          age: 75,
        });

        // Then: 正しく作成される
        expect(result).toBe('user123');
        expect(mockAddDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            name: '田中太郎',
            age: 75,
            createdAt: expect.any(Object), // serverTimestampはObjectを返す
            updatedAt: expect.any(Object), // serverTimestampはObjectを返す
          })
        );
      });

      it('Firestoreエラー時に適切なエラーを投げる', async () => {
        // Given: Firestoreエラーを設定
        mockAddDoc.mockRejectedValue(new Error('Firestore error'));

        // When & Then: エラーが投げられる
        await expect(createUserProfile({ name: '田中太郎', age: 75 }))
          .rejects
          .toThrow('ユーザープロファイルの作成に失敗しました');
      });
    });

    describe('getUserProfile', () => {
      it('ユーザープロファイルを取得できる', async () => {
        // Given: モックがデータを返すように設定
        mockGetDoc.mockResolvedValue({
          exists: () => true,
          id: 'user123',
          data: () => ({
            name: '田中太郎',
            age: 75,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          }),
        });

        // When: ユーザープロファイルを取得
        const result = await getUserProfile('user123');

        // Then: 正しく取得される
        expect(result).toEqual(mockUserProfile);
        expect(mockGetDoc).toHaveBeenCalled();
      });

      it('存在しないユーザーの場合nullを返す', async () => {
        // Given: ドキュメントが存在しない
        mockGetDoc.mockResolvedValue({
          exists: () => false,
        });

        // When: 存在しないユーザーを取得
        const result = await getUserProfile('nonexistent');

        // Then: nullが返される
        expect(result).toBeNull();
      });
    });

    describe('updateUserProfile', () => {
      it('ユーザープロファイルを更新できる', async () => {
        // Given: モックが成功を返すように設定
        mockUpdateDoc.mockResolvedValue(undefined);

        // When: ユーザープロファイルを更新
        await updateUserProfile('user123', { name: '田中次郎', age: 76 });

        // Then: 正しく更新される
        expect(mockUpdateDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            name: '田中次郎',
            age: 76,
            updatedAt: expect.any(Date),
          })
        );
      });
    });

    describe('deleteUserProfile', () => {
      it('ユーザープロファイルを削除できる', async () => {
        // Given: モックが成功を返すように設定
        mockDeleteDoc.mockResolvedValue(undefined);

        // When: ユーザープロファイルを削除
        await deleteUserProfile('user123');

        // Then: 正しく削除される
        expect(mockDeleteDoc).toHaveBeenCalled();
      });
    });
  });

  describe('VitalData関連', () => {
    const mockVitalData: VitalData = {
      userId: 'user123',
      steps: 5000,
      date: '2024-01-01',
      timestamp: Date.now(),
    };

    describe('saveVitalData', () => {
      it('バイタルデータを保存できる', async () => {
        // Given: モックが成功を返すように設定
        mockAddDoc.mockResolvedValue({ id: 'vital123' });

        // When: バイタルデータを保存
        const result = await saveVitalData(mockVitalData);

        // Then: 正しく保存される
        expect(result).toBe('vital123');
        expect(mockAddDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            ...mockVitalData,
            createdAt: expect.any(Date),
          })
        );
      });
    });

    describe('getVitalData', () => {
      it('バイタルデータを取得できる', async () => {
        // Given: モックがデータを返すように設定
        mockGetDoc.mockResolvedValue({
          exists: () => true,
          id: 'vital123',
          data: () => ({
            ...mockVitalData,
            createdAt: new Date(),
          }),
        });

        // When: バイタルデータを取得
        const result = await getVitalData('vital123');

        // Then: 正しく取得される
        expect(result).toEqual(expect.objectContaining(mockVitalData));
      });
    });

    describe('getUserVitalHistory', () => {
      it('ユーザーのバイタルデータ履歴を取得できる', async () => {
        // Given: モックが履歴データを返すように設定
        const mockDocs = [
          {
            id: 'vital1',
            data: () => ({ ...mockVitalData, date: '2024-01-01' }),
          },
          {
            id: 'vital2', 
            data: () => ({ ...mockVitalData, date: '2024-01-02' }),
          },
        ];
        
        mockGetDocs.mockResolvedValue({
          docs: mockDocs,
        });

        // When: バイタルデータ履歴を取得
        const result = await getUserVitalHistory('user123', 7); // 7日間

        // Then: 正しく取得される
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual(expect.objectContaining({ id: 'vital1' }));
        expect(result[1]).toEqual(expect.objectContaining({ id: 'vital2' }));
      });
    });
  });
});