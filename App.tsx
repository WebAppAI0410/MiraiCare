import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text, TouchableOpacity, Platform } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import GuestHomeScreen from './src/screens/GuestHomeScreen';
import PromptLoginScreen from './src/screens/PromptLoginScreen';
import { subscribeToAuthState } from './src/services/authService';
import { User, Colors, AppState } from './src/types';
import { notificationService } from './src/services/notificationService';
import * as Notifications from 'expo-notifications';
import { auth } from './src/config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// SYNTAX ERRORS FIXED AFTER SUCCESSFUL CI AUTOFIX TEST
// const intentionallyBroken = ;
// const anotherBrokenVariable = function( {
//   return "broken";
// };

// 通知設定
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  } as Notifications.NotificationBehavior),
});

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appState, setAppState] = useState<AppState>('onboarding');
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  useEffect(() => {
    // 通知リスナーの設定
    notificationService.setupNotificationListeners();
    
    // オンボーディング状態を確認
    const checkOnboardingStatus = async () => {
      const hasSeenOnboardingStorage = await AsyncStorage.getItem('hasSeenOnboarding');
      if (hasSeenOnboardingStorage === 'true') {
        setHasSeenOnboarding(true);
      }
    };
    
    checkOnboardingStatus();
    
    // Firebase認証状態の監視
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('Auth state changed:', currentUser?.uid);
      
      if (currentUser) {
        // 認証済みユーザー
        const userObj: User = {
          id: currentUser.uid,
          email: currentUser.email || '',
          fullName: currentUser.displayName || '',
        };
        setUser(userObj);
        setAppState('authenticated');
        setShowLogin(false);
        setShowSignup(false);
      } else {
        // 未認証
        setUser(null);
        const hasSeenOnboardingStorage = await AsyncStorage.getItem('hasSeenOnboarding');
        if (hasSeenOnboardingStorage === 'true') {
          setAppState('guest_experience');
        } else {
          setAppState('onboarding');
        }
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleOnboardingComplete = async () => {
    setHasSeenOnboarding(true);
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    setAppState('guest_experience');
  };

  const handlePromptLogin = () => {
    setAppState('prompt_login');
  };

  const handleLoginSuccess = () => {
    setAppState('authenticated');
    setShowLogin(false);
  };
  
  const handleSignupSuccess = () => {
    // サインアップ成功後はログイン画面へ
    setShowSignup(false);
    setShowLogin(true);
  };
  

  const handleLoginNavigate = () => {
    setShowLogin(true);
  };

  const handleContinueGuest = () => {
    setAppState('guest_experience');
  };

  const handleSwitchToSignup = () => {
    setShowLogin(false);
    setShowSignup(true);
  };
  
  const handleSwitchToLogin = () => {
    setShowSignup(false);
    setShowLogin(true);
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
      {showLogin ? (
        <LoginScreen 
          onLoginSuccess={handleLoginSuccess}
          onSwitchToSignup={handleSwitchToSignup}
        />
      ) : showSignup ? (
        <SignupScreen
          onSignupSuccess={handleSignupSuccess}
          onSwitchToLogin={handleSwitchToLogin}
        />
      ) : (
        <>
          {appState === 'onboarding' && !hasSeenOnboarding && (
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
            <AppNavigator 
              showOnboarding={false} 
              onOnboardingComplete={() => {}} 
            />
          )}
        </>
      )}
    </>
  );
}
