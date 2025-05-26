import { db, auth, COLLECTIONS } from '../../src/config/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  getDocs
} from 'firebase/firestore';

// Firebase設定をテスト
describe('Firebase Configuration', () => {
  it('Firebaseクライアントが正常に初期化される', () => {
    expect(db).toBeDefined();
    expect(auth).toBeDefined();
  });

  it('認証メソッドが利用可能である', () => {
    expect(auth).toBeDefined();
    // Firebase Authの主要メソッドは、直接auth.signInWithEmailAndPasswordのように呼び出すので
    // ここではauthオブジェクトの存在のみを確認
  });

  it('Firestoreメソッドが利用可能である', () => {
    expect(typeof collection).toBe('function');
    expect(typeof doc).toBe('function');
    expect(typeof addDoc).toBe('function');
    expect(typeof getDoc).toBe('function');
    expect(typeof updateDoc).toBe('function');
    expect(typeof deleteDoc).toBe('function');
  });

  describe('Firestore操作のモック', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('ユーザーデータの取得をモックできる', async () => {
      // FirestoreのgetDocメソッドをモック
      const mockGetDoc = jest.mocked(getDoc);
      mockGetDoc.mockResolvedValue({
        exists: () => true,
        id: 'user-123',
        data: () => ({
          email: 'test@example.com',
          fullName: 'テストユーザー',
          createdAt: new Date('2024-01-01T00:00:00Z'),
        }),
      } as any);

      const userDocRef = doc(db, COLLECTIONS.USERS, 'user-123');
      const docSnap = await getDoc(userDocRef);

      expect(docSnap.exists()).toBe(true);
      expect(docSnap.data()).toEqual({
        email: 'test@example.com',
        fullName: 'テストユーザー',
        createdAt: new Date('2024-01-01T00:00:00Z'),
      });
    });

    it('バイタルデータの挿入をモックできる', async () => {
      const mockAddDoc = jest.mocked(addDoc);
      mockAddDoc.mockResolvedValue({
        id: 'vital-123',
      } as any);

      const vitalData = {
        userId: 'user-123',
        type: 'steps' as const,
        value: 8500,
        unit: 'steps',
        measuredAt: new Date('2024-01-01T12:00:00Z'),
      };

      const vitalsCollection = collection(db, COLLECTIONS.VITALS);
      const docRef = await addDoc(vitalsCollection, vitalData);

      expect(mockAddDoc).toHaveBeenCalledWith(vitalsCollection, vitalData);
      expect(docRef.id).toBe('vital-123');
    });

    it('気分データの更新をモックできる', async () => {
      const mockUpdateDoc = jest.mocked(updateDoc);
      mockUpdateDoc.mockResolvedValue(undefined);

      const moodDocRef = doc(db, COLLECTIONS.MOODS, 'mood-123');
      await updateDoc(moodDocRef, { intensity: 5 });

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        moodDocRef,
        { intensity: 5 }
      );
    });

    it('データの削除をモックできる', async () => {
      const mockDeleteDoc = jest.mocked(deleteDoc);
      mockDeleteDoc.mockResolvedValue(undefined);

      const reminderDocRef = doc(db, COLLECTIONS.REMINDERS, 'reminder-123');
      await deleteDoc(reminderDocRef);

      expect(mockDeleteDoc).toHaveBeenCalledWith(reminderDocRef);
    });
  });

  describe('クエリ操作のモック', () => {
    it('条件付きクエリをモックできる', async () => {
      const mockGetDocs = jest.mocked(getDocs);
      mockGetDocs.mockResolvedValue({
        docs: [
          {
            id: 'vital-1',
            data: () => ({
              userId: 'user-123',
              type: 'steps',
              value: 5000,
              measuredAt: new Date('2024-01-01'),
            }),
          },
          {
            id: 'vital-2',
            data: () => ({
              userId: 'user-123',
              type: 'steps',
              value: 7000,
              measuredAt: new Date('2024-01-02'),
            }),
          },
        ],
        empty: false,
        size: 2,
      } as any);

      const vitalsCollection = collection(db, COLLECTIONS.VITALS);
      const q = query(
        vitalsCollection,
        where('userId', '==', 'user-123'),
        where('type', '==', 'steps')
      );
      
      const querySnapshot = await getDocs(q);
      
      expect(querySnapshot.size).toBe(2);
      expect(querySnapshot.docs[0].data().value).toBe(5000);
    });
  });

  describe('エラーハンドリング', () => {
    it('ドキュメントが存在しない場合を適切に処理する', async () => {
      const mockGetDoc = jest.mocked(getDoc);
      mockGetDoc.mockResolvedValue({
        exists: () => false,
        id: 'non-existent',
        data: () => undefined,
      } as any);

      const userDocRef = doc(db, COLLECTIONS.USERS, 'non-existent');
      const docSnap = await getDoc(userDocRef);

      expect(docSnap.exists()).toBe(false);
      expect(docSnap.data()).toBeUndefined();
    });

    it('Firestoreエラーを適切に処理する', async () => {
      const mockAddDoc = jest.mocked(addDoc);
      mockAddDoc.mockRejectedValue(new Error('Permission denied'));

      const vitalsCollection = collection(db, COLLECTIONS.VITALS);
      
      await expect(
        addDoc(vitalsCollection, { userId: 'user-123' })
      ).rejects.toThrow('Permission denied');
    });
  });

  describe('バッチ操作のモック', () => {
    it('複数のドキュメントを一度に取得できる', async () => {
      const mockGetDocs = jest.mocked(getDocs);
      mockGetDocs.mockResolvedValue({
        docs: Array.from({ length: 10 }, (_, i) => ({
          id: `reminder-${i}`,
          data: () => ({
            userId: 'user-123',
            type: 'water',
            title: `リマインダー ${i}`,
            completed: false,
          }),
        })),
        empty: false,
        size: 10,
      } as any);

      const remindersCollection = collection(db, COLLECTIONS.REMINDERS);
      const q = query(remindersCollection, where('userId', '==', 'user-123'));
      const querySnapshot = await getDocs(q);

      expect(querySnapshot.size).toBe(10);
      expect(querySnapshot.docs[0].data().title).toBe('リマインダー 0');
    });
  });
});