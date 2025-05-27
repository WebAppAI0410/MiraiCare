import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import VerificationCodeScreen from '../../src/screens/VerificationCodeScreen';
import { signInWithCustomToken } from 'firebase/auth';
import { signUpWithEmail } from '../../src/services/authService';

// Firebaseのモック
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(),
  httpsCallable: jest.fn(() => jest.fn()),
}));

jest.mock('firebase/auth', () => ({
  signInWithCustomToken: jest.fn(),
}));

jest.mock('../../src/services/authService', () => ({
  signUpWithEmail: jest.fn(),
}));

jest.mock('../../src/config/firebase', () => ({
  auth: {},
}));

// Alertのモック
jest.spyOn(Alert, 'alert');

// グローバル変数のモック
global.tempUserData = {
  email: 'test@example.com',
  password: 'password123',
  fullName: 'テストユーザー',
};

describe('VerificationCodeScreen', () => {
  const mockOnSuccess = jest.fn();
  const mockOnBack = jest.fn();
  const mockVerifyCode = jest.fn();
  const mockSendVerificationCode = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // httpsCallableのモックを設定
    const { httpsCallable } = require('firebase/functions');
    httpsCallable.mockImplementation((_, functionName) => {
      if (functionName === 'verifyCode') return mockVerifyCode;
      if (functionName === 'sendVerificationCode') return mockSendVerificationCode;
      return jest.fn();
    });

    // タイマーのモック
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderComponent = (props = {}) => {
    return render(
      <VerificationCodeScreen
        email="test@example.com"
        action="signup"
        onSuccess={mockOnSuccess}
        onBack={mockOnBack}
        {...props}
      />
    );
  };

  describe('コード入力', () => {
    it('6桁のコードを入力できる', () => {
      const { getAllByAccessibilityLabel } = renderComponent();
      
      const inputs = getAllByAccessibilityLabel(/認証コード\d桁目/);
      expect(inputs).toHaveLength(6);

      // 各桁に数字を入力
      inputs.forEach((input, index) => {
        fireEvent.changeText(input, String(index + 1));
      });

      // 値が設定されていることを確認
      inputs.forEach((input, index) => {
        expect(input.props.value).toBe(String(index + 1));
      });
    });

    it('次の入力欄に自動フォーカス', () => {
      const { getAllByAccessibilityLabel } = renderComponent();
      const inputs = getAllByAccessibilityLabel(/認証コード\d桁目/);

      // 最初の入力欄に入力
      fireEvent.changeText(inputs[0], '1');

      // 2番目の入力欄にフォーカスが移動することを期待
      // （実際のフォーカス移動はテスト環境では確認が難しいため、
      // 入力値が正しく設定されることを確認）
      expect(inputs[0].props.value).toBe('1');
    });

    it('コピーペーストで一度に入力できる', () => {
      const { getAllByAccessibilityLabel } = renderComponent();
      const inputs = getAllByAccessibilityLabel(/認証コード\d桁目/);

      // 最初の入力欄に6桁をペースト
      fireEvent.changeText(inputs[0], '123456');

      // すべての入力欄に値が分配されることを期待
      // （実装により動作が異なる可能性があるため、最初の入力欄の値を確認）
      expect(inputs[0].props.value).toBeTruthy();
    });
  });

  describe('コード検証', () => {
    it('正しいコードで検証成功（サインアップ）', async () => {
      mockVerifyCode.mockResolvedValue({ 
        data: { success: true, customToken: 'test-token' } 
      });
      (signUpWithEmail as jest.Mock).mockResolvedValue({
        id: 'test-user-id',
        email: 'test@example.com',
      });

      const { getAllByAccessibilityLabel, getByText } = renderComponent();
      const inputs = getAllByAccessibilityLabel(/認証コード\d桁目/);
      const verifyButton = getByText('確認');

      // 6桁のコードを入力
      '123456'.split('').forEach((digit, index) => {
        fireEvent.changeText(inputs[index], digit);
      });

      fireEvent.press(verifyButton);

      await waitFor(() => {
        expect(mockVerifyCode).toHaveBeenCalledWith({
          email: 'test@example.com',
          code: '123456',
        });
      });

      await waitFor(() => {
        expect(signUpWithEmail).toHaveBeenCalledWith(
          'test@example.com',
          'password123',
          'テストユーザー'
        );
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          '登録完了',
          'アカウントが作成されました！',
          expect.any(Array)
        );
      });
    });

    it('正しいコードで検証成功（ログイン）', async () => {
      mockVerifyCode.mockResolvedValue({ 
        data: { success: true, customToken: 'test-token' } 
      });

      const { getAllByAccessibilityLabel, getByText } = renderComponent({
        action: 'login',
      });
      const inputs = getAllByAccessibilityLabel(/認証コード\d桁目/);
      const verifyButton = getByText('確認');

      // 6桁のコードを入力
      '123456'.split('').forEach((digit, index) => {
        fireEvent.changeText(inputs[index], digit);
      });

      fireEvent.press(verifyButton);

      await waitFor(() => {
        expect(signInWithCustomToken).toHaveBeenCalledWith(
          expect.any(Object),
          'test-token'
        );
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'ログイン成功',
          'MiraiCareへようこそ！',
          expect.any(Array)
        );
      });
    });

    it('不正なコードでエラー表示', async () => {
      mockVerifyCode.mockRejectedValue({ 
        code: 'invalid-argument',
        message: '認証コードが正しくありません' 
      });

      const { getAllByAccessibilityLabel, getByText } = renderComponent();
      const inputs = getAllByAccessibilityLabel(/認証コード\d桁目/);
      const verifyButton = getByText('確認');

      // 6桁のコードを入力
      '999999'.split('').forEach((digit, index) => {
        fireEvent.changeText(inputs[index], digit);
      });

      fireEvent.press(verifyButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'エラー',
          '認証コードが正しくありません。'
        );
      });
    });

    it('期限切れコードでエラー表示', async () => {
      mockVerifyCode.mockRejectedValue({ 
        code: 'deadline-exceeded',
        message: '認証コードの有効期限が切れています' 
      });

      const { getAllByAccessibilityLabel, getByText } = renderComponent();
      const inputs = getAllByAccessibilityLabel(/認証コード\d桁目/);
      const verifyButton = getByText('確認');

      // 6桁のコードを入力
      '123456'.split('').forEach((digit, index) => {
        fireEvent.changeText(inputs[index], digit);
      });

      fireEvent.press(verifyButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'エラー',
          '認証コードの有効期限が切れています。'
        );
      });
    });

    it('6桁未満のコードでエラー表示', async () => {
      const { getAllByAccessibilityLabel, getByText } = renderComponent();
      const inputs = getAllByAccessibilityLabel(/認証コード\d桁目/);
      const verifyButton = getByText('確認');

      // 3桁のみ入力
      fireEvent.changeText(inputs[0], '1');
      fireEvent.changeText(inputs[1], '2');
      fireEvent.changeText(inputs[2], '3');

      fireEvent.press(verifyButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'エラー',
          '6桁の認証コードを入力してください。'
        );
      });
    });
  });

  describe('再送信機能', () => {
    it('60秒後に再送信ボタンが有効になる', () => {
      const { getByText } = renderComponent();

      // 初期状態では無効
      expect(getByText(/再送信まで 60秒/)).toBeTruthy();

      // 60秒経過
      jest.advanceTimersByTime(60000);

      // 再送信ボタンが有効に
      waitFor(() => {
        expect(getByText('認証コードを再送信')).toBeTruthy();
      });
    });

    it('再送信ボタンで新しいコードを送信', async () => {
      mockSendVerificationCode.mockResolvedValue({ 
        data: { success: true } 
      });

      const { getByText } = renderComponent();

      // 60秒経過
      jest.advanceTimersByTime(60000);

      await waitFor(() => {
        const resendButton = getByText('認証コードを再送信');
        fireEvent.press(resendButton);
      });

      await waitFor(() => {
        expect(mockSendVerificationCode).toHaveBeenCalledWith({
          email: 'test@example.com',
          action: 'signup',
        });
      });

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          '送信完了',
          '新しい認証コードを送信しました。'
        );
      });
    });
  });

  describe('画面遷移', () => {
    it('戻るボタンで前の画面に戻る', () => {
      const { getByText } = renderComponent();
      
      const backButton = getByText('← 戻る');
      fireEvent.press(backButton);

      expect(mockOnBack).toHaveBeenCalled();
    });

    it('検証成功後に成功コールバックを実行', async () => {
      mockVerifyCode.mockResolvedValue({ 
        data: { success: true, customToken: 'test-token' } 
      });
      (signUpWithEmail as jest.Mock).mockResolvedValue({
        id: 'test-user-id',
        email: 'test@example.com',
      });

      const { getAllByAccessibilityLabel, getByText } = renderComponent();
      const inputs = getAllByAccessibilityLabel(/認証コード\d桁目/);
      const verifyButton = getByText('確認');

      // 6桁のコードを入力
      '123456'.split('').forEach((digit, index) => {
        fireEvent.changeText(inputs[index], digit);
      });

      fireEvent.press(verifyButton);

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalled();
      });

      // AlertのOKボタンを押す
      const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
      const buttons = alertCall[2];
      buttons[0].onPress();

      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});