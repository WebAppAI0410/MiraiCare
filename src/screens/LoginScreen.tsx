import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors, FontSizes, TouchTargets, Spacing } from '../types';
import { resetPassword } from '../services/authService';
import { signInWithEmailFree, resendVerificationEmail } from '../services/authServiceFree';
import { reload } from 'firebase/auth';
import { auth } from '../config/firebase';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onSwitchToSignup: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateInput = (): boolean => {
    if (!email.trim()) {
      Alert.alert('入力エラー', 'メールアドレスを入力してください。');
      return false;
    }
    
    if (!password.trim()) {
      Alert.alert('入力エラー', 'パスワードを入力してください。');
      return false;
    }
    
    return true;
  };

  const handleLogin = async () => {
    if (!validateInput()) return;

    setIsLoading(true);
    try {
      const result = await signInWithEmailFree(email.trim(), password);
      
      if (result.success) {
        if (result.emailVerified) {
          Alert.alert('ログイン成功', 'MiraiCareへようこそ！', [
            { text: 'OK', onPress: onLoginSuccess }
          ]);
        } else {
          Alert.alert(
            'メール認証が必要です',
            result.message + '\n\nメールを確認後、もう一度ログインしてください。',
            [
              {
                text: '確認メールを再送信',
                onPress: async () => {
                  const resendResult = await resendVerificationEmail();
                  Alert.alert('確認メール送信', resendResult.message);
                }
              },
              {
                text: '再度確認',
                onPress: async () => {
                  // ユーザー情報を再読み込みして確認
                  await reload(auth.currentUser!);
                  if (auth.currentUser?.emailVerified) {
                    Alert.alert('確認完了', 'メール確認が完了しました！', [
                      { text: 'OK', onPress: onLoginSuccess }
                    ]);
                  } else {
                    Alert.alert('未確認', 'まだメール確認が完了していません。');
                  }
                }
              },
              { text: 'キャンセル' }
            ]
          );
        }
      } else {
        Alert.alert('ログインエラー', result.message);
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('ログインエラー', '予期しないエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert(
        'パスワードリセット',
        'メールアドレスを入力してから「パスワードを忘れた」をタップしてください。'
      );
      return;
    }

    try {
      await resetPassword(email.trim());
      Alert.alert(
        'パスワードリセット',
        'パスワードリセットのメールを送信しました。メールをご確認ください。'
      );
    } catch (error) {
      Alert.alert('エラー', (error as Error).message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={Colors.background} />
      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.title}>MiraiCare</Text>
          <Text style={styles.subtitle}>ログイン</Text>
          <Text style={styles.description}>
            メールアドレスとパスワードを入力してください
          </Text>
        </View>

        {/* 入力フォーム */}
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>メールアドレス</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="example@example.com"
              placeholderTextColor={Colors.textLight}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              accessibilityLabel="メールアドレス入力"
              accessibilityHint="ログイン用のメールアドレスを入力してください"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>パスワード</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                value={password}
                onChangeText={setPassword}
                placeholder="パスワードを入力"
                placeholderTextColor={Colors.textLight}
                secureTextEntry={!showPassword}
                accessibilityLabel="パスワード入力"
                accessibilityHint="ログイン用のパスワードを入力してください"
              />
              <TouchableOpacity
                style={styles.showPasswordButton}
                onPress={() => setShowPassword(!showPassword)}
                accessibilityLabel={showPassword ? 'パスワードを隠す' : 'パスワードを表示'}
              >
                <Text style={styles.showPasswordText}>
                  {showPassword ? '隠す' : '表示'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ボタン */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            accessibilityLabel="ログイン"
            accessibilityHint="入力した情報でログインします"
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.surface} size="large" />
            ) : (
              <Text style={styles.loginButtonText}>ログイン</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={handleForgotPassword}
            accessibilityLabel="パスワードを忘れた"
            accessibilityHint="パスワードリセットメールを送信します"
          >
            <Text style={styles.forgotPasswordText}>パスワードを忘れた方はこちら</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.signupButton}
            onPress={onSwitchToSignup}
            accessibilityLabel="新規アカウント作成"
            accessibilityHint="新しいアカウントを作成します"
          >
            <Text style={styles.signupButtonText}>新規アカウント作成</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  title: {
    fontSize: FontSizes.h1 + 8,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSizes.h2,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 30,
  },
  form: {
    marginBottom: Spacing.xxl,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSizes.medium,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSizes.input,
    color: Colors.text,
    minHeight: TouchTargets.minimum,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  showPasswordButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    minHeight: TouchTargets.minimum,
    justifyContent: 'center',
  },
  showPasswordText: {
    fontSize: FontSizes.medium,
    color: Colors.surface,
    fontWeight: '600',
  },
  buttonContainer: {
    marginTop: Spacing.xl,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
    minHeight: TouchTargets.buttonHeightLarge,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  buttonDisabled: {
    backgroundColor: Colors.disabled,
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: FontSizes.button + 4,
    fontWeight: 'bold',
    color: Colors.surface,
  },
  forgotPasswordButton: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
    minHeight: TouchTargets.minimum,
  },
  forgotPasswordText: {
    fontSize: FontSizes.medium,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.lg,
  },
  signupButton: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: Spacing.md,
    minHeight: TouchTargets.buttonHeightLarge,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupButtonText: {
    fontSize: FontSizes.button,
    fontWeight: 'bold',
    color: Colors.primary,
  },
});

export default LoginScreen; 