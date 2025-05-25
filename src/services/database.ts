import {
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  WriteBatch,
  writeBatch,
  runTransaction,
  Unsubscribe
} from 'firebase/firestore';

import { db } from '../config/firebase';
import {
  usersCollection,
  vitalsCollection,
  moodsCollection,
  remindersCollection,
  badgesCollection,
  userBadgesCollection,
  medicationsCollection,
  medicationLogsCollection,
  emergencyContactsCollection,
  healthReportsCollection,
  userDocument,
  vitalDocument,
  moodDocument,
  reminderDocument,
  handleFirestoreError,
  BATCH_SIZE
} from '../config/firestore';

import {
  User,
  VitalData,
  MoodData,
  Reminder,
  Badge,
  UserBadge,
  Medication,
  MedicationLog,
  EmergencyContact,
  HealthReport,
  QueryOptions,
  DatabaseResponse,
  ListResponse
} from '../types/database';

// ベースCRUDサービスクラス
class BaseService<T extends { id: string }> {
  constructor(private getCollectionRef: () => any, private getDocumentRef: (id: string) => any) {}

  // 作成
  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<DatabaseResponse<T>> {
    try {
      const docData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(this.getCollectionRef(), docData);
      const newDoc = await getDoc(docRef);
      
      if (newDoc.exists()) {
        return {
          success: true,
          data: { id: newDoc.id, ...newDoc.data() } as T,
          message: 'データを正常に作成しました。'
        };
      } else {
        throw new Error('作成されたドキュメントを取得できませんでした。');
      }
    } catch (error: any) {
      return {
        success: false,
        error: handleFirestoreError(error)
      };
    }
  }

  // 読み取り（単一）
  async getById(id: string): Promise<DatabaseResponse<T>> {
    try {
      const docRef = this.getDocumentRef(id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          success: true,
          data: { id: docSnap.id, ...docSnap.data() } as T
        };
      } else {
        return {
          success: false,
          error: 'データが見つかりません。'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: handleFirestoreError(error)
      };
    }
  }

  // 読み取り（複数）
  async getList(options?: QueryOptions): Promise<ListResponse<T>> {
    try {
      let q = query(this.getCollectionRef());

      // フィルター適用
      if (options?.filters) {
        for (const filter of options.filters) {
          q = query(q, where(filter.field, filter.operator, filter.value));
        }
      }

      // ソート適用
      if (options?.orderBy) {
        q = query(q, orderBy(options.orderBy.field, options.orderBy.direction));
      }

      // 制限適用
      if (options?.limit) {
        q = query(q, limit(options.limit));
      }

      // ページネーション
      if (options?.startAfter) {
        q = query(q, startAfter(options.startAfter));
      }

      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];

      return {
        success: true,
        data,
        total: querySnapshot.size,
        hasMore: querySnapshot.size === (options?.limit || 0)
      };
    } catch (error: any) {
      return {
        success: false,
        error: handleFirestoreError(error)
      };
    }
  }

  // 更新
  async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<DatabaseResponse<T>> {
    try {
      const docRef = this.getDocumentRef(id);
      const updateData = {
        ...data,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(docRef, updateData);
      
      // 更新後のデータを取得
      const updatedDoc = await getDoc(docRef);
      if (updatedDoc.exists()) {
        return {
          success: true,
          data: { id: updatedDoc.id, ...updatedDoc.data() } as T,
          message: 'データを正常に更新しました。'
        };
      } else {
        throw new Error('更新されたドキュメントを取得できませんでした。');
      }
    } catch (error: any) {
      return {
        success: false,
        error: handleFirestoreError(error)
      };
    }
  }

  // 削除
  async delete(id: string): Promise<DatabaseResponse<boolean>> {
    try {
      const docRef = this.getDocumentRef(id);
      await deleteDoc(docRef);
      
      return {
        success: true,
        data: true,
        message: 'データを正常に削除しました。'
      };
    } catch (error: any) {
      return {
        success: false,
        error: handleFirestoreError(error)
      };
    }
  }

  // リアルタイムリスナー
  subscribe(
    callback: (data: T[]) => void,
    options?: QueryOptions,
    errorCallback?: (error: string) => void
  ): Unsubscribe {
    let q = query(this.getCollectionRef());

    // フィルター適用
    if (options?.filters) {
      for (const filter of options.filters) {
        q = query(q, where(filter.field, filter.operator, filter.value));
      }
    }

    // ソート適用
    if (options?.orderBy) {
      q = query(q, orderBy(options.orderBy.field, options.orderBy.direction));
    }

    // 制限適用
    if (options?.limit) {
      q = query(q, limit(options.limit));
    }

    return onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as T[];
        callback(data);
      },
      (error) => {
        if (errorCallback) {
          errorCallback(handleFirestoreError(error));
        }
      }
    );
  }

  // 単一ドキュメントのリアルタイムリスナー
  subscribeToDocument(
    id: string,
    callback: (data: T | null) => void,
    errorCallback?: (error: string) => void
  ): Unsubscribe {
    const docRef = this.getDocumentRef(id);
    
    return onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          callback({ id: doc.id, ...doc.data() } as T);
        } else {
          callback(null);
        }
      },
      (error) => {
        if (errorCallback) {
          errorCallback(handleFirestoreError(error));
        }
      }
    );
  }
}

