import { useState, useEffect, useCallback } from 'react';
import { Unsubscribe } from 'firebase/firestore';
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
  Reminder,
  UserBadge,
  QueryOptions
} from '../types/database';

// リアルタイムユーザーデータフック
export const useUser = (userId: string) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = userService.subscribeToDocument(
      userId,
      (userData) => {
        setUser(userData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { user, loading, error };
};

// リアルタイムバイタルデータフック
export const useUserVitals = (userId: string, type?: string, limit: number = 50) => {
  const [vitals, setVitals] = useState<VitalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const options: QueryOptions = {
      filters: [{ field: 'userId', operator: '==', value: userId }],
      orderBy: { field: 'measuredAt', direction: 'desc' },
      limit
    };

    if (type) {
      options.filters?.push({ field: 'type', operator: '==', value: type });
    }

    const unsubscribe = vitalService.subscribe(
      (vitalData) => {
        setVitals(vitalData);
        setLoading(false);
        setError(null);
      },
      options,
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, type, limit]);

  return { vitals, loading, error };
};

// リアルタイム気分データフック
export const useUserMoods = (userId: string, limit: number = 30) => {
  const [moods, setMoods] = useState<MoodData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = moodService.subscribe(
      (moodData) => {
        setMoods(moodData);
        setLoading(false);
        setError(null);
      },
      {
        filters: [{ field: 'userId', operator: '==', value: userId }],
        orderBy: { field: 'recordedAt', direction: 'desc' },
        limit
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, limit]);

  return { moods, loading, error };
};

// リアルタイムリマインダーフック
export const useActiveReminders = (userId: string) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = reminderService.subscribe(
      (reminderData) => {
        setReminders(reminderData);
        setLoading(false);
        setError(null);
      },
      {
        filters: [
          { field: 'userId', operator: '==', value: userId },
          { field: 'isActive', operator: '==', value: true }
        ],
        orderBy: { field: 'scheduledTime', direction: 'asc' }
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { reminders, loading, error };
};

// リアルタイムユーザーバッジフック
export const useUserBadges = (userId: string) => {
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = userBadgeService.subscribe(
      (badgeData) => {
        setBadges(badgeData);
        setLoading(false);
        setError(null);
      },
      {
        filters: [{ field: 'userId', operator: '==', value: userId }],
        orderBy: { field: 'unlockedAt', direction: 'desc' }
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { badges, loading, error };
};

// 今日のリマインダーフック
export const useTodayReminders = (userId: string) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshReminders = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const result = await reminderService.getTodayReminders(userId);
      if (result.success && result.data) {
        setReminders(result.data);
        setError(null);
      } else {
        setError(result.error || 'リマインダーの取得に失敗しました');
      }
    } catch (err) {
      setError('予期しないエラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshReminders();
  }, [refreshReminders]);

  return { reminders, loading, error, refreshReminders };
};

// 今日の気分データフック
export const useTodayMood = (userId: string) => {
  const [mood, setMood] = useState<MoodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshMood = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const result = await moodService.getTodayMood(userId);
      if (result.success && result.data) {
        setMood(result.data);
        setError(null);
      } else {
        setMood(null);
        setError(null); // 今日のデータがないのは正常
      }
    } catch (err) {
      setError('気分データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshMood();
  }, [refreshMood]);

  return { mood, loading, error, refreshMood };
};

// リアルタイムデータ統合フック
export const useUserData = (userId: string) => {
  const { user, loading: userLoading, error: userError } = useUser(userId);
  const { vitals, loading: vitalsLoading, error: vitalsError } = useUserVitals(userId, undefined, 10);
  const { moods, loading: moodsLoading, error: moodsError } = useUserMoods(userId, 5);
  const { reminders, loading: remindersLoading, error: remindersError } = useActiveReminders(userId);
  const { badges, loading: badgesLoading, error: badgesError } = useUserBadges(userId);

  const loading = userLoading || vitalsLoading || moodsLoading || remindersLoading || badgesLoading;
  const error = userError || vitalsError || moodsError || remindersError || badgesError;

  return {
    user,
    vitals,
    moods,
    reminders,
    badges,
    loading,
    error
  };
};

// CRUD操作フック
export const useFirestoreOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createVital = useCallback(async (vitalData: Omit<VitalData, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await vitalService.create(vitalData);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error || 'バイタルデータの作成に失敗しました');
        return null;
      }
    } catch (err) {
      setError('予期しないエラーが発生しました');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createMood = useCallback(async (moodData: Omit<MoodData, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await moodService.create(moodData);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error || '気分データの作成に失敗しました');
        return null;
      }
    } catch (err) {
      setError('予期しないエラーが発生しました');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createReminder = useCallback(async (reminderData: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    setError(null);
    try {
      const result = await reminderService.create(reminderData);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error || 'リマインダーの作成に失敗しました');
        return null;
      }
    } catch (err) {
      setError('予期しないエラーが発生しました');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const markReminderCompleted = useCallback(async (reminderId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await reminderService.markCompleted(reminderId);
      if (result.success) {
        return result.data;
      } else {
        setError(result.error || 'リマインダーの完了処理に失敗しました');
        return null;
      }
    } catch (err) {
      setError('予期しないエラーが発生しました');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createVital,
    createMood,
    createReminder,
    markReminderCompleted
  };
};