import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser,
  AuthError,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, COLLECTIONS } from '../config/firebase';
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
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    throw handleAuthError(error as AuthError);
  }
};

// 後方互換性のためのエイリアス
export const signOutUser = signOut;

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
    default:
      message = `エラー: ${error.message}`;
  }
  
  return new Error(message);
}; 