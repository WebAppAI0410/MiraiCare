import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  GestureResponderEvent,
} from 'react-native';
import { elderlyTheme } from '../../styles/elderly-theme';

interface ElderlyCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  onPress?: (event: GestureResponderEvent) => void;
  style?: ViewStyle;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'none' | 'button' | 'text';
}

export const ElderlyCard: React.FC<ElderlyCardProps> = ({
  children,
  variant = 'default',
  onPress,
  style,
  testID,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'none',
}) => {
  const cardStyles = [
    styles.base,
    styles[variant],
    style,
  ];

  // タッチ可能な場合はTouchableOpacityを使用
  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyles}
        onPress={onPress}
        activeOpacity={0.9}
        testID={testID}
        accessibilityRole={accessibilityRole === 'none' ? 'button' : accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      >
        {children}
      </TouchableOpacity>
    );
  }

  // タッチ不可の場合は通常のViewを使用
  return (
    <View
      style={cardStyles}
      testID={testID}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  // ベーススタイル
  base: {
    backgroundColor: elderlyTheme.colors.background,
    borderRadius: elderlyTheme.borderRadius.large,
    padding: elderlyTheme.spacing.large, // 高齢者向けに大きなパディング
    marginVertical: elderlyTheme.spacing.small,
    
    // 明確な境界線
    borderWidth: 1,
    borderColor: elderlyTheme.colors.border,
    
    // 高齢者向けのシャドウで視認性向上
    shadowColor: elderlyTheme.colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },

  // バリアント別スタイル
  default: {
    borderColor: elderlyTheme.colors.border,
  },

  primary: {
    borderColor: elderlyTheme.colors.primary,
    borderWidth: 2, // 重要なカードは太いボーダー
    backgroundColor: elderlyTheme.colors.primaryLight + '10', // 薄い背景色
  },

  secondary: {
    borderColor: elderlyTheme.colors.secondary,
    borderWidth: 2,
    backgroundColor: elderlyTheme.colors.secondaryLight + '10',
  },

  success: {
    borderColor: elderlyTheme.colors.success,
    borderWidth: 2,
    backgroundColor: elderlyTheme.colors.success + '10',
  },

  warning: {
    borderColor: elderlyTheme.colors.warning,
    borderWidth: 2,
    backgroundColor: elderlyTheme.colors.warning + '10',
  },

  error: {
    borderColor: elderlyTheme.colors.error,
    borderWidth: 2,
    backgroundColor: elderlyTheme.colors.error + '10',
  },
});