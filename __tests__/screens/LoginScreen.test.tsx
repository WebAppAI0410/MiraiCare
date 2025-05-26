import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import LoginScreen from '../../src/screens/LoginScreen';
import * as authService from '../../src/services/authService';

// authServiceをモック
jest.mock('../../src/services/authService', () => ({
  signInWithEmail: jest.fn(),
  resetPassword: jest.fn(),
}));

// Alertをモック
jest.spyOn(Alert, 'alert');

describe('LoginScreen', () => {
  const mockOnLoginSuccess = jest.fn();
  const mockOnSwitchToSignup = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    onLoginSuccess: mockOnLoginSuccess,
    onSwitchToSignup: mockOnSwitchToSignup,
  };

  it('画面が正常にレンダリングされる', () => {
    const { getByText, getByLabelText } = render(
      <LoginScreen {...defaultProps} />
    );

    // 主要な要素が表示されることを確認
    expect(getByLabelText('ログイン')).toBeTruthy(); // ボタンのアクセシビリティラベル
    expect(getByLabelText('メールアドレス入力')).toBeTruthy();
    expect(getByLabelText('パスワード入力')).toBeTruthy();
  });

  it('メールアドレス入力が正常に動作する', () => {
    const { getByLabelText } = render(
      <LoginScreen {...defaultProps} />
    );

    const emailInput = getByLabelText('メールアドレス入力');
    fireEvent.changeText(emailInput, 'test@example.com');

    expect(emailInput.props.value).toBe('test@example.com');
  });

  it('パスワード入力が正常に動作する', () => {
    const { getByLabelText } = render(
      <LoginScreen {...defaultProps} />
    );

    const passwordInput = getByLabelText('パスワード入力');
    fireEvent.changeText(passwordInput, 'password123');

    expect(passwordInput.props.value).toBe('password123');
  });

  it('空のメールアドレスでログイン時にエラーが表示される', async () => {
    const { getByText, getByLabelText } = render(
      <LoginScreen {...defaultProps} />
    );

    const passwordInput = getByLabelText('パスワード入力');
    fireEvent.changeText(passwordInput, 'password123');

    const loginButton = getByLabelText('ログイン');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        '入力エラー',
        'メールアドレスを入力してください。'
      );
    });
  });

  it('空のパスワードでログイン時にエラーが表示される', async () => {
    const { getByText, getByLabelText } = render(
      <LoginScreen {...defaultProps} />
    );

    const emailInput = getByLabelText('メールアドレス入力');
    fireEvent.changeText(emailInput, 'test@example.com');

    const loginButton = getByLabelText('ログイン');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        '入力エラー',
        'パスワードを入力してください。'
      );
    });
  });

  it('正しい入力でログインが成功する', async () => {
    const { getByText, getByLabelText } = render(
      <LoginScreen {...defaultProps} />
    );

    // authServiceのモックを設定
    (authService.signInWithEmail as jest.Mock).mockResolvedValue({
      user: { id: '1', email: 'test@example.com' },
    });

    const emailInput = getByLabelText('メールアドレス入力');
    const passwordInput = getByLabelText('パスワード入力');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');

    const loginButton = getByLabelText('ログイン');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(authService.signInWithEmail).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
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

  it('ログインエラー時に適切なエラーメッセージが表示される', async () => {
    const { getByText, getByLabelText } = render(
      <LoginScreen {...defaultProps} />
    );

    // authServiceのモックを設定（エラーを投げる）
    (authService.signInWithEmail as jest.Mock).mockRejectedValue(
      new Error('Invalid credentials')
    );

    const emailInput = getByLabelText('メールアドレス入力');
    const passwordInput = getByLabelText('パスワード入力');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'wrongpassword');

    const loginButton = getByLabelText('ログイン');
    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'ログインエラー',
        'Invalid credentials'
      );
    });
  });

  it('パスワード表示切り替えが正常に動作する', () => {
    const { getByText } = render(
      <LoginScreen {...defaultProps} />
    );

    const toggleButton = getByText('表示');
    fireEvent.press(toggleButton);

    expect(getByText('隠す')).toBeTruthy();
  });

  it('サインアップ画面への切り替えが正常に動作する', () => {
    const { getByText } = render(
      <LoginScreen {...defaultProps} />
    );

    const signupButton = getByText('新規アカウント作成');
    fireEvent.press(signupButton);

    expect(mockOnSwitchToSignup).toHaveBeenCalled();
  });

  it('ローディング状態が適切に表示される', async () => {
    const { getByText, getByLabelText } = render(
      <LoginScreen {...defaultProps} />
    );

    // authServiceのモックを設定（遅延）
    (authService.signInWithEmail as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    const emailInput = getByLabelText('メールアドレス入力');
    const passwordInput = getByLabelText('パスワード入力');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');

    const loginButton = getByLabelText('ログイン');
    fireEvent.press(loginButton);

    // ログインボタンが無効化されることを確認（ローディング中）
    await waitFor(() => {
      const button = getByLabelText('ログイン');
      expect(button.props.accessibilityState?.disabled).toBe(true);
    });
  });

  it('アクセシビリティラベルが適切に設定されている', () => {
    const { getByLabelText } = render(
      <LoginScreen {...defaultProps} />
    );

    expect(getByLabelText('メールアドレス入力')).toBeTruthy();
    expect(getByLabelText('パスワード入力')).toBeTruthy();
    expect(getByLabelText('ログイン')).toBeTruthy();
  });
});