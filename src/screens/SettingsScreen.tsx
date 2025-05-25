import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  Alert,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../types';
import { useNotifications } from '../hooks/useNotifications';

const { width } = Dimensions.get('window');

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>
      {children}
    </View>
  </View>
);

interface SettingsItemProps {
  title: string;
  subtitle?: string;
  icon?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  disabled?: boolean;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  title,
  subtitle,
  icon,
  onPress,
  rightElement,
  disabled = false,
}) => (
  <TouchableOpacity
    style={[styles.settingsItem, disabled && styles.disabledItem]}
    onPress={onPress}
    disabled={disabled || !onPress}
    accessibilityRole="button"
    accessibilityLabel={title}
    accessibilityHint={subtitle}
  >
    <View style={styles.itemLeft}>
      {icon && <Text style={styles.itemIcon}>{icon}</Text>}
      <View style={styles.itemText}>
        <Text style={[styles.itemTitle, disabled && styles.disabledText]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.itemSubtitle, disabled && styles.disabledText]}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
    <View style={styles.itemRight}>
      {rightElement}
      {onPress && !rightElement && (
        <Text style={[styles.chevron, disabled && styles.disabledText]}>›</Text>
      )}
    </View>
  </TouchableOpacity>
);

const SettingsScreen: React.FC = () => {
  const [notificationState, notificationActions] = useNotifications('demo-user'); // TODO: 実際のユーザーIDを使用
  const [appVersion] = useState('1.0.0');

  const handleClearNotificationHistory = async () => {
    Alert.alert(
      '通知履歴の削除',
      '通知履歴をすべて削除しますか？この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            await notificationActions.clearHistory();
            Alert.alert('完了', '通知履歴を削除しました');
          },
        },
      ]
    );
  };

  const handleResetNotificationSettings = async () => {
    Alert.alert(
      '通知設定のリセット',
      '通知設定をデフォルトに戻しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'リセット',
          style: 'destructive',
          onPress: async () => {
            await notificationActions.updateSettings({
              enabled: true,
              waterReminders: true,
              medicationReminders: true,
              dailySummary: true,
              emergencyAlerts: true,
              sound: true,
              vibration: true,
            });
            Alert.alert('完了', '通知設定をリセットしました');
          },
        },
      ]
    );
  };

  const handleTestNotification = async () => {
    await notificationActions.sendTestNotification();
    Alert.alert('テスト完了', 'テスト通知を送信しました');
  };

  const getNotificationStatusText = () => {
    if (!notificationState.isInitialized) return '初期化中...';
    if (!notificationState.hasPermission) return '許可されていません';
    if (!notificationState.settings.enabled) return '無効';
    return '有効';
  };

  const getNotificationStatusColor = () => {
    if (!notificationState.isInitialized) return Colors.warning;
    if (!notificationState.hasPermission) return Colors.error;
    if (!notificationState.settings.enabled) return Colors.textSecondary;
    return Colors.success;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={Colors.primary} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* アプリ情報 */}
        <SettingsSection title="アプリ情報">
          <SettingsItem
            title="MiraiCare"
            subtitle={`バージョン ${appVersion}`}
            icon="📱"
          />
        </SettingsSection>

        {/* 通知設定 */}
        <SettingsSection title="通知設定">
          <SettingsItem
            title="プッシュ通知"
            subtitle={`現在の状態: ${getNotificationStatusText()}`}
            icon="🔔"
            rightElement={
              <View style={[
                styles.statusBadge,
                { backgroundColor: getNotificationStatusColor() }
              ]}>
                <Text style={styles.statusText}>
                  {notificationState.settings.enabled ? 'ON' : 'OFF'}
                </Text>
              </View>
            }
          />

          <SettingsItem
            title="水分補給リマインダー"
            subtitle="定期的な水分補給の通知"
            icon="💧"
            rightElement={
              <Switch
                value={notificationState.settings.waterReminders}
                onValueChange={async (value) => {
                  await notificationActions.updateSettings({ waterReminders: value });
                }}
                trackColor={{ false: '#E0E0E0', true: Colors.secondary }}
                thumbColor={notificationState.settings.waterReminders ? Colors.surface : '#F4F3F4'}
                disabled={!notificationState.settings.enabled}
              />
            }
            disabled={!notificationState.settings.enabled}
          />

          <SettingsItem
            title="服薬リマインダー"
            subtitle="薬の服用時間の通知"
            icon="💊"
            rightElement={
              <Switch
                value={notificationState.settings.medicationReminders}
                onValueChange={async (value) => {
                  await notificationActions.updateSettings({ medicationReminders: value });
                }}
                trackColor={{ false: '#E0E0E0', true: Colors.success }}
                thumbColor={notificationState.settings.medicationReminders ? Colors.surface : '#F4F3F4'}
                disabled={!notificationState.settings.enabled}
              />
            }
            disabled={!notificationState.settings.enabled}
          />

          <SettingsItem
            title="日次サマリー"
            subtitle="1日の振り返りと明日の目標"
            icon="📊"
            rightElement={
              <Switch
                value={notificationState.settings.dailySummary}
                onValueChange={async (value) => {
                  await notificationActions.updateSettings({ dailySummary: value });
                }}
                trackColor={{ false: '#E0E0E0', true: Colors.info }}
                thumbColor={notificationState.settings.dailySummary ? Colors.surface : '#F4F3F4'}
                disabled={!notificationState.settings.enabled}
              />
            }
            disabled={!notificationState.settings.enabled}
          />

          <SettingsItem
            title="緊急アラート"
            subtitle="重要な健康関連の通知"
            icon="🚨"
            rightElement={
              <Switch
                value={notificationState.settings.emergencyAlerts}
                onValueChange={async (value) => {
                  await notificationActions.updateSettings({ emergencyAlerts: value });
                }}
                trackColor={{ false: '#E0E0E0', true: Colors.error }}
                thumbColor={notificationState.settings.emergencyAlerts ? Colors.surface : '#F4F3F4'}
                disabled={!notificationState.settings.enabled}
              />
            }
            disabled={!notificationState.settings.enabled}
          />
        </SettingsSection>

        {/* 音声・バイブレーション設定 */}
        <SettingsSection title="音声・バイブレーション">
          <SettingsItem
            title="音声通知"
            subtitle="通知音を再生する"
            icon="🔊"
            rightElement={
              <Switch
                value={notificationState.settings.sound}
                onValueChange={async (value) => {
                  await notificationActions.updateSettings({ sound: value });
                }}
                trackColor={{ false: '#E0E0E0', true: Colors.primary }}
                thumbColor={notificationState.settings.sound ? Colors.surface : '#F4F3F4'}
                disabled={!notificationState.settings.enabled}
              />
            }
            disabled={!notificationState.settings.enabled}
          />

          <SettingsItem
            title="バイブレーション"
            subtitle="端末を振動させる"
            icon="📳"
            rightElement={
              <Switch
                value={notificationState.settings.vibration}
                onValueChange={async (value) => {
                  await notificationActions.updateSettings({ vibration: value });
                }}
                trackColor={{ false: '#E0E0E0', true: Colors.primary }}
                thumbColor={notificationState.settings.vibration ? Colors.surface : '#F4F3F4'}
                disabled={!notificationState.settings.enabled}
              />
            }
            disabled={!notificationState.settings.enabled}
          />
        </SettingsSection>

        {/* 通知履歴 */}
        <SettingsSection title="通知履歴">
          <SettingsItem
            title="通知履歴"
            subtitle={`未読: ${notificationState.unreadCount}件`}
            icon="📋"
            onPress={() => {
              // TODO: 通知履歴画面への遷移
              Alert.alert('準備中', '通知履歴画面は準備中です');
            }}
          />

          <SettingsItem
            title="履歴をクリア"
            subtitle="すべての通知履歴を削除"
            icon="🗑️"
            onPress={handleClearNotificationHistory}
          />
        </SettingsSection>

        {/* テスト・メンテナンス */}
        <SettingsSection title="テスト・メンテナンス">
          <SettingsItem
            title="テスト通知"
            subtitle="通知が正常に動作するかテスト"
            icon="🧪"
            onPress={handleTestNotification}
            disabled={!notificationState.settings.enabled}
          />

          <SettingsItem
            title="通知設定をリセット"
            subtitle="すべての通知設定をデフォルトに戻す"
            icon="🔄"
            onPress={handleResetNotificationSettings}
          />

          <SettingsItem
            title="通知の再初期化"
            subtitle="通知サービスを再起動"
            icon="⚡"
            onPress={async () => {
              Alert.alert(
                '再初期化',
                '通知サービスを再初期化しますか？',
                [
                  { text: 'キャンセル', style: 'cancel' },
                  {
                    text: '実行',
                    onPress: async () => {
                      const success = await notificationActions.initialize();
                      Alert.alert(
                        success ? '完了' : 'エラー',
                        success 
                          ? '通知サービスを再初期化しました' 
                          : '再初期化に失敗しました'
                      );
                    },
                  },
                ]
              );
            }}
          />
        </SettingsSection>

        {/* デバッグ情報 */}
        {__DEV__ && (
          <SettingsSection title="デバッグ情報">
            <SettingsItem
              title="通知初期化状態"
              subtitle={notificationState.isInitialized ? '完了' : '未完了'}
              icon="🔧"
            />
            
            <SettingsItem
              title="通知許可状態"
              subtitle={notificationState.hasPermission ? '許可済み' : '未許可'}
              icon="🔐"
            />

            <SettingsItem
              title="プッシュトークン"
              subtitle="デバッグ用トークン情報"
              icon="🔑"
              onPress={() => {
                // TODO: トークン情報の表示
                Alert.alert('トークン', 'プッシュ通知トークン情報');
              }}
            />
          </SettingsSection>
        )}

        {/* エラー表示 */}
        {notificationState.error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{notificationState.error}</Text>
          </View>
        )}

        {/* フッター */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            MiraiCare - 高齢者向けヘルスケアアプリ
          </Text>
          <Text style={styles.footerSubtext}>
            © 2025 MiraiCare Team
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: Colors.surface,
    marginBottom: 8,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    paddingHorizontal: 20,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    minHeight: 64,
  },
  disabledItem: {
    opacity: 0.5,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 32,
    textAlign: 'center',
  },
  itemText: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  disabledText: {
    opacity: 0.5,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  chevron: {
    fontSize: 24,
    color: Colors.textSecondary,
    fontWeight: '300',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 40,
    alignItems: 'center',
  },
  statusText: {
    color: Colors.surface,
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorContainer: {
    backgroundColor: Colors.surface,
    padding: 20,
    marginBottom: 8,
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default SettingsScreen;