import { Platform, TextInput } from 'react-native';

/**
 * Android特有のUI問題を修正するユーティリティ
 */

// Androidでのメール入力フィールドの自動補正を無効化
export const androidEmailInputFix = Platform.select({
  android: {
    autoCorrect: false,
    autoCapitalize: 'none' as const,
    textContentType: 'emailAddress' as const,
    importantForAutofill: 'no' as const,
    keyboardType: 'email-address' as const,
  },
  default: {},
});

// Androidでの画面遷移時の点滅を防ぐための設定
export const androidScreenTransitionFix = Platform.select({
  android: {
    cardStyleInterpolator: ({ current: { progress } }: any) => ({
      cardStyle: {
        opacity: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
        }),
      },
    }),
  },
  default: {},
});

// AndroidでのTextInput自動フォーカス問題を修正
export const androidTextInputAutoFocusFix = () => {
  if (Platform.OS === 'android') {
    // Androidで自動フォーカスによる問題を防ぐ
    TextInput.State.currentlyFocusedInput()?.blur();
  }
};

// Androidでのキーボード表示時のレイアウト調整
export const androidKeyboardAvoidingViewProps = Platform.select({
  android: {
    behavior: undefined, // Androidではbehaviorを使わない方が安定
    keyboardVerticalOffset: 0,
  },
  ios: {
    behavior: 'padding' as const,
    keyboardVerticalOffset: 0,
  },
  default: {},
});

// Androidでのelevation（影）の最適化
export const androidElevationStyle = (elevation: number) => 
  Platform.select({
    android: {
      elevation,
    },
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: elevation / 2 },
      shadowOpacity: 0.1 + (elevation * 0.01),
      shadowRadius: elevation,
    },
    default: {},
  });

// Androidでのメールバリデーションを改善
export const validateEmailForAndroid = (email: string): boolean => {
  // より寛容なメールバリデーション（Androidの入力補助機能に対応）
  const trimmedEmail = email.trim();
  
  // 基本的なメール形式チェック
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // Androidの自動補正で追加される可能性のある文字を除去
  const cleanedEmail = trimmedEmail
    .replace(/\u00A0/g, '') // 非破壊スペースを除去
    .replace(/\s+/g, ''); // すべての空白を除去
  
  return emailRegex.test(cleanedEmail);
};

// Androidでのスクロールビューの最適化
export const androidScrollViewOptimization = Platform.select({
  android: {
    nestedScrollEnabled: true,
    removeClippedSubviews: true,
    scrollEventThrottle: 16,
  },
  default: {},
});