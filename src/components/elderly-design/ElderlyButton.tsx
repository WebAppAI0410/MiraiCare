import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  GestureResponderEvent,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { elderlyTheme } from '../../styles/elderly-theme';

interface ElderlyButtonProps {
  children?: React.ReactNode;
  title?: string;
  icon?: string;
  onPress: (event: GestureResponderEvent) => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const ElderlyButton: React.FC<ElderlyButtonProps> = ({
  children,
  title,
  icon,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
  textStyle,
  testID,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[size],
    disabled && styles.disabled,
    style,
  ];

  const buttonTextStyles = [
    styles.baseText,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  // アイコンサイズを決定
  const getIconSize = () => {
    switch (size) {
      case 'small':
        return elderlyTheme.iconSize.small;
      case 'large':
        return elderlyTheme.iconSize.large;
      case 'xlarge':
        return elderlyTheme.iconSize.xlarge;
      default:
        return elderlyTheme.iconSize.medium;
    }
  };

  // アイコンカラーを決定
  const getIconColor = () => {
    if (disabled) return elderlyTheme.colors.textDisabled;
    
    switch (variant) {
      case 'primary':
      case 'secondary':
        return elderlyTheme.colors.white;
      case 'outline':
      case 'text':
        return elderlyTheme.colors.primary;
      default:
        return elderlyTheme.colors.white;
    }
  };

  const renderContent = () => {
    // childrenが提供されている場合はそれを使用
    if (children) {
      return typeof children === 'string' ? (
        <Text style={buttonTextStyles}>{children}</Text>
      ) : (
        children
      );
    }

    // title/iconの組み合わせ
    if (icon && title) {
      return (
        <View style={styles.iconTextContainer}>
          <Icon
            name={icon}
            size={getIconSize()}
            color={getIconColor()}
            style={styles.icon}
          />
          <Text style={buttonTextStyles}>{title}</Text>
        </View>
      );
    }

    // アイコンのみ
    if (icon) {
      return (
        <Icon
          name={icon}
          size={getIconSize()}
          color={getIconColor()}
        />
      );
    }

    // テキストのみ
    if (title) {
      return <Text style={buttonTextStyles}>{title}</Text>;
    }

    return null;
  };

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // ベーススタイル
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: elderlyTheme.borderRadius.medium,
    flexDirection: 'row',
    // 高齢者向けのシャドウで視認性向上
    shadowColor: elderlyTheme.colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },

  // バリアント別スタイル
  primary: {
    backgroundColor: elderlyTheme.colors.primary,
    borderWidth: 0,
  },

  secondary: {
    backgroundColor: elderlyTheme.colors.secondary,
    borderWidth: 0,
  },

  outline: {
    backgroundColor: elderlyTheme.colors.transparent,
    borderWidth: 2,
    borderColor: elderlyTheme.colors.primary,
    shadowOpacity: 0, // アウトラインボタンはシャドウなし
    elevation: 0,
  },

  text: {
    backgroundColor: elderlyTheme.colors.transparent,
    borderWidth: 0,
    shadowOpacity: 0, // テキストボタンはシャドウなし
    elevation: 0,
  },

  // サイズ別スタイル
  small: {
    minHeight: elderlyTheme.touchTarget.small,
    minWidth: elderlyTheme.touchTarget.small,
    paddingHorizontal: elderlyTheme.spacing.medium,
    paddingVertical: elderlyTheme.spacing.small,
  },

  medium: {
    minHeight: elderlyTheme.touchTarget.medium,
    minWidth: elderlyTheme.touchTarget.medium,
    paddingHorizontal: elderlyTheme.spacing.large,
    paddingVertical: elderlyTheme.spacing.medium,
  },

  large: {
    minHeight: elderlyTheme.touchTarget.large,
    minWidth: elderlyTheme.touchTarget.large,
    paddingHorizontal: elderlyTheme.spacing.xlarge,
    paddingVertical: elderlyTheme.spacing.large,
  },

  xlarge: {
    minHeight: elderlyTheme.touchTarget.xlarge,
    minWidth: elderlyTheme.touchTarget.xlarge,
    paddingHorizontal: elderlyTheme.spacing.xxlarge,
    paddingVertical: elderlyTheme.spacing.xlarge,
  },

  // 無効化スタイル
  disabled: {
    backgroundColor: elderlyTheme.colors.backgroundDark,
    shadowOpacity: 0,
    elevation: 0,
  },

  // テキストスタイル
  baseText: {
    fontWeight: elderlyTheme.fontWeight.medium,
    textAlign: 'center',
  },

  // バリアント別テキストスタイル
  primaryText: {
    color: elderlyTheme.colors.white,
  },

  secondaryText: {
    color: elderlyTheme.colors.white,
  },

  outlineText: {
    color: elderlyTheme.colors.primary,
  },

  textText: {
    color: elderlyTheme.colors.primary,
  },

  // サイズ別テキストスタイル
  smallText: {
    fontSize: elderlyTheme.fontSize.small,
  },

  mediumText: {
    fontSize: elderlyTheme.fontSize.medium,
  },

  largeText: {
    fontSize: elderlyTheme.fontSize.large,
  },

  xlargeText: {
    fontSize: elderlyTheme.fontSize.xlarge,
  },

  // 無効化テキストスタイル
  disabledText: {
    color: elderlyTheme.colors.textDisabled,
  },

  // アイコンとテキストのコンテナ
  iconTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // アイコンのマージン
  icon: {
    marginRight: elderlyTheme.spacing.small,
  },
});