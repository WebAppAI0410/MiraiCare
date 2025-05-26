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
  UserProfile, 
  VitalData, 
  VitalDataDocument
} from '../types/userData';

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
        name: data.name,
        age: data.age,
        createdAt: data.createdAt?.toDate() || new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate() || new Date(data.updatedAt),
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
 * @param vitalData バイタルデータ
 * @returns 保存されたドキュメントのID
 */
export const saveVitalData = async (vitalData: VitalData): Promise<string> => {
  try {
    const vitalCollection = collection(db, COLLECTIONS.VITAL_DATA);
    
    const docRef = await addDoc(vitalCollection, {
      ...vitalData,
      createdAt: serverTimestamp(),
    });
    
    return docRef.id;
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
        createdAt: data.createdAt?.toDate() || new Date(data.createdAt),
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
        createdAt: data.createdAt?.toDate() || new Date(data.createdAt),
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