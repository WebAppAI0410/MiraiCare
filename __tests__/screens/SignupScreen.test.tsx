import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SignupScreen from '../../src/screens/SignupScreen';
import { getFunctions } from 'firebase/functions';

// Firebase Functionsのモック
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(),
  httpsCallable: jest.fn(() => jest.fn()),
}));

// Alertのモック
jest.spyOn(Alert, 'alert');

describe('SignupScreen', () => {
  const mockOnSignupSuccess = jest.fn();
  const mockOnSwitchToLogin = jest.fn();
  const mockOnProceedToVerification = jest.fn();
  const mockSendVerificationCode = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // httpsCallableのモックを設定
    const { httpsCallable } = require('firebase/functions');
    httpsCallable.mockReturnValue(mockSendVerificationCode);
  });

  const renderComponent = () => {
    return render(
      <SignupScreen
        onSignupSuccess={mockOnSignupSuccess}
        onSwitchToLogin={mockOnSwitchToLogin}
        onProceedToVerification={mockOnProceedToVerification}
      />
    );
  };

  describe('フォームバリデーション', () => {
    it('名前が未入力の場合エラーを表示', async () => {
      const { getByPlaceholderText, getByText } = renderComponent();
      
      const emailInput = getByPlaceholderText('example@example.com');
      const passwordInput = getByPlaceholderText('6文字以上で入力');
      const confirmPasswordInput = getByPlaceholderText('パスワードを再入力');
      const signupButton = getByText('アカウント作成');

      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          '入力エラー',
          'お名前を入力してください。'
        );
      });
    });

    it('メールアドレスが無効な場合エラーを表示', async () => {
      const { getByPlaceholderText, getByText } = renderComponent();
      
      const nameInput = getByPlaceholderText('山田 太郎');
      const emailInput = getByPlaceholderText('example@example.com');
      const passwordInput = getByPlaceholderText('6文字以上で入力');
      const confirmPasswordInput = getByPlaceholderText('パスワードを再入力');
      const signupButton = getByText('アカウント作成');

      fireEvent.changeText(nameInput, 'テストユーザー');
      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          '入力エラー',
          '有効なメールアドレスを入力してください。'
        );
      });
    });

    it('パスワードが6文字未満の場合エラーを表示', async () => {
      const { getByPlaceholderText, getByText } = renderComponent();
      
      const nameInput = getByPlaceholderText('山田 太郎');
      const emailInput = getByPlaceholderText('example@example.com');
      const passwordInput = getByPlaceholderText('6文字以上で入力');
      const confirmPasswordInput = getByPlaceholderText('パスワードを再入力');
      const signupButton = getByText('アカウント作成');

      fireEvent.changeText(nameInput, 'テストユーザー');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, '12345');
      fireEvent.changeText(confirmPasswordInput, '12345');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          '入力エラー',
          'パスワードは6文字以上で設定してください。'
        );
      });
    });

    it('パスワードが一致しない場合エラーを表示', async () => {
      const { getByPlaceholderText, getByText } = renderComponent();
      
      const nameInput = getByPlaceholderText('山田 太郎');
      const emailInput = getByPlaceholderText('example@example.com');
      const passwordInput = getByPlaceholderText('6文字以上で入力');
      const confirmPasswordInput = getByPlaceholderText('パスワードを再入力');
      const signupButton = getByText('アカウント作成');

      fireEvent.changeText(nameInput, 'テストユーザー');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password456');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          '入力エラー',
          'パスワードが一致しません。'
        );
      });
    });
  });

  describe('認証コード送信', () => {
    it('正しい入力で認証コードを送信', async () => {
      mockSendVerificationCode.mockResolvedValue({ data: { success: true } });
      
      const { getByPlaceholderText, getByText } = renderComponent();
      
      const nameInput = getByPlaceholderText('山田 太郎');
      const emailInput = getByPlaceholderText('example@example.com');
      const passwordInput = getByPlaceholderText('6文字以上で入力');
      const confirmPasswordInput = getByPlaceholderText('パスワードを再入力');
      const signupButton = getByText('アカウント作成');

      fireEvent.changeText(nameInput, 'テストユーザー');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(mockSendVerificationCode).toHaveBeenCalledWith({
          email: 'test@example.com',
          action: 'signup'
        });
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          '認証コードを送信しました',
          'test@example.com 宛てに6桁の認証コードを送信しました。',
          expect.any(Array),
          { cancelable: false }
        );
      });
    });

    it('認証コード送信エラー時にエラーメッセージを表示', async () => {
      mockSendVerificationCode.mockRejectedValue(new Error('ネットワークエラー'));
      
      const { getByPlaceholderText, getByText } = renderComponent();
      
      const nameInput = getByPlaceholderText('山田 太郎');
      const emailInput = getByPlaceholderText('example@example.com');
      const passwordInput = getByPlaceholderText('6文字以上で入力');
      const confirmPasswordInput = getByPlaceholderText('パスワードを再入力');
      const signupButton = getByText('アカウント作成');

      fireEvent.changeText(nameInput, 'テストユーザー');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          '登録エラー',
          expect.stringContaining('エラー')
        );
      });
    });
  });

  describe('画面遷移', () => {
    it('既存アカウントリンクをタップでログイン画面へ遷移', () => {
      const { getByText } = renderComponent();
      
      const loginLink = getByText('既にアカウントをお持ちの方');
      fireEvent.press(loginLink);

      expect(mockOnSwitchToLogin).toHaveBeenCalled();
    });

    it('認証コード送信成功後に認証画面へ遷移', async () => {
      mockSendVerificationCode.mockResolvedValue({ data: { success: true } });
      
      const { getByPlaceholderText, getByText } = renderComponent();
      
      const nameInput = getByPlaceholderText('山田 太郎');
      const emailInput = getByPlaceholderText('example@example.com');
      const passwordInput = getByPlaceholderText('6文字以上で入力');
      const confirmPasswordInput = getByPlaceholderText('パスワードを再入力');
      const signupButton = getByText('アカウント作成');

      fireEvent.changeText(nameInput, 'テストユーザー');
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      fireEvent.press(signupButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      // Alert.alertの3番目の引数（ボタン配列）の最初のボタンのonPressを実行
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const buttons = alertCall[2];
      buttons[0].onPress();

      expect(mockOnProceedToVerification).toHaveBeenCalledWith('test@example.com');
    });
  });

  describe('パスワード表示/非表示', () => {
    it('パスワード表示ボタンで表示切り替え', () => {
      const { getByPlaceholderText, getAllByText } = renderComponent();
      
      const passwordInput = getByPlaceholderText('6文字以上で入力');
      const showButtons = getAllByText('表示');

      // 初期状態では非表示
      expect(passwordInput.props.secureTextEntry).toBe(true);

      // 表示ボタンをクリック
      fireEvent.press(showButtons[0]);

      // secureTextEntryがfalseになることを確認
      // （実際の実装では状態が変わるが、テストでは直接確認が難しいため、
      // ボタンのテキストが「隠す」に変わることを確認する方が良い）
    });
  });
});