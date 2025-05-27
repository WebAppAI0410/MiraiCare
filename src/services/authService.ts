import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
  AuthError,
  sendEmailVerification,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db, COLLECTIONS } from '../config/firebase';
import { registerForPushNotifications } from './notificationService';
import type { User } from '../types';

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
  if (!email || !password) {
    throw new Error('メールアドレスとパスワードを入力してください');
  }
  
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // Firestoreからユーザー情報を取得
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
    if (userDoc.exists()) {
      // ログイン時刻を更新
      await updateDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
        lastLoginAt: new Date().toISOString(),
      });
      
      // プッシュ通知トークンを登録
      registerForPushNotifications().catch(console.error);
      
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
    
    // メール確認を送信
    await sendEmailVerification(firebaseUser);
    
    // Firestoreにユーザー情報を保存
    const newUser: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      fullName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), newUser);
    
    // 初回バッジを付与
    await setDoc(doc(db, COLLECTIONS.BADGES, `${firebaseUser.uid}_badge-1`), {
      userId: firebaseUser.uid,
      id: 'badge-1',
      name: '初回ログイン',
      description: 'MiraiCareを初めて使用しました',
      iconName: 'log-in',
      unlockedAt: new Date().toISOString(),
    });
    
    // プッシュ通知トークンを登録
    registerForPushNotifications().catch(console.error);
    
    return newUser;
  } catch (error) {
    throw handleAuthError(error as AuthError);
  }
};

// ログアウト
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    throw new Error('ログアウトに失敗しました');
  }
};

// 後方互換性のためのエイリアス
export const signOutUser = signOut;

// パスワードリセット
export const resetPassword = async (email: string): Promise<void> => {
  if (!email) {
    throw new Error('メールアドレスを入力してください');
  }
  
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw handleAuthError(error as AuthError);
  }
};

// 現在のユーザーを取得
export const getCurrentUser = async (): Promise<User | null> => {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) return null;
  
  try {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
    if (userDoc.exists()) {
      return {
        ...userDoc.data() as User,
        id: firebaseUser.uid,
      };
    }
    return null;
  } catch (error) {
    console.error('ユーザー情報の取得エラー:', error);
    return null;
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
    case 'auth/invalid-credential':
      message = 'ログインに失敗しました。メールアドレスまたはパスワードが正しくありません。';
      break;
    case 'auth/email-already-in-use':
      message = 'このメールアドレスは既に使用されています。';
      break;
    case 'auth/weak-password':
      message = 'パスワードは6文字以上で設定してください。';
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
    default:
      message = `エラー: ${error.message}`;
  }
  
  return new Error(message);
};

// メール確認の再送信
export const resendEmailVerification = async (): Promise<void> => {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) {
    throw new Error('ログインが必要です');
  }
  
  try {
    await sendEmailVerification(firebaseUser);
  } catch (error) {
    throw handleAuthError(error as AuthError);
  }
};

// メール確認状態のチェック
export const checkEmailVerification = async (): Promise<boolean> => {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) return false;
  
  // ユーザー情報を再読み込み
  await firebaseUser.reload();
  return firebaseUser.emailVerified;
};