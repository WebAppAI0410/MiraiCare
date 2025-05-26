import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/LoginScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import GuestHomeScreen from './src/screens/GuestHomeScreen';
import PromptLoginScreen from './src/screens/PromptLoginScreen';
import { subscribeToAuthState } from './src/services/authService';
import { User, Colors, AppState } from './src/types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appState, setAppState] = useState<AppState>('onboarding');
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    // 認証状態の監視
    const unsubscribe = subscribeToAuthState((currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
      
      if (currentUser) {
        // 認証済みユーザー → メインアプリ
        setAppState('authenticated');
      } else if (hasSeenOnboarding) {
        // オンボーディング済み → ゲスト体験
        setAppState('guest_experience');
      } else {
        // 初回起動 → オンボーディング
        setAppState('onboarding');
      }
    });

    return unsubscribe;
  }, [hasSeenOnboarding]);

  const handleOnboardingComplete = () => {
    setHasSeenOnboarding(true);
    setAppState('guest_experience');
  };

  const handlePromptLogin = () => {
    setAppState('prompt_login');
  };

  const handleLoginSuccess = () => {
    setAppState('authenticated');
  };

  const handleLoginNavigate = () => {
    setAppState('onboarding'); // LoginScreenに移動
  };

  const handleContinueGuest = () => {
    setAppState('guest_experience');
  };

  const handleSwitchToSignup = () => {
    // TODO: SignupScreen実装時に追加
    console.log('Switch to signup');
  };

  // 初期化中のローディング画面
  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: Colors.background 
      }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // アプリ状態に応じた画面表示
  return (
    <>
      <StatusBar style="auto" />
      {appState === 'onboarding' && (
        <OnboardingScreen onComplete={handleOnboardingComplete} />
      )}
      {appState === 'guest_experience' && (
        <GuestHomeScreen onPromptLogin={handlePromptLogin} />
      )}
      {appState === 'prompt_login' && (
        <PromptLoginScreen 
          onLogin={handleLoginNavigate}
          onContinueGuest={handleContinueGuest}
        />
      )}
      {appState === 'authenticated' && user && (
        <AppNavigator />
      )}
      {/* 認証が必要な場合のログイン画面 */}
      {!user && (appState === 'onboarding' && hasSeenOnboarding) && (
        <LoginScreen 
          onLoginSuccess={handleLoginSuccess}
          onSwitchToSignup={handleSwitchToSignup}
        />
      )}
    </>
  );
}
