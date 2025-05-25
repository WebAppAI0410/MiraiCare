/**
 * Firestoreデータベース使用例
 * 
 * このファイルは実装されたFirestoreサービスの使用方法を示すサンプルです。
 * 実際のアプリケーションでの使用パターンを参考にしてください。
 */

import { Timestamp } from 'firebase/firestore';
import {
  userService,
  vitalService,
  moodService,
  reminderService,
  userBadgeService
} from '../services/database';
import {
  User,
  VitalData,
  MoodData,
  Reminder
} from '../types/database';

// ユーザー作成の例
export const createUserExample = async (email: string, fullName: string) => {
  const userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> = {
    email,
    fullName,
    preferences: {
      language: 'ja',
      notifications: {
        medication: true,
        water: true,
        exercise: true,
        mood: true,
      },
      accessibility: {
        fontSize: 'medium',
        highContrast: false,
        voiceAssist: false,
      },
    },
    isActive: true,
  };

  const result = await userService.create(userData);
  if (result.success) {
    console.log('ユーザーが作成されました:', result.data);
    return result.data;
  } else {
    console.error('ユーザー作成エラー:', result.error);
    return null;
  }
};

// バイタルデータ記録の例
export const recordVitalDataExample = async (userId: string) => {
  const vitalData: Omit<VitalData, 'id' | 'createdAt' | 'updatedAt'> = {
    userId,
    type: 'steps',
    value: 8500,
    unit: '歩',
    measuredAt: Timestamp.now(),
    source: 'app',
    metadata: {
      notes: '朝の散歩を含む',
    },
  };

  const result = await vitalService.create(vitalData);
  if (result.success) {
    console.log('バイタルデータが記録されました:', result.data);
    return result.data;
  } else {
    console.error('バイタルデータ記録エラー:', result.error);
    return null;
  }
};

// 気分データ記録の例
export const recordMoodExample = async (userId: string) => {
  const moodData: Omit<MoodData, 'id' | 'createdAt' | 'updatedAt'> = {
    userId,
    moodLabel: '快適',
    intensity: 4,
    mood: 'happy',
    tags: ['朝', '散歩', '天気が良い'],
    notes: '朝の散歩で気分がよくなりました',
    suggestion: '引き続き定期的な運動を心がけましょう',
    aiGenerated: false,
    recordedAt: Timestamp.now(),
  };

  const result = await moodService.create(moodData);
  if (result.success) {
    console.log('気分データが記録されました:', result.data);
    return result.data;
  } else {
    console.error('気分データ記録エラー:', result.error);
    return null;
  }
};

// リマインダー作成の例
export const createReminderExample = async (userId: string) => {
  const reminderData: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'> = {
    userId,
    type: 'water',
    title: '水分補給',
    description: '1日2リットルの水分摂取を目標にしましょう',
    scheduledTime: Timestamp.fromDate(new Date(Date.now() + 60 * 60 * 1000)), // 1時間後
    recurrence: {
      type: 'daily',
      interval: 1,
    },
    completed: false,
    isActive: true,
  };

  const result = await reminderService.create(reminderData);
  if (result.success) {
    console.log('リマインダーが作成されました:', result.data);
    return result.data;
  } else {
    console.error('リマインダー作成エラー:', result.error);
    return null;
  }
};

// データ取得の例
export const getUserDataExample = async (userId: string) => {
  try {
    // ユーザー情報取得
    const userResult = await userService.getById(userId);
    if (userResult.success) {
      console.log('ユーザー情報:', userResult.data);
    }

    // 最新のバイタルデータ取得
    const vitalsResult = await vitalService.getUserVitals(userId, undefined, 10);
    if (vitalsResult.success) {
      console.log('最新のバイタルデータ:', vitalsResult.data);
    }

    // 今日の気分データ取得
    const todayMoodResult = await moodService.getTodayMood(userId);
    if (todayMoodResult.success) {
      console.log('今日の気分:', todayMoodResult.data);
    }

    // アクティブなリマインダー取得
    const remindersResult = await reminderService.getActiveReminders(userId);
    if (remindersResult.success) {
      console.log('アクティブなリマインダー:', remindersResult.data);
    }
  } catch (error) {
    console.error('データ取得エラー:', error);
  }
};

// リアルタイムリスナーの例
export const setupRealtimeListenersExample = (userId: string) => {
  // ユーザーデータのリアルタイム監視
  const unsubscribeUser = userService.subscribeToDocument(
    userId,
    (user) => {
      if (user) {
        console.log('ユーザーデータが更新されました:', user);
      }
    },
    (error) => {
      console.error('ユーザーデータ監視エラー:', error);
    }
  );

  // バイタルデータのリアルタイム監視
  const unsubscribeVitals = vitalService.subscribe(
    (vitals) => {
      console.log('バイタルデータが更新されました:', vitals);
    },
    {
      filters: [{ field: 'userId', operator: '==', value: userId }],
      orderBy: { field: 'measuredAt', direction: 'desc' },
      limit: 5,
    },
    (error) => {
      console.error('バイタルデータ監視エラー:', error);
    }
  );

  // リマインダーのリアルタイム監視
  const unsubscribeReminders = reminderService.subscribe(
    (reminders) => {
      console.log('リマインダーが更新されました:', reminders);
    },
    {
      filters: [
        { field: 'userId', operator: '==', value: userId },
        { field: 'isActive', operator: '==', value: true },
      ],
      orderBy: { field: 'scheduledTime', direction: 'asc' },
    },
    (error) => {
      console.error('リマインダー監視エラー:', error);
    }
  );

  // クリーンアップ関数を返す
  return () => {
    unsubscribeUser();
    unsubscribeVitals();
    unsubscribeReminders();
  };
};

// バッチ操作の例
export const batchOperationExample = async (userId: string) => {
  try {
    const batch = new (await import('../services/database')).batchService();

    // 複数のバイタルデータを一度に追加
    const vitalsCollection = (await import('../config/firestore')).vitalsCollection();
    
    // 歩数データ
    batch.add(vitalsCollection(), {
      userId,
      type: 'steps',
      value: 10000,
      unit: '歩',
      measuredAt: Timestamp.now(),
      source: 'app',
    });

    // 心拍数データ
    batch.add(vitalsCollection(), {
      userId,
      type: 'heart_rate',
      value: 72,
      unit: 'bpm',
      measuredAt: Timestamp.now(),
      source: 'device',
    });

    const result = await batch.commit();
    if (result.success) {
      console.log('バッチ操作が成功しました');
    } else {
      console.error('バッチ操作エラー:', result.error);
    }
  } catch (error) {
    console.error('バッチ操作エラー:', error);
  }
};

export default {
  createUserExample,
  recordVitalDataExample,
  recordMoodExample,
  createReminderExample,
  getUserDataExample,
  setupRealtimeListenersExample,
  batchOperationExample,
};