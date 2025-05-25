import { Timestamp } from 'firebase/firestore';

// ベース型定義
export interface BaseDocument {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ユーザー情報
export interface User extends BaseDocument {
  email: string;
  fullName?: string;
  avatarUrl?: string;
  phone?: string;
  birthDate?: string;
  emergencyContact?: string;
  lineNotifyToken?: string;
  preferences: {
    language: 'ja' | 'en';
    notifications: {
      medication: boolean;
      water: boolean;
      exercise: boolean;
      mood: boolean;
    };
    accessibility: {
      fontSize: 'small' | 'medium' | 'large' | 'xlarge';
      highContrast: boolean;
      voiceAssist: boolean;
    };
  };
  isActive: boolean;
}

// バイタルデータ
export interface VitalData extends BaseDocument {
  userId: string;
  type: 'steps' | 'heart_rate' | 'blood_pressure' | 'weight' | 'sleep';
  value: number;
  unit: string;
  measuredAt: Timestamp;
  source: 'manual' | 'device' | 'app';
  metadata?: {
    deviceId?: string;
    location?: string;
    notes?: string;
  };
}

// 血圧専用データ
export interface BloodPressureData extends VitalData {
  type: 'blood_pressure';
  systolic: number;
  diastolic: number;
  value: number; // 平均値として計算
}

// 気分データ
export interface MoodData extends BaseDocument {
  userId: string;
  moodLabel: string;
  intensity: number; // 1-5のスケール
  mood: 'very_sad' | 'sad' | 'neutral' | 'happy' | 'very_happy';
  tags: string[]; // 気分に関連するタグ
  notes?: string;
  suggestion?: string;
  aiGenerated: boolean; // AI生成の提案かどうか
  recordedAt: Timestamp;
}

// リマインダー
export interface Reminder extends BaseDocument {
  userId: string;
  type: 'water' | 'medication' | 'exercise' | 'mood_check' | 'custom';
  title: string;
  description?: string;
  scheduledTime: Timestamp;
  recurrence: {
    type: 'none' | 'daily' | 'weekly' | 'monthly';
    interval: number;
    daysOfWeek?: number[]; // 0=日曜日, 1=月曜日...
    endDate?: Timestamp;
  };
  completed: boolean;
  completedAt?: Timestamp;
  snoozedUntil?: Timestamp;
  isActive: boolean;
}

// バッジ・実績
export interface Badge extends BaseDocument {
  name: string;
  description: string;
  iconName: string;
  category: 'steps' | 'water' | 'mood' | 'medication' | 'streak' | 'special';
  condition: {
    type: 'count' | 'streak' | 'percentage' | 'custom';
    target: number;
    period?: 'daily' | 'weekly' | 'monthly' | 'total';
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isVisible: boolean; // ユーザーに表示するかどうか
}

// ユーザーのバッジ獲得記録
export interface UserBadge extends BaseDocument {
  userId: string;
  badgeId: string;
  unlockedAt: Timestamp;
  progress: number; // 達成進度（0-100）
  isUnlocked: boolean;
}

// 睡眠データ
export interface SleepData extends BaseDocument {
  userId: string;
  sleepStart: Timestamp;
  sleepEnd: Timestamp;
  duration: number; // 分単位
  quality: 'poor' | 'fair' | 'good' | 'excellent';
  stages?: {
    deep: number;
    light: number;
    rem: number;
    awake: number;
  };
  notes?: string;
}

// 薬剤管理
export interface Medication extends BaseDocument {
  userId: string;
  name: string;
  dosage: string;
  frequency: string;
  prescribedBy?: string;
  startDate: Timestamp;
  endDate?: Timestamp;
  instructions?: string;
  sideEffects?: string[];
  isActive: boolean;
}

// 薬剤服用記録
export interface MedicationLog extends BaseDocument {
  userId: string;
  medicationId: string;
  scheduledTime: Timestamp;
  takenAt?: Timestamp;
  status: 'taken' | 'missed' | 'delayed' | 'skipped';
  notes?: string;
  sideEffectsReported?: string[];
}

// 緊急連絡先
export interface EmergencyContact extends BaseDocument {
  userId: string;
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  isPrimary: boolean;
  isActive: boolean;
}

// 健康レポート
export interface HealthReport extends BaseDocument {
  userId: string;
  reportDate: Timestamp;
  period: 'daily' | 'weekly' | 'monthly';
  data: {
    vitals: {
      averageSteps: number;
      averageHeartRate?: number;
      bloodPressureTrend?: string;
      weightChange?: number;
    };
    mood: {
      averageIntensity: number;
      dominantMood: string;
      moodVariability: number;
    };
    compliance: {
      medicationAdherence: number;
      reminderCompletion: number;
    };
  };
  insights: string[];
  recommendations: string[];
  riskFactors: string[];
  aiGenerated: boolean;
}

// アプリ使用統計
export interface AppUsage extends BaseDocument {
  userId: string;
  date: Timestamp;
  sessionDuration: number; // 分単位
  screensVisited: string[];
  featuresUsed: string[];
  crashReports?: string[];
}

// データ同期状態
export interface SyncStatus extends BaseDocument {
  userId: string;
  deviceId: string;
  lastSyncAt: Timestamp;
  syncedCollections: {
    [collection: string]: Timestamp;
  };
  pendingUploads: number;
  syncErrors?: string[];
}

// Firestoreコレクション名の定数
export const COLLECTIONS = {
  USERS: 'users',
  VITALS: 'vitals',
  MOODS: 'moods',
  REMINDERS: 'reminders',
  BADGES: 'badges',
  USER_BADGES: 'user_badges',
  SLEEP_DATA: 'sleep_data',
  MEDICATIONS: 'medications',
  MEDICATION_LOGS: 'medication_logs',
  EMERGENCY_CONTACTS: 'emergency_contacts',
  HEALTH_REPORTS: 'health_reports',
  APP_USAGE: 'app_usage',
  SYNC_STATUS: 'sync_status',
} as const;

// サブコレクション名
export const SUBCOLLECTIONS = {
  USER_VITALS: 'vitals',
  USER_MOODS: 'moods',
  USER_REMINDERS: 'reminders',
  USER_BADGES: 'badges',
  USER_MEDICATIONS: 'medications',
} as const;

// 型ガード関数
export const isBloodPressureData = (vital: VitalData): vital is BloodPressureData => {
  return vital.type === 'blood_pressure';
};

// クエリ用のフィルター型
export interface QueryFilter {
  field: string;
  operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'in' | 'array-contains-any' | 'not-in';
  value: any;
}

export interface QueryOptions {
  filters?: QueryFilter[];
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  limit?: number;
  startAfter?: any;
}

// レスポンス型
export interface DatabaseResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ListResponse<T> {
  success: boolean;
  data?: T[];
  total?: number;
  hasMore?: boolean;
  error?: string;
  message?: string;
}