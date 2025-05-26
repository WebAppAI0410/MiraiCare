// ユーザーデータ関連の型定義（Firebase Firestore用）
// TDD Phase 2: Firebase データ層実装

/**
 * ユーザープロファイル型定義
 * Firebase Authentication + Firestoreで管理
 */
export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  phone?: string;
  birthDate?: string;
  age?: number;
  emergencyContact?: string;
  lineNotifyToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * バイタルデータ型定義
 * センサーデータ・手動入力データを含む
 */
export interface VitalData {
  id?: string; // Firestore自動生成ID
  userId: string;
  type: 'steps' | 'heart_rate' | 'blood_pressure' | 'weight' | 'sleep';
  value: number;
  unit: string;
  measuredAt: Date;
  source: 'sensor' | 'manual' | 'device'; // データ取得元
  deviceInfo?: string; // デバイス情報（optional）
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * 歩数カウントデータ型定義
 * Expo Pedometerから取得される特化型
 */
export interface StepCountData {
  userId: string;
  steps: number;
  date: string; // YYYY-MM-DD形式
  startTime: Date;
  endTime: Date;
  deviceInfo?: string;
  timestamp: number; // Unix timestamp
}

/**
 * 心拍数データ型定義
 */
export interface HeartRateData {
  userId: string;
  heartRate: number; // BPM
  measuredAt: Date;
  source: 'device' | 'manual';
  deviceInfo?: string;
}

/**
 * 血圧データ型定義
 */
export interface BloodPressureData {
  userId: string;
  systolic: number; // 収縮期血圧
  diastolic: number; // 拡張期血圧
  pulse?: number; // 脈拍数（optional）
  measuredAt: Date;
  notes?: string; // メモ（optional）
}

/**
 * Firestoreサービス用のエラー型
 */
export interface FirestoreError {
  code: string;
  message: string;
  details?: any;
}

/**
 * データクエリ条件
 */
export interface QueryOptions {
  limit?: number;
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  where?: {
    field: string;
    operator: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'in' | 'array-contains';
    value: any;
  }[];
  startAfter?: any; // ページネーション用
}

/**
 * バッチ操作用の型
 */
export interface BatchOperation {
  type: 'create' | 'update' | 'delete';
  collection: string;
  docId?: string;
  data?: any;
}

/**
 * データ統計情報
 */
export interface DataStats {
  totalRecords: number;
  dateRange: {
    start: Date;
    end: Date;
  };
  averageValue?: number;
  maxValue?: number;
  minValue?: number;
}

/**
 * センサーサービス用の型定義
 */
export interface SensorAvailability {
  pedometer: boolean;
  accelerometer: boolean;
  gyroscope: boolean;
  magnetometer: boolean;
}

export interface SensorResult<T> {
  data: T | null;
  error: string | null;
  timestamp: Date;
}

/**
 * リアルタイムデータ更新用のコールバック型
 */
export type DataUpdateCallback<T> = (data: T) => void;
export type ErrorCallback = (error: FirestoreError) => void;

/**
 * Firestore サブスクリプション管理
 */
export interface SubscriptionManager {
  unsubscribe: () => void;
  isActive: boolean;
}