// 各エンティティのサービス
class UserService extends BaseService<User> {
  constructor() {
    super(usersCollection, userDocument);
  }

  // ユーザー固有のメソッド
  async getByEmail(email: string): Promise<DatabaseResponse<User>> {
    const result = await this.getList({
      filters: [{ field: 'email', operator: '==', value: email }],
      limit: 1
    });

    if (result.success && result.data && result.data.length > 0) {
      return {
        success: true,
        data: result.data[0]
      };
    } else {
      return {
        success: false,
        error: 'ユーザーが見つかりません。'
      };
    }
  }

  async updatePreferences(userId: string, preferences: User['preferences']): Promise<DatabaseResponse<User>> {
    return this.update(userId, { preferences });
  }
}

class VitalService extends BaseService<VitalData> {
  constructor() {
    super(vitalsCollection, vitalDocument);
  }

  // ユーザーのバイタルデータを取得
  async getUserVitals(userId: string, type?: string, limit?: number): Promise<ListResponse<VitalData>> {
    const filters = [{ field: 'userId', operator: '==', value: userId }];
    if (type) {
      filters.push({ field: 'type', operator: '==', value: type });
    }

    return this.getList({
      filters,
      orderBy: { field: 'measuredAt', direction: 'desc' },
      limit: limit || 50
    });
  }

  // 期間内のバイタルデータを取得
  async getUserVitalsByDateRange(
    userId: string,
    startDate: Timestamp,
    endDate: Timestamp,
    type?: string
  ): Promise<ListResponse<VitalData>> {
    const filters = [
      { field: 'userId', operator: '==', value: userId },
      { field: 'measuredAt', operator: '>=', value: startDate },
      { field: 'measuredAt', operator: '<=', value: endDate }
    ];

    if (type) {
      filters.push({ field: 'type', operator: '==', value: type });
    }

    return this.getList({
      filters,
      orderBy: { field: 'measuredAt', direction: 'desc' }
    });
  }
}

class MoodService extends BaseService<MoodData> {
  constructor() {
    super(moodsCollection, moodDocument);
  }

  // ユーザーの気分データを取得
  async getUserMoods(userId: string, limit?: number): Promise<ListResponse<MoodData>> {
    return this.getList({
      filters: [{ field: 'userId', operator: '==', value: userId }],
      orderBy: { field: 'recordedAt', direction: 'desc' },
      limit: limit || 30
    });
  }

  // 今日の気分データを取得
  async getTodayMood(userId: string): Promise<DatabaseResponse<MoodData>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await this.getList({
      filters: [
        { field: 'userId', operator: '==', value: userId },
        { field: 'recordedAt', operator: '>=', value: Timestamp.fromDate(today) },
        { field: 'recordedAt', operator: '<', value: Timestamp.fromDate(tomorrow) }
      ],
      orderBy: { field: 'recordedAt', direction: 'desc' },
      limit: 1
    });

    if (result.success && result.data && result.data.length > 0) {
      return {
        success: true,
        data: result.data[0]
      };
    } else {
      return {
        success: false,
        error: '今日の気分データが見つかりません。'
      };
    }
  }
}

class ReminderService extends BaseService<Reminder> {
  constructor() {
    super(remindersCollection, reminderDocument);
  }

  // アクティブなリマインダーを取得
  async getActiveReminders(userId: string): Promise<ListResponse<Reminder>> {
    return this.getList({
      filters: [
        { field: 'userId', operator: '==', value: userId },
        { field: 'isActive', operator: '==', value: true }
      ],
      orderBy: { field: 'scheduledTime', direction: 'asc' }
    });
  }

