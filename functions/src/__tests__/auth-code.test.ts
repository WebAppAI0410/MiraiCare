import * as functions from 'firebase-functions-test';
import * as admin from 'firebase-admin';

// Firebase Admin SDKのモック
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  firestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: jest.fn(),
        get: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })),
    })),
    FieldValue: {
      serverTimestamp: jest.fn(() => 'mock-timestamp'),
    },
  })),
  auth: jest.fn(() => ({
    createCustomToken: jest.fn(),
  })),
}));

// Nodemailerのモック
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(),
  })),
}));

// テスト環境の設定
const test = functions();
const { sendVerificationCode, verifyCode } = require('../auth-code');

describe('auth-code functions', () => {
  const mockFirestore = admin.firestore();
  const mockAuth = admin.auth();
  const mockTransporter = require('nodemailer').createTransport();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // 環境変数の設定
    process.env.EMAIL_USER = 'test@example.com';
    process.env.EMAIL_PASSWORD = 'test-password';
  });

  afterAll(() => {
    test.cleanup();
  });

  describe('sendVerificationCode', () => {
    const mockContext = {
      auth: null,
    };

    it('正常に認証コードを送信', async () => {
      const data = {
        email: 'user@example.com',
        action: 'signup',
      };

      // Firestoreのモック設定
      const mockDoc = {
        set: jest.fn().mockResolvedValue(true),
      };
      (mockFirestore.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDoc),
      });

      // メール送信のモック設定
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' });

      // 関数を実行
      const wrapped = test.wrap(sendVerificationCode);
      const result = await wrapped(data, mockContext);

      // 検証
      expect(result).toEqual({
        success: true,
        message: '認証コードを送信しました',
      });

      // Firestoreに保存されたことを確認
      expect(mockDoc.set).toHaveBeenCalledWith({
        code: expect.stringMatching(/^\d{6}$/), // 6桁の数字
        email: 'user@example.com',
        action: 'signup',
        expiresAt: expect.any(Number),
        verified: false,
        createdAt: 'mock-timestamp',
      });

      // メールが送信されたことを確認
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: 'MiraiCare <noreply@miraicare.app>',
        to: 'user@example.com',
        subject: 'MiraiCare 認証コード',
        html: expect.stringContaining('認証コード'),
      });
    });

    it('メールアドレスが指定されていない場合エラー', async () => {
      const data = {
        action: 'signup',
      };

      const wrapped = test.wrap(sendVerificationCode);
      
      await expect(wrapped(data, mockContext)).rejects.toThrow(
        'メールアドレスが必要です'
      );
    });

    it('メール送信エラー時に適切なエラーを返す', async () => {
      const data = {
        email: 'user@example.com',
        action: 'signup',
      };

      // Firestoreのモック設定
      const mockDoc = {
        set: jest.fn().mockResolvedValue(true),
      };
      (mockFirestore.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDoc),
      });

      // メール送信エラー
      mockTransporter.sendMail.mockRejectedValue(new Error('SMTP error'));

      const wrapped = test.wrap(sendVerificationCode);
      
      await expect(wrapped(data, mockContext)).rejects.toThrow(
        '認証コードの送信に失敗しました'
      );
    });
  });

  describe('verifyCode', () => {
    const mockContext = {
      auth: null,
    };

    it('正しいコードで検証成功', async () => {
      const data = {
        email: 'user@example.com',
        code: '123456',
      };

      // Firestoreのモック設定
      const mockDoc = {
        exists: true,
        data: jest.fn().mockReturnValue({
          code: '123456',
          expiresAt: Date.now() + 5 * 60 * 1000, // 5分後
          action: 'signup',
          verified: false,
        }),
        update: jest.fn().mockResolvedValue(true),
      };
      
      const mockDocRef = {
        get: jest.fn().mockResolvedValue(mockDoc),
        update: jest.fn().mockResolvedValue(true),
        delete: jest.fn(),
      };
      
      (mockFirestore.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDocRef),
      });

      // カスタムトークンのモック
      (mockAuth.createCustomToken as jest.Mock).mockResolvedValue('custom-token');

      // 関数を実行
      const wrapped = test.wrap(verifyCode);
      const result = await wrapped(data, mockContext);

      // 検証
      expect(result).toEqual({
        success: true,
        customToken: 'custom-token',
        action: 'signup',
      });

      // verified フラグが更新されたことを確認
      expect(mockDocRef.update).toHaveBeenCalledWith({ verified: true });

      // カスタムトークンが作成されたことを確認
      expect(mockAuth.createCustomToken).toHaveBeenCalledWith('user@example.com');
    });

    it('コードが見つからない場合エラー', async () => {
      const data = {
        email: 'user@example.com',
        code: '123456',
      };

      // Firestoreのモック設定（ドキュメントが存在しない）
      const mockDoc = {
        exists: false,
      };
      
      const mockDocRef = {
        get: jest.fn().mockResolvedValue(mockDoc),
      };
      
      (mockFirestore.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDocRef),
      });

      const wrapped = test.wrap(verifyCode);
      
      await expect(wrapped(data, mockContext)).rejects.toThrow(
        '認証コードが見つかりません'
      );
    });

    it('期限切れコードでエラー', async () => {
      const data = {
        email: 'user@example.com',
        code: '123456',
      };

      // Firestoreのモック設定（期限切れ）
      const mockDoc = {
        exists: true,
        data: jest.fn().mockReturnValue({
          code: '123456',
          expiresAt: Date.now() - 1000, // 1秒前に期限切れ
          action: 'signup',
          verified: false,
        }),
      };
      
      const mockDocRef = {
        get: jest.fn().mockResolvedValue(mockDoc),
        delete: jest.fn().mockResolvedValue(true),
      };
      
      (mockFirestore.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDocRef),
      });

      const wrapped = test.wrap(verifyCode);
      
      await expect(wrapped(data, mockContext)).rejects.toThrow(
        '認証コードの有効期限が切れています'
      );

      // 期限切れコードが削除されたことを確認
      expect(mockDocRef.delete).toHaveBeenCalled();
    });

    it('不正なコードでエラー', async () => {
      const data = {
        email: 'user@example.com',
        code: '999999',
      };

      // Firestoreのモック設定（コードが一致しない）
      const mockDoc = {
        exists: true,
        data: jest.fn().mockReturnValue({
          code: '123456', // 異なるコード
          expiresAt: Date.now() + 5 * 60 * 1000,
          action: 'signup',
          verified: false,
        }),
      };
      
      const mockDocRef = {
        get: jest.fn().mockResolvedValue(mockDoc),
      };
      
      (mockFirestore.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDocRef),
      });

      const wrapped = test.wrap(verifyCode);
      
      await expect(wrapped(data, mockContext)).rejects.toThrow(
        '認証コードが正しくありません'
      );
    });

    it('必須パラメータが不足している場合エラー', async () => {
      const wrapped = test.wrap(verifyCode);
      
      // メールアドレスがない
      await expect(wrapped({ code: '123456' }, mockContext)).rejects.toThrow(
        'メールアドレスと認証コードが必要です'
      );

      // コードがない
      await expect(wrapped({ email: 'user@example.com' }, mockContext)).rejects.toThrow(
        'メールアドレスと認証コードが必要です'
      );
    });
  });

  describe('認証コード生成', () => {
    it('6桁の数字が生成される', () => {
      // generateVerificationCode関数は内部関数なので、
      // sendVerificationCodeを通じて間接的にテスト
      const data = {
        email: 'user@example.com',
        action: 'signup',
      };

      // Firestoreのモック設定
      let savedCode: string = '';
      const mockDoc = {
        set: jest.fn().mockImplementation((data) => {
          savedCode = data.code;
          return Promise.resolve(true);
        }),
      };
      (mockFirestore.collection as jest.Mock).mockReturnValue({
        doc: jest.fn().mockReturnValue(mockDoc),
      });

      // メール送信のモック設定
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-id' });

      // 関数を実行
      const wrapped = test.wrap(sendVerificationCode);
      wrapped(data, mockContext).then(() => {
        // 6桁の数字であることを確認
        expect(savedCode).toMatch(/^\d{6}$/);
        expect(parseInt(savedCode)).toBeGreaterThanOrEqual(100000);
        expect(parseInt(savedCode)).toBeLessThanOrEqual(999999);
      });
    });
  });
});