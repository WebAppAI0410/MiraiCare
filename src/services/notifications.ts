import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from 'react-native-async-storage';
import { supabase } from '../config/supabase';

// 通知設定
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface NotificationSettings {
  enabled: boolean;
  waterReminders: boolean;
  medicationReminders: boolean;
  dailySummary: boolean;
  emergencyAlerts: boolean;
  sound: boolean;
  vibration: boolean;
}

export interface ScheduledNotification {
  id: string;
  type: 'water' | 'medication' | 'summary' | 'emergency';
  title: string;
  body: string;
  scheduledTime: Date;
  recurring: boolean;
  userId?: string;
}

export interface NotificationHistory {
  id: string;
  type: 'water' | 'medication' | 'summary' | 'emergency';
  title: string;
  body: string;
  sentAt: Date;
  opened: boolean;
  actionTaken?: string;
  userId?: string;
}

class NotificationService {
  private token: string | null = null;
  private readonly STORAGE_KEY = 'notification_settings';
  private readonly HISTORY_KEY = 'notification_history';

  // デフォルト設定
  private defaultSettings: NotificationSettings = {
    enabled: true,
    waterReminders: true,
    medicationReminders: true,
    dailySummary: true,
    emergencyAlerts: true,
    sound: true,
    vibration: true,
  };

