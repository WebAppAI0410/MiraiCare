import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../types';
import { auth } from '../config/firebase';
import {
  getUserNotificationSettings,
  updateUserNotificationSettings,
  requestNotificationPermissions,
  registerForPushNotifications,
} from '../services/notificationService';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  enabled: boolean;
  key: 'waterReminders' | 'medicationReminders' | 'dailyReports';
}

const NotificationSettingsScreen: React.FC = () => {
  const [masterEnabled, setMasterEnabled] = useState(true);
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: '1',
      title: '水分補給リマインダー',
      description: '定期的な水分補給の通知',
      icon: 'water',
      enabled: true,
      key: 'waterReminders',
    },
    {
      id: '2',
      title: '服薬リマインダー',
      description: '薬の服用時間の通知',
      icon: 'medical',
      enabled: true,
      key: 'medicationReminders',
    },
    {
      id: '3',
      title: 'デイリーレポート',
      description: '1日の活動サマリー通知',
      icon: 'stats-chart',
      enabled: true,
      key: 'dailyReports',
    },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const userSettings = await getUserNotificationSettings(currentUser.uid);
      
      setMasterEnabled(userSettings.enabled);
      setSettings(prev => prev.map(setting => ({
        ...setting,
        enabled: userSettings[setting.key],
      })));
    } catch (error) {
      console.error('通知設定の読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMasterToggle = async (value: boolean) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      if (value) {
        // 通知権限をリクエスト
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) {
          Alert.alert(
            '通知権限が必要です',
            '通知を受け取るには、設定から通知を許可してください。',
            [{ text: 'OK' }]
          );
          return;
        }

        // プッシュ通知トークンを登録
        await registerForPushNotifications();
      }

      setMasterEnabled(value);
      
      // すべての設定を更新
      const updatedSettings = {
        enabled: value,
        waterReminders: value ? settings[0].enabled : false,
        medicationReminders: value ? settings[1].enabled : false,
        dailyReports: value ? settings[2].enabled : false,
      };
      
      await updateUserNotificationSettings(currentUser.uid, updatedSettings);
    } catch (error) {
      console.error('通知設定の更新エラー:', error);
      Alert.alert('エラー', '通知設定の更新に失敗しました。');
    }
  };

  const handleSettingToggle = async (settingId: string, value: boolean) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !masterEnabled) return;

      const updatedSettings = settings.map(setting =>
        setting.id === settingId ? { ...setting, enabled: value } : setting
      );
      
      setSettings(updatedSettings);

      // Firestoreに保存
      const settingsObject = {
        enabled: masterEnabled,
        waterReminders: updatedSettings[0].enabled,
        medicationReminders: updatedSettings[1].enabled,
        dailyReports: updatedSettings[2].enabled,
      };
      
      await updateUserNotificationSettings(currentUser.uid, settingsObject);
    } catch (error) {
      console.error('個別設定の更新エラー:', error);
      Alert.alert('エラー', '設定の更新に失敗しました。');
    }
  };

  const renderSettingItem = (setting: NotificationSetting) => (
    <View key={setting.id} style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={setting.icon}
            size={24}
            color={masterEnabled && setting.enabled ? Colors.primary : Colors.gray}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={[
            styles.settingTitle,
            !masterEnabled && styles.disabledText
          ]}>
            {setting.title}
          </Text>
          <Text style={[
            styles.settingDescription,
            !masterEnabled && styles.disabledText
          ]}>
            {setting.description}
          </Text>
        </View>
      </View>
      <Switch
        value={masterEnabled && setting.enabled}
        onValueChange={(value) => handleSettingToggle(setting.id, value)}
        disabled={!masterEnabled}
        trackColor={{ false: Colors.lightGray, true: Colors.primary }}
        thumbColor={Colors.white}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>読み込み中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.masterControl}>
        <View style={styles.masterInfo}>
          <Ionicons
            name="notifications"
            size={28}
            color={masterEnabled ? Colors.primary : Colors.gray}
          />
          <View style={styles.masterTextContainer}>
            <Text style={styles.masterTitle}>通知を許可</Text>
            <Text style={styles.masterDescription}>
              すべての通知のオン/オフを切り替えます
            </Text>
          </View>
        </View>
        <Switch
          value={masterEnabled}
          onValueChange={handleMasterToggle}
          trackColor={{ false: Colors.lightGray, true: Colors.primary }}
          thumbColor={Colors.white}
          style={styles.masterSwitch}
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>通知の種類</Text>
        {settings.map(renderSettingItem)}
      </View>

      <View style={styles.infoSection}>
        <Ionicons name="information-circle" size={20} color={Colors.gray} />
        <Text style={styles.infoText}>
          通知の時間やタイミングは、各機能の設定から変更できます。
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  masterControl: {
    backgroundColor: Colors.white,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  masterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  masterTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  masterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  masterDescription: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 4,
  },
  masterSwitch: {
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginVertical: 16,
  },
  settingsSection: {
    backgroundColor: Colors.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  settingDescription: {
    fontSize: 14,
    color: Colors.gray,
    marginTop: 2,
  },
  disabledText: {
    color: Colors.lightGray,
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginTop: 16,
  },
  infoText: {
    fontSize: 14,
    color: Colors.gray,
    marginLeft: 8,
    flex: 1,
  },
});

export default NotificationSettingsScreen;