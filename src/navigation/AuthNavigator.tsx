import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuthStore, useAuth } from '../stores/authStore';
import { Colors, Spacing } from '../types';

// スクリーンのインポート
import LoginScreen from '../screens/LoginScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import HomeScreen from '../screens/HomeScreen';
import ActivityScreen from '../screens/ActivityScreen';
import MoodMirrorScreen from '../screens/MoodMirrorScreen';
import ReminderScreen from '../screens/ReminderScreen';

// ナビゲーションの型定義
type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

type MainStackParamList = {
  Home: undefined;
  Activity: undefined;
  MoodMirror: undefined;
  Reminder: undefined;
  Onboarding: undefined;
};

const AuthStack = createStackNavigator<AuthStackParamList>();
const MainStack = createStackNavigator<MainStackParamList>();

// ログイン画面のラッパーコンポーネント
const LoginScreenWrapper: React.FC = () => {
  return (
    <LoginScreen 
      onLoginSuccess={() => {
        // 認証成功時は authStore が自動的に状態を更新するので、
        // 特別な処理は不要（MainNavigatorに自動切り替え）
        console.log('Login successful - redirecting to main app');
      }}
      onSwitchToSignup={() => {
        // 将来のサインアップ画面への遷移
        console.log('Switch to signup requested');
      }}
    />
  );
};

// 認証フロー用のナビゲーター
const AuthNavigator: React.FC = () => {
  return (
    <AuthStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: Colors.background }
      }}
    >
      <AuthStack.Screen 
        name="Login" 
        component={LoginScreenWrapper} 
        options={{ title: 'ログイン' }}
      />
    </AuthStack.Navigator>
  );
};

// メインアプリフロー用のナビゲーター
const MainNavigator: React.FC = () => {
  return (
    <MainStack.Navigator 
      screenOptions={{ 
        headerShown: false,
        cardStyle: { backgroundColor: Colors.background }
      }}
    >
      <MainStack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'ホーム' }}
      />
      <MainStack.Screen 
        name="Activity" 
        component={ActivityScreen} 
        options={{ title: '活動記録' }}
      />
      <MainStack.Screen 
        name="MoodMirror" 
        component={MoodMirrorScreen} 
        options={{ title: '気分ミラー' }}
      />
      <MainStack.Screen 
        name="Reminder" 
        component={ReminderScreen} 
        options={{ title: 'リマインダー' }}
      />
      <MainStack.Screen 
        name="Onboarding" 
        component={OnboardingScreen} 
        options={{ title: 'はじめに' }}
      />
    </MainStack.Navigator>
  );
};

// ローディング画面コンポーネント
const LoadingScreen: React.FC = () => {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
};

// メインの認証ガード付きナビゲーター
const AppNavigator: React.FC = () => {
  const { isLoading, isAuthenticated } = useAuth();
  const initialize = useAuthStore(state => state.initialize);

  // 認証状態の初期化
  useEffect(() => {
    const unsubscribe = initialize();
    return unsubscribe; // クリーンアップ関数として返す
  }, [initialize]);

  // ローディング中は読み込み画面を表示
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

// 認証が必要な画面をラップするHOC（Higher-Order Component）
export const withAuthGuard = <P extends object>(Component: React.ComponentType<P>) => {
  return (props: P) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
      return <LoadingScreen />;
    }

    if (!isAuthenticated) {
      // 未認証の場合はログイン画面にリダイレクト
      return <AuthNavigator />;
    }

    return <Component {...props} />;
  };
};

// 認証状態確認用のカスタムフック
export const useAuthGuard = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  return {
    isAuthenticated,
    isLoading,
    shouldShowAuth: !isLoading && !isAuthenticated,
    shouldShowMain: !isLoading && isAuthenticated,
  };
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.screenPadding,
  },
});

export default AppNavigator;