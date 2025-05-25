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

// 気分データの型定義
export interface MoodData {
  id: string;
  userId: string;
  moodLabel: string;
  intensity: number; // 1-5のスケール
  suggestion?: string;
  notes?: string;
  createdAt: string;
}

// リスクレベル
export type RiskLevel = 'low' | 'medium' | 'high';

// リスクスコア
export interface RiskScore {
  overall: RiskLevel;
  fallRisk: RiskLevel;
  frailtyRisk: RiskLevel;
  mentalHealthRisk: RiskLevel;
  lastUpdated: string;
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
  Reminders: undefined;
  Badges: undefined;
  Settings: undefined;
  MoodMirror: undefined;
  Reminiscence: undefined;
  CBTCoach: undefined;
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
  warning: '#FF9800',
  warningLight: '#FFF3E0',  // 薄いオレンジ（警告背景）
  error: '#F44336',
  info: '#2196F3',
  disabled: '#BDBDBD',      // 無効状態（グレーアウト）
  overlay: 'rgba(0, 0, 0, 0.5)',
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