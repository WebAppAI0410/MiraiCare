/**
 * 高齢者向けデザインテーマ
 * 
 * アクセシビリティとユーザビリティを重視した
 * 高齢者向けのデザインシステム
 * 
 * 参考基準:
 * - WCAG 2.1 AA準拠
 * - Android Material Design Accessibility
 * - iOS Human Interface Guidelines Accessibility
 */

export const elderlyTheme = {
  // カラーパレット（高コントラスト）
  colors: {
    // プライマリカラー（視認性重視）
    primary: '#2E7D32',       // 濃い緑（コントラスト比 4.87:1）
    primaryLight: '#4CAF50',  // 明るい緑
    primaryDark: '#1B5E20',   // 暗い緑
    
    // セカンダリカラー
    secondary: '#FF9800',     // オレンジ（注意・アクション用）
    secondaryLight: '#FFB74D',
    secondaryDark: '#F57C00',
    
    // システムカラー
    success: '#4CAF50',       // 成功（緑）
    warning: '#FF9800',       // 警告（オレンジ）
    error: '#F44336',         // エラー（赤）
    info: '#2196F3',          // 情報（青）
    
    // テキストカラー（高コントラスト）
    text: '#212121',          // メインテキスト（コントラスト比 16:1）
    textSecondary: '#424242', // セカンダリテキスト（コントラスト比 12.6:1）
    textDisabled: '#757575',  // 無効テキスト
    
    // 背景カラー
    background: '#FFFFFF',    // メイン背景
    backgroundSecondary: '#F5F5F5', // セカンダリ背景
    backgroundDark: '#EEEEEE', // カード背景
    
    // ボーダーカラー
    border: '#E0E0E0',        // 通常ボーダー
    borderFocus: '#2E7D32',   // フォーカス時ボーダー
    
    // その他
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
    
    // 健康状態カラー
    riskLow: '#4CAF50',       // 低リスク（緑）
    riskMedium: '#FF9800',    // 中リスク（オレンジ）
    riskHigh: '#F44336',      // 高リスク（赤）
  },

  // フォントサイズ（大きめ設定）
  fontSize: {
    small: 16,    // 通常のアプリの14pxに相当
    medium: 18,   // 通常のアプリの16pxに相当
    large: 20,    // 通常のアプリの18pxに相当
    xlarge: 24,   // 見出し用
    xxlarge: 28,  // 大見出し用
    xxxlarge: 32, // 特大見出し用
  },

  // フォントウェイト
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    bold: '600' as const,   // 高齢者向けには少し太め
    heavy: '700' as const,
  },

  // スペーシング（大きめ設定）
  spacing: {
    xs: 4,
    small: 8,
    medium: 16,
    large: 24,
    xlarge: 32,
    xxlarge: 40,
    xxxlarge: 48,
  },

  // タッチターゲットサイズ
  touchTarget: {
    small: 44,    // iOS最小推奨サイズ
    medium: 48,   // Android最小推奨サイズ
    large: 56,    // ナビゲーション用
    xlarge: 64,   // 重要なアクション用
  },

  // ボーダー半径
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12,
    xlarge: 16,
    round: 50,    // 円形
  },

  // エレベーション（シャドウ）
  elevation: {
    none: 0,
    small: 2,
    medium: 4,
    large: 8,
    xlarge: 12,
  },

  // アニメーション持続時間
  animation: {
    fast: 150,
    normal: 300,
    slow: 500,
  },

  // アイコンサイズ
  iconSize: {
    small: 20,
    medium: 24,
    large: 32,
    xlarge: 40,
  },

  // Z-index
  zIndex: {
    background: -1,
    normal: 0,
    overlay: 10,
    modal: 20,
    toast: 30,
  },
};

// タイプ定義
export type ElderlyTheme = typeof elderlyTheme;
export type ElderlyColors = typeof elderlyTheme.colors;
export type ElderlyFontSize = typeof elderlyTheme.fontSize;
export type ElderlySpacing = typeof elderlyTheme.spacing;