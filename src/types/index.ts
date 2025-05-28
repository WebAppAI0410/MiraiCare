// ユーザー関連の型定義
export interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  phone?: string;
  birthDate?: string;
  emergencyContact?: string;
  lineNotifyToken?: string;
  emailVerified?: boolean;
  isAnonymous?: boolean;
  createdAt: string;
  updatedAt: string;
}

// バイタルデータの型定義
export interface VitalData {
  id: string;
  userId: string;
  type: 'steps' | 'heart_rate' | 'blood_pressure';
  value: number;
  unit: string;
  measuredAt: string;
  createdAt: string;
}

// 歩数データの型定義
export interface StepData {
  date: string; // YYYY-MM-DD形式
  steps: number;
  userId?: string;
  distance?: number; // km
  calories?: number; // kcal
  activeTime?: number; // 分
}

// 歩数統計の型定義
export interface StepStatistics {
  daily: number;
  weekly: number;
  monthly: number;
  weeklyAverage: number;
  monthlyAverage: number;
  bestDay: StepData;
  currentStreak: number; // 連続達成日数
}

// ユーザー設定の型定義を拡張
export interface UserSettings {
  stepTarget?: number; // 歩数目標
  strideLength?: number; // 歩幅（メートル）
  weight?: number; // 体重（kg）
  height?: number; // 身長（cm）
  activityLevel?: 'low' | 'moderate' | 'high'; // 活動レベル
  notifications?: {
    enabled: boolean;
    hydrationReminder?: boolean;
    medicationReminder?: boolean;
    dailyReport?: boolean;
    riskAlerts?: boolean;
  };
}

// ユーザープロファイルの型定義
export interface UserProfile extends User, UserSettings {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// リスクレベルの型定義
export type RiskLevel = 'low' | 'medium' | 'high';

// リスクスコアの型定義
export interface RiskScore {
  level: RiskLevel;
  score: number; // 0-100
  factors: string[]; // リスク要因のリスト
  lastUpdated: string; // ISO 8601形式
}

// 転倒リスクの型定義
export interface FallRisk {
  type: 'fall';
  level: RiskLevel;
  score: number;
  factors: string[];
  lastUpdated: string;
  indicators: {
    stepDecline: boolean; // 歩数の減少
    irregularPattern: boolean; // 不規則な活動パターン
    lowActivity: boolean; // 活動量低下
    consistencyScore: number; // 活動の一貫性スコア（0-100）
  };
}

// フレイルリスクの型定義
export interface FrailtyRisk {
  type: 'frailty';
  level: RiskLevel;
  score: number;
  factors: string[];
  lastUpdated: string;
  indicators: {
    weeklyAverage: number; // 週間平均歩数
    monthlyTrend: 'improving' | 'stable' | 'declining'; // 月間トレンド
    activityDays: number; // 過去7日間の活動日数
    activeDays?: number; // 過去7日間の活動日数（エイリアス）
    goalAchievementRate: number; // 目標達成率（%）
    stepTarget?: number; // 歩数目標
  };
}

// メンタルヘルスリスクの型定義
export interface MentalHealthRisk {
  type: 'mentalHealth' | 'mental';
  level: RiskLevel;
  score: number;
  factors: string[];
  lastUpdated: string;
  indicators: {
    moodScore: number; // 気分スコア（0-100）
    socialActivity?: 'high' | 'moderate' | 'low'; // 社会活動レベル
    engagementLevel?: number; // アプリ利用率（0-100）
    appEngagement?: number; // アプリ利用日数
    lastMoodUpdate?: string; // 最後の気分更新日時
  };
}

// 総合リスク評価の型定義
export interface OverallRiskAssessment {
  userId: string;
  assessmentDate: string; // ISO 8601形式
  fallRisk: FallRisk;
  frailtyRisk: FrailtyRisk;
  mentalHealthRisk: MentalHealthRisk;
  overallLevel: RiskLevel; // 総合リスクレベル
  overallRiskLevel: RiskLevel; // 総合リスクレベル（エイリアス）
  overallRiskScore: number; // 総合リスクスコア（0-100）
  priorityRisks: string[]; // 優先対応が必要なリスク
  recommendations: string[]; // 改善提案
  nextAssessmentDate: string; // 次回評価予定日
}

// 気分データの型定義
export interface MoodData {
  id: string;
  userId: string;
  mood: number; // 0-100のスコア
  energy?: number; // エネルギーレベル (0-100)
  moodLabel?: string;
  intensity?: number; // 1-5のスケール
  suggestion?: string;
  note?: string;
  notes?: string;
  createdAt: string;
}


// バッジ
export interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: string;
  unlockedAt?: string;
}

