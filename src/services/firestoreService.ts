// Firestoreサービス（TDD Phase 2）

import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  limit,
} from 'firebase/firestore';
import { db, COLLECTIONS } from '../config/firebase';
import { 
  VitalData, 
  VitalDataDocument
} from '../types/userData';
import { 
  UserProfile,
  Reminder,
  Badge,
  MoodData,
  UserSettings,
  OverallRiskAssessment
} from '../types';

/**
 * ユーザープロファイルサービス
 */

/**
 * 新しいユーザープロファイルを作成
 * @param userData ユーザーデータ（IDを除く）
 * @returns 作成されたドキュメントのID
 */
export const createUserProfile = async (userData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const userCollection = collection(db, COLLECTIONS.USER_PROFILES);
    const now = serverTimestamp();
    
    const docRef = await addDoc(userCollection, {
      ...userData,
      createdAt: now,
      updatedAt: now,
    });
    
    return docRef.id;
  } catch (error) {
    console.error('ユーザープロファイル作成エラー:', error);
    throw new Error('ユーザープロファイルの作成に失敗しました');
  }
};

/**
 * ユーザープロファイルを取得
 * @param userId ユーザーID
 * @returns ユーザープロファイル、または存在しない場合はnull
 */
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userDocRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        id: userDoc.id,
        email: data.email || '',
        fullName: data.fullName || data.name,
        avatarUrl: data.avatarUrl,
        phone: data.phone,
        birthDate: data.birthDate,
        emergencyContact: data.emergencyContact,
        lineNotifyToken: data.lineNotifyToken,
        emailVerified: data.emailVerified || false,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date(data.createdAt).toISOString(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date(data.updatedAt).toISOString(),
        // UserSettings properties
        stepTarget: data.stepTarget,
        strideLength: data.strideLength,
        weight: data.weight,
        height: data.height,
        activityLevel: data.activityLevel,
        notifications: data.notifications || {
          enabled: false,
          hydrationReminder: false,
          medicationReminder: false,
          dailyReport: false,
          riskAlerts: false,
        },
      };
    }
    
    return null;
  } catch (error) {
    console.error('ユーザープロファイル取得エラー:', error);
    throw new Error('ユーザープロファイルの取得に失敗しました');
  }
};

/**
 * ユーザープロファイルを更新
 * @param userId ユーザーID
 * @param updateData 更新データ
 */
export const updateUserProfile = async (
  userId: string, 
  updateData: Partial<Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  try {
    const userDocRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
    
    await updateDoc(userDocRef, {
      ...updateData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('ユーザープロファイル更新エラー:', error);
    throw new Error('ユーザープロファイルの更新に失敗しました');
  }
};

/**
 * ユーザープロファイルを削除
 * @param userId ユーザーID
 */
export const deleteUserProfile = async (userId: string): Promise<void> => {
  try {
    const userDocRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
    await deleteDoc(userDocRef);
  } catch (error) {
    console.error('ユーザープロファイル削除エラー:', error);
    throw new Error('ユーザープロファイルの削除に失敗しました');
  }
};

/**
 * バイタルデータサービス
 */

/**
 * バイタルデータを保存
 * @param userId ユーザーID
 * @param vitalData バイタルデータ（部分的）
 * @returns 保存されたドキュメントのID
 */
export const saveVitalData = async (
  userId: string,
  vitalData: Partial<VitalData>
): Promise<{ id: string; success: boolean }> => {
  try {
    const vitalCollection = collection(db, COLLECTIONS.VITAL_DATA);
    
    const docRef = await addDoc(vitalCollection, {
      userId,
      ...vitalData,
      createdAt: serverTimestamp(),
    });
    
    return {
      id: docRef.id,
      success: true,
    };
  } catch (error) {
    console.error('バイタルデータ保存エラー:', error);
    throw new Error('バイタルデータの保存に失敗しました');
  }
};

/**
 * バイタルデータを取得
 * @param vitalId バイタルデータID
 * @returns バイタルデータ、または存在しない場合はnull
 */
export const getVitalData = async (vitalId: string): Promise<VitalDataDocument | null> => {
  try {
    const vitalDocRef = doc(db, COLLECTIONS.VITAL_DATA, vitalId);
    const vitalDoc = await getDoc(vitalDocRef);
    
    if (vitalDoc.exists()) {
      const data = vitalDoc.data();
      return {
        id: vitalDoc.id,
        userId: data.userId,
        steps: data.steps,
        date: data.date,
        timestamp: data.timestamp,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      };
    }
    
    return null;
  } catch (error) {
    console.error('バイタルデータ取得エラー:', error);
    throw new Error('バイタルデータの取得に失敗しました');
  }
};

/**
 * ユーザーのバイタルデータ履歴を取得
 * @param userId ユーザーID
 * @param days 取得する日数（デフォルト: 30日）
 * @returns バイタルデータ配列（日付降順）
 */
export const getUserVitalHistory = async (
  userId: string, 
  days: number = 30
): Promise<VitalDataDocument[]> => {
  try {
    const vitalCollection = collection(db, COLLECTIONS.VITAL_DATA);
    
    // 指定された日数分の開始日を計算
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateString = startDate.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const vitalQuery = query(
      vitalCollection,
      where('userId', '==', userId),
      where('date', '>=', startDateString),
      orderBy('date', 'desc'),
      orderBy('timestamp', 'desc'),
      limit(100) // 最大100件
    );
    
    const querySnapshot = await getDocs(vitalQuery);
    
    return querySnapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        userId: data.userId,
        steps: data.steps,
        date: data.date,
        timestamp: data.timestamp,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      };
    });
  } catch (error) {
    console.error('バイタルデータ履歴取得エラー:', error);
    throw new Error('バイタルデータ履歴の取得に失敗しました');
  }
};

