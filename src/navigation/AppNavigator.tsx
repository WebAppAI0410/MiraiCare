import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Colors, TabParamList, RootStackParamList } from '../types';

// 画面コンポーネントのインポート
import HomeScreen from '../screens/HomeScreen';
import ActivityScreen from '../screens/ActivityScreen';
import MoodMirrorScreen from '../screens/MoodMirrorScreen';
import ReminderScreen from '../screens/ReminderScreen';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

interface AppNavigatorProps {
  showOnboarding: boolean;
  onOnboardingComplete: () => void;
}

// メインタブナビゲーター
const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 80,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: Colors.surface,
          borderBottomColor: Colors.border,
        },
        headerTitleStyle: {
          color: Colors.textPrimary,
          fontSize: 18,
          fontWeight: '700',
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: 'ホーム',
          headerTitle: 'MiraiCare',
          tabBarLabel: 'ホーム',
        }}
      />
      <Tab.Screen
        name="ActivityTab"
        component={ActivityScreen}
        options={{
          title: '活動記録',
          headerTitle: '活動記録',
          tabBarLabel: '活動',
        }}
      />
      <Tab.Screen
        name="MoodTab"
        component={MoodMirrorScreen}
        options={{
          title: '気分記録',
          headerTitle: '気分ミラー',
          tabBarLabel: '気分',
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={ReminderScreen}
        options={{
          title: 'リマインダー',
          headerTitle: 'リマインダー',
          tabBarLabel: '設定',
        }}
      />
    </Tab.Navigator>
  );
};

// メインアプリナビゲーター
const AppNavigator: React.FC<AppNavigatorProps> = ({
  showOnboarding,
  onOnboardingComplete,
}) => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.surface,
            borderBottomColor: Colors.border,
          },
          headerTitleStyle: {
            color: Colors.textPrimary,
            fontSize: 18,
            fontWeight: '700',
          },
          headerBackTitleVisible: false,
          headerTintColor: Colors.primary,
        }}
      >
        <Stack.Screen
          name="Main"
          component={MainTabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MoodMirror"
          component={MoodMirrorScreen}
          options={{
            title: '気分ミラー',
            headerTitle: '気分ミラー',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;