// リマインダー
export interface Reminder {
  id: string;
  userId?: string;
  type: 'water' | 'medication';
  title: string;
  scheduledTime: string;
  completed: boolean;
  completedAt?: string;
}

// ナビゲーション関連の型定義
export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
  Home: undefined;
  Activity: undefined;
  Reminder: undefined;
  Badges: undefined;
  Settings: undefined;
  MoodMirror: undefined;
  NotificationSettings: undefined;
  Reminiscence: undefined;
  CBTCoach: undefined;
  Charts: undefined;
  Report: undefined;
};

export type TabParamList = {
  HomeTab: undefined;
  ActivityTab: undefined;
  MoodTab: undefined;
  SettingsTab: undefined;
};

// テーマカラー（高齢者向けアクセシビリティ強化）
export const Colors = {
  primary: '#1B5E20',        // 深緑（安心感）
  primaryLight: '#E8F5E8',   // 薄い緑（背景用）
  accent: '#4CAF50',         // 明るい緑（活力）
  secondary: '#81C784',      // ソフトグリーン（やさしさ）
  text: '#1A1A1A',          // ダークグレー（読みやすさ）
  textPrimary: '#1A1A1A',   // 主要テキスト色
  textSecondary: '#757575',  // ミディアムグレー
  textLight: '#9E9E9E',     // ライトグレー
  background: '#F5F5F5',    // オフホワイト（目に優しい）
  surface: '#FFFFFF',       // 純白
  border: '#E0E0E0',        // ライトグレー
  success: '#4CAF50',
  successLight: '#E8F5E9',  // 薄い緑（成功背景）
  warning: '#FF9800',
  warningLight: '#FFF3E0',  // 薄いオレンジ（警告背景）
  error: '#F44336',
  info: '#2196F3',
  overlay: 'rgba(0, 0, 0, 0.5)',
  // 追加のカラー定義
  disabled: '#C7C7CC',
  gray: '#8E8E93',
  lightGray: '#E0E0E0',
  white: '#FFFFFF',
};

// 高齢者向けフォントサイズ（最小24pt以上）
export const FontSizes = {
  small: 16,      // 最小フォントサイズ（高齢者配慮）
  medium: 20,     // 標準フォントサイズ
  large: 24,      // 大きめフォントサイズ
  xlarge: 28,     // 特大フォントサイズ
  xxlarge: 32,    // 超特大フォントサイズ
  xxxlarge: 36,   // 最大フォントサイズ
  h1: 32,         // 見出し1
  h2: 28,         // 見出し2
  h3: 24,         // 見出し3
  caption: 14,    // キャプション（最小限の使用）
  button: 18,     // ボタンテキスト
  input: 20,      // 入力フィールド
  status: 36,     // ステータス表示（目立たせる）
  number: 40,     // 数値表示（歩数など）
  numbers: 48,    // 大きな数値表示
};

// タップ領域サイズ（最小56dp以上）
export const TouchTargets = {
  minimum: 56,    // 最小タップ領域
  comfortable: 64, // 快適なタップ領域
  large: 72,      // 大きなタップ領域
  
  // ボタン高さ
  buttonHeight: 56,
  buttonHeightLarge: 64,
  
  // アイコンサイズ
  iconSmall: 32,
  iconMedium: 40,
  iconLarge: 48,
};

// 余白・間隔（アクセシビリティ考慮）
export const Spacing = {
  xs: 4,
  small: 8,       // 小さなスペース
  sm: 8,
  medium: 16,     // 標準スペース
  md: 16,
  large: 24,      // 大きなスペース
  lg: 24,
  xl: 32,
  xlarge: 32,     // 特大スペース
  xxl: 48,
  xxlarge: 48,    // 超特大スペース
  cardPadding: 20,
  screenPadding: 24,
  sectionGap: 32,
};

// 新しいアプリ状態管理
export type AppState = 
  | 'onboarding'
  | 'guest_experience' 
  | 'prompt_login'
  | 'authenticated';

export type AuthState = 
  | 'guest'
  | 'authenticated'
  | 'loading';

// ゲストモード制限
export interface GuestLimitations {
  canSaveData: boolean;
  canShareWithFamily: boolean;
  canAccessDetailedReports: boolean;
  maxDaysHistory: number;
}

export const GUEST_LIMITATIONS: GuestLimitations = {
  canSaveData: false,
  canShareWithFamily: false,
  canAccessDetailedReports: false,
  maxDaysHistory: 1, // 当日のみ
};

// ゲスト体験データ
export interface GuestExperienceData {
  steps: number;
  mood: string;
  waterIntake: number;
  medicationTaken: boolean;
  showPromptLogin: boolean;
} 