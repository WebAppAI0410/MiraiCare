import { initializeTestEnvironment, assertFails, assertSucceeds, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

describe('Firestore セキュリティルール', () => {
  let testEnv: RulesTestEnvironment;
  const projectId = 'miraicare-test';

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId,
      firestore: {
        rules: fs.readFileSync(path.resolve(__dirname, '../../firestore.rules'), 'utf8'),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  describe('ユーザーコレクション', () => {
    const userId = 'test-user';
    const userData = {
      email: 'test@example.com',
      fullName: 'テストユーザー',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('認証されたユーザーは自分のデータを作成できる', async () => {
      const db = testEnv.authenticatedContext(userId).firestore();
      await assertSucceeds(setDoc(doc(db, 'users', userId), userData));
    });

    it('認証されていないユーザーはデータを作成できない', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      await assertFails(setDoc(doc(db, 'users', userId), userData));
    });

    it('他のユーザーのデータは作成できない', async () => {
      const db = testEnv.authenticatedContext('other-user').firestore();
      await assertFails(setDoc(doc(db, 'users', userId), userData));
    });

    it('必須フィールドが欠けている場合は作成できない', async () => {
      const db = testEnv.authenticatedContext(userId).firestore();
      const invalidData = { email: 'test@example.com' }; // fullName欠落
      await assertFails(setDoc(doc(db, 'users', userId), invalidData));
    });

    it('自分のデータを読み取れる', async () => {
      const adminDb = testEnv.authenticatedContext(userId).firestore();
      await setDoc(doc(adminDb, 'users', userId), userData);

      const db = testEnv.authenticatedContext(userId).firestore();
      await assertSucceeds(getDoc(doc(db, 'users', userId)));
    });

    it('他のユーザーのデータは読み取れない', async () => {
      const adminDb = testEnv.authenticatedContext(userId).firestore();
      await setDoc(doc(adminDb, 'users', userId), userData);

      const db = testEnv.authenticatedContext('other-user').firestore();
      await assertFails(getDoc(doc(db, 'users', userId)));
    });

    it('ユーザーデータは削除できない', async () => {
      const db = testEnv.authenticatedContext(userId).firestore();
      await setDoc(doc(db, 'users', userId), userData);
      await assertFails(deleteDoc(doc(db, 'users', userId)));
    });
  });

  describe('バイタルデータコレクション', () => {
    const userId = 'test-user';
    const vitalData = {
      userId,
      steps: 5000,
      heartRate: 75,
      timestamp: new Date().toISOString(),
    };

    it('認証されたユーザーは自分のバイタルデータを作成できる', async () => {
      const db = testEnv.authenticatedContext(userId).firestore();
      await assertSucceeds(setDoc(doc(db, 'vitalData', 'vital1'), vitalData));
    });

    it('歩数が負の値の場合は作成できない', async () => {
      const db = testEnv.authenticatedContext(userId).firestore();
      const invalidData = { ...vitalData, steps: -100 };
      await assertFails(setDoc(doc(db, 'vitalData', 'vital1'), invalidData));
    });

    it('心拍数が範囲外の場合は作成できない', async () => {
      const db = testEnv.authenticatedContext(userId).firestore();
      const invalidData1 = { ...vitalData, heartRate: 39 }; // 40未満
      await assertFails(setDoc(doc(db, 'vitalData', 'vital1'), invalidData1));

      const invalidData2 = { ...vitalData, heartRate: 201 }; // 200超
      await assertFails(setDoc(doc(db, 'vitalData', 'vital2'), invalidData2));
    });

    it('他のユーザーのバイタルデータは作成できない', async () => {
      const db = testEnv.authenticatedContext('other-user').firestore();
      await assertFails(setDoc(doc(db, 'vitalData', 'vital1'), vitalData));
    });

    it('バイタルデータは削除できない', async () => {
      const adminDb = testEnv.authenticatedContext(userId).firestore();
      await setDoc(doc(adminDb, 'vitalData', 'vital1'), vitalData);

      const db = testEnv.authenticatedContext(userId).firestore();
      await assertFails(deleteDoc(doc(db, 'vitalData', 'vital1')));
    });
  });

  describe('ムードデータコレクション', () => {
    const userId = 'test-user';
    const moodData = {
      userId,
      mood: 'happy',
      timestamp: new Date().toISOString(),
      notes: 'テストノート',
    };

    it('認証されたユーザーは有効なムードデータを作成できる', async () => {
      const db = testEnv.authenticatedContext(userId).firestore();
      await assertSucceeds(setDoc(doc(db, 'moodData', 'mood1'), moodData));
    });

    it('無効なムード値では作成できない', async () => {
      const db = testEnv.authenticatedContext(userId).firestore();
      const invalidData = { ...moodData, mood: 'invalid_mood' };
      await assertFails(setDoc(doc(db, 'moodData', 'mood1'), invalidData));
    });

    it('ムードデータは更新できない', async () => {
      const adminDb = testEnv.authenticatedContext(userId).firestore();
      await setDoc(doc(adminDb, 'moodData', 'mood1'), moodData);

      const db = testEnv.authenticatedContext(userId).firestore();
      await assertFails(updateDoc(doc(db, 'moodData', 'mood1'), { mood: 'sad' }));
    });

    it('ムードデータは削除できない', async () => {
      const adminDb = testEnv.authenticatedContext(userId).firestore();
      await setDoc(doc(adminDb, 'moodData', 'mood1'), moodData);

      const db = testEnv.authenticatedContext(userId).firestore();
      await assertFails(deleteDoc(doc(db, 'moodData', 'mood1')));
    });
  });

  describe('リマインダーコレクション', () => {
    const userId = 'test-user';
    const reminderData = {
      userId,
      type: 'water',
      scheduledTime: new Date().toISOString(),
      completed: false,
      title: 'テストリマインダー',
    };

    it('認証されたユーザーは有効なリマインダーを作成できる', async () => {
      const db = testEnv.authenticatedContext(userId).firestore();
      await assertSucceeds(setDoc(doc(db, 'reminders', 'reminder1'), reminderData));
    });

    it('無効なタイプのリマインダーは作成できない', async () => {
      const db = testEnv.authenticatedContext(userId).firestore();
      const invalidData = { ...reminderData, type: 'invalid' };
      await assertFails(setDoc(doc(db, 'reminders', 'reminder1'), invalidData));
    });

    it('完了状態のみ更新できる', async () => {
      const adminDb = testEnv.authenticatedContext(userId).firestore();
      await setDoc(doc(adminDb, 'reminders', 'reminder1'), reminderData);

      const db = testEnv.authenticatedContext(userId).firestore();
      await assertSucceeds(updateDoc(doc(db, 'reminders', 'reminder1'), { completed: true }));
      await assertFails(updateDoc(doc(db, 'reminders', 'reminder1'), { type: 'medication' }));
    });

    it('自分のリマインダーは削除できる', async () => {
      const adminDb = testEnv.authenticatedContext(userId).firestore();
      await setDoc(doc(adminDb, 'reminders', 'reminder1'), reminderData);

      const db = testEnv.authenticatedContext(userId).firestore();
      await assertSucceeds(deleteDoc(doc(db, 'reminders', 'reminder1')));
    });
  });

  describe('バッジコレクション', () => {
    const userId = 'test-user';
    const badgeData = {
      userId,
      id: 'badge-1',
      name: 'テストバッジ',
      description: 'テスト用バッジ',
      iconName: 'test-icon',
      unlockedAt: new Date().toISOString(),
    };

    it('バッジは読み取りのみ可能', async () => {
      // 管理者権限でバッジを作成
      await testEnv.withSecurityRulesDisabled(async (context: any) => {
        const adminDb = context.firestore();
        await setDoc(doc(adminDb, 'badges', 'badge1'), badgeData);
      });

      const db = testEnv.authenticatedContext(userId).firestore();
      await assertSucceeds(getDoc(doc(db, 'badges', 'badge1')));
    });

    it('バッジは作成できない', async () => {
      const db = testEnv.authenticatedContext(userId).firestore();
      await assertFails(setDoc(doc(db, 'badges', 'badge1'), badgeData));
    });

    it('バッジは更新できない', async () => {
      await testEnv.withSecurityRulesDisabled(async (context: any) => {
        const adminDb = context.firestore();
        await setDoc(doc(adminDb, 'badges', 'badge1'), badgeData);
      });

      const db = testEnv.authenticatedContext(userId).firestore();
      await assertFails(updateDoc(doc(db, 'badges', 'badge1'), { name: '更新バッジ' }));
    });

    it('バッジは削除できない', async () => {
      await testEnv.withSecurityRulesDisabled(async (context: any) => {
        const adminDb = context.firestore();
        await setDoc(doc(adminDb, 'badges', 'badge1'), badgeData);
      });

      const db = testEnv.authenticatedContext(userId).firestore();
      await assertFails(deleteDoc(doc(db, 'badges', 'badge1')));
    });
  });

  describe('通知コレクション', () => {
    const userId = 'test-user';
    const notificationData = {
      userId,
      type: 'daily_report',
      title: 'テスト通知',
      body: 'テスト本文',
      createdAt: new Date().toISOString(),
      read: false,
    };

    it('通知は読み取りのみ可能', async () => {
      await testEnv.withSecurityRulesDisabled(async (context: any) => {
        const adminDb = context.firestore();
        await setDoc(doc(adminDb, 'notifications', 'notif1'), notificationData);
      });

      const db = testEnv.authenticatedContext(userId).firestore();
      await assertSucceeds(getDoc(doc(db, 'notifications', 'notif1')));
    });

    it('通知は作成できない', async () => {
      const db = testEnv.authenticatedContext(userId).firestore();
      await assertFails(setDoc(doc(db, 'notifications', 'notif1'), notificationData));
    });

    it('既読フラグのみ更新できる', async () => {
      await testEnv.withSecurityRulesDisabled(async (context: any) => {
        const adminDb = context.firestore();
        await setDoc(doc(adminDb, 'notifications', 'notif1'), notificationData);
      });

      const db = testEnv.authenticatedContext(userId).firestore();
      await assertSucceeds(updateDoc(doc(db, 'notifications', 'notif1'), { read: true }));
      await assertFails(updateDoc(doc(db, 'notifications', 'notif1'), { title: '変更' }));
    });

    it('自分の通知は削除できる', async () => {
      await testEnv.withSecurityRulesDisabled(async (context: any) => {
        const adminDb = context.firestore();
        await setDoc(doc(adminDb, 'notifications', 'notif1'), notificationData);
      });

      const db = testEnv.authenticatedContext(userId).firestore();
      await assertSucceeds(deleteDoc(doc(db, 'notifications', 'notif1')));
    });
  });
});