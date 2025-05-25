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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors, FontSizes, TouchTargets, Spacing } from '../types';
import { signInWithEmail, resetPassword } from '../services/authService';
import { useAuthStore } from '../stores/authStore';

interface LoginScreenProps {
  onLoginSuccess?: () => void;
  onSwitchToSignup?: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onLoginSuccess = () => console.log('Login successful'), 
  onSwitchToSignup = () => console.log('Switch to signup') 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<'email' | 'magiclink' | 'otp'>('email');
  const [otpSent, setOtpSent] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  
  const { sendMagicLinkToEmail, sendOTP, verifyOTP } = useAuthStore();

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
      await signInWithEmail(email.trim(), password);
      Alert.alert('ログイン成功', 'MiraiCareへようこそ！', [
        { text: 'OK', onPress: onLoginSuccess }
      ]);
    } catch (error) {
      Alert.alert('ログインエラー', (error as Error).message);
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

  const handleMagicLinkLogin = async () => {
    if (!email.trim()) {
      Alert.alert('入力エラー', 'メールアドレスを入力してください。');
      return;
    }

    setIsLoading(true);
    try {
      await sendMagicLinkToEmail(email.trim());
      setMagicLinkSent(true);
      Alert.alert(
        'マジックリンク送信完了',
        'ログイン用のリンクをメールで送信しました。メールをご確認ください。',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('エラー', (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOTP = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('入力エラー', '電話番号を入力してください。');
      return;
    }

    setIsLoading(true);
    try {
      await sendOTP(phoneNumber.trim());
      setOtpSent(true);
      Alert.alert(
        'SMS送信完了',
        '認証コードをSMSで送信しました。SMSをご確認ください。',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('エラー', (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode.trim()) {
      Alert.alert('入力エラー', '認証コードを入力してください。');
      return;
    }

    setIsLoading(true);
    try {
      await verifyOTP(otpCode.trim());
      Alert.alert('ログイン成功', 'MiraiCareへようこそ！', [
        { text: 'OK', onPress: onLoginSuccess }
      ]);
    } catch (error) {
      Alert.alert('認証エラー', (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={Colors.background} />
      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.title}>MiraiCare</Text>
          <Text style={styles.subtitle}>ログイン</Text>
          <Text style={styles.description}>
            お好みの方法でログインしてください
          </Text>
        </View>

        {/* 認証方法選択 */}
        <View style={styles.authModeContainer}>
          <TouchableOpacity
            style={[styles.authModeButton, authMode === 'email' && styles.authModeButtonActive]}
            onPress={() => setAuthMode('email')}
            accessibilityLabel="メールでログイン"
          >
            <Text style={[styles.authModeText, authMode === 'email' && styles.authModeTextActive]}>
              メール＋パスワード
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.authModeButton, authMode === 'magiclink' && styles.authModeButtonActive]}
            onPress={() => setAuthMode('magiclink')}
            accessibilityLabel="マジックリンクでログイン"
          >
            <Text style={[styles.authModeText, authMode === 'magiclink' && styles.authModeTextActive]}>
              マジックリンク
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.authModeButton, authMode === 'otp' && styles.authModeButtonActive]}
            onPress={() => setAuthMode('otp')}
            accessibilityLabel="SMSでログイン"
          >
            <Text style={[styles.authModeText, authMode === 'otp' && styles.authModeTextActive]}>
              SMS認証
            </Text>
          </TouchableOpacity>
        </View>

        {/* 入力フォーム */}
        <View style={styles.form}>
          {/* メール＋パスワード認証 */}
          {authMode === 'email' && (
            <>
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
            </>
          )}

          {/* マジックリンク認証 */}
          {authMode === 'magiclink' && (
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
              {magicLinkSent && (
                <Text style={styles.successText}>
                  ✅ メールを送信しました。受信箱をご確認ください。
                </Text>
              )}
            </View>
          )}

          {/* SMS OTP認証 */}
          {authMode === 'otp' && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>電話番号</Text>
                <TextInput
                  style={styles.input}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="+81 90-1234-5678"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="phone-pad"
                  accessibilityLabel="電話番号入力"
                  accessibilityHint="SMS認証用の電話番号を入力してください"
                />
              </View>

              {otpSent && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>認証コード</Text>
                  <TextInput
                    style={styles.input}
                    value={otpCode}
                    onChangeText={setOtpCode}
                    placeholder="6桁のコードを入力"
                    placeholderTextColor={Colors.textLight}
                    keyboardType="number-pad"
                    maxLength={6}
                    accessibilityLabel="認証コード入力"
                    accessibilityHint="SMSで受信した6桁のコードを入力してください"
                  />
                  <Text style={styles.successText}>
                    ✅ SMS認証コードを送信しました。
                  </Text>
                </View>
              )}
              
              {/* Note: reCAPTCHA setup required for OTP authentication */}
            </>
          )}
        </View>

        {/* ボタン */}
        <View style={styles.buttonContainer}>
          {/* メール＋パスワード認証ボタン */}
          {authMode === 'email' && (
            <>
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
            </>
          )}

          {/* マジックリンク認証ボタン */}
          {authMode === 'magiclink' && (
            <TouchableOpacity
              style={[styles.loginButton, (isLoading || magicLinkSent) && styles.buttonDisabled]}
              onPress={handleMagicLinkLogin}
              disabled={isLoading || magicLinkSent}
              accessibilityLabel="マジックリンクを送信"
              accessibilityHint="ログイン用のマジックリンクをメールで送信します"
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.surface} size="large" />
              ) : (
                <Text style={styles.loginButtonText}>
                  {magicLinkSent ? 'メール送信済み' : 'マジックリンクを送信'}
                </Text>
              )}
            </TouchableOpacity>
          )}

          {/* SMS OTP認証ボタン */}
          {authMode === 'otp' && (
            <>
              {!otpSent ? (
                <TouchableOpacity
                  style={[styles.loginButton, isLoading && styles.buttonDisabled]}
                  onPress={handleSendOTP}
                  disabled={isLoading}
                  accessibilityLabel="SMS認証コードを送信"
                  accessibilityHint="認証コードをSMSで送信します"
                >
                  {isLoading ? (
                    <ActivityIndicator color={Colors.surface} size="large" />
                  ) : (
                    <Text style={styles.loginButtonText}>認証コードを送信</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.loginButton, isLoading && styles.buttonDisabled]}
                  onPress={handleVerifyOTP}
                  disabled={isLoading}
                  accessibilityLabel="認証コードで認証"
                  accessibilityHint="入力した認証コードで認証します"
                >
                  {isLoading ? (
                    <ActivityIndicator color={Colors.surface} size="large" />
                  ) : (
                    <Text style={styles.loginButtonText}>認証</Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}

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
    flex: 1,
    justifyContent: 'flex-end',
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
  // 認証方法選択のスタイル
  authModeContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  authModeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: TouchTargets.minimum,
    justifyContent: 'center',
  },
  authModeButtonActive: {
    backgroundColor: Colors.primary,
  },
  authModeText: {
    fontSize: FontSizes.medium,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  authModeTextActive: {
    color: Colors.surface,
  },
  successText: {
    fontSize: FontSizes.medium,
    color: Colors.success,
    marginTop: Spacing.sm,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default LoginScreen; 