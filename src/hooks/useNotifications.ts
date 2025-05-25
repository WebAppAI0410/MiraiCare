import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import * as Notifications from 'expo-notifications';
import { 
  notificationService, 
  NotificationSettings, 
  NotificationHistory 
} from '../services/notifications';
import { reminderService } from '../services/reminders';

export interface NotificationState {
  isInitialized: boolean;
  hasPermission: boolean;
  settings: NotificationSettings;
  history: NotificationHistory[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

export interface NotificationActions {
  initialize: () => Promise<boolean>;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<boolean>;
  sendTestNotification: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  scheduleWaterReminder: () => Promise<void>;
  scheduleMedicationReminder: () => Promise<void>;
  cancelAllReminders: () => Promise<void>;
}

/**
 * 通知機能を管理するカスタムフック
 */
export const useNotifications = (userId?: string): [NotificationState, NotificationActions] => {
  const [state, setState] = useState<NotificationState>({
    isInitialized: false,
    hasPermission: false,
    settings: {
      enabled: true,
      waterReminders: true,
      medicationReminders: true,
      dailySummary: true,
      emergencyAlerts: true,
      sound: true,
      vibration: true,
    },
    history: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
  });

  // 通知の初期化
  const initialize = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const success = await notificationService.initialize();
      
      if (success) {
        // 設定と履歴を読み込み
        const [settings, history] = await Promise.all([
          notificationService.getSettings(),
          notificationService.getHistory(),
        ]);

        const unreadCount = history.filter(h => !h.opened).length;

        setState(prev => ({
          ...prev,
          isInitialized: true,
          hasPermission: true,
          settings,
          history,
          unreadCount,
          isLoading: false,
        }));

        // ユーザーIDがある場合、トークンを登録
        if (userId) {
          await notificationService.registerTokenWithServer(userId);
        }

        return true;
      } else {
        setState(prev => ({
          ...prev,
          isInitialized: false,
          hasPermission: false,
          isLoading: false,
          error: '通知の許可が得られませんでした',
        }));
        return false;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: '通知の初期化に失敗しました',
      }));
      console.error('通知初期化エラー:', error);
      return false;
    }
  }, [userId]);

  // 設定の更新
  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const success = await notificationService.updateSettings(newSettings);
      
      if (success) {
        const updatedSettings = await notificationService.getSettings();
        setState(prev => ({
          ...prev,
          settings: updatedSettings,
          isLoading: false,
        }));
        return true;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: '設定の更新に失敗しました',
        }));
        return false;
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: '設定の更新でエラーが発生しました',
      }));
      console.error('設定更新エラー:', error);
      return false;
    }
  }, []);

  // テスト通知の送信
  const sendTestNotification = useCallback(async (): Promise<void> => {
    try {
      await notificationService.sendImmediateNotification(
        '🔔 テスト通知',
        '通知が正常に動作しています',
        { type: 'test' }
      );
    } catch (error) {
      console.error('テスト通知エラー:', error);
    }
  }, []);

  // 通知を既読にマーク
  const markAsRead = useCallback(async (notificationId: string): Promise<void> => {
    try {
      const history = await notificationService.getHistory();
      const updatedHistory = history.map(item => 
        item.id === notificationId ? { ...item, opened: true } : item
      );

      setState(prev => ({
        ...prev,
        history: updatedHistory,
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));

      // ここで実際の既読状態をローカルストレージまたはサーバーに保存
    } catch (error) {
      console.error('既読マークエラー:', error);
    }
  }, []);

  // 履歴のクリア
  const clearHistory = useCallback(async (): Promise<void> => {
    try {
      const success = await notificationService.clearHistory();
      if (success) {
        setState(prev => ({
          ...prev,
          history: [],
          unreadCount: 0,
        }));
      }
    } catch (error) {
      console.error('履歴クリアエラー:', error);
    }
  }, []);

  // 履歴の再取得
  const refreshHistory = useCallback(async (): Promise<void> => {
    try {
      const history = await notificationService.getHistory();
      const unreadCount = history.filter(h => !h.opened).length;

      setState(prev => ({
        ...prev,
        history,
        unreadCount,
      }));
    } catch (error) {
      console.error('履歴取得エラー:', error);
    }
  }, []);

  // 水分補給リマインダーのスケジュール
  const scheduleWaterReminder = useCallback(async (): Promise<void> => {
    try {
      await notificationService.scheduleWaterReminders();
    } catch (error) {
      console.error('水分補給リマインダー設定エラー:', error);
    }
  }, []);

  // 服薬リマインダーのスケジュール
  const scheduleMedicationReminder = useCallback(async (): Promise<void> => {
    try {
      await notificationService.scheduleMedicationReminders();
    } catch (error) {
      console.error('服薬リマインダー設定エラー:', error);
    }
  }, []);

  // 全リマインダーのキャンセル
  const cancelAllReminders = useCallback(async (): Promise<void> => {
    try {
      await notificationService.cancelAllNotifications();
    } catch (error) {
      console.error('リマインダーキャンセルエラー:', error);
    }
  }, []);

  // アプリの状態変化を監視
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && state.isInitialized) {
        // アプリがアクティブになったら履歴を更新
        refreshHistory();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [state.isInitialized, refreshHistory]);

  // 通知受信のリスナー設定
  useEffect(() => {
    if (!state.isInitialized) return;

    // 通知受信時の処理
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('通知を受信:', notification);
      
      // 履歴を更新
      refreshHistory();
    });

    // 通知タップ時の処理
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('通知がタップされました:', response);
      
      const notificationId = response.notification.request.identifier;
      markAsRead(notificationId);

      // 通知の種類に応じて画面遷移などの処理
      const notificationData = response.notification.request.content.data;
      if (notificationData?.type === 'water' || notificationData?.type === 'medication') {
        // リマインダー画面に遷移
        console.log('リマインダー画面に遷移');
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, [state.isInitialized, refreshHistory, markAsRead]);

  // 初回初期化
  useEffect(() => {
    if (!state.isInitialized && !state.isLoading) {
      initialize();
    }
  }, [initialize, state.isInitialized, state.isLoading]);

  const actions: NotificationActions = {
    initialize,
    updateSettings,
    sendTestNotification,
    markAsRead,
    clearHistory,
    refreshHistory,
    scheduleWaterReminder,
    scheduleMedicationReminder,
    cancelAllReminders,
  };

  return [state, actions];
};