/**
 * 今日のバイタルデータを取得
 * @param userId ユーザーID
 * @returns 今日のバイタルデータ、または存在しない場合はnull
 */
export const getTodayVitalData = async (userId: string): Promise<VitalDataDocument | null> => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const vitalCollection = collection(db, COLLECTIONS.VITAL_DATA);
    
    const vitalQuery = query(
      vitalCollection,
      where('userId', '==', userId),
      where('date', '==', today),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(vitalQuery);
    
    if (!querySnapshot.empty) {
      const docSnapshot = querySnapshot.docs[0];
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        userId: data.userId,
        steps: data.steps,
        date: data.date,
        timestamp: data.timestamp,
        createdAt: data.createdAt?.toDate() || new Date(data.createdAt),
      };
    }
    
    return null;
  } catch (error) {
    console.error('今日のバイタルデータ取得エラー:', error);
    throw new Error('今日のバイタルデータの取得に失敗しました');
  }
};

/**
 * リマインダーサービス
 */

/**
 * リマインダーを作成
 * @param reminder リマインダーデータ
 * @returns 作成されたドキュメントのID
 */
export const createReminder = async (reminder: Omit<Reminder, 'id'>): Promise<string> => {
  try {
    const reminderCollection = collection(db, COLLECTIONS.REMINDERS);
    
    const docRef = await addDoc(reminderCollection, reminder);
    
    return docRef.id;
  } catch (error) {
    console.error('リマインダー作成エラー:', error);
    throw new Error('リマインダーの作成に失敗しました');
  }
};

/**
 * ユーザーのリマインダー一覧を取得
 * @param userId ユーザーID
 * @returns リマインダー配列
 */
export const getUserReminders = async (userId: string): Promise<Reminder[]> => {
  try {
    const reminderCollection = collection(db, COLLECTIONS.REMINDERS);
    
    const reminderQuery = query(
      reminderCollection,
      where('userId', '==', userId),
      orderBy('scheduledTime', 'asc')
    );
    
    const querySnapshot = await getDocs(reminderQuery);
    
    return querySnapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        ...data
      } as Reminder;
    });
  } catch (error) {
    console.error('リマインダー取得エラー:', error);
    throw new Error('リマインダーの取得に失敗しました');
  }
};

/**
 * リマインダーの完了状態を更新
 * @param reminderId リマインダーID
 * @param completed 完了状態
 */
export const updateReminderStatus = async (reminderId: string, completed: boolean): Promise<void> => {
  try {
    const reminderDocRef = doc(db, COLLECTIONS.REMINDERS, reminderId);
    
    await updateDoc(reminderDocRef, {
      completed,
      completedAt: completed ? serverTimestamp() : null,
    });
  } catch (error) {
    console.error('リマインダー更新エラー:', error);
    throw new Error('リマインダーの更新に失敗しました');
  }
};

/**
 * バッジサービス
 */

/**
 * ユーザーのバッジ一覧を取得
 * @param userId ユーザーID
 * @returns バッジ配列
 */
export const getUserBadges = async (userId: string): Promise<Badge[]> => {
  try {
    const badgeCollection = collection(db, COLLECTIONS.BADGES);
    
    const badgeQuery = query(
      badgeCollection,
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(badgeQuery);
    
    return querySnapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        ...data
      } as Badge;
    });
  } catch (error) {
    console.error('バッジ取得エラー:', error);
    throw new Error('バッジの取得に失敗しました');
  }
};

/**
 * バッジを解除（付与）
 * @param userId ユーザーID
 * @param badgeData バッジデータ
 * @returns 作成されたドキュメントのID
 */
