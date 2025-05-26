import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// 画面コンポーネントのインポート
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import ActivityScreen from '../screens/ActivityScreen';
import MoodMirrorScreen from '../screens/MoodMirrorScreen';
import ReminderScreen from '../screens/ReminderScreen';
import GuestHomeScreen from '../screens/GuestHomeScreen';
import PromptLoginScreen from '../screens/PromptLoginScreen';

// ナビゲーション型定義
export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  PromptLogin: undefined;
  GuestHome: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Activity: undefined;
  MoodMirror: undefined;
  Reminder: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// メインタブナビゲーター
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'ホーム',
        }}
      />
      <Tab.Screen 
        name="Activity" 
        component={ActivityScreen}
        options={{
          tabBarLabel: 'アクティビティ',
        }}
      />
      <Tab.Screen 
        name="MoodMirror" 
        component={MoodMirrorScreen}
        options={{
          tabBarLabel: 'ムードミラー',
        }}
      />
      <Tab.Screen 
        name="Reminder" 
        component={ReminderScreen}
        options={{
          tabBarLabel: 'リマインダー',
        }}
      />
    </Tab.Navigator>
  );
};

// メインナビゲーター
const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Onboarding"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="PromptLogin" component={PromptLoginScreen} />
        <Stack.Screen name="GuestHome" component={GuestHomeScreen} />
        <Stack.Screen name="Main" component={MainTabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
export { MainTabParamList, RootStackParamList };