import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  PhoneAuthProvider,
  signInWithCredential,
  RecaptchaVerifier,
  ConfirmationResult,
  updateProfile,
  User as FirebaseUser,
  AuthError,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, COLLECTIONS } from '../config/firebase';
import type { User } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 認証状態の監視
export const subscribeToAuthState = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // Firestoreからユーザー情報を取得
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        callback({
          ...userData,
          id: firebaseUser.uid,
        });
      } else {
        // 初回ログイン時にユーザードキュメントを作成
        const newUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          fullName: firebaseUser.displayName || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), newUser);
        callback(newUser);
      }
    } else {
      callback(null);
    }
  });
};

// 簡単ログイン（メールアドレスとパスワード）
export const signInWithEmail = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Firestoreからユーザー情報を取得
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
    if (userDoc.exists()) {
      return {
        ...userDoc.data() as User,
        id: firebaseUser.uid,
      };
    }
    
    throw new Error('ユーザー情報が見つかりません');
  } catch (error) {
    throw handleAuthError(error as AuthError);
  }
};

// 新規アカウント作成
export const signUpWithEmail = async (
  email: string, 
  password: string, 
  fullName: string
): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // プロフィール更新
    await updateProfile(firebaseUser, {
      displayName: fullName,
    });
    
    // Firestoreにユーザー情報を保存
    const newUser: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      fullName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), newUser);
    
    return newUser;
  } catch (error) {
    throw handleAuthError(error as AuthError);
  }
};

// ログアウト
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    throw handleAuthError(error as AuthError);
  }
};

// パスワードリセット
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw handleAuthError(error as AuthError);
  }
};

// 現在のユーザーを取得
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

// Magic Link認証
export const sendMagicLink = async (email: string): Promise<void> => {
  try {
    // 環境変数またはデフォルトのFirebase Dynamic LinkドメインURLを使用
    const baseUrl = process.env.MIRAI_FIREBASE_DYNAMIC_LINK || 'https://miraicare.page.link';
    const actionCodeSettings = {
      url: `${baseUrl}/auth/complete`, // Firebase Dynamic Linkドメインを使用
      handleCodeInApp: true,
    };
    
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    // メールアドレスをAsyncStorageに保存（ログイン完了時に使用）
    await AsyncStorage.setItem('emailForSignIn', email);
  } catch (error) {
    throw handleAuthError(error as AuthError);
  }
};

// Magic Linkでのログイン確認・完了
export const completeMagicLinkSignIn = async (url?: string): Promise<User> => {
  try {
    // 完全なディープリンクURLを取得（クエリパラメータを含む）
    let signInUrl = url;
    if (!signInUrl) {
      // React NativeのLinkingから実際のディープリンクURLを取得
      const { default: Linking } = await import('expo-linking');
      signInUrl = await Linking.getInitialURL();
    }

    if (!signInUrl) {
      throw new Error('マジックリンクが検出できませんでした。');
    }
    
    if (isSignInWithEmailLink(auth, signInUrl)) {
      let email = await AsyncStorage.getItem('emailForSignIn');
      
      if (!email) {
        // ユーザーがメールアドレスを手動で入力する必要がある場合
        throw new Error('メールアドレスが見つかりません。再度メールアドレスを入力してください。');
      }
      
      const userCredential = await signInWithEmailLink(auth, email, signInUrl);
      const firebaseUser = userCredential.user;
      
      // AsyncStorageからメールアドレスを削除
      await AsyncStorage.removeItem('emailForSignIn');
      
      // Firestoreからユーザー情報を取得または作成
      let userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
      
      if (userDoc.exists()) {
        return {
          ...userDoc.data() as User,
          id: firebaseUser.uid,
        };
      } else {
        // 初回ログイン時にユーザードキュメントを作成
        const newUser: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          fullName: firebaseUser.displayName || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), newUser);
        return newUser;
      }
    } else {
      throw new Error('無効なマジックリンクです。');
    }
  } catch (error) {
    throw handleAuthError(error as AuthError);
  }
};

// SMS OTP認証の開始
let recaptchaVerifier: RecaptchaVerifier | null = null;
let confirmationResult: ConfirmationResult | null = null;