export const unlockBadge = async (
  userId: string,
  badgeData: Omit<Badge, 'id' | 'unlockedAt'>
): Promise<string> => {
  try {
    const badgeCollection = collection(db, COLLECTIONS.BADGES);
    
    const docRef = await addDoc(badgeCollection, {
      ...badgeData,
      userId,
      unlockedAt: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('バッジ解除エラー:', error);
    throw new Error('バッジの解除に失敗しました');
  }
};

/**
 * ムードデータサービス
 */

/**
 * ムードデータを保存
 * @param moodData ムードデータ
 * @returns 保存されたドキュメントのID
 */
export const saveMoodData = async (moodData: Omit<MoodData, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const moodCollection = collection(db, COLLECTIONS.MOODS);
    
    const docRef = await addDoc(moodCollection, {
      ...moodData,
      createdAt: serverTimestamp(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('ムードデータ保存エラー:', error);
    throw new Error('ムードデータの保存に失敗しました');
  }
};

/**
 * ユーザーのムードデータ履歴を取得
 * @param userId ユーザーID
 * @param days 取得する日数（デフォルト: 7日）
 * @returns ムードデータ配列（日付降順）
 */
export const getUserMoodHistory = async (
  userId: string,
  days: number = 7
): Promise<MoodData[]> => {
  try {
    const moodCollection = collection(db, COLLECTIONS.MOODS);
    
    // 指定された日数分の開始日を計算
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const moodQuery = query(
      moodCollection,
      where('userId', '==', userId),
      where('createdAt', '>=', startDate),
      orderBy('createdAt', 'desc'),
      limit(50) // 最大50件
    );
    
    const querySnapshot = await getDocs(moodQuery);
    
    return querySnapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        userId: data.userId,
        mood: data.mood || (data.intensity ? data.intensity * 20 : 50), // intensityから変換
        energy: data.energy,
        moodLabel: data.moodLabel,
        intensity: data.intensity,
        suggestion: data.suggestion,
        note: data.note || data.notes,
        notes: data.notes,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
      } as MoodData;
    });
  } catch (error) {
    console.error('ムードデータ履歴取得エラー:', error);
    throw new Error('ムードデータ履歴の取得に失敗しました');
  }
};

/**
 * 今日のムードデータを取得
 * @param userId ユーザーID
 * @returns 今日のムードデータ配列
 */
export const getTodayMoodData = async (userId: string): Promise<MoodData[]> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const moodCollection = collection(db, COLLECTIONS.MOODS);
    
    const moodQuery = query(
      moodCollection,
      where('userId', '==', userId),
      where('createdAt', '>=', today),
      where('createdAt', '<', tomorrow),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(moodQuery);
    
    return querySnapshot.docs.map(docSnapshot => {
      const data = docSnapshot.data();
      return {
        id: docSnapshot.id,
        userId: data.userId,
        mood: data.mood || (data.intensity ? data.intensity * 20 : 50), // intensityから変換
        energy: data.energy,
        moodLabel: data.moodLabel,
        intensity: data.intensity,
        suggestion: data.suggestion,
        note: data.note || data.notes,
        notes: data.notes,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
      };
    });
  } catch (error) {
    console.error('今日のムードデータ取得エラー:', error);
    throw new Error('今日のムードデータの取得に失敗しました');
  }
};

/**
 * ユーザー設定を更新
 * @param userId ユーザーID
 * @param settings 更新する設定
 */
