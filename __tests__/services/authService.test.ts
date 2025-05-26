import { 
  signInWithEmail, 
  signUpWithEmail, 
  signOut, 
  getCurrentUser, 
  resetPassword 
} from '../../src/services/authService';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Firebaseをモック
jest.mock('firebase/auth');
jest.mock('firebase/firestore');

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signInWithEmail', () => {
    it('正常なログインが成功する', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'test@example.com',
        displayName: 'テストユーザー',
      };

      const mockUserDoc = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'テストユーザー',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      // Firebaseのモックを設定
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: mockUser,
      });

      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => mockUserDoc,
      });

      // When: ログインを実行
      const result = await signInWithEmail('test@example.com', 'password123');

      // Then: 正しくログインできる
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password123'
      );
      expect(result).toEqual(expect.objectContaining({
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'テストユーザー',
      }));
    });

    it('無効な資格情報でエラーが発生する', async () => {
      // Given: 認証エラーを設定
      const authError = {
        code: 'auth/invalid-credential',
        message: 'Invalid credentials',
      };
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(authError);

      // When & Then: エラーが投げられる
      await expect(signInWithEmail('test@example.com', 'wrongpassword'))
        .rejects
        .toThrow('ログインに失敗しました。メールアドレスまたはパスワードが正しくありません。');
    });

    it('メールアドレスが空の場合エラーが発生する', async () => {
      await expect(signInWithEmail('', 'password123'))
        .rejects
        .toThrow('メールアドレスとパスワードを入力してください');
    });

    it('パスワードが空の場合エラーが発生する', async () => {
      await expect(signInWithEmail('test@example.com', ''))
        .rejects
        .toThrow('メールアドレスとパスワードを入力してください');
    });
  });

  describe('signUpWithEmail', () => {
    it('新規ユーザー登録が成功する', async () => {
      const mockUser = {
        uid: 'new-user-123',
        email: 'newuser@example.com',
      };

      // Firebaseのモックを設定
      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue({
        user: mockUser,
      });

      (setDoc as jest.Mock).mockResolvedValue(undefined);

      // When: サインアップを実行
      const result = await signUpWithEmail('newuser@example.com', 'password123', '新規ユーザー');

      // Then: 正しく登録できる
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'newuser@example.com',
        'password123'
      );
      expect(setDoc).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({
        id: 'new-user-123',
        email: 'newuser@example.com',
        fullName: '新規ユーザー',
      }));
    });

    it('既存のメールアドレスでエラーが発生する', async () => {
      // Given: メールアドレス重複エラーを設定
      const authError = {
        code: 'auth/email-already-in-use',
        message: 'Email already in use',
      };
      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(authError);

      // When & Then: エラーが投げられる
      await expect(signUpWithEmail('existing@example.com', 'password123', 'テストユーザー'))
        .rejects
        .toThrow('このメールアドレスは既に使用されています');
    });

    it('弱いパスワードでエラーが発生する', async () => {
      // Given: 弱いパスワードエラーを設定
      const authError = {
        code: 'auth/weak-password',
        message: 'Password is too weak',
      };
      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(authError);

      // When & Then: エラーが投げられる
      await expect(signUpWithEmail('test@example.com', '123', 'テストユーザー'))
        .rejects
        .toThrow('パスワードは6文字以上で設定してください');
    });
  });

  describe('signOut', () => {
    it('正常にログアウトできる', async () => {
      // Given: ログアウト成功を設定
      (firebaseSignOut as jest.Mock).mockResolvedValue(undefined);

      // When: ログアウトを実行
      await signOut();

      // Then: Firebaseのサインアウトが呼ばれる
      expect(firebaseSignOut).toHaveBeenCalled();
    });

    it('ログアウト時のエラーを処理する', async () => {
      // Given: ログアウトエラーを設定
      (firebaseSignOut as jest.Mock).mockRejectedValue(new Error('Sign out error'));

      // When & Then: エラーが投げられる
      await expect(signOut()).rejects.toThrow('ログアウトに失敗しました');
    });
  });

  describe('getCurrentUser', () => {
    it('ログイン中のユーザー情報を取得できる', async () => {
      const mockUser = {
        uid: 'user-123',
        email: 'test@example.com',
      };

      const mockUserDoc = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'テストユーザー',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      // authのcurrentUserをモック
      Object.defineProperty(require('../../src/config/firebase').auth, 'currentUser', {
        value: mockUser,
        configurable: true,
      });

      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => mockUserDoc,
      });

      // When: 現在のユーザーを取得
      const result = await getCurrentUser();

      // Then: ユーザー情報が返される
      expect(result).toEqual(expect.objectContaining({
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'テストユーザー',
      }));
    });

    it('未ログイン時はnullを返す', async () => {
      // authのcurrentUserをnullに設定
      Object.defineProperty(require('../../src/config/firebase').auth, 'currentUser', {
        value: null,
        configurable: true,
      });

      // When: 現在のユーザーを取得
      const result = await getCurrentUser();

      // Then: nullが返される
      expect(result).toBeNull();
    });
  });

  describe('resetPassword', () => {
    it('パスワードリセットメールが送信される', async () => {
      // Given: メール送信成功を設定
      (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

      // When: パスワードリセットを実行
      await resetPassword('test@example.com');

      // Then: メール送信が呼ばれる
      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com'
      );
    });

    it('存在しないメールアドレスでエラーが発生する', async () => {
      // Given: ユーザー不在エラーを設定
      const authError = {
        code: 'auth/user-not-found',
        message: 'User not found',
      };
      (sendPasswordResetEmail as jest.Mock).mockRejectedValue(authError);

      // When & Then: エラーが投げられる
      await expect(resetPassword('notfound@example.com'))
        .rejects
        .toThrow('このメールアドレスは登録されていません');
    });

    it('メールアドレスが空の場合エラーが発生する', async () => {
      await expect(resetPassword(''))
        .rejects
        .toThrow('メールアドレスを入力してください');
    });
  });
});