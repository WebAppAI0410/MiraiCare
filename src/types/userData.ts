// ユーザーデータ関連の型定義（TDD Phase 2用）

/**
 * ユーザープロファイル（Firestore用）
 * 基本的なユーザー情報を管理
 */
export interface UserProfile {
  id: string;
  name: string;
  age: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * バイタルデータ（歩数など）
 * センサーから取得したデータを保存
 */
export interface VitalData {
  userId: string;
  steps: number;
  date: string; // YYYY-MM-DD形式
  timestamp: number; // Unix timestamp
}

/**
 * バイタルデータ（Firestore保存用）
 * IDとタイムスタンプが追加された形
 */
export interface VitalDataDocument extends VitalData {
  id: string;
  createdAt: Date;
}

/**
 * 歩数データ（Expo Sensors用）
 * Pedometerから取得される生データ
 */
export interface StepCountData {
  steps: number;
  timestamp: number;
}

/**
 * センサーエラー情報
 */
export interface SensorError {
  code: string;
  message: string;
  timestamp: number;
}

/**
 * 歩数カウンター設定
 */
export interface StepCounterConfig {
  updateInterval: number; // ミリ秒
  autoSave: boolean;
  maxRetries: number;
}

/**
 * デフォルト設定
 */
export const DEFAULT_STEP_COUNTER_CONFIG: StepCounterConfig = {
  updateInterval: 1000, // 1秒
  autoSave: true,
  maxRetries: 3,
};

// Firestoreコレクション名は src/config/firebase.ts の COLLECTIONS を使用