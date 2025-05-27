import { 
  signUpWithEmailFree, 
  signInWithEmailFree,
  resendVerificationEmail 
} from '../../src/services/authServiceFree';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth } from '../../src/config/firebase';

// Firebase Auth と Firestore のモック
jest.mock('firebase/auth');
jest.mock('firebase/firestore');
jest.mock('../../src/config/firebase', () => ({
  auth: {},
  db: {},
  COLLECTIONS: {
    USERS: 'users'
  }
}));

describe('authServiceFree', () => {
  const mockUser = {
    uid: 'test-uid',
    email: 'test@example.com',
    emailVerified: false,
    displayName: 'Test User'
  } as FirebaseUser;

  const mockUserVerified = {
    ...mockUser,
    emailVerified: true
  } as FirebaseUser;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signUpWithEmailFree', () => {
    it('新規アカウントを作成し、確認メールを送信する', async () => {
      const mockUserCredential = { user: mockUser };
      (createUserWithEmailAndPassword as jest.Mock).mockResolvedValue(mockUserCredential);
      (updateProfile as jest.Mock).mockResolvedValue(undefined);
      (sendEmailVerification as jest.Mock).mockResolvedValue(undefined);
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await signUpWithEmailFree('test@example.com', 'password123', 'Test User');

      expect(result.success).toBe(true);
      expect(result.message).toContain('確認メールを送信しました');
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, 'test@example.com', 'password123');
      expect(updateProfile).toHaveBeenCalledWith(mockUser, { displayName: 'Test User' });
      expect(sendEmailVerification).toHaveBeenCalledWith(mockUser);
      expect(setDoc).toHaveBeenCalled();
    });

    it('既存のメールアドレスでエラーを返す', async () => {
      const error = new Error('Firebase: Error (auth/email-already-in-use).');
      (error as any).code = 'auth/email-already-in-use';
      (createUserWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

      await expect(signUpWithEmailFree('existing@example.com', 'password123', 'Test User'))
        .rejects.toThrow('このメールアドレスは既に使用されています。');
    });
  });

  describe('signInWithEmailFree', () => {
    it('メール確認済みユーザーのログインを許可する', async () => {
      const mockUserCredential = { user: mockUserVerified };
      const mockUserDoc = {
        exists: () => true,
        data: () => ({
          id: 'test-uid',
          email: 'test@example.com',
          fullName: 'Test User'
        })
      };
      
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue(mockUserCredential);
      (getDoc as jest.Mock).mockResolvedValue(mockUserDoc);
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await signInWithEmailFree('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.emailVerified).toBe(true);
      expect(result.message).toBe('ログインに成功しました。');
    });

    it('メール未確認ユーザーのログインをブロックする', async () => {
      const mockUserCredential = { user: mockUser };
      (signInWithEmailAndPassword as jest.Mock).mockResolvedValue(mockUserCredential);

      const result = await signInWithEmailFree('test@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.emailVerified).toBe(false);
      expect(result.message).toContain('メールアドレスが確認されていません');
    });

    it('間違ったパスワードでエラーを返す', async () => {
      const error = new Error('Firebase: Error (auth/wrong-password).');
      (error as any).code = 'auth/wrong-password';
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

      const result = await signInWithEmailFree('test@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.message).toBe('メールアドレスまたはパスワードが正しくありません。');
    });

    it('存在しないユーザーでエラーを返す', async () => {
      const error = new Error('Firebase: Error (auth/user-not-found).');
      (error as any).code = 'auth/user-not-found';
      (signInWithEmailAndPassword as jest.Mock).mockRejectedValue(error);

      const result = await signInWithEmailFree('nonexistent@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.message).toBe('このメールアドレスは登録されていません。');
    });
  });

  describe('resendVerificationEmail', () => {
    it('メール未確認ユーザーに確認メールを再送信する', async () => {
      (auth as any).currentUser = mockUser;
      (sendEmailVerification as jest.Mock).mockResolvedValue(undefined);

      const result = await resendVerificationEmail();

      expect(result.success).toBe(true);
      expect(result.message).toContain('確認メールを再送信しました');
      expect(sendEmailVerification).toHaveBeenCalledWith(mockUser);
    });

    it('メール確認済みユーザーにはエラーを返す', async () => {
      (auth as any).currentUser = mockUserVerified;

      const result = await resendVerificationEmail();

      expect(result.success).toBe(false);
      expect(result.message).toBe('メールアドレスは既に確認済みです');
    });

    it('ログインしていない場合はエラーを返す', async () => {
      (auth as any).currentUser = null;

      const result = await resendVerificationEmail();

      expect(result.success).toBe(false);
      expect(result.message).toBe('ログインしていません');
    });

    it('送信回数制限に達した場合はエラーを返す', async () => {
      (auth as any).currentUser = mockUser;
      const error = new Error('Firebase: Error (auth/too-many-requests).');
      (error as any).code = 'auth/too-many-requests';
      (sendEmailVerification as jest.Mock).mockRejectedValue(error);

      const result = await resendVerificationEmail();

      expect(result.success).toBe(false);
      expect(result.message).toContain('送信回数が上限に達しました');
    });
  });
});