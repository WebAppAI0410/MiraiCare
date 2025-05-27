// 無料版：Firebase標準のメール認証を使用
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
  AuthError
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, COLLECTIONS } from '../config/firebase';
import { User } from '../types';
import { registerForPushNotifications } from './notificationService';

// 新規アカウント作成（メール確認リンク付き）
export const signUpWithEmailFree = async (
  email: string, 
  password: string, 
  fullName: string
): Promise<{ success: boolean; message: string }> => {
  try {
    // 1. アカウント作成
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // 2. プロフィール更新
    await updateProfile(firebaseUser, {
      displayName: fullName,
    });
    
    // 3. メール確認を送信（無料）
    await sendEmailVerification(firebaseUser);
    
    // 4. Firestoreにユーザー情報を保存
    const newUser: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      fullName,
      emailVerified: false, // メール未確認
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), newUser);
    
    // 5. サインアウトはしない（ユーザーが手動でログインする必要がある）
    // await firebaseSignOut(auth); を削除
    
    return {
      success: true,
      message: `${email} に確認メールを送信しました。メール内のリンクをクリックしてアカウントを有効化した後、ログインしてください。`
    };
  } catch (error) {
    throw handleAuthError(error as AuthError);
  }
};

// ログイン（メール確認済みチェック付き）
export const signInWithEmailFree = async (email: string, password: string): Promise<{ success: boolean; message: string; emailVerified?: boolean }> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // メール確認済みかチェック
    if (!firebaseUser.emailVerified) {
      return {
        success: true,
        emailVerified: false,
        message: 'メールアドレスが確認されていません。送信された確認メールをご確認ください。'
      };
    }
    
    // Firestoreからユーザー情報を取得
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
    if (userDoc.exists()) {
      // メール確認済みフラグを更新
      await updateDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), {
        emailVerified: true,
        lastLoginAt: serverTimestamp(),
      });
      
      return {
        success: true,
        emailVerified: true,
        message: 'ログインに成功しました。'
      };
    }
    
    throw new Error('ユーザー情報が見つかりません');
  } catch (error) {
    const authError = handleAuthError(error as AuthError);
    return {
      success: false,
      message: authError.message
    };
  }
};

// メール確認の再送信
export const resendVerificationEmail = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return {
        success: false,
        message: 'ログインしていません'
      };
    }
    
    if (user.emailVerified) {
      return {
        success: false,
        message: 'メールアドレスは既に確認済みです'
      };
    }
    
    await sendEmailVerification(user);
    return {
      success: true,
      message: `${user.email} 宛てに確認メールを再送信しました。`
    };
  } catch (error: any) {
    console.error('Resend verification email error:', error);
    
    if (error.code === 'auth/too-many-requests') {
      return {
        success: false,
        message: '確認メールの送信回数が上限に達しました。しばらく時間をおいてから再度お試しください。'
      };
    }
    
    return {
      success: false,
      message: '確認メールの送信に失敗しました。'
    };
  }
};

// 認証状態の監視（メール確認済みチェック付き）
export const subscribeToAuthStateFree = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser && firebaseUser.emailVerified) {
      // メール確認済みの場合のみログイン状態とする
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
      if (userDoc.exists()) {
        callback({
          ...userDoc.data() as User,
          id: firebaseUser.uid,
          emailVerified: true,
        });
      } else {
        callback(null);
      }
    } else {
      callback(null);
    }
  });
};

// エラーハンドリング
const handleAuthError = (error: AuthError): Error => {
  let message = 'エラーが発生しました。もう一度お試しください。';
  
  switch (error.code) {
    case 'auth/user-not-found':
      message = 'このメールアドレスは登録されていません。';
      break;
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      message = 'メールアドレスまたはパスワードが正しくありません。';
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
    case 'auth/network-request-failed':
      message = 'ネットワークエラーです。インターネット接続を確認してください。';
      break;
    default:
      message = error.message || message;
  }
  
  return new Error(message);
};

// 既存の関数をエクスポート（互換性のため）
export { sendPasswordResetEmail as resetPassword } from 'firebase/auth';
export const signOut = () => firebaseSignOut(auth);
export const getCurrentUser = async (): Promise<User | null> => {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser || !firebaseUser.emailVerified) return null;
  
  const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid));
  if (userDoc.exists()) {
    return {
      ...userDoc.data() as User,
      id: firebaseUser.uid,
    };
  }
  return null;
};