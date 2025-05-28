/**
 * Firestore Security Rules テスト
 * リスクアセスメントとユーザープロファイル関連のアクセス権限をテスト
 */

import { RulesTestEnvironment, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

describe('Firestore Security Rules - リスクアセスメント', () => {
  let testEnv: RulesTestEnvironment;
  const PROJECT_ID = 'test-project';
  const USER_ID = 'test-user-123';
  const OTHER_USER_ID = 'other-user-456';

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: require('fs').readFileSync('./firestore.rules', 'utf8'),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  describe('userProfiles コレクション', () => {
    it('認証済みユーザーは自分のプロファイルを読み取れる', async () => {
      const db = testEnv.authenticatedContext(USER_ID).firestore();
      
      // テストデータの準備
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'userProfiles', USER_ID), {
          userId: USER_ID,
          email: 'test@example.com',
          fullName: 'テストユーザー',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });

      // 自分のプロファイルを読み取り
      const userDoc = await getDoc(doc(db, 'userProfiles', USER_ID));
      expect(userDoc.exists()).toBe(true);
    });

    it('他のユーザーのプロファイルは読み取れない', async () => {
      const db = testEnv.authenticatedContext(USER_ID).firestore();
      
      // 他のユーザーのデータを準備
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'userProfiles', OTHER_USER_ID), {
          userId: OTHER_USER_ID,
          email: 'other@example.com',
          fullName: '他のユーザー',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });

      // 他のユーザーのプロファイルを読み取り試行
      await expect(
        getDoc(doc(db, 'userProfiles', OTHER_USER_ID))
      ).rejects.toThrow();
    });

    it('認証済みユーザーは自分のプロファイルを作成できる', async () => {
      const db = testEnv.authenticatedContext(USER_ID).firestore();
      
      const userData = {
        userId: USER_ID,
        email: 'test@example.com',
        fullName: 'テストユーザー',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await expect(
        setDoc(doc(db, 'userProfiles', USER_ID), userData)
      ).resolves.not.toThrow();
    });
  });

  describe('riskAssessments コレクション', () => {
    it('認証済みユーザーは自分のリスクアセスメントを読み取れる', async () => {
      const db = testEnv.authenticatedContext(USER_ID).firestore();
      
      // テストデータの準備
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'riskAssessments', 'test-assessment'), {
          userId: USER_ID,
          overallRiskLevel: 'medium',
          overallRiskScore: 50,
          assessmentDate: new Date().toISOString(),
          fallRisk: { level: 'low', score: 20 },
          frailtyRisk: { level: 'medium', score: 50 },
          mentalHealthRisk: { level: 'low', score: 30 },
        });
      });

      // リスクアセスメントを読み取り
      const assessmentDoc = await getDoc(doc(db, 'riskAssessments', 'test-assessment'));
      expect(assessmentDoc.exists()).toBe(true);
    });

    it('認証済みユーザーは自分のリスクアセスメントを作成できる', async () => {
      const db = testEnv.authenticatedContext(USER_ID).firestore();
      
      const assessmentData = {
        userId: USER_ID,
        overallRiskLevel: 'medium',
        overallRiskScore: 50,
        assessmentDate: new Date().toISOString(),
        fallRisk: { level: 'low', score: 20 },
        frailtyRisk: { level: 'medium', score: 50 },
        mentalHealthRisk: { level: 'low', score: 30 },
      };

      await expect(
        setDoc(doc(db, 'riskAssessments', 'test-assessment'), assessmentData)
      ).resolves.not.toThrow();
    });
  });

  describe('stepData コレクション', () => {
    it('認証済みユーザーは自分の歩数データを読み取れる', async () => {
      const db = testEnv.authenticatedContext(USER_ID).firestore();
      
      // テストデータの準備
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await setDoc(doc(context.firestore(), 'stepData', 'test-step-data'), {
          userId: USER_ID,
          date: '2025-05-28',
          steps: 5000,
          distance: 3.5,
          calories: 200,
          createdAt: new Date().toISOString(),
        });
      });

      // 歩数データを読み取り
      const stepDoc = await getDoc(doc(db, 'stepData', 'test-step-data'));
      expect(stepDoc.exists()).toBe(true);
    });

    it('認証済みユーザーは自分の歩数データを作成できる', async () => {
      const db = testEnv.authenticatedContext(USER_ID).firestore();
      
      const stepData = {
        userId: USER_ID,
        date: '2025-05-28',
        steps: 5000,
        distance: 3.5,
        calories: 200,
        createdAt: new Date().toISOString(),
      };

      await expect(
        setDoc(doc(db, 'stepData', 'test-step-data'), stepData)
      ).resolves.not.toThrow();
    });
  });

  describe('未認証ユーザー', () => {
    it('未認証ユーザーは任意のデータを読み取れない', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      
      await expect(
        getDoc(doc(db, 'userProfiles', USER_ID))
      ).rejects.toThrow();

      await expect(
        getDoc(doc(db, 'riskAssessments', 'test-assessment'))
      ).rejects.toThrow();

      await expect(
        getDoc(doc(db, 'stepData', 'test-step-data'))
      ).rejects.toThrow();
    });
  });
});