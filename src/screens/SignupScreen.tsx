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
import { signUpWithEmailFree } from '../services/authServiceFree';
import { debugLog, debugError } from '../utils/debug';
import { webTouchableOpacityFix, webScrollViewFix, webTextInputFix } from '../utils/platform-fixes';
import { androidEmailInputFix, validateEmailForAndroid, androidKeyboardAvoidingViewProps, androidElevationStyle } from '../utils/android-fixes';

interface SignupScreenProps {
  onSignupSuccess: () => void;
  onSwitchToLogin: () => void;
}

const SignupScreen: React.FC<SignupScreenProps> = ({ onSignupSuccess, onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateInput = (): boolean => {
    if (!fullName.trim()) {
      Alert.alert('入力エラー', 'お名前を入力してください。');
      return false;
    }
    
    if (!email.trim()) {
      Alert.alert('入力エラー', 'メールアドレスを入力してください。');
      return false;
    }
    
    // メールアドレスの形式チェック（Android対応）
    if (!validateEmailForAndroid(email)) {
      Alert.alert('入力エラー', '有効なメールアドレスを入力してください。');
      return false;
    }
    
    if (!password.trim()) {
      Alert.alert('入力エラー', 'パスワードを入力してください。');
      return false;
    }
    
    if (password.length < 6) {
      Alert.alert('入力エラー', 'パスワードは6文字以上で設定してください。');
      return false;
    }
    
    if (password !== confirmPassword) {
      Alert.alert('入力エラー', 'パスワードが一致しません。');
      return false;
    }
    
    return true;
  };

  const handleSignup = async () => {
    debugLog('SignupScreen', 'Signup button pressed');
    if (!validateInput()) {
      debugLog('SignupScreen', 'Validation failed');
      return;
    }

    setIsLoading(true);
    debugLog('SignupScreen', 'Starting signup process', { email: email.trim() });
    
    try {
      // 無料の認証方法を使用してサインアップ
      const result = await signUpWithEmailFree(
        email.trim(),
        password,
        fullName.trim()
      );
      
      if (result.success) {
        Alert.alert(
          '確認メールを送信しました',
          result.message,
          [
            {
              text: '確認',
              onPress: () => onSwitchToLogin()
            }
          ],
          { cancelable: false }
        );
      } else {
        Alert.alert('登録エラー', result.message);
      }
    } catch (error) {
      debugError('SignupScreen', error);
      console.error('Signup error:', error);
      Alert.alert('登録エラー', '予期しないエラーが発生しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={Colors.background} />
      <KeyboardAvoidingView 
        style={styles.content}
        {...androidKeyboardAvoidingViewProps}
      >
        <ScrollView showsVerticalScrollIndicator={false} style={webScrollViewFix}>
          {/* ヘッダー */}
          <View style={styles.header}>
            <Text style={styles.title}>MiraiCare</Text>
            <Text style={styles.subtitle}>新規アカウント作成</Text>
            <Text style={styles.description}>
              健康管理を始めるために必要な情報を入力してください
            </Text>
          </View>

          {/* 入力フォーム */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>お名前</Text>
              <TextInput
                style={[styles.input, webTextInputFix]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="山田 太郎"
                placeholderTextColor={Colors.textLight}
                autoCapitalize="words"
                accessibilityLabel="お名前入力"
                accessibilityHint="フルネームを入力してください"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>メールアドレス</Text>
              <TextInput
                style={[styles.input, webTextInputFix]}
                value={email}
                onChangeText={setEmail}
                placeholder="example@example.com"
                placeholderTextColor={Colors.textLight}
                {...androidEmailInputFix}
                accessibilityLabel="メールアドレス入力"
                accessibilityHint="登録用のメールアドレスを入力してください"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>パスワード</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="6文字以上で入力"
                  placeholderTextColor={Colors.textLight}
                  secureTextEntry={!showPassword}
                  accessibilityLabel="パスワード入力"
                  accessibilityHint="6文字以上のパスワードを入力してください"
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>パスワード（確認）</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="パスワードを再入力"
                  placeholderTextColor={Colors.textLight}
                  secureTextEntry={!showConfirmPassword}
                  accessibilityLabel="パスワード確認入力"
                  accessibilityHint="確認のためパスワードを再度入力してください"
                />
                <TouchableOpacity
                  style={styles.showPasswordButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  accessibilityLabel={showConfirmPassword ? 'パスワードを隠す' : 'パスワードを表示'}
                >
                  <Text style={styles.showPasswordText}>
                    {showConfirmPassword ? '隠す' : '表示'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* 利用規約 */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              アカウントを作成することで、{'\n'}
              <Text style={styles.termsLink}>利用規約</Text>と
              <Text style={styles.termsLink}>プライバシーポリシー</Text>に{'\n'}
              同意したものとみなされます。
            </Text>
          </View>

          {/* ボタン */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.signupButton, isLoading && styles.buttonDisabled, webTouchableOpacityFix]}
              onPress={() => {
                debugLog('SignupScreen', 'TouchableOpacity onPress triggered');
                console.log('TouchableOpacity pressed');
                handleSignup();
              }}
              disabled={isLoading}
              accessibilityLabel="アカウント作成"
              accessibilityHint="入力した情報でアカウントを作成します"
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.surface} size="large" />
              ) : (
                <Text style={styles.signupButtonText}>アカウント作成</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.loginButton}
              onPress={onSwitchToLogin}
              accessibilityLabel="ログインへ戻る"
              accessibilityHint="ログイン画面へ戻ります"
            >
              <Text style={styles.loginButtonText}>既にアカウントをお持ちの方</Text>
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
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.lg,
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
    lineHeight: 24,
  },
  form: {
    marginBottom: Spacing.lg,
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
  termsContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  termsText: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  buttonContainer: {
    marginBottom: Spacing.xxl,
  },
  signupButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
    minHeight: TouchTargets.buttonHeightLarge,
    justifyContent: 'center',
    alignItems: 'center',
    ...androidElevationStyle(3),
  },
  buttonDisabled: {
    backgroundColor: Colors.disabled,
    opacity: 0.7,
  },
  signupButtonText: {
    fontSize: FontSizes.button + 4,
    fontWeight: 'bold',
    color: Colors.surface,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.lg,
  },
  loginButton: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: Spacing.md,
    minHeight: TouchTargets.buttonHeightLarge,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: FontSizes.button,
    fontWeight: 'bold',
    color: Colors.primary,
  },
});

export default SignupScreen;