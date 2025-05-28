import { auth, db } from '../../src/config/firebase';
import { 
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { firestoreService } from '../../src/services/firestoreService';

// Firebaseエミュレータを使用する場合のセットアップ
const EMULATOR_HOST = process.env.FIREBASE_EMULATOR_HOST || 'localhost';
const AUTH_EMULATOR_PORT = process.env.FIREBASE_AUTH_EMULATOR_PORT || '9099';
const FIRESTORE_EMULATOR_PORT = process.env.FIRESTORE_EMULATOR_PORT || '8080';

describe('Firestore Permissions Integration Tests', () => {
  let testUser: User | null = null;
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  beforeAll(async () => {
    // エミュレータの使用（CI環境でのみ）
    if (process.env.CI) {
      const { connectAuthEmulator } = await import('firebase/auth');
      const { connectFirestoreEmulator } = await import('firebase/firestore');
      
      try {
        connectAuthEmulator(auth, `http://${EMULATOR_HOST}:${AUTH_EMULATOR_PORT}`);
        connectFirestoreEmulator(db, EMULATOR_HOST, parseInt(FIRESTORE_EMULATOR_PORT));
      } catch (error) {
        // Already connected
      }
    }
  });

  afterEach(async () => {
    // サインアウト
    if (auth.currentUser) {
      await signOut(auth);
    }
    testUser = null;
  });

  describe('認証ユーザーのFirestoreアクセス権限', () => {
    beforeEach(async () => {
      // テストユーザーを作成
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
        testUser = userCredential.user;
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          // 既存のユーザーでサインイン
          const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
          testUser = userCredential.user;
        } else {
          throw error;
        }
      }
    });

    it('認証ユーザーは自分のプロファイルにアクセスできる', async () => {
      expect(testUser).toBeTruthy();
      if (!testUser) return;

      // プロファイルを作成
      const profileData = {
        userId: testUser.uid,
        email: testUser.email,
        fullName: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Firestoreに保存
      await setDoc(doc(db, 'userProfiles', testUser.uid), profileData);

      // 読み取りテスト
      const profile = await firestoreService.getUserProfile(testUser.uid);
      expect(profile).toBeTruthy();
      expect(profile?.email).toBe(testUser.email);
    });

    it('認証ユーザーは自分のリスクアセスメントデータにアクセスできる', async () => {
      expect(testUser).toBeTruthy();
      if (!testUser) return;

      // リスクアセスメントデータを保存
      const riskData = {
        userId: testUser.uid,
        date: new Date().toISOString(),
        overallRiskScore: 50,
        factors: {
          activity: { score: 60, level: 'medium' },
          mood: { score: 40, level: 'low' },
        },
        createdAt: new Date(),
      };

      await setDoc(doc(collection(db, 'riskAssessments')), riskData);

      // 読み取りテスト
      const assessments = await firestoreService.getRiskAssessments(testUser.uid);
      expect(assessments).toBeTruthy();
      expect(assessments.length).toBeGreaterThan(0);
    });

    it('認証ユーザーは他のユーザーのデータにアクセスできない', async () => {
      expect(testUser).toBeTruthy();
      if (!testUser) return;

      const otherUserId = 'other-user-id';

      // 他のユーザーのプロファイルへのアクセスを試みる
      await expect(
        firestoreService.getUserProfile(otherUserId)
      ).rejects.toThrow();
    });
  });

  describe('匿名認証ユーザーのFirestoreアクセス権限', () => {
    beforeEach(async () => {
      // 匿名認証
      const result = await signInAnonymously(auth);
      testUser = result.user;
    });

    it('匿名ユーザーは限定的なデータにアクセスできる', async () => {
      expect(testUser).toBeTruthy();
      if (!testUser) return;

      // 匿名ユーザー用の仮データを作成
      const guestProfile = {
        userId: testUser.uid,
        isAnonymous: true,
        createdAt: new Date(),
      };

      // プロファイルを保存（これは成功すべき）
      await setDoc(doc(db, 'userProfiles', testUser.uid), guestProfile);

      // 読み取りテスト
      const profile = await getDoc(doc(db, 'userProfiles', testUser.uid));
      expect(profile.exists()).toBe(true);
    });

    it('匿名ユーザーは自分のムードデータを保存できる', async () => {
      expect(testUser).toBeTruthy();
      if (!testUser) return;

      const moodData = {
        userId: testUser.uid,
        mood: 'happy',
        timestamp: new Date().toISOString(),
        notes: 'テスト',
        isAnonymous: true,
      };

      // ムードデータの保存をテスト
      await firestoreService.saveMoodData(
        testUser.uid,
        moodData.mood,
        moodData.notes
      );

      // 読み取りテスト
      const savedMood = await firestoreService.getMoodData(testUser.uid);
      expect(savedMood).toBeTruthy();
      expect(savedMood.length).toBeGreaterThan(0);
    });
  });

  describe('未認証ユーザーのアクセス制限', () => {
    beforeEach(async () => {
      // サインアウトして未認証状態にする
      await signOut(auth);
    });

    it('未認証ユーザーはプロファイルデータにアクセスできない', async () => {
      // 未認証状態でのアクセスを試みる
      await expect(
        firestoreService.getUserProfile('any-user-id')
      ).rejects.toThrow();
    });

    it('未認証ユーザーはリスクアセスメントデータにアクセスできない', async () => {
      await expect(
        firestoreService.getRiskAssessments('any-user-id')
      ).rejects.toThrow();
    });
  });

  describe('Firestoreセキュリティルールの検証', () => {
    it('userProfilesコレクションは正しいアクセス制御を持つ', async () => {
      // 認証ユーザーでテスト
      const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
      const user = userCredential.user;

      // 自分のドキュメントへの書き込み（成功すべき）
      const myProfile = {
        userId: user.uid,
        email: user.email,
        fullName: 'My Profile',
        updatedAt: new Date(),
      };

      await expect(
        setDoc(doc(db, 'userProfiles', user.uid), myProfile)
      ).resolves.not.toThrow();

      // 他人のドキュメントへの書き込み（失敗すべき）
      const otherProfile = {
        userId: 'other-user',
        email: 'other@example.com',
        fullName: 'Other Profile',
        updatedAt: new Date(),
      };

      await expect(
        setDoc(doc(db, 'userProfiles', 'other-user'), otherProfile)
      ).rejects.toThrow();
    });

    it('stepDataコレクションはuserIdフィールドで制御される', async () => {
      const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
      const user = userCredential.user;

      // 自分のステップデータ（成功すべき）
      const myStepData = {
        userId: user.uid,
        date: new Date().toISOString(),
        steps: 5000,
        createdAt: new Date(),
      };

      const docRef = doc(collection(db, 'stepData'));
      await expect(
        setDoc(docRef, myStepData)
      ).resolves.not.toThrow();

      // クエリで自分のデータを取得（成功すべき）
      const q = query(
        collection(db, 'stepData'),
        where('userId', '==', user.uid)
      );
      
      const querySnapshot = await getDocs(q);
      expect(querySnapshot.size).toBeGreaterThan(0);
    });
  });
});