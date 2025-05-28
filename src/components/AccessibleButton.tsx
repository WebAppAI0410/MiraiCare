import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  Platform,
  TouchableOpacityProps,
} from 'react-native';
import { Colors, FontSizes } from '../types';
import { responsiveFontSize, getButtonHeight, getMinTouchTarget, isTablet } from '../utils/responsive';
import { androidElevationStyle } from '../utils/android-fixes';

interface AccessibleButtonProps extends Omit<TouchableOpacityProps, 'onPress'> {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  icon?: React.ReactNode;
  disabled?: boolean;
  fullWidth?: boolean;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  icon,
  disabled = false,
  fullWidth = true,
  accessibilityLabel,
  accessibilityHint,
  ...rest
}) => {
  const isDisabled = disabled || loading;
  
  const getButtonStyle = () => {
    const baseStyle = [
      styles.button,
      styles[variant],
      styles[size],
      fullWidth && styles.fullWidth,
      isDisabled && styles.disabled,
    ];
    
    // 影の追加（Android/iOS対応）
    if (variant === 'primary' && !isDisabled) {
      baseStyle.push(androidElevationStyle(4) as any);
    }
    
    return baseStyle;
  };
  
  const getTextStyle = () => {
    return [
      styles.text,
      styles[`${variant}Text`],
      styles[`${size}Text`],
      isDisabled && styles.disabledText,
    ];
  };
  
  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{
        disabled: isDisabled,
        busy: loading,
      }}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      {...rest}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator 
            color={variant === 'secondary' ? Colors.primary : Colors.surface} 
            size={size === 'small' ? 'small' : 'large'}
          />
        ) : (
          <>
            {icon && <View style={styles.icon}>{icon}</View>}
            <Text style={getTextStyle()} numberOfLines={1} adjustsFontSizeToFit>
              {title}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: isTablet() ? 16 : 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  
  // サイズ別スタイル
  small: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: getMinTouchTarget(),
  },
  medium: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    minHeight: getButtonHeight(),
  },
  large: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    minHeight: getButtonHeight() * 1.2,
  },
  
  // バリアント別スタイル
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  danger: {
    backgroundColor: Colors.error,
  },
  success: {
    backgroundColor: Colors.success,
  },
  
  // 無効化状態
  disabled: {
    backgroundColor: Colors.disabled,
    opacity: 0.6,
  },
  
  // テキストスタイル
  text: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  smallText: {
    fontSize: responsiveFontSize(FontSizes.small),
  },
  mediumText: {
    fontSize: responsiveFontSize(FontSizes.button),
  },
  largeText: {
    fontSize: responsiveFontSize(FontSizes.button + 2),
  },
  
  // テキストカラー
  primaryText: {
    color: Colors.surface,
  },
  secondaryText: {
    color: Colors.primary,
  },
  dangerText: {
    color: Colors.surface,
  },
  successText: {
    color: Colors.surface,
  },
  disabledText: {
    color: Colors.textLight,
  },
});