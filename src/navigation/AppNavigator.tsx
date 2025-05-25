import React from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

// Screens
import HomeScreen from '../screens/HomeScreen';
import ActivityScreen from '../screens/ActivityScreen';
import MoodMirrorScreen from '../screens/MoodMirrorScreen';
import ReminderScreen from '../screens/ReminderScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

interface AppNavigatorProps {
  showOnboarding: boolean;
  onOnboardingComplete: () => void;
}

// メインタブナビゲーション
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'ホーム',
          tabBarIcon: ({ color, size }) => (
            <HomeIcon color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Activity"
        component={ActivityScreen}
        options={{
          title: 'アクティビティ',
          tabBarIcon: ({ color, size }) => (
            <ActivityIcon color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="MoodMirror"
        component={MoodMirrorScreen}
        options={{
          title: 'ムードミラー',
          tabBarIcon: ({ color, size }) => (
            <MoodIcon color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Reminder"
        component={ReminderScreen}
        options={{
          title: 'リマインダー',
          tabBarIcon: ({ color, size }) => (
            <ReminderIcon color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// 仮のアイコンコンポーネント（後で適切なアイコンライブラリに置き換え）

const HomeIcon = ({ color, size }: { color: string; size: number }) => (
  <View style={{ width: size, height: size, backgroundColor: color, borderRadius: 4 }} />
);

const ActivityIcon = ({ color, size }: { color: string; size: number }) => (
  <View style={{ width: size, height: size, backgroundColor: color, borderRadius: 4 }} />
);

const MoodIcon = ({ color, size }: { color: string; size: number }) => (
  <View style={{ width: size, height: size, backgroundColor: color, borderRadius: 4 }} />
);

const ReminderIcon = ({ color, size }: { color: string; size: number }) => (
  <View style={{ width: size, height: size, backgroundColor: color, borderRadius: 4 }} />
);

// メインアプリナビゲーター
export default function AppNavigator({ showOnboarding, onOnboardingComplete }: AppNavigatorProps) {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}