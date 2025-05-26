// Firebase Web SDK（Expo環境用）
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import Constants from 'expo-constants';

// Firebase設定（環境変数から取得）
const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain,
  projectId: Constants.expoConfig?.extra?.firebaseProjectId,
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket,
  messagingSenderId: Constants.expoConfig?.extra?.firebaseMessagingSenderId,
  appId: Constants.expoConfig?.extra?.firebaseAppId
};

// Firebase初期化
const app = initializeApp(firebaseConfig);

// Firebase サービス（標準の初期化方法）
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app);

// 開発環境でエミュレーターに接続（オプション）
if (__DEV__ && Constants.appOwnership === 'expo') {
  // エミュレーターに接続（必要に応じて有効化）
  // connectFirestoreEmulator(db, 'localhost', 8080);
  // connectAuthEmulator(auth, 'http://localhost:9099');
  // connectFunctionsEmulator(functions, 'localhost', 5001);
}

// TypeScript型定義
export interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  phone?: string;
  birthDate?: string;
  emergencyContact?: string;
  lineNotifyToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VitalData {
  id: string;
  userId: string;
  type: 'steps' | 'heart_rate' | 'blood_pressure';
  value: number;
  unit: string;
  measuredAt: Date;
  createdAt: Date;
}

export interface MoodData {
  id: string;
  userId: string;
  moodLabel: string;
  intensity: number;
  suggestion?: string;
  notes?: string;
  createdAt: Date;
}

export interface Reminder {
  id: string;
  userId: string;
  type: 'water' | 'medication';
  title: string;
  scheduledTime: Date;
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: string;
  condition: string;
  isUnlocked: boolean;
  unlockedAt?: Date;
}

// Firestore コレクション名
export const COLLECTIONS = {
  USERS: 'users',
  VITALS: 'vitals',
  MOODS: 'moods',
  REMINDERS: 'reminders',
  BADGES: 'badges',
} as const;

// Firestore関数をインポート
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore';

// ヘルパー関数
export const createUserDocument = async (userData: Partial<User>) => {
  const userCollection = collection(db, COLLECTIONS.USERS);
  return await addDoc(userCollection, {
    ...userData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

export const getUserDocument = async (userId: string) => {
  const userDocRef = doc(db, COLLECTIONS.USERS, userId);
  return await getDoc(userDocRef);
};

export const updateUserDocument = async (userId: string, data: Partial<User>) => {
  const userDocRef = doc(db, COLLECTIONS.USERS, userId);
  return await updateDoc(userDocRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// リアルタイムリスナー
export const subscribeToUserData = (userId: string, callback: (data: User | null) => void) => {
  const userDocRef = doc(db, COLLECTIONS.USERS, userId);
  return onSnapshot(userDocRef, (docSnapshot) => {
    if (docSnapshot.exists()) {
      callback({ id: docSnapshot.id, ...docSnapshot.data() } as User);
    } else {
      callback(null);
    }
  });
};

export const subscribeToVitalData = (userId: string, callback: (data: VitalData[]) => void) => {
  const vitalsCollection = collection(db, COLLECTIONS.VITALS);
  const vitalsQuery = query(
    vitalsCollection,
    where('userId', '==', userId),
    orderBy('measuredAt', 'desc'),
    limit(100)
  );
  
  return onSnapshot(vitalsQuery, (snapshot: QuerySnapshot<DocumentData>) => {
    const vitals = snapshot.docs.map(docSnapshot => ({
      id: docSnapshot.id,
      ...docSnapshot.data()
    })) as VitalData[];
    callback(vitals);
  });
}; 