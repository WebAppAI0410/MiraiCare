import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

// スクリーンのインポート
import HomeScreen from '../screens/HomeScreen';
import ActivityScreen from '../screens/ActivityScreen';
import MoodMirrorScreen from '../screens/MoodMirrorScreen';
import ReminderScreen from '../screens/ReminderScreen';

import { TabParamList, RootStackParamList, Colors, FontSizes, TouchTargets } from '../types';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

interface AppNavigatorProps {
  showOnboarding: boolean;
  onOnboardingComplete: () => void;
}

// メインタブナビゲーター
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: TouchTargets.large,
          paddingVertical: 8,
        },
        tabBarLabelStyle: {
          fontSize: FontSizes.small,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: Colors.surface,
          borderBottomColor: Colors.border,
        },
        headerTitleStyle: {
          fontSize: FontSizes.h2,
          fontWeight: '700',
          color: Colors.textPrimary,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: 'ホーム',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="ActivityTab"
        component={ActivityScreen}
        options={{
          title: 'アクティビティ',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>📊</Text>
          ),
        }}
      />
      <Tab.Screen
        name="MoodTab"
        component={MoodMirrorScreen}
        options={{
          title: '気分ミラー',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>😊</Text>
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={ReminderScreen}
        options={{
          title: 'リマインダー',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ color, fontSize: size }}>⏰</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// メインアプリナビゲーター
export default function AppNavigator({ showOnboarding, onOnboardingComplete }: AppNavigatorProps) {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Main" component={MainTabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}