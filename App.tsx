import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import VerificationCodeScreen from './src/screens/VerificationCodeScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import GuestHomeScreen from './src/screens/GuestHomeScreen';
import PromptLoginScreen from './src/screens/PromptLoginScreen';
import { subscribeToAuthState } from './src/services/authService';
import { User, Colors, AppState } from './src/types';

// SYNTAX ERRORS FIXED AFTER SUCCESSFUL CI AUTOFIX TEST
// const intentionallyBroken = ;
// const anotherBrokenVariable = function( {
//   return "broken";
// };

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [appState, setAppState] = useState<AppState>('onboarding');
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

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
    setShowLogin(false);
  };
  
  const handleSignupSuccess = () => {
    // サインアップ成功後はログイン画面へ
    setShowSignup(false);
    setShowLogin(true);
  };
  
  const handleProceedToVerification = (email: string) => {
    setVerificationEmail(email);
    setShowSignup(false);
    setShowVerification(true);
  };
  
  const handleVerificationSuccess = () => {
    setShowVerification(false);
    setAppState('authenticated');
  };
  
  const handleVerificationBack = () => {
    setShowVerification(false);
    setShowSignup(true);
  };

  const handleLoginNavigate = () => {
    setShowSignup(true);
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
          onProceedToVerification={handleProceedToVerification}
        />
      ) : showVerification ? (
        <VerificationCodeScreen
          email={verificationEmail}
          action="signup"
          onSuccess={handleVerificationSuccess}
          onBack={handleVerificationBack}
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
