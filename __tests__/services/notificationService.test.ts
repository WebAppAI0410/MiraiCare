import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  requestNotificationPermissions,
  registerForPushNotifications,
  scheduleLocalNotification,
  scheduleReminderNotification,
  cancelNotification,
  cancelAllNotifications,
  getUserNotificationSettings,
  updateUserNotificationSettings,
  saveUserNotificationToken,
} from '../../src/services/notificationService';
import { auth } from '../../src/config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

// Expo Notificationsのモック
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  AndroidImportance: {
    MAX: 5,
  },
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
}));

// React Nativeのモック
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

// Firebaseのモック
jest.mock('../../src/config/firebase', () => ({
  auth: {
    currentUser: { uid: 'test-user-id' },
  },
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  setDoc: jest.fn(),
  collection: jest.fn(),
}));

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestNotificationPermissions', () => {
    it('権限が付与されている場合はtrueを返す', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await requestNotificationPermissions();
      expect(result).toBe(true);
    });

    it('権限をリクエストして付与された場合はtrueを返す', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'undetermined',
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await requestNotificationPermissions();
      expect(result).toBe(true);
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('権限が拒否された場合はfalseを返す', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });
      (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const result = await requestNotificationPermissions();
      expect(result).toBe(false);
    });

    it('Androidの場合は通知チャンネルを設定する', async () => {
      (Platform as any).OS = 'android';
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      await requestNotificationPermissions();
      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith('default', {
        name: 'default',
        importance: 5,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    });
  });

  describe('registerForPushNotifications', () => {
    it('プッシュトークンを取得して保存する', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });
      (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({
        data: 'expo-push-token',
      });
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      const result = await registerForPushNotifications();
      expect(result).toBe('expo-push-token');
      expect(updateDoc).toHaveBeenCalled();
    });

    it('権限がない場合はnullを返す', async () => {
      (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const result = await registerForPushNotifications();
      expect(result).toBe(null);
      expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
    });
  });

  describe('scheduleLocalNotification', () => {
    it('通知をスケジュールする', async () => {
      const scheduledDate = new Date('2025-05-27T10:00:00');
      const mockIdentifier = 'notification-id';
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue(mockIdentifier);

      const result = await scheduleLocalNotification(
        'テストタイトル',
        'テスト本文',
        scheduledDate,
        { testData: true }
      );

      expect(result).toBe(mockIdentifier);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: 'テストタイトル',
          body: 'テスト本文',
          data: { testData: true },
          sound: true,
        },
        trigger: {
          date: scheduledDate,
        },
      });
    });

    it('エラーが発生した場合は例外をスローする', async () => {
      (Notifications.scheduleNotificationAsync as jest.Mock).mockRejectedValue(
        new Error('Schedule failed')
      );

      await expect(
        scheduleLocalNotification('タイトル', '本文', new Date())
      ).rejects.toThrow('通知のスケジュールに失敗しました');
    });
  });

  describe('scheduleReminderNotification', () => {
    it('水分補給リマインダーをスケジュールする', async () => {
      const scheduledTime = new Date('2025-05-27T10:00:00');
      const mockIdentifier = 'water-reminder-id';
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue(mockIdentifier);

      const result = await scheduleReminderNotification('water', scheduledTime);

      expect(result).toBe(mockIdentifier);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: '水分補給のお知らせ',
          body: 'お水を飲む時間です。健康のために水分補給をしましょう！',
          data: { type: 'water', scheduledTime },
          sound: true,
        },
        trigger: {
          date: scheduledTime,
        },
      });
    });

    it('服薬リマインダーをスケジュールする', async () => {
      const scheduledTime = new Date('2025-05-27T10:00:00');
      const mockIdentifier = 'medication-reminder-id';
      (Notifications.scheduleNotificationAsync as jest.Mock).mockResolvedValue(mockIdentifier);

      const result = await scheduleReminderNotification('medication', scheduledTime);

      expect(result).toBe(mockIdentifier);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith({
        content: {
          title: '服薬のお知らせ',
          body: 'お薬を飲む時間です。忘れずに服用しましょう。',
          data: { type: 'medication', scheduledTime },
          sound: true,
        },
        trigger: {
          date: scheduledTime,
        },
      });
    });
  });

  describe('cancelNotification', () => {
    it('通知をキャンセルする', async () => {
      await cancelNotification('notification-id');
      expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('notification-id');
    });

    it('エラーが発生してもクラッシュしない', async () => {
      (Notifications.cancelScheduledNotificationAsync as jest.Mock).mockRejectedValue(
        new Error('Cancel failed')
      );

      await expect(cancelNotification('notification-id')).resolves.not.toThrow();
    });
  });

  describe('cancelAllNotifications', () => {
    it('すべての通知をキャンセルする', async () => {
      await cancelAllNotifications();
      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    });
  });

  describe('getUserNotificationSettings', () => {
    it('ユーザーの通知設定を取得する', async () => {
      const mockSettings = {
        notificationsEnabled: true,
        waterRemindersEnabled: false,
        medicationRemindersEnabled: true,
        dailyReportsEnabled: true,
      };

      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => mockSettings,
      });

      const result = await getUserNotificationSettings('test-user-id');
      expect(result).toEqual({
        enabled: true,
        waterReminders: false,
        medicationReminders: true,
        dailyReports: true,
      });
    });

    it('設定が存在しない場合はデフォルト値を返す', async () => {
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => false,
      });

      const result = await getUserNotificationSettings('test-user-id');
      expect(result).toEqual({
        enabled: true,
        waterReminders: true,
        medicationReminders: true,
        dailyReports: true,
      });
    });
  });

  describe('updateUserNotificationSettings', () => {
    it('ユーザーの通知設定を更新する', async () => {
      const settings = {
        enabled: true,
        waterReminders: false,
        medicationReminders: true,
        dailyReports: false,
      };

      await updateUserNotificationSettings('test-user-id', settings);

      expect(updateDoc).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          notificationsEnabled: true,
          waterRemindersEnabled: false,
          medicationRemindersEnabled: true,
          dailyReportsEnabled: false,
          notificationSettingsUpdatedAt: expect.any(String),
        })
      );
    });
  });

  describe('saveUserNotificationToken', () => {
    it('通知トークンを保存する', async () => {
      await saveUserNotificationToken('test-user-id', 'expo-push-token');

      expect(updateDoc).toHaveBeenCalledWith(
        undefined,
        expect.objectContaining({
          notificationToken: 'expo-push-token',
          notificationTokenUpdatedAt: expect.any(String),
        })
      );
    });
  });
});