/**
 * リマインダー機能専用のカスタムフック
 */
export const useReminders = (userId?: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 今日のリマインダー取得
  const getTodayReminders = useCallback(async () => {
    if (!userId) return [];
    
    setIsLoading(true);
    setError(null);
    
    try {
      const reminders = await reminderService.getTodayReminders(userId);
      return reminders;
    } catch (err) {
      setError('リマインダーの取得に失敗しました');
      console.error('リマインダー取得エラー:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // リマインダー完了
  const completeReminder = useCallback(async (
    scheduleId: string,
    scheduledTime: Date,
    method: 'manual' | 'camera' | 'voice' = 'manual',
    notes?: string,
    photoUrl?: string
  ) => {
    if (!userId) return false;

    setIsLoading(true);
    setError(null);

    try {
      const success = await reminderService.completeReminder(
        userId,
        scheduleId,
        scheduledTime,
        method,
        notes,
        photoUrl
      );

      if (!success) {
        setError('リマインダーの完了記録に失敗しました');
      }

      return success;
    } catch (err) {
      setError('リマインダーの完了でエラーが発生しました');
      console.error('リマインダー完了エラー:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // 完了統計取得
  const getCompletionStats = useCallback(async (startDate: Date, endDate: Date) => {
    if (!userId) return null;

    setIsLoading(true);
    setError(null);

    try {
      const stats = await reminderService.getCompletionStats(userId, startDate, endDate);
      return stats;
    } catch (err) {
      setError('統計の取得に失敗しました');
      console.error('統計取得エラー:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  return {
    isLoading,
    error,
    getTodayReminders,
    completeReminder,
    getCompletionStats,
  };
};