  /**
   * 通知サービスの初期化
   */
  async initialize(): Promise<boolean> {
    try {
      // デバイスが実機かチェック
      if (!Device.isDevice) {
        console.warn('プッシュ通知は実機でのみ動作します');
        return false;
      }

      // 通知許可の確認・取得
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('通知の許可が得られませんでした');
        return false;
      }

      // プッシュ通知トークンの取得
      const token = await Notifications.getExpoPushTokenAsync();
      this.token = token.data;

      // Android用の通知チャンネル設定
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      console.log('通知サービスが初期化されました', { token: this.token });
      return true;
    } catch (error) {
      console.error('通知サービスの初期化に失敗:', error);
      return false;
    }
  }

  /**
   * Android用通知チャンネルの設定
   */
  private async setupAndroidChannels(): Promise<void> {
    // リマインダーチャンネル
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'リマインダー',
      description: '水分補給や服薬のリマインダー通知',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });

    // 緊急アラートチャンネル
    await Notifications.setNotificationChannelAsync('emergency', {
      name: '緊急アラート',
      description: '緊急時の重要な通知',
      importance: Notifications.AndroidImportance.MAX,
      sound: 'default',
      vibrationPattern: [0, 500, 250, 500],
    });

    // 日次サマリーチャンネル
    await Notifications.setNotificationChannelAsync('summary', {
      name: '日次レポート',
      description: '1日の振り返りと明日の目標',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }

  /**
   * 通知設定の取得
   */
  async getSettings(): Promise<NotificationSettings> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return { ...this.defaultSettings, ...JSON.parse(stored) };
      }
      return this.defaultSettings;
    } catch (error) {
      console.error('通知設定の取得に失敗:', error);
      return this.defaultSettings;
    }
  }

  /**
   * 通知設定の更新
   */
  async updateSettings(settings: Partial<NotificationSettings>): Promise<boolean> {
    try {
      const currentSettings = await this.getSettings();
      const newSettings = { ...currentSettings, ...settings };
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(newSettings));
      
      // 設定変更時に通知スケジュールを更新
      if (settings.waterReminders !== undefined || settings.medicationReminders !== undefined) {
        await this.rescheduleNotifications(newSettings);
      }
      
      return true;
    } catch (error) {
      console.error('通知設定の更新に失敗:', error);
      return false;
    }
  }

  /**
   * 即座に通知を送信
   */
  async sendImmediateNotification(
    title: string, 
    body: string, 
    data?: any
  ): Promise<string | null> {
    try {
      const settings = await this.getSettings();
      if (!settings.enabled) {
        console.log('通知が無効化されています');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: settings.sound ? 'default' : undefined,
        },
        trigger: null, // 即座に送信
      });

      // 履歴に記録
      await this.addToHistory({
        id: notificationId,
        type: data?.type || 'summary',
        title,
        body,
        sentAt: new Date(),
        opened: false,
      });

      return notificationId;
    } catch (error) {
      console.error('即座通知の送信に失敗:', error);
      return null;
    }
  }

  /**
   * スケジュール通知の設定
   */
  async scheduleNotification(notification: ScheduledNotification): Promise<string | null> {
    try {
      const settings = await this.getSettings();
      if (!settings.enabled) {
        console.log('通知が無効化されています');
        return null;
      }

      // 通知タイプ別の有効性チェック
      if (notification.type === 'water' && !settings.waterReminders) return null;
      if (notification.type === 'medication' && !settings.medicationReminders) return null;
      if (notification.type === 'summary' && !settings.dailySummary) return null;

      const channelId = this.getChannelId(notification.type);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: { 
            type: notification.type,
            originalId: notification.id,
          },
          sound: settings.sound ? 'default' : undefined,
        },
        trigger: notification.recurring 
          ? {
              repeats: true,
              hour: notification.scheduledTime.getHours(),
              minute: notification.scheduledTime.getMinutes(),
            }
          : {
              date: notification.scheduledTime,
            },
        identifier: notification.id,
      });

      return notificationId;
    } catch (error) {
      console.error('スケジュール通知の設定に失敗:', error);
      return null;
    }
  }

  /**
   * 通知タイプに応じたチャンネルIDを取得
   */
  private getChannelId(type: string): string {
    switch (type) {
      case 'emergency':
        return 'emergency';
      case 'summary':
        return 'summary';
      default:
        return 'reminders';
    }
  }

  /**
   * スケジュール通知のキャンセル
   */
  async cancelNotification(notificationId: string): Promise<boolean> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      return true;
    } catch (error) {
      console.error('通知のキャンセルに失敗:', error);
      return false;
    }
  }

  /**
   * 全てのスケジュール通知をキャンセル
   */
  async cancelAllNotifications(): Promise<boolean> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return true;
    } catch (error) {
      console.error('全通知のキャンセルに失敗:', error);
      return false;
    }
  }

  /**
   * 設定変更時の通知スケジュール更新
   */
  private async rescheduleNotifications(settings: NotificationSettings): Promise<void> {
    try {
      // 既存の通知をキャンセル
      await this.cancelAllNotifications();

      // 新しい設定で通知を再スケジュール
      if (settings.waterReminders) {
        await this.scheduleWaterReminders();
      }

      if (settings.medicationReminders) {
        await this.scheduleMedicationReminders();
      }

      if (settings.dailySummary) {
        await this.scheduleDailySummary();
      }
    } catch (error) {
      console.error('通知の再スケジュールに失敗:', error);
    }
  }

  /**
   * 水分補給リマインダーのスケジュール
   */
  async scheduleWaterReminders(): Promise<void> {
    const waterTimes = [
      { hour: 8, minute: 0 },   // 朝
      { hour: 12, minute: 0 },  // 昼
      { hour: 15, minute: 0 },  // 午後
      { hour: 18, minute: 0 },  // 夕方
    ];

    for (const time of waterTimes) {
      const scheduledTime = new Date();
      scheduledTime.setHours(time.hour, time.minute, 0, 0);

      await this.scheduleNotification({
        id: `water_${time.hour}_${time.minute}`,
        type: 'water',
        title: '💧 水分補給の時間です',
        body: 'のどの渇きを感じる前に、水分補給をしましょう',
        scheduledTime,
        recurring: true,
      });
    }
  }

  /**
   * 服薬リマインダーのスケジュール
   */
  async scheduleMedicationReminders(): Promise<void> {
    const medicationTimes = [
      { hour: 8, minute: 30 },   // 朝食後
      { hour: 12, minute: 30 },  // 昼食後
      { hour: 18, minute: 30 },  // 夕食後
    ];

    for (const time of medicationTimes) {
      const scheduledTime = new Date();
      scheduledTime.setHours(time.hour, time.minute, 0, 0);

      await this.scheduleNotification({
        id: `medication_${time.hour}_${time.minute}`,
        type: 'medication',
        title: '💊 服薬の時間です',
        body: 'お薬を忘れずに服用してください',
        scheduledTime,
        recurring: true,
      });
    }
  }

  /**
   * 日次サマリーのスケジュール
   */
  async scheduleDailySummary(): Promise<void> {
    const summaryTime = new Date();
    summaryTime.setHours(21, 0, 0, 0); // 午後9時

    await this.scheduleNotification({
      id: 'daily_summary',
      type: 'summary',
      title: '📊 今日の振り返り',
      body: '今日の健康状況をチェックして、明日の目標を設定しましょう',
      scheduledTime: summaryTime,
      recurring: true,
    });
  }

  /**
   * 通知履歴に追加
   */
  async addToHistory(notification: NotificationHistory): Promise<void> {
    try {
      const history = await this.getHistory();
      const newHistory = [notification, ...history.slice(0, 99)]; // 最新100件まで保持
      
      await AsyncStorage.setItem(this.HISTORY_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('通知履歴の追加に失敗:', error);
    }
  }

  /**
   * 通知履歴の取得
   */
  async getHistory(): Promise<NotificationHistory[]> {
    try {
      const stored = await AsyncStorage.getItem(this.HISTORY_KEY);
      if (stored) {
        const history = JSON.parse(stored);
        return history.map((item: any) => ({
          ...item,
          sentAt: new Date(item.sentAt),
        }));
      }
      return [];
    } catch (error) {
      console.error('通知履歴の取得に失敗:', error);
      return [];
    }
  }

  /**
   * 通知履歴のクリア
   */
  async clearHistory(): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(this.HISTORY_KEY);
      return true;
    } catch (error) {
      console.error('通知履歴のクリアに失敗:', error);
      return false;
    }
  }

  /**
   * プッシュ通知トークンの取得
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * プッシュ通知トークンをサーバーに登録
   */
  async registerTokenWithServer(userId: string): Promise<boolean> {
    try {
      if (!this.token) {
        console.warn('プッシュ通知トークンが取得されていません');
        return false;
      }

      const { error } = await supabase
        .from('user_push_tokens')
        .upsert({
          user_id: userId,
          push_token: this.token,
          platform: Platform.OS,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('トークン登録エラー:', error);
        return false;
      }

      console.log('プッシュ通知トークンをサーバーに登録しました');
      return true;
    } catch (error) {
      console.error('トークン登録に失敗:', error);
      return false;
    }
  }
}

// シングルトンインスタンス
export const notificationService = new NotificationService();