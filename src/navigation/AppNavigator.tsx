import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { androidScreenTransitionFix } from '../utils/android-fixes';

import HomeScreen from '../screens/HomeScreen';
import ActivityScreen from '../screens/ActivityScreen';
import MoodMirrorScreen from '../screens/MoodMirrorScreen';
import ReminderScreen from '../screens/ReminderScreen';
import BadgesScreen from '../screens/BadgesScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import { ChartsScreen } from '../screens/ChartsScreen';
import { ReportScreen } from '../screens/ReportScreen';
import { DevToolsScreen } from '../screens/DevToolsScreen';
import { Colors } from '../types';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// タブナビゲーター（メイン画面）
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Activity') {
            iconName = focused ? 'fitness' : 'fitness-outline';
          } else if (route.name === 'MoodMirror') {
            iconName = focused ? 'heart' : 'heart-outline';
          } else if (route.name === 'Reminder') {
            iconName = focused ? 'notifications' : 'notifications-outline';
          } else if (route.name === 'Charts') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray,
        tabBarStyle: {
          backgroundColor: Colors.white,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'ホーム' }}
      />
      <Tab.Screen 
        name="Activity" 
        component={ActivityScreen}
        options={{ title: 'アクティビティ' }}
      />
      <Tab.Screen 
        name="MoodMirror" 
        component={MoodMirrorScreen}
        options={{ title: 'ムードミラー' }}
      />
      <Tab.Screen 
        name="Reminder" 
        component={ReminderScreen}
        options={{ title: 'リマインダー' }}
      />
      <Tab.Screen 
        name="Charts" 
        component={ChartsScreen}
        options={{ title: 'グラフ' }}
      />
    </Tab.Navigator>
  );
}

interface AppNavigatorProps {
  showOnboarding: boolean;
  onOnboardingComplete: () => void;
}

export default function AppNavigator({ showOnboarding, onOnboardingComplete }: AppNavigatorProps) {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          ...(Platform.OS === 'android' && {
            cardStyleInterpolator: ({ current: { progress } }) => ({
              cardStyle: {
                opacity: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                }),
              },
            }),
            animationEnabled: true,
            gestureEnabled: false,
          }),
        }}
      >
        <Stack.Screen 
          name="Main" 
          component={TabNavigator}
        />
        <Stack.Screen 
          name="Badges" 
          component={BadgesScreen}
          options={{
            headerShown: true,
            title: 'バッジ',
            headerStyle: {
              backgroundColor: Colors.primary,
            },
            headerTintColor: Colors.white,
          }}
        />
        <Stack.Screen 
          name="NotificationSettings" 
          component={NotificationSettingsScreen}
          options={{
            headerShown: true,
            title: '通知設定',
            headerStyle: {
              backgroundColor: Colors.primary,
            },
            headerTintColor: Colors.white,
          }}
        />
        <Stack.Screen 
          name="Report" 
          component={ReportScreen}
          options={{
            headerShown: true,
            title: 'レポート',
            headerStyle: {
              backgroundColor: Colors.primary,
            },
            headerTintColor: Colors.white,
          }}
        />
        <Stack.Screen 
          name="DevTools" 
          component={DevToolsScreen}
          options={{
            headerShown: true,
            title: '開発者ツール',
            headerStyle: {
              backgroundColor: Colors.primary,
            },
            headerTintColor: Colors.white,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}