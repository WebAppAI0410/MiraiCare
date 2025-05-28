import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  GestureResponderEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { elderlyTheme } from '../../styles/elderly-theme';

export interface NavigationItem {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: (event: GestureResponderEvent) => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  badge?: number; // バッジ数（通知数など）
}

interface ElderlyNavigationBarProps {
  items: NavigationItem[];
  activeKey: string;
  style?: ViewStyle;
  testID?: string;
}

export const ElderlyNavigationBar: React.FC<ElderlyNavigationBarProps> = ({
  items,
  activeKey,
  style,
  testID,
}) => {
  return (
    <View style={[styles.container, style]} testID={testID}>
      {items.map((item) => (
        <NavigationButton
          key={item.key}
          item={item}
          isActive={item.key === activeKey}
        />
      ))}
    </View>
  );
};

interface NavigationButtonProps {
  item: NavigationItem;
  isActive: boolean;
}

const NavigationButton: React.FC<NavigationButtonProps> = ({ item, isActive }) => {
  return (
    <TouchableOpacity
      style={[styles.button, isActive && styles.activeButton]}
      onPress={item.onPress}
      activeOpacity={0.7}
      accessibilityRole="tab"
      accessibilityLabel={item.accessibilityLabel || item.label}
      accessibilityHint={item.accessibilityHint}
      accessibilityState={{ selected: isActive }}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={item.icon}
          size={elderlyTheme.iconSize.large}
          color={isActive ? elderlyTheme.colors.primary : elderlyTheme.colors.textSecondary}
        />
        {item.badge && item.badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {item.badge > 99 ? '99+' : item.badge.toString()}
            </Text>
          </View>
        )}
      </View>
      <Text
        style={[
          styles.label,
          isActive && styles.activeLabel,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: elderlyTheme.colors.background,
    borderTopWidth: 1,
    borderTopColor: elderlyTheme.colors.border,
    paddingVertical: elderlyTheme.spacing.small,
    paddingHorizontal: elderlyTheme.spacing.xs,
    
    // 高齢者向けのシャドウで視認性向上
    shadowColor: elderlyTheme.colors.black,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },

  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: elderlyTheme.spacing.medium,
    paddingHorizontal: elderlyTheme.spacing.small,
    minHeight: elderlyTheme.touchTarget.large, // 高齢者向けに大きなタッチターゲット
    borderRadius: elderlyTheme.borderRadius.medium,
    marginHorizontal: 2,
  },

  activeButton: {
    backgroundColor: elderlyTheme.colors.primaryLight + '20', // 薄い背景色
    borderWidth: 1,
    borderColor: elderlyTheme.colors.primary,
  },

  iconContainer: {
    position: 'relative',
    marginBottom: 4,
  },

  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: elderlyTheme.colors.error,
    borderRadius: elderlyTheme.borderRadius.round,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },

  badgeText: {
    color: elderlyTheme.colors.white,
    fontSize: 10,
    fontWeight: elderlyTheme.fontWeight.bold,
    textAlign: 'center',
  },

  label: {
    fontSize: elderlyTheme.fontSize.small,
    fontWeight: elderlyTheme.fontWeight.normal,
    color: elderlyTheme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },

  activeLabel: {
    color: elderlyTheme.colors.primary,
    fontWeight: elderlyTheme.fontWeight.medium,
  },
});