  // 今日のリマインダーを取得
  async getTodayReminders(userId: string): Promise<ListResponse<Reminder>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getList({
      filters: [
        { field: 'userId', operator: '==', value: userId },
        { field: 'isActive', operator: '==', value: true },
        { field: 'scheduledTime', operator: '>=', value: Timestamp.fromDate(today) },
        { field: 'scheduledTime', operator: '<', value: Timestamp.fromDate(tomorrow) }
      ],
      orderBy: { field: 'scheduledTime', direction: 'asc' }
    });
  }

  // リマインダーを完了としてマーク
  async markCompleted(reminderId: string): Promise<DatabaseResponse<Reminder>> {
    return this.update(reminderId, {
      completed: true,
      completedAt: serverTimestamp() as any
    });
  }

  // リマインダーをスヌーズ
  async snoozeReminder(reminderId: string, snoozeUntil: Timestamp): Promise<DatabaseResponse<Reminder>> {
    return this.update(reminderId, {
      snoozedUntil: snoozeUntil
    });
  }
}

class BadgeService extends BaseService<Badge> {
  constructor() {
    super(badgesCollection, () => {});
  }

  // 表示可能なバッジを取得
  async getVisibleBadges(): Promise<ListResponse<Badge>> {
    return this.getList({
      filters: [{ field: 'isVisible', operator: '==', value: true }],
      orderBy: { field: 'rarity', direction: 'asc' }
    });
  }

  // カテゴリ別バッジを取得
  async getBadgesByCategory(category: string): Promise<ListResponse<Badge>> {
    return this.getList({
      filters: [
        { field: 'category', operator: '==', value: category },
        { field: 'isVisible', operator: '==', value: true }
      ]
    });
  }
}

class UserBadgeService extends BaseService<UserBadge> {
  constructor() {
    super(userBadgesCollection, () => {});
  }

  // ユーザーのバッジを取得
  async getUserBadges(userId: string): Promise<ListResponse<UserBadge>> {
    return this.getList({
      filters: [{ field: 'userId', operator: '==', value: userId }],
      orderBy: { field: 'unlockedAt', direction: 'desc' }
    });
  }

  // ユーザーの解除済みバッジを取得
  async getUnlockedBadges(userId: string): Promise<ListResponse<UserBadge>> {
    return this.getList({
      filters: [
        { field: 'userId', operator: '==', value: userId },
        { field: 'isUnlocked', operator: '==', value: true }
      ],
      orderBy: { field: 'unlockedAt', direction: 'desc' }
    });
  }

  // バッジの進行状況を更新
  async updateProgress(userBadgeId: string, progress: number): Promise<DatabaseResponse<UserBadge>> {
    const isUnlocked = progress >= 100;
    const updateData: Partial<UserBadge> = { progress };
    
    if (isUnlocked) {
      updateData.isUnlocked = true;
      updateData.unlockedAt = serverTimestamp() as any;
    }

    return this.update(userBadgeId, updateData);
  }
}

// バッチ処理サービス
class BatchService {
  private batch: WriteBatch;

  constructor() {
    this.batch = writeBatch(db);
  }

  // バッチに追加操作を追加
  add(collectionRef: any, data: any): void {
    const docRef = doc(collectionRef);
    this.batch.set(docRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  // バッチに更新操作を追加
  update(docRef: any, data: any): void {
    this.batch.update(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  }

  // バッチに削除操作を追加
  delete(docRef: any): void {
    this.batch.delete(docRef);
  }

  // バッチを実行
  async commit(): Promise<DatabaseResponse<boolean>> {
    try {
      await this.batch.commit();
      return {
        success: true,
        data: true,
        message: 'バッチ処理を正常に実行しました。'
      };
    } catch (error: any) {
      return {
        success: false,
        error: handleFirestoreError(error)
      };
    }
  }
}

// トランザクションサービス
class TransactionService {
  async execute<T>(
    operation: (transaction: any) => Promise<T>
  ): Promise<DatabaseResponse<T>> {
    try {
      const result = await runTransaction(db, operation);
      return {
        success: true,
        data: result,
        message: 'トランザクションを正常に実行しました。'
      };
    } catch (error: any) {
      return {
        success: false,
        error: handleFirestoreError(error)
      };
    }
  }
}

// サービスインスタンスをエクスポート
export const userService = new UserService();
export const vitalService = new VitalService();
export const moodService = new MoodService();
export const reminderService = new ReminderService();
export const badgeService = new BadgeService();
export const userBadgeService = new UserBadgeService();
export const batchService = BatchService;
export const transactionService = new TransactionService();

// デフォルトエクスポート
export default {
  user: userService,
  vital: vitalService,
  mood: moodService,
  reminder: reminderService,
  badge: badgeService,
  userBadge: userBadgeService,
  batch: BatchService,
  transaction: transactionService,
};