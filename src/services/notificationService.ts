import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { auth, db } from '../config/firebase';
import { collection, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

// 通知の設定
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// 通知権限の取得
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('通知権限が拒否されました');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('通知権限の取得エラー:', error);
    return false;
  }
};

// Expoプッシュトークンの取得と保存
export const registerForPushNotifications = async (): Promise<string | null> => {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: 'miraicare-360-mvp', // Firebase/Expoプロジェクト ID
    });

    // トークンをFirestoreに保存
    const currentUser = auth.currentUser;
    if (currentUser) {
      await saveUserNotificationToken(currentUser.uid, token.data);
    }

    return token.data;
  } catch (error) {
    console.error('プッシュトークン取得エラー:', error);
    return null;
  }
};

// ユーザーの通知トークンを保存
export const saveUserNotificationToken = async (userId: string, token: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      notificationToken: token,
      notificationTokenUpdatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('通知トークン保存エラー:', error);
    throw new Error('通知トークンの保存に失敗しました');
  }
};

// ローカル通知のスケジュール
export const scheduleLocalNotification = async (
  title: string,
  body: string,
  scheduledDate: Date,
  data?: any
): Promise<string> => {
  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
      },
      trigger: {
        date: scheduledDate,
      } as any,
    });

    return identifier;
  } catch (error) {
    console.error('通知スケジュールエラー:', error);
    throw new Error('通知のスケジュールに失敗しました');
  }
};

// リマインダー通知のスケジュール
export const scheduleReminderNotification = async (
  type: 'water' | 'medication',
  scheduledTime: Date
): Promise<string> => {
  const title = type === 'water' ? '水分補給のお知らせ' : '服薬のお知らせ';
  const body = type === 'water' 
    ? 'お水を飲む時間です。健康のために水分補給をしましょう！' 
    : 'お薬を飲む時間です。忘れずに服用しましょう。';

  return scheduleLocalNotification(title, body, scheduledTime, { type, scheduledTime });
};

// 通知のキャンセル
export const cancelNotification = async (identifier: string): Promise<void> => {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  } catch (error) {
    console.error('通知キャンセルエラー:', error);
  }
};

// すべての通知をキャンセル
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('全通知キャンセルエラー:', error);
  }
};

// 通知設定の取得
export const getUserNotificationSettings = async (userId: string): Promise<any> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        enabled: data.notificationsEnabled ?? true,
        waterReminders: data.waterRemindersEnabled ?? true,
        medicationReminders: data.medicationRemindersEnabled ?? true,
        dailyReports: data.dailyReportsEnabled ?? true,
      };
    }
    
    return {
      enabled: true,
      waterReminders: true,
      medicationReminders: true,
      dailyReports: true,
    };
  } catch (error) {
    console.error('通知設定取得エラー:', error);
    throw new Error('通知設定の取得に失敗しました');
  }
};

// 通知設定の更新
export const updateUserNotificationSettings = async (
  userId: string,
  settings: any
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      notificationsEnabled: settings.enabled,
      waterRemindersEnabled: settings.waterReminders,
      medicationRemindersEnabled: settings.medicationReminders,
      dailyReportsEnabled: settings.dailyReports,
      notificationSettingsUpdatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('通知設定更新エラー:', error);
    throw new Error('通知設定の更新に失敗しました');
  }
};

// 通知リスナーの設定
export const setupNotificationListeners = () => {
  // 通知を受信したときの処理
  const notificationListener = Notifications.addNotificationReceivedListener(notification => {
    console.log('通知受信:', notification);
  });

  // 通知をタップしたときの処理
  const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('通知タップ:', response);
    const { data } = response.notification.request.content;
    
    // タイプに応じて適切な画面に遷移
    if (data.type === 'water' || data.type === 'medication') {
      // ReminderScreenに遷移するなどの処理
    }
  });

  return () => {
    notificationListener.remove();
    responseListener.remove();
  };
};

// サービスオブジェクトとしてエクスポート
export const notificationService = {
  requestNotificationPermissions,
  registerForPushNotifications,
  getExpoPushToken: registerForPushNotifications, // エイリアス
  scheduleNotification: scheduleLocalNotification,
  scheduleReminderNotification,
  scheduleWaterReminder: scheduleReminderNotification, // エイリアス
  scheduleMedicationReminder: scheduleReminderNotification, // エイリアス
  cancelNotification,
  cancelAllNotifications,
  getUserNotificationSettings,
  updateNotificationSettings: updateUserNotificationSettings,
  setupNotificationListeners,
};