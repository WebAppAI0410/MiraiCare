import { create } from 'zustand';
import { User } from '../types';
import { 
  subscribeToAuthState, 
  signOutUser, 
  getCurrentUser,
  sendMagicLink,
  completeMagicLinkSignIn,
  sendOTPToPhone,
  verifyOTPCode,
  checkForMagicLinkSignIn
} from '../services/authService';

// 認証ストアの型定義
interface AuthStore {
  // 状態
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authMethod: 'email' | 'magiclink' | 'otp' | null;
  
  // アクション
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => void;
  logout: () => Promise<void>;
  
  // Magic Link認証
  sendMagicLinkToEmail: (email: string) => Promise<void>;
  completeMagicLink: (url?: string) => Promise<User>;
  
  // OTP認証
  sendOTP: (phoneNumber: string) => Promise<void>;
  verifyOTP: (code: string) => Promise<User>;
  
  // ユーティリティ
  checkMagicLinkStatus: () => Promise<boolean>;
}

// 認証ストア実装
export const useAuthStore = create<AuthStore>((set, get) => ({
  // 初期状態
  user: null,
  isLoading: true,
  isAuthenticated: false,
  authMethod: null,

  // ユーザー設定
  setUser: (user: User | null) => {
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    });
  },

  // ローディング状態設定
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  // 認証状態の初期化
  initialize: () => {
    const unsubscribe = subscribeToAuthState((user) => {
      set({
        user,
        isAuthenticated: !!user,
        isLoading: false,
        authMethod: user ? 'email' : null, // メール/パスワード認証の場合は'email'を設定
      });
    });
    
    // 初期ユーザー取得
    const currentUser = getCurrentUser();
    if (currentUser) {
      // 既にログインしている場合の処理は subscribeToAuthState で処理される
    } else {
      set({ isLoading: false });
    }
    
    // Magic Linkログインの確認
    checkForMagicLinkSignIn().then(isMagicLink => {
      if (isMagicLink) {
        get().completeMagicLink().catch(console.error);
      }
    }).catch(console.error);
    
    return unsubscribe;
  },

  // ログアウト
  logout: async () => {
    try {
      set({ isLoading: true });
      await signOutUser();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        authMethod: null,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Magic Link認証の送信
  sendMagicLinkToEmail: async (email: string) => {
    try {
      set({ isLoading: true });
      await sendMagicLink(email);
      set({ 
        isLoading: false,
        authMethod: 'magiclink'
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Magic Linkログインの完了
  completeMagicLink: async (url?: string) => {
    try {
      set({ isLoading: true });
      const user = await completeMagicLinkSignIn(url);
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        authMethod: 'magiclink',
      });
      return user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // OTP認証の送信
  sendOTP: async (phoneNumber: string) => {
    try {
      set({ isLoading: true });
      await sendOTPToPhone(phoneNumber);
      set({ 
        isLoading: false,
        authMethod: 'otp'
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // OTP認証の確認
  verifyOTP: async (code: string) => {
    try {
      set({ isLoading: true });
      const user = await verifyOTPCode(code);
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        authMethod: 'otp',
      });
      return user;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Magic Linkログイン状態の確認
  checkMagicLinkStatus: async () => {
    return await checkForMagicLinkSignIn();
  },
}));

// 認証状態確認用のヘルパーフック
export const useAuth = () => {
  const { user, isLoading, isAuthenticated, authMethod } = useAuthStore();
  
  return {
    user,
    isLoading,
    isAuthenticated,
    authMethod,
    isGuest: !isAuthenticated,
  };
};

// 認証が必要な画面用のヘルパーフック
export const useRequireAuth = () => {
  const { isAuthenticated, isLoading } = useAuthStore();
  
  return {
    isAuthenticated,
    isLoading,
    shouldRedirectToLogin: !isLoading && !isAuthenticated,
  };
};