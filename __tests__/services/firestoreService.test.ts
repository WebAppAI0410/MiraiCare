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
import * as firestore from 'firebase/firestore';

// Firebaseモックの設定
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

// Firestoreをモック
jest.mock('firebase/firestore');

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
        // Given: モックの設定
        const mockDocRef = { id: 'user123' };
        (firestore.addDoc as jest.Mock).mockResolvedValue(mockDocRef);
        (firestore.collection as jest.Mock).mockReturnValue('mock-collection');
        (firestore.serverTimestamp as jest.Mock).mockReturnValue('timestamp');

        // When: ユーザープロファイルを作成
        const result = await createUserProfile({
          name: '田中太郎',
          age: 75,
        });

        // Then: 正しく作成される
        expect(result).toBe('user123');
        expect(firestore.collection).toHaveBeenCalledWith({}, 'userProfiles');
        expect(firestore.addDoc).toHaveBeenCalledWith(
          'mock-collection',
          expect.objectContaining({
            name: '田中太郎',
            age: 75,
            createdAt: 'timestamp',
            updatedAt: 'timestamp',
          })
        );
      });

      it('Firestoreエラー時に適切なエラーを投げる', async () => {
        // Given: Firestoreエラーを設定
        (firestore.addDoc as jest.Mock).mockRejectedValue(new Error('Firestore error'));
        (firestore.collection as jest.Mock).mockReturnValue('mock-collection');

        // When & Then: エラーが投げられる
        await expect(createUserProfile({ name: '田中太郎', age: 75 }))
          .rejects
          .toThrow('ユーザープロファイルの作成に失敗しました');
      });
    });

    describe('getUserProfile', () => {
      it('ユーザープロファイルを取得できる', async () => {
        // Given: モックの設定
        const mockDocSnap = {
          id: 'user123',
          exists: () => true,
          data: () => ({
            name: '田中太郎',
            age: 75,
            createdAt: new Date('2024-01-01'),
            updatedAt: new Date('2024-01-01'),
          }),
        };
        (firestore.getDoc as jest.Mock).mockResolvedValue(mockDocSnap);
        (firestore.doc as jest.Mock).mockReturnValue('mock-doc-ref');

        // When: ユーザープロファイルを取得
        const result = await getUserProfile('user123');

        // Then: 正しく取得される
        expect(result).toEqual(mockUserProfile);
        expect(firestore.doc).toHaveBeenCalledWith({}, 'userProfiles', 'user123');
        expect(firestore.getDoc).toHaveBeenCalledWith('mock-doc-ref');
      });

      it('存在しないユーザーの場合nullを返す', async () => {
        // Given: ドキュメントが存在しない
        const mockDocSnap = {
          exists: () => false,
        };
        (firestore.getDoc as jest.Mock).mockResolvedValue(mockDocSnap);
        (firestore.doc as jest.Mock).mockReturnValue('mock-doc-ref');

        // When: 存在しないユーザーを取得
        const result = await getUserProfile('nonexistent');

        // Then: nullが返される
        expect(result).toBeNull();
      });

      it('Firestoreエラー時に適切なエラーを投げる', async () => {
        // Given: Firestoreエラーを設定
        (firestore.getDoc as jest.Mock).mockRejectedValue(new Error('Firestore error'));
        (firestore.doc as jest.Mock).mockReturnValue('mock-doc-ref');

        // When & Then: エラーが投げられる
        await expect(getUserProfile('user123'))
          .rejects
          .toThrow('ユーザープロファイルの取得に失敗しました');
      });
    });

    describe('updateUserProfile', () => {
      it('ユーザープロファイルを更新できる', async () => {
        // Given: モックの設定
        (firestore.updateDoc as jest.Mock).mockResolvedValue(undefined);
        (firestore.doc as jest.Mock).mockReturnValue('mock-doc-ref');
        (firestore.serverTimestamp as jest.Mock).mockReturnValue('timestamp');

        // When: ユーザープロファイルを更新
        await updateUserProfile('user123', {
          name: '田中次郎',
          age: 76,
        });

        // Then: 正しく更新される
        expect(firestore.doc).toHaveBeenCalledWith({}, 'userProfiles', 'user123');
        expect(firestore.updateDoc).toHaveBeenCalledWith(
          'mock-doc-ref',
          expect.objectContaining({
            name: '田中次郎',
            age: 76,
            updatedAt: 'timestamp',
          })
        );
      });

      it('Firestoreエラー時に適切なエラーを投げる', async () => {
        // Given: Firestoreエラーを設定
        (firestore.updateDoc as jest.Mock).mockRejectedValue(new Error('Firestore error'));
        (firestore.doc as jest.Mock).mockReturnValue('mock-doc-ref');

        // When & Then: エラーが投げられる
        await expect(updateUserProfile('user123', { name: '田中次郎' }))
          .rejects
          .toThrow('ユーザープロファイルの更新に失敗しました');
      });
    });

    describe('deleteUserProfile', () => {
      it('ユーザープロファイルを削除できる', async () => {
        // Given: モックの設定
        (firestore.deleteDoc as jest.Mock).mockResolvedValue(undefined);
        (firestore.doc as jest.Mock).mockReturnValue('mock-doc-ref');

        // When: ユーザープロファイルを削除
        await deleteUserProfile('user123');

        // Then: 正しく削除される
        expect(firestore.doc).toHaveBeenCalledWith({}, 'userProfiles', 'user123');
        expect(firestore.deleteDoc).toHaveBeenCalledWith('mock-doc-ref');
      });

      it('Firestoreエラー時に適切なエラーを投げる', async () => {
        // Given: Firestoreエラーを設定
        (firestore.deleteDoc as jest.Mock).mockRejectedValue(new Error('Firestore error'));
        (firestore.doc as jest.Mock).mockReturnValue('mock-doc-ref');

        // When & Then: エラーが投げられる
        await expect(deleteUserProfile('user123'))
          .rejects
          .toThrow('ユーザープロファイルの削除に失敗しました');
      });
    });
  });

  describe('VitalData関連', () => {
    const mockVitalData: VitalData = {
      userId: 'user123',
      date: '2024-01-01',
      steps: 5000,
      timestamp: Date.now(),
    };

    describe('saveVitalData', () => {
      it('バイタルデータを保存できる', async () => {
        // Given: モックの設定
        const mockDocRef = { id: 'vital123' };
        (firestore.addDoc as jest.Mock).mockResolvedValue(mockDocRef);
        (firestore.collection as jest.Mock).mockReturnValue('mock-collection');
        (firestore.serverTimestamp as jest.Mock).mockReturnValue('timestamp');

        // When: バイタルデータを保存
        const result = await saveVitalData(mockVitalData);

        // Then: 正しく保存される
        expect(result).toBe('vital123');
        expect(firestore.collection).toHaveBeenCalledWith({}, 'vitalData');
        expect(firestore.addDoc).toHaveBeenCalledWith(
          'mock-collection',
          expect.objectContaining({
            ...mockVitalData,
            createdAt: 'timestamp',
          })
        );
      });

      it('Firestoreエラー時に適切なエラーを投げる', async () => {
        // Given: Firestoreエラーを設定
        (firestore.addDoc as jest.Mock).mockRejectedValue(new Error('Firestore error'));
        (firestore.collection as jest.Mock).mockReturnValue('mock-collection');

        // When & Then: エラーが投げられる
        await expect(saveVitalData(mockVitalData))
          .rejects
          .toThrow('バイタルデータの保存に失敗しました');
      });
    });

    describe('getVitalData', () => {
      it('バイタルデータを取得できる', async () => {
        // Given: モックの設定
        const mockDocSnap = {
          exists: () => true,
          id: 'vital123',
          data: () => ({
            ...mockVitalData,
            createdAt: { toDate: () => new Date('2024-01-01') }
          }),
        };
        (firestore.getDoc as jest.Mock).mockResolvedValue(mockDocSnap);
        (firestore.doc as jest.Mock).mockReturnValue('mock-doc-ref');

        // When: バイタルデータを取得
        const result = await getVitalData('vital123');

        // Then: 正しく取得される
        expect(result).toEqual({ 
          id: 'vital123', 
          ...mockVitalData,
          createdAt: new Date('2024-01-01')
        });
        expect(firestore.doc).toHaveBeenCalledWith({}, 'vitalData', 'vital123');
        expect(firestore.getDoc).toHaveBeenCalledWith('mock-doc-ref');
      });

      it('存在しないデータの場合nullを返す', async () => {
        // Given: ドキュメントが存在しない
        const mockDocSnap = {
          exists: () => false,
        };
        (firestore.getDoc as jest.Mock).mockResolvedValue(mockDocSnap);
        (firestore.doc as jest.Mock).mockReturnValue('mock-doc-ref');

        // When: 存在しないデータを取得
        const result = await getVitalData('nonexistent');

        // Then: nullが返される
        expect(result).toBeNull();
      });
    });

    describe('getUserVitalHistory', () => {
      it('ユーザーのバイタルデータ履歴を取得できる', async () => {
        // Given: モックの設定
        const mockDocs = [
          {
            id: 'vital1',
            data: () => ({ 
              ...mockVitalData, 
              date: '2024-01-01',
              createdAt: { toDate: () => new Date('2024-01-01') }
            }),
          },
          {
            id: 'vital2', 
            data: () => ({ 
              ...mockVitalData, 
              date: '2024-01-02',
              createdAt: { toDate: () => new Date('2024-01-02') }
            }),
          },
        ];
        const mockQuerySnapshot = {
          docs: mockDocs,
          empty: false,
          size: 2,
        };
        (firestore.getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);
        (firestore.collection as jest.Mock).mockReturnValue('mock-collection');
        (firestore.query as jest.Mock).mockReturnValue('mock-query');
        (firestore.where as jest.Mock).mockReturnValue('mock-where');
        (firestore.orderBy as jest.Mock).mockReturnValue('mock-orderby');
        (firestore.limit as jest.Mock).mockReturnValue('mock-limit');

        // When: 履歴を取得
        const result = await getUserVitalHistory('user123', 30);

        // Then: 正しく取得される
        expect(result).toHaveLength(2);
        expect(result[0]).toEqual({
          id: 'vital1',
          ...mockVitalData,
          date: '2024-01-01',
          createdAt: new Date('2024-01-01')
        });
        expect(firestore.query).toHaveBeenCalled();
        expect(firestore.where).toHaveBeenCalledWith('userId', '==', 'user123');
      });

      it('データがない場合は空配列を返す', async () => {
        // Given: 空の結果
        const mockQuerySnapshot = {
          docs: [],
          empty: true,
          size: 0,
        };
        (firestore.getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);
        (firestore.collection as jest.Mock).mockReturnValue('mock-collection');
        (firestore.query as jest.Mock).mockReturnValue('mock-query');

        // When: 履歴を取得
        const result = await getUserVitalHistory('user123', 30);

        // Then: 空配列が返される
        expect(result).toEqual([]);
      });
    });
  });
});