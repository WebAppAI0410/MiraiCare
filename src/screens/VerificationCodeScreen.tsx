import React, { useState, useRef, useEffect } from 'react';
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
import { getFunctions, httpsCallable } from 'firebase/functions';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../config/firebase';
import { signUpWithEmail } from '../services/authService';

interface VerificationCodeScreenProps {
  email: string;
  action: 'signup' | 'login';
  onSuccess: () => void;
  onBack: () => void;
}

const VerificationCodeScreen: React.FC<VerificationCodeScreenProps> = ({
  email,
  action,
  onSuccess,
  onBack,
}) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const functions = getFunctions();
  const verifyCode = httpsCallable(functions, 'verifyCode');
  const sendVerificationCode = httpsCallable(functions, 'sendVerificationCode');

  useEffect(() => {
    // リセンドタイマー
    const timer = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCodeChange = (value: string, index: number) => {
    if (value.length > 1) {
      // ペーストされた場合
      const pastedCode = value.slice(0, 6).split('');
      const newCode = [...code];
      pastedCode.forEach((digit, i) => {
        if (i < 6) newCode[i] = digit;
      });
      setCode(newCode);
      
      // 最後の入力欄にフォーカス
      const lastIndex = Math.min(pastedCode.length - 1, 5);
      inputRefs.current[lastIndex]?.focus();
    } else {
      // 通常の入力
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // 次の入力欄に自動フォーカス
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      // 前の入力欄に戻る
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      Alert.alert('エラー', '6桁の認証コードを入力してください。');
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyCode({ email, code: fullCode });
      
      if (action === 'signup' && global.tempUserData) {
        // サインアップの場合、ユーザーを作成
        const { password, fullName } = global.tempUserData;
        await signUpWithEmail(email, password, fullName);
        // 一時データをクリア
        global.tempUserData = undefined;
      } else {
        // ログインの場合、カスタムトークンでログイン
        const { customToken } = result.data as any;
        await signInWithCustomToken(auth, customToken);
      }
      
      Alert.alert(
        action === 'signup' ? '登録完了' : 'ログイン成功',
        action === 'signup' 
          ? 'アカウントが作成されました！' 
          : 'MiraiCareへようこそ！',
        [{ text: 'OK', onPress: onSuccess }]
      );
    } catch (error: any) {
      console.error('Verification error:', error);
      let errorMessage = '認証に失敗しました。';
      
      if (error.code === 'invalid-argument') {
        errorMessage = '認証コードが正しくありません。';
      } else if (error.code === 'deadline-exceeded') {
        errorMessage = '認証コードの有効期限が切れています。';
      }
      
      Alert.alert('エラー', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;

    setIsLoading(true);
    try {
      await sendVerificationCode({ email, action });
      Alert.alert('送信完了', '新しい認証コードを送信しました。');
      setResendTimer(60);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error) {
      Alert.alert('エラー', '認証コードの再送信に失敗しました。');
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
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backText}>← 戻る</Text>
          </TouchableOpacity>
          <Text style={styles.title}>認証コード入力</Text>
          <Text style={styles.subtitle}>
            {email} に送信された{'\n'}6桁の認証コードを入力してください
          </Text>
        </View>

        {/* コード入力エリア */}
        <View style={styles.codeContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[
                styles.codeInput,
                digit ? styles.codeInputFilled : null,
              ]}
              value={digit}
              onChangeText={(value) => handleCodeChange(value, index)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              accessibilityLabel={`認証コード${index + 1}桁目`}
            />
          ))}
        </View>

        {/* ボタンエリア */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.verifyButton, isLoading && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.surface} size="large" />
            ) : (
              <Text style={styles.verifyButtonText}>確認</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.resendButton, resendTimer > 0 && styles.buttonDisabled]}
            onPress={handleResend}
            disabled={resendTimer > 0 || isLoading}
          >
            <Text style={styles.resendButtonText}>
              {resendTimer > 0
                ? `再送信まで ${resendTimer}秒`
                : '認証コードを再送信'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ヘルプテキスト */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpText}>
            認証コードが届かない場合：{'\n'}
            • 迷惑メールフォルダをご確認ください{'\n'}
            • メールアドレスが正しいかご確認ください
          </Text>
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
  },
  header: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xxl,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: Spacing.md,
  },
  backText: {
    fontSize: FontSizes.medium,
    color: Colors.primary,
  },
  title: {
    fontSize: FontSizes.h1,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  subtitle: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  codeInput: {
    width: 50,
    height: 60,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    fontSize: FontSizes.h2,
    textAlign: 'center',
    backgroundColor: Colors.surface,
  },
  codeInputFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '20',
  },
  buttonContainer: {
    gap: Spacing.lg,
  },
  verifyButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: Spacing.lg,
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
    opacity: 0.6,
  },
  verifyButtonText: {
    fontSize: FontSizes.button + 2,
    fontWeight: 'bold',
    color: Colors.surface,
  },
  resendButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  resendButtonText: {
    fontSize: FontSizes.medium,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  helpContainer: {
    marginTop: Spacing.xxl,
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  helpText: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});

export default VerificationCodeScreen;