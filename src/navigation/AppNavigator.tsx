import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

// 画面コンポーネントのインポート
import HomeScreen from '../screens/HomeScreen';
import ActivityScreen from '../screens/ActivityScreen';
import MoodMirrorScreen from '../screens/MoodMirrorScreen';
import ReminderScreen from '../screens/ReminderScreen';

// 型定義のインポート
import { RootStackParamList, TabParamList, Colors, FontSizes, TouchTargets } from '../types';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

interface AppNavigatorProps {
  showOnboarding?: boolean;
  onOnboardingComplete?: () => void;
}

// タブナビゲーター
const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: TouchTargets.comfortable + 20,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: FontSizes.small,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: Colors.surface,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontSize: FontSizes.h2,
          fontWeight: 'bold',
          color: Colors.textPrimary,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: 'ホーム',
          headerTitle: 'MiraiCare',
        }}
      />
      <Tab.Screen
        name="ActivityTab"
        component={ActivityScreen}
        options={{
          title: '活動',
          headerTitle: '活動記録',
        }}
      />
      <Tab.Screen
        name="MoodTab"
        component={MoodMirrorScreen}
        options={{
          title: '気分',
          headerTitle: '気分ミラー',
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={ReminderScreen}
        options={{
          title: '設定',
          headerTitle: 'リマインダー',
        }}
      />
    </Tab.Navigator>
  );
};

// メインナビゲーター
const AppNavigator: React.FC<AppNavigatorProps> = ({ 
  showOnboarding = false, 
  onOnboardingComplete 
}) => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Main" component={TabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;