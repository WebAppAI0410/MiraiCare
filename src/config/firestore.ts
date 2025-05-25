import { 
  collection,
  doc,
  CollectionReference,
  DocumentReference,
  Query
} from 'firebase/firestore';
import { db } from './firebase';
import {
  User,
  VitalData,
  MoodData,
  Reminder,
  Badge,
  UserBadge,
  SleepData,
  Medication,
  MedicationLog,
  EmergencyContact,
  HealthReport,
  AppUsage,
  SyncStatus,
  COLLECTIONS
} from '../types/database';

// コレクションリファレンスの型安全なヘルパー関数
export const getCollection = <T>(collectionName: string): CollectionReference<T> => {
  return collection(db, collectionName) as CollectionReference<T>;
};

export const getDocument = <T>(collectionName: string, documentId: string): DocumentReference<T> => {
  return doc(db, collectionName, documentId) as DocumentReference<T>;
};

// 各コレクションのリファレンス
export const usersCollection = () => getCollection<User>(COLLECTIONS.USERS);
export const vitalsCollection = () => getCollection<VitalData>(COLLECTIONS.VITALS);
export const moodsCollection = () => getCollection<MoodData>(COLLECTIONS.MOODS);
export const remindersCollection = () => getCollection<Reminder>(COLLECTIONS.REMINDERS);
export const badgesCollection = () => getCollection<Badge>(COLLECTIONS.BADGES);
export const userBadgesCollection = () => getCollection<UserBadge>(COLLECTIONS.USER_BADGES);
export const sleepDataCollection = () => getCollection<SleepData>(COLLECTIONS.SLEEP_DATA);
export const medicationsCollection = () => getCollection<Medication>(COLLECTIONS.MEDICATIONS);
export const medicationLogsCollection = () => getCollection<MedicationLog>(COLLECTIONS.MEDICATION_LOGS);
export const emergencyContactsCollection = () => getCollection<EmergencyContact>(COLLECTIONS.EMERGENCY_CONTACTS);
export const healthReportsCollection = () => getCollection<HealthReport>(COLLECTIONS.HEALTH_REPORTS);
export const appUsageCollection = () => getCollection<AppUsage>(COLLECTIONS.APP_USAGE);
export const syncStatusCollection = () => getCollection<SyncStatus>(COLLECTIONS.SYNC_STATUS);

// ドキュメントリファレンス
export const userDocument = (userId: string) => getDocument<User>(COLLECTIONS.USERS, userId);
export const vitalDocument = (vitalId: string) => getDocument<VitalData>(COLLECTIONS.VITALS, vitalId);
export const moodDocument = (moodId: string) => getDocument<MoodData>(COLLECTIONS.MOODS, moodId);
export const reminderDocument = (reminderId: string) => getDocument<Reminder>(COLLECTIONS.REMINDERS, reminderId);
export const badgeDocument = (badgeId: string) => getDocument<Badge>(COLLECTIONS.BADGES, badgeId);
export const userBadgeDocument = (userBadgeId: string) => getDocument<UserBadge>(COLLECTIONS.USER_BADGES, userBadgeId);
export const medicationDocument = (medicationId: string) => getDocument<Medication>(COLLECTIONS.MEDICATIONS, medicationId);

// Firestoreの設定オプション
export const firestoreSettings = {
  // キャッシュサイズの設定（モバイル端末向け）
  cacheSizeBytes: 40000000, // 40MB
  
  // オフライン永続性の有効化
  experimentalForceLongPolling: false,
  
  // SSL設定
  ssl: true,
  
  // ホストの設定（本番環境用）
  host: 'firestore.googleapis.com',
  
  // ローカルキャッシュの設定
  localCache: {
    kind: 'persistent',
    sizeBytes: 40000000
  }
};

// インデックス設定用のクエリ例
export const commonQueries = {
  // ユーザーのバイタルデータを日付順で取得
  getUserVitals: (userId: string) => 
    `vitals WHERE userId == "${userId}" ORDER BY measuredAt DESC`,
  
  // ユーザーの気分データを日付順で取得
  getUserMoods: (userId: string) => 
    `moods WHERE userId == "${userId}" ORDER BY recordedAt DESC`,
  
  // アクティブなリマインダーを時間順で取得
  getActiveReminders: (userId: string) => 
    `reminders WHERE userId == "${userId}" AND isActive == true ORDER BY scheduledTime ASC`,
  
  // 未服用の薬剤ログを取得
  getPendingMedications: (userId: string) => 
    `medication_logs WHERE userId == "${userId}" AND status == "scheduled" ORDER BY scheduledTime ASC`,
  
  // 期間内のヘルスレポートを取得
  getHealthReports: (userId: string, startDate: string, endDate: string) => 
    `health_reports WHERE userId == "${userId}" AND reportDate >= "${startDate}" AND reportDate <= "${endDate}" ORDER BY reportDate DESC`
};

// Firestoreエラーハンドリング
export const handleFirestoreError = (error: any): string => {
  console.error('Firestore Error:', error);
  
  switch (error.code) {
    case 'permission-denied':
      return 'アクセス権限がありません。ログインしてください。';
    case 'not-found':
      return '指定されたデータが見つかりません。';
    case 'already-exists':
      return 'データは既に存在します。';
    case 'invalid-argument':
      return '無効な引数が指定されました。';
    case 'deadline-exceeded':
      return 'リクエストがタイムアウトしました。';
    case 'unavailable':
      return 'サービスが一時的に利用できません。';
    case 'unauthenticated':
      return '認証が必要です。ログインしてください。';
    case 'resource-exhausted':
      return 'リソースの制限に達しました。しばらく待ってから再試行してください。';
    case 'failed-precondition':
      return 'システムの状態が正しくありません。';
    case 'aborted':
      return '操作が中断されました。再試行してください。';
    case 'out-of-range':
      return '指定された値が範囲外です。';
    case 'unimplemented':
      return 'この機能は現在利用できません。';
    case 'internal':
      return '内部エラーが発生しました。';
    case 'data-loss':
      return 'データの破損が検出されました。';
    default:
      return '予期しないエラーが発生しました。';
  }
};

// バッチ処理のサイズ制限
export const BATCH_SIZE = 500;

// リアルタイムリスナーの最大数
export const MAX_LISTENERS = 100;

// オフラインキャッシュの保持期間（ミリ秒）
export const CACHE_RETENTION_PERIOD = 7 * 24 * 60 * 60 * 1000; // 7日間