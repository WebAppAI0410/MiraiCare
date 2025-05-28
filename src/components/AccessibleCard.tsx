import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, FontSizes, Spacing } from '../types';
import { responsiveFontSize, responsiveSpacing, getCardLayout, isTablet } from '../utils/responsive';
import { androidElevationStyle } from '../utils/android-fixes';

interface AccessibleCardProps {
  title: string;
  subtitle?: string;
  description?: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'primary' | 'warning' | 'success';
  disabled?: boolean;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  rightElement?: React.ReactNode;
  children?: React.ReactNode;
}

export const AccessibleCard: React.FC<AccessibleCardProps> = ({
  title,
  subtitle,
  description,
  icon,
  onPress,
  variant = 'default',
  disabled = false,
  style,
  titleStyle,
  accessibilityLabel,
  accessibilityHint,
  rightElement,
  children,
}) => {
  const cardLayout = getCardLayout();
  const isClickable = !!onPress && !disabled;
  
  const cardStyle = [
    styles.card,
    styles[variant],
    disabled && styles.disabled,
    isTablet() && { width: cardLayout.cardWidth },
    style,
  ];
  
  const content = (
    <View style={styles.content}>
      <View style={styles.header}>
        {icon && <View style={styles.icon}>{icon}</View>}
        <View style={styles.textContainer}>
          <Text 
            style={[styles.title, titleStyle]} 
            numberOfLines={2}
            adjustsFontSizeToFit
          >
            {title}
          </Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        {rightElement && <View style={styles.rightElement}>{rightElement}</View>}
      </View>
      
      {description && (
        <Text style={styles.description} numberOfLines={3}>
          {description}
        </Text>
      )}
      
      {children}
    </View>
  );
  
  if (isClickable) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled }}
      >
        {content}
      </TouchableOpacity>
    );
  }
  
  return (
    <View 
      style={cardStyle}
      accessibilityRole="none"
      accessible={false}
    >
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: isTablet() ? 16 : 12,
    padding: responsiveSpacing(16),
    marginVertical: responsiveSpacing(8),
    ...androidElevationStyle(2),
  },
  
  // バリアント
  default: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
  primary: {
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  warning: {
    borderWidth: 2,
    borderColor: Colors.warning,
    backgroundColor: Colors.warningLight,
  },
  success: {
    borderWidth: 2,
    borderColor: Colors.success,
    backgroundColor: Colors.successLight,
  },
  
  disabled: {
    opacity: 0.5,
    backgroundColor: Colors.disabled,
  },
  
  content: {
    flex: 1,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveSpacing(8),
  },
  
  icon: {
    marginRight: responsiveSpacing(12),
  },
  
  textContainer: {
    flex: 1,
  },
  
  title: {
    fontSize: responsiveFontSize(FontSizes.large),
    fontWeight: 'bold',
    color: Colors.text,
    lineHeight: responsiveFontSize(FontSizes.large) * 1.3,
  },
  
  subtitle: {
    fontSize: responsiveFontSize(FontSizes.medium),
    color: Colors.textSecondary,
    marginTop: responsiveSpacing(4),
  },
  
  description: {
    fontSize: responsiveFontSize(FontSizes.medium),
    color: Colors.textSecondary,
    lineHeight: responsiveFontSize(FontSizes.medium) * 1.5,
    marginTop: responsiveSpacing(8),
  },
  
  rightElement: {
    marginLeft: responsiveSpacing(12),
  },
});