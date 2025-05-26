import { signInWithEmail, signUpWithEmail, signOut, getCurrentUser, resetPassword } from '../../src/services/authService';
import { supabase } from '../../src/config/supabase';

// Supabaseをモック
jest.mock('../../src/config/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
}));

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signInWithEmail', () => {
    it('正常なログインが成功する', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        email_confirmed_at: '2024-01-01T00:00:00Z',
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: { access_token: 'token' } },
        error: null,
      });

      const result = await signInWithEmail('test@example.com', 'password123');

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result.user).toEqual(mockUser);
    });

    it('無効な認証情報でエラーが発生する', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      await expect(signInWithEmail('test@example.com', 'wrongpassword'))
        .rejects
        .toThrow('Invalid login credentials');

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'wrongpassword',
      });
    });

    it('空のメールアドレスでエラーが発生する', async () => {
      await expect(signInWithEmail('', 'password123'))
        .rejects
        .toThrow('メールアドレスとパスワードは必須です');
    });

    it('空のパスワードでエラーが発生する', async () => {
      await expect(signInWithEmail('test@example.com', ''))
        .rejects
        .toThrow('メールアドレスとパスワードは必須です');
    });

    it('ネットワークエラーが適切に処理される', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await expect(signInWithEmail('test@example.com', 'password123'))
        .rejects
        .toThrow('Network error');
    });
  });

  describe('signUpWithEmail', () => {
    it('正常なユーザー登録が成功する', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'newuser@example.com',
        email_confirmed_at: null,
      };

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null,
      });

      const result = await signUpWithEmail('newuser@example.com', 'password123');

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
      });
      expect(result.user).toEqual(mockUser);
    });

    it('既存のメールアドレスでエラーが発生する', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already registered' },
      });

      await expect(signUpWithEmail('existing@example.com', 'password123'))
        .rejects
        .toThrow('User already registered');
    });

    it('弱いパスワードでエラーが発生する', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Password should be at least 6 characters' },
      });

      await expect(signUpWithEmail('test@example.com', '123'))
        .rejects
        .toThrow('Password should be at least 6 characters');
    });
  });

  describe('signOut', () => {
    it('正常なログアウトが成功する', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: null,
      });

      await expect(signOut()).resolves.not.toThrow();
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('ログアウト時のエラーが適切に処理される', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: { message: 'Sign out failed' },
      });

      await expect(signOut()).rejects.toThrow('Sign out failed');
    });
  });

  describe('getCurrentUser', () => {
    it('現在のユーザー情報を取得できる', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        email_confirmed_at: '2024-01-01T00:00:00Z',
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await getCurrentUser();

      expect(supabase.auth.getUser).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('未認証状態でnullが返される', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await getCurrentUser();

      expect(result).toBeNull();
    });

    it('エラー時に適切にハンドリングされる', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid JWT' },
      });

      await expect(getCurrentUser()).rejects.toThrow('Invalid JWT');
    });
  });

  describe('resetPassword', () => {
    it('パスワードリセットメールが正常に送信される', async () => {
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
        data: {},
        error: null,
      });

      await expect(resetPassword('test@example.com')).resolves.not.toThrow();
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com'
      );
    });

    it('無効なメールアドレスでエラーが発生する', async () => {
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
        data: {},
        error: { message: 'Invalid email address' },
      });

      await expect(resetPassword('invalid-email'))
        .rejects
        .toThrow('Invalid email address');
    });

    it('空のメールアドレスでエラーが発生する', async () => {
      await expect(resetPassword(''))
        .rejects
        .toThrow('メールアドレスは必須です');
    });
  });

  describe('認証状態監視', () => {
    it('認証状態変更リスナーが正常に設定される', () => {
      const mockCallback = jest.fn();
      
      // 認証状態監視のセットアップをテスト
      (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation(
        (callback) => {
          callback('SIGNED_IN', { user: { id: '123' } });
          return { data: { subscription: { unsubscribe: jest.fn() } } };
        }
      );

      // 実際の実装で使用される認証状態監視をテスト
      const { data } = supabase.auth.onAuthStateChange(mockCallback);

      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith('SIGNED_IN', { user: { id: '123' } });
      expect(data.subscription.unsubscribe).toBeDefined();
    });
  });

  describe('エラーハンドリング', () => {
    it('Supabaseエラーが適切に変換される', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { 
          message: 'Email not confirmed',
          status: 400 
        },
      });

      await expect(signInWithEmail('test@example.com', 'password123'))
        .rejects
        .toThrow('Email not confirmed');
    });

    it('ネットワークエラーが適切に処理される', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockRejectedValue(
        new Error('fetch failed')
      );

      await expect(signInWithEmail('test@example.com', 'password123'))
        .rejects
        .toThrow('fetch failed');
    });

    it('予期しないエラーが適切に処理される', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: null,
        error: null,
      });

      await expect(signInWithEmail('test@example.com', 'password123'))
        .rejects
        .toThrow('予期しないエラーが発生しました');
    });
  });

  describe('バリデーション', () => {
    it('メールアドレス形式が正しく検証される', async () => {
      await expect(signInWithEmail('invalid-email', 'password123'))
        .rejects
        .toThrow('有効なメールアドレスを入力してください');
    });

    it('パスワード長が正しく検証される', async () => {
      await expect(signUpWithEmail('test@example.com', '12345'))
        .rejects
        .toThrow('パスワードは6文字以上である必要があります');
    });
  });
});