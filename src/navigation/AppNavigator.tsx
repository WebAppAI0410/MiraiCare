import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// スクリーンのインポート
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import ActivityScreen from '../screens/ActivityScreen';
import MoodMirrorScreen from '../screens/MoodMirrorScreen';
import ReminderScreen from '../screens/ReminderScreen';
import LoginScreen from '../screens/LoginScreen';
import PromptLoginScreen from '../screens/PromptLoginScreen';
import GuestHomeScreen from '../screens/GuestHomeScreen';

// 型定義のインポート
import { RootStackParamList, TabParamList } from '../types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// AppNavigator用の型定義
interface AppNavigatorProps {
  showOnboarding?: boolean;
  onOnboardingComplete?: () => void;
}

// メインタブナビゲーター
const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: 'ホーム',
          tabBarAccessibilityLabel: 'ホーム画面',
        }}
      />
      <Tab.Screen
        name="ActivityTab"
        component={ActivityScreen}
        options={{
          title: '活動',
          tabBarAccessibilityLabel: '活動記録画面',
        }}
      />
      <Tab.Screen
        name="MoodTab"
        component={MoodMirrorScreen}
        options={{
          title: '気分',
          tabBarAccessibilityLabel: '気分記録画面',
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={ReminderScreen}
        options={{
          title: '設定',
          tabBarAccessibilityLabel: '設定画面',
        }}
      />
    </Tab.Navigator>
  );
};

// メインアプリナビゲーター
const AppNavigator: React.FC<AppNavigatorProps> = ({ showOnboarding, onOnboardingComplete }) => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Onboarding"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{
            title: 'オンボーディング',
          }}
        />
        <Stack.Screen
          name="Main"
          component={TabNavigator}
          options={{
            title: 'メイン',
          }}
        />
        <Stack.Screen
          name="Home"
          component={GuestHomeScreen}
          options={{
            title: 'ゲストホーム',
          }}
        />
        <Stack.Screen
          name="Activity"
          component={ActivityScreen}
          options={{
            title: '活動記録',
          }}
        />
        <Stack.Screen
          name="Reminders"
          component={ReminderScreen}
          options={{
            title: 'リマインダー',
          }}
        />
        <Stack.Screen
          name="MoodMirror"
          component={MoodMirrorScreen}
          options={{
            title: '気分ミラー',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;