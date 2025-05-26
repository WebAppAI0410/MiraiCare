// TDD Phase 2: Firebase Firestoreサービス実装
// GREEN フェーズ: テストを通すための実装

import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  DocumentReference,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot,
  Unsubscribe,
} from 'firebase/firestore';

import { db, COLLECTIONS } from '../config/firebase';
import type {
  UserProfile,
  VitalData,
  StepCountData,
  HeartRateData,
  BloodPressureData,
  QueryOptions,
  DataStats,
  BatchOperation,
  FirestoreError,
  DataUpdateCallback,
  ErrorCallback,
} from '../types/userData';

/**
 * Firebase Firestoreサービス
 * ユーザープロファイルとバイタルデータのCRUD操作を提供
 */
class FirestoreService {
  /**
   * ユーザープロファイル操作
   */

  // ユーザープロファイルの作成
  async createUserProfile(userProfile: UserProfile): Promise<string> {
    try {
      const profileData = {
        ...userProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, COLLECTIONS.USER_PROFILES), profileData);
      return docRef.id;
    } catch (error) {
      console.error('ユーザープロファイルの作成に失敗:', error);
      throw new Error('ユーザープロファイルの作成に失敗しました');
    }
  }

  // ユーザープロファイルの取得
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userDocRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        return {
          id: userDocSnap.id,
          email: data.email,
          fullName: data.fullName,
          avatarUrl: data.avatarUrl,
          phone: data.phone,
          birthDate: data.birthDate,
          age: data.age,
          emergencyContact: data.emergencyContact,
          lineNotifyToken: data.lineNotifyToken,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as UserProfile;
      }

      return null;
    } catch (error) {
      console.error('ユーザープロファイルの取得に失敗:', error);
      throw new Error('ユーザー情報の取得に失敗しました');
    }
  }

  // ユーザープロファイルの更新
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const userDocRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(userDocRef, updateData);
    } catch (error) {
      console.error('ユーザープロファイルの更新に失敗:', error);
      throw new Error('ユーザープロファイルの更新に失敗しました');
    }
  }

  // ユーザープロファイルの削除
  async deleteUserProfile(userId: string): Promise<void> {
    try {
      const userDocRef = doc(db, COLLECTIONS.USER_PROFILES, userId);
      await deleteDoc(userDocRef);
    } catch (error) {
      console.error('ユーザープロファイルの削除に失敗:', error);
      throw new Error('ユーザープロファイルの削除に失敗しました');
    }
  }

  /**
   * バイタルデータ操作
   */

  // バイタルデータの追加
  async addVitalData(vitalData: VitalData): Promise<string> {
    try {
      const dataWithTimestamp = {
        ...vitalData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, COLLECTIONS.VITAL_DATA), dataWithTimestamp);
      return docRef.id;
    } catch (error) {
      console.error('バイタルデータの追加に失敗:', error);
      throw new Error('バイタルデータの追加に失敗しました');
    }
  }

  // ユーザーのバイタルデータ取得
  async getVitalData(userId: string): Promise<VitalData[]> {
    try {
      const vitalQuery = query(
        collection(db, COLLECTIONS.VITAL_DATA),
        where('userId', '==', userId),
        orderBy('measuredAt', 'desc')
      );

      const querySnapshot = await getDocs(vitalQuery);
      const vitalDataList: VitalData[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        vitalDataList.push({
          id: doc.id,
          userId: data.userId,
          type: data.type,
          value: data.value,
          unit: data.unit,
          measuredAt: data.measuredAt?.toDate() || new Date(),
          source: data.source,
          deviceInfo: data.deviceInfo,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate(),
        } as VitalData);
      });

      return vitalDataList;
    } catch (error) {
      console.error('バイタルデータの取得に失敗:', error);
      throw new Error('バイタルデータの取得に失敗しました');
    }
  }

  // タイプ別バイタルデータ取得
  async getVitalDataByType(userId: string, type: string): Promise<VitalData[]> {
    try {
      const vitalQuery = query(
        collection(db, COLLECTIONS.VITAL_DATA),
        where('userId', '==', userId),
        where('type', '==', type),
        orderBy('measuredAt', 'desc')
      );

      const querySnapshot = await getDocs(vitalQuery);
      const vitalDataList: VitalData[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        vitalDataList.push({
          id: doc.id,
          ...data,
          measuredAt: data.measuredAt?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate(),
        } as VitalData);
      });

      return vitalDataList;
    } catch (error) {
      console.error('タイプ別バイタルデータの取得に失敗:', error);
      throw new Error('バイタルデータの取得に失敗しました');
    }
  }

  // バイタルデータの更新
  async updateVitalData(vitalId: string, updates: Partial<VitalData>): Promise<void> {
    try {
      const vitalDocRef = doc(db, COLLECTIONS.VITAL_DATA, vitalId);
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(vitalDocRef, updateData);
    } catch (error) {
      console.error('バイタルデータの更新に失敗:', error);
      throw new Error('バイタルデータの更新に失敗しました');
    }
  }

  // バイタルデータの削除
  async deleteVitalData(vitalId: string): Promise<void> {
    try {
      const vitalDocRef = doc(db, COLLECTIONS.VITAL_DATA, vitalId);
      await deleteDoc(vitalDocRef);
    } catch (error) {
      console.error('バイタルデータの削除に失敗:', error);
      throw new Error('バイタルデータの削除に失敗しました');
    }
  }

  /**
   * 歩数データ特化操作
   */

  // 歩数データの追加
  async addStepCount(stepData: StepCountData): Promise<string> {
    try {
      const vitalData: VitalData = {
        userId: stepData.userId,
        type: 'steps',
        value: stepData.steps,
        unit: 'steps',
        measuredAt: stepData.endTime,
        source: 'sensor',
        deviceInfo: stepData.deviceInfo,
        createdAt: new Date(),
      };

      // 追加でstepData特有の情報も保存
      const stepDataDoc = {
        ...vitalData,
        date: stepData.date,
        startTime: stepData.startTime,
        endTime: stepData.endTime,
        timestamp: stepData.timestamp,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, COLLECTIONS.VITAL_DATA), stepDataDoc);
      return docRef.id;
    } catch (error) {
      console.error('歩数データの追加に失敗:', error);
      throw new Error('歩数データの追加に失敗しました');
    }
  }

  // 日付別歩数データ取得
  async getStepCountByDate(userId: string, date: string): Promise<StepCountData | null> {
    try {
      const stepQuery = query(
        collection(db, COLLECTIONS.VITAL_DATA),
        where('userId', '==', userId),
        where('type', '==', 'steps'),
        where('date', '==', date)
      );

      const querySnapshot = await getDocs(stepQuery);

      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        
        return {
          userId: data.userId,
          steps: data.value,
          date: data.date,
          startTime: data.startTime?.toDate() || new Date(),
          endTime: data.endTime?.toDate() || new Date(),
          deviceInfo: data.deviceInfo,
          timestamp: data.timestamp,
        } as StepCountData;
      }

      return null;
    } catch (error) {
      console.error('日付別歩数データの取得に失敗:', error);
      throw new Error('歩数データの取得に失敗しました');
    }
  }

  // 期間別歩数データ取得
  async getStepCountRange(userId: string, startDate: string, endDate: string): Promise<StepCountData[]> {
    try {
      const stepQuery = query(
        collection(db, COLLECTIONS.VITAL_DATA),
        where('userId', '==', userId),
        where('type', '==', 'steps'),
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'asc')
      );

      const querySnapshot = await getDocs(stepQuery);
      const stepDataList: StepCountData[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        stepDataList.push({
          userId: data.userId,
          steps: data.value,
          date: data.date,
          startTime: data.startTime?.toDate() || new Date(),
          endTime: data.endTime?.toDate() || new Date(),
          deviceInfo: data.deviceInfo,
          timestamp: data.timestamp,
        } as StepCountData);
      });

      return stepDataList;
    } catch (error) {
      console.error('期間別歩数データの取得に失敗:', error);
      throw new Error('歩数データの取得に失敗しました');
    }
  }

  /**
   * 心拍数データ操作
   */

  // 心拍数データの追加
  async addHeartRate(heartRateData: HeartRateData): Promise<string> {
    try {
      const vitalData: VitalData = {
        userId: heartRateData.userId,
        type: 'heart_rate',
        value: heartRateData.heartRate,
        unit: 'bpm',
        measuredAt: heartRateData.measuredAt,
        source: heartRateData.source,
        deviceInfo: heartRateData.deviceInfo,
        createdAt: new Date(),
      };

      return await this.addVitalData(vitalData);
    } catch (error) {
      console.error('心拍数データの追加に失敗:', error);
      throw new Error('心拍数データの追加に失敗しました');
    }
  }

  // 心拍数データ取得
  async getHeartRateData(userId: string): Promise<HeartRateData[]> {
    try {
      const vitalDataList = await this.getVitalDataByType(userId, 'heart_rate');
      
      return vitalDataList.map(data => ({
        userId: data.userId,
        heartRate: data.value,
        measuredAt: data.measuredAt,
        source: data.source,
        deviceInfo: data.deviceInfo,
      } as HeartRateData));
    } catch (error) {
      console.error('心拍数データの取得に失敗:', error);
      throw new Error('心拍数データの取得に失敗しました');
    }
  }

  /**
   * 血圧データ操作
   */

  // 血圧データの追加
  async addBloodPressure(bloodPressureData: BloodPressureData): Promise<string[]> {
    try {
      // 血圧は収縮期と拡張期を別々のレコードとして保存
      const systolicData: VitalData = {
        userId: bloodPressureData.userId,
        type: 'blood_pressure',
        value: bloodPressureData.systolic,
        unit: 'mmHg',
        measuredAt: bloodPressureData.measuredAt,
        source: 'manual',
        createdAt: new Date(),
      };

      const diastolicData: VitalData = {
        userId: bloodPressureData.userId,
        type: 'blood_pressure',
        value: bloodPressureData.diastolic,
        unit: 'mmHg',
        measuredAt: bloodPressureData.measuredAt,
        source: 'manual',
        createdAt: new Date(),
      };

      const [systolicId, diastolicId] = await Promise.all([
        this.addVitalData(systolicData),
        this.addVitalData(diastolicData)
      ]);

      return [systolicId, diastolicId];
    } catch (error) {
      console.error('血圧データの追加に失敗:', error);
      throw new Error('血圧データの追加に失敗しました');
    }
  }

  // 血圧データ取得
  async getBloodPressureData(userId: string): Promise<BloodPressureData[]> {
    try {
      const vitalDataList = await this.getVitalDataByType(userId, 'blood_pressure');
      
      // 血圧データをペアにして返す（簡略化）
      const bloodPressureList: BloodPressureData[] = [];
      
      for (let i = 0; i < vitalDataList.length; i += 2) {
        const systolic = vitalDataList[i];
        const diastolic = vitalDataList[i + 1];
        
        if (systolic && diastolic) {
          bloodPressureList.push({
            userId: systolic.userId,
            systolic: systolic.value,
            diastolic: diastolic.value,
            measuredAt: systolic.measuredAt,
          } as BloodPressureData);
        }
      }

      return bloodPressureList;
    } catch (error) {
      console.error('血圧データの取得に失敗:', error);
      throw new Error('血圧データの取得に失敗しました');
    }
  }

  /**
   * 高度なクエリ操作
   */

  // 条件付きクエリでバイタルデータ取得
  async queryVitalData(userId: string, options: QueryOptions): Promise<VitalData[]> {
    try {
      let queryRef = collection(db, COLLECTIONS.VITAL_DATA);
      let q = query(queryRef, where('userId', '==', userId));

      // where条件の追加
      if (options.where) {
        options.where.forEach(condition => {
          q = query(q, where(condition.field, condition.operator, condition.value));
        });
      }

      // 並び順の設定
      if (options.orderBy) {
        q = query(q, orderBy(options.orderBy.field, options.orderBy.direction));
      }

      // 制限数の設定
      if (options.limit) {
        q = query(q, limit(options.limit));
      }

      const querySnapshot = await getDocs(q);
      const vitalDataList: VitalData[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        vitalDataList.push({
          id: doc.id,
          ...data,
          measuredAt: data.measuredAt?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate(),
        } as VitalData);
      });

      return vitalDataList;
    } catch (error) {
      console.error('バイタルデータクエリに失敗:', error);
      throw new Error('データの検索に失敗しました');
    }
  }

  // データ統計の取得
  async getDataStats(userId: string, type: string): Promise<DataStats> {
    try {
      const vitalDataList = await this.getVitalDataByType(userId, type);

      if (vitalDataList.length === 0) {
        return {
          totalRecords: 0,
          dateRange: {
            start: new Date(),
            end: new Date(),
          },
          averageValue: 0,
          maxValue: 0,
          minValue: 0,
        };
      }

      const values = vitalDataList.map(data => data.value);
      const dates = vitalDataList.map(data => data.measuredAt);

      return {
        totalRecords: vitalDataList.length,
        dateRange: {
          start: new Date(Math.min(...dates.map(d => d.getTime()))),
          end: new Date(Math.max(...dates.map(d => d.getTime()))),
        },
        averageValue: values.reduce((sum, val) => sum + val, 0) / values.length,
        maxValue: Math.max(...values),
        minValue: Math.min(...values),
      };
    } catch (error) {
      console.error('データ統計の取得に失敗:', error);
      throw new Error('統計データの取得に失敗しました');
    }
  }

  /**
   * リアルタイム監視
   */

  // ユーザープロファイル監視
  subscribeToUserProfile(userId: string, callback: DataUpdateCallback<UserProfile | null>): Unsubscribe {
    const userDocRef = doc(db, COLLECTIONS.USER_PROFILES, userId);

    return onSnapshot(userDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const userProfile: UserProfile = {
          id: docSnapshot.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as UserProfile;
        callback(userProfile);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error('ユーザープロファイル監視エラー:', error);
    });
  }

  // バイタルデータ監視
  subscribeToVitalData(userId: string, callback: DataUpdateCallback<VitalData[]>): Unsubscribe {
    const vitalQuery = query(
      collection(db, COLLECTIONS.VITAL_DATA),
      where('userId', '==', userId),
      orderBy('measuredAt', 'desc'),
      limit(100)
    );

    return onSnapshot(vitalQuery, (querySnapshot) => {
      const vitalDataList: VitalData[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        vitalDataList.push({
          id: doc.id,
          ...data,
          measuredAt: data.measuredAt?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate(),
        } as VitalData);
      });

      callback(vitalDataList);
    }, (error) => {
      console.error('バイタルデータ監視エラー:', error);
    });
  }

  /**
   * バッチ操作
   */

  // バッチ書き込み操作
  async batchWrite(operations: BatchOperation[]): Promise<void> {
    try {
      const batch = writeBatch(db);

      operations.forEach(operation => {
        const colRef = collection(db, operation.collection);

        switch (operation.type) {
          case 'create':
            if (operation.data) {
              const docRef = doc(colRef);
              batch.set(docRef, {
                ...operation.data,
                createdAt: serverTimestamp(),
              });
            }
            break;

          case 'update':
            if (operation.docId && operation.data) {
              const docRef = doc(colRef, operation.docId);
              batch.update(docRef, {
                ...operation.data,
                updatedAt: serverTimestamp(),
              });
            }
            break;

          case 'delete':
            if (operation.docId) {
              const docRef = doc(colRef, operation.docId);
              batch.delete(docRef);
            }
            break;
        }
      });

      await batch.commit();
    } catch (error) {
      console.error('バッチ操作に失敗:', error);
      throw new Error('バッチ操作に失敗しました');
    }
  }
}

// シングルトンインスタンスをエクスポート
export const firestoreService = new FirestoreService();