export const sendOTPToPhone = async (phoneNumber: string): Promise<void> => {
  try {
    // React Nativeの場合、reCAPTCHAは別の方法で処理が必要
    // このサンプルでは、SMS認証はFirebase プロジェクト設定でテストモードを使用することを想定
    console.warn('OTP認証はFirebaseプロジェクトでSMS認証が有効化されている必要があります。');
    
    // テスト用のダミー実装
    // 実際の本番環境では、Firebase App Checkの設定が必要
    throw new Error('SMS認証は現在開発中です。メール認証またはマジックリンクをご利用ください。');
    
    /*
    // 本番実装例:
    const phoneAuthProvider = new PhoneAuthProvider(auth);
    const verificationId = await phoneAuthProvider.verifyPhoneNumber(
      phoneNumber, 
      // React NativeではreCAPTCHAの代わりにFirebase App Checkを使用
    );
    
    // 確認コードを保存
    confirmationResult = {
      verificationId,
      confirm: async (code: string) => {
        const credential = PhoneAuthProvider.credential(verificationId, code);
        return await signInWithCredential(auth, credential);
      }
    } as ConfirmationResult;
    */
    
  } catch (error) {
    throw handleAuthError(error as AuthError);
  }
};

// OTP認証の確認
export const verifyOTPCode = async (code: string): Promise<User> => {
  try {
    if (!confirmationResult) {
      throw new Error('OTP認証が開始されていません。再度お試しください。');
    }
    
    const userCredential = await confirmationResult.confirm(code);
    const firebaseUser = userCredential.user;
    
    // Firestoreからユーザー情報を取得または作成
    let userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
    
    if (userDoc.exists()) {
      return {
        ...userDoc.data() as User,
        id: firebaseUser.uid,
      };
    } else {
      // 初回ログイン時にユーザードキュメントを作成
      const newUser: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        phone: firebaseUser.phoneNumber || undefined,
        fullName: firebaseUser.displayName || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), newUser);
      return newUser;
    }
  } catch (error) {
    throw handleAuthError(error as AuthError);
  }
};

// Magic Linkログインの状態確認
export const checkForMagicLinkSignIn = async (url?: string): Promise<boolean> => {
  try {
    let checkUrl = url;
    if (!checkUrl) {
      // React NativeのLinkingから実際のディープリンクURLを取得
      const { default: Linking } = await import('expo-linking');
      checkUrl = await Linking.getInitialURL();
    }
    
    if (!checkUrl) {
      return false;
    }
    
    return isSignInWithEmailLink(auth, checkUrl);
  } catch (error) {
    console.error('Magic Link check error:', error);
    return false;
  }
};

// エラーハンドリング（高齢者にとって分かりやすいメッセージ）
const handleAuthError = (error: AuthError): Error => {
  let message = 'エラーが発生しました。もう一度お試しください。';
  
  switch (error.code) {
    case 'auth/user-not-found':
      message = 'このメールアドレスは登録されていません。';
      break;
    case 'auth/wrong-password':
      message = 'パスワードが間違っています。';
      break;
    case 'auth/email-already-in-use':
      message = 'このメールアドレスは既に使用されています。';
      break;
    case 'auth/weak-password':
      message = 'パスワードは6文字以上で入力してください。';
      break;
    case 'auth/invalid-email':
      message = 'メールアドレスの形式が正しくありません。';
      break;
    case 'auth/too-many-requests':
      message = 'しばらく時間をおいてから再度お試しください。';
      break;
    case 'auth/network-request-failed':
      message = 'インターネット接続を確認してください。';
      break;
    case 'auth/invalid-verification-code':
      message = '認証コードが正しくありません。もう一度確認してください。';
      break;
    case 'auth/code-expired':
      message = '認証コードの有効期限が切れています。新しいコードを取得してください。';
      break;
    case 'auth/invalid-phone-number':
      message = '電話番号の形式が正しくありません。';
      break;
    case 'auth/missing-phone-number':
      message = '電話番号を入力してください。';
      break;
    case 'auth/quota-exceeded':
      message = 'SMS送信の上限に達しました。しばらく時間をおいてから再度お試しください。';
      break;
    case 'auth/invalid-action-code':
      message = 'マジックリンクが無効または期限切れです。新しいリンクを取得してください。';
      break;
    case 'auth/expired-action-code':
      message = 'マジックリンクの有効期限が切れています。新しいリンクを取得してください。';
      break;
    default:
      message = `エラー: ${error.message}`;
  }
  
  return new Error(message);
}; 