export const updateUserSettings = async (
  userId: string,
  settings: Partial<UserSettings>
): Promise<void> => {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    
    await updateDoc(userRef, {
      ...settings,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('ユーザー設定更新エラー:', error);
    throw new Error('ユーザー設定の更新に失敗しました');
  }
};

/**
 * リスクアセスメントサービス
 */

/**
 * リスクアセスメントを保存
 * @param userId ユーザーID
 * @param assessment リスクアセスメントデータ
 * @returns 保存結果
 */
export const saveRiskAssessment = async (
  userId: string,
  assessment: OverallRiskAssessment
): Promise<{ id: string; success: boolean }> => {
  try {
    const assessmentCollection = collection(db, 'riskAssessments');
    
    const docRef = await addDoc(assessmentCollection, {
      ...assessment,
      createdAt: serverTimestamp(),
    });
    
    return {
      id: docRef.id,
      success: true,
    };
  } catch (error) {
    console.error('リスクアセスメント保存エラー:', error);
    throw new Error('リスクアセスメントの保存に失敗しました');
  }
};

/**
 * 最新のリスクアセスメントを取得
 * @param userId ユーザーID
 * @returns 最新のリスクアセスメント、または存在しない場合はnull
 */
export const getLatestRiskAssessment = async (
  userId: string
): Promise<OverallRiskAssessment | null> => {
  try {
    const assessmentCollection = collection(db, 'riskAssessments');
    
    const assessmentQuery = query(
      assessmentCollection,
      where('userId', '==', userId),
      orderBy('assessmentDate', 'desc'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(assessmentQuery);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return doc.data() as OverallRiskAssessment;
    }
    
    return null;
  } catch (error) {
    console.error('リスクアセスメント取得エラー:', error);
    throw new Error('リスクアセスメントの取得に失敗しました');
  }
};

/**
 * リスクアセスメント履歴を取得
 * @param userId ユーザーID
 * @param days 取得する日数（デフォルト: 30日）
 * @returns リスクアセスメント配列（日付降順）
 */
export const getRiskAssessmentHistory = async (
  userId: string,
  days: number = 30
): Promise<OverallRiskAssessment[]> => {
  try {
    const assessmentCollection = collection(db, 'riskAssessments');
    
    // 指定された日数分の開始日を計算
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const assessmentQuery = query(
      assessmentCollection,
      where('userId', '==', userId),
      where('assessmentDate', '>=', startDate.toISOString()),
      orderBy('assessmentDate', 'desc')
    );
    
    const querySnapshot = await getDocs(assessmentQuery);
    
    return querySnapshot.docs.map(doc => doc.data() as OverallRiskAssessment);
  } catch (error) {
    console.error('リスクアセスメント履歴取得エラー:', error);
    throw new Error('リスクアセスメント履歴の取得に失敗しました');
  }
};

/**
 * 通知履歴サービス
 */

interface NotificationHistory {
  userId: string;
  notificationId: string;
  type: 'risk-alert' | 'reminder' | 'report';
  riskLevel?: string;
  sentAt: string;
  assessment?: OverallRiskAssessment;
}

/**
 * 通知履歴を保存
 * @param history 通知履歴データ
 * @returns 保存成功フラグ
 */
export const saveNotificationHistory = async (
  history: NotificationHistory
): Promise<boolean> => {
  try {
    const notificationCollection = collection(db, 'notificationHistory');
    
    await addDoc(notificationCollection, {
      ...history,
      createdAt: serverTimestamp(),
    });
    
    return true;
  } catch (error) {
    console.error('通知履歴保存エラー:', error);
    return false;
  }
};

/**
 * 通知履歴を取得
 * @param userId ユーザーID
 * @param days 取得する日数（デフォルト: 30日）
 * @returns 通知履歴配列
 */
export const getNotificationHistory = async (
  userId: string,
  days: number = 30
): Promise<NotificationHistory[]> => {
  try {
    const notificationCollection = collection(db, 'notificationHistory');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const historyQuery = query(
      notificationCollection,
      where('userId', '==', userId),
      where('sentAt', '>=', startDate.toISOString()),
      orderBy('sentAt', 'desc')
    );
    
    const querySnapshot = await getDocs(historyQuery);
    
    return querySnapshot.docs.map(doc => doc.data() as NotificationHistory);
  } catch (error) {
    console.error('通知履歴取得エラー:', error);
    return [];
  }
};

// サービスオブジェクトとしてエクスポート
export const firestoreService = {
  // ユーザー関連
  createUserProfile,
  updateUserProfile,
  getUserProfile,
  deleteUserProfile,
  getUserSettings: getUserProfile,
  updateUserSettings,
  
  // バイタルデータ関連
  saveVitalData,
  getVitalData,
  getTodayVitalData,
  getUserVitalHistory,
  
  // 歩数データ関連（エイリアス）
  getTodaySteps: getTodayVitalData,
  saveDailySteps: saveVitalData,
  getStepHistory: getUserVitalHistory,
  updateUserStepGoal: updateUserSettings,
  
  // バッジ関連
  getUserBadges,
  unlockBadge,
  
  // リマインダー関連
  createReminder,
  saveReminder: createReminder,
  getUserReminders,
  updateReminder: updateReminderStatus,
  updateReminderStatus,
  deleteReminder: async (id: string) => { /* TODO */ },
  
  // ムードデータ関連
  saveMoodData,
  getUserMoodHistory,
  getDailyMoodData: getUserMoodHistory,
  getTodayMoodData,
  
  // 水分摂取関連（TODO: 実装が必要）
  getWaterIntake: async (userId: string) => ({ current: 0, target: 8 }),
  updateWaterIntake: async (userId: string, amount: number) => ({ success: true }),
  
  // リスクアセスメント関連
  saveRiskAssessment,
  getLatestRiskAssessment,
  getRiskAssessmentHistory,
  
  // 通知履歴関連
  saveNotificationHistory,
  getNotificationHistory,
  
  // 統計関連（TODO: 実装が必要）
  getStepStatistics: async (userId: string) => ({ daily: 0, weekly: 0, monthly: 0 }),
  calculateDailyAverage: async (data: any[]) => 0,
};