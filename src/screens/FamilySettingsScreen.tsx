import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { 
  Colors, 
  FontSizes, 
  Spacing, 
  TouchTargets,
  FamilyMember,
  LineNotifyConfig 
} from '../types';
import { LineNotifyService } from '../services/lineNotify';
import { useFamilyStore } from '../hooks/useLineIntegration';

/**
 * 家族設定画面
 * LINE連携と通知設定を管理
 */
export const FamilySettingsScreen: React.FC = () => {
  const { 
    familyMembers, 
    addFamilyMember, 
    updateFamilyMember, 
    removeFamilyMember,
    isLoading 
  } = useFamilyStore();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMember, setNewMember] = useState<Partial<FamilyMember>>({
    name: '',
    relationship: '',
    email: '',
    phone: '',
    lineNotifyToken: '',
    notificationSettings: {
      token: '',
      enabled: false,
      weeklyReportDay: 'sunday',
      emergencyAlerts: true,
      riskThresholds: {
        high: true,
        medium: true,
        low: false,
      },
    },
  });
  const [validatingToken, setValidatingToken] = useState(false);

  /**
   * 新しい家族メンバーを追加
   */
  const handleAddMember = async () => {
    if (!newMember.name || !newMember.relationship) {
      Alert.alert('エラー', '名前と続柄を入力してください');
      return;
    }

    // LINE Notifyトークンの検証
    if (newMember.lineNotifyToken) {
      setValidatingToken(true);
      const isValid = await LineNotifyService.validateToken(newMember.lineNotifyToken);
      setValidatingToken(false);

      if (!isValid) {
        Alert.alert('エラー', 'LINE Notifyトークンが無効です');
        return;
      }
    }

    try {
      await addFamilyMember({
        id: `family_${Date.now()}`,
        name: newMember.name!,
        relationship: newMember.relationship!,
        email: newMember.email,
        phone: newMember.phone,
        lineNotifyToken: newMember.lineNotifyToken,
        notificationSettings: {
          ...newMember.notificationSettings!,
          token: newMember.lineNotifyToken || '',
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // フォームをリセット
      setNewMember({
        name: '',
        relationship: '',
        email: '',
        phone: '',
        lineNotifyToken: '',
        notificationSettings: {
          token: '',
          enabled: false,
          weeklyReportDay: 'sunday',
          emergencyAlerts: true,
          riskThresholds: {
            high: true,
            medium: true,
            low: false,
          },
        },
      });
      setShowAddForm(false);

      Alert.alert('成功', '家族メンバーを追加しました');
    } catch (error) {
      Alert.alert('エラー', '家族メンバーの追加に失敗しました');
    }
  };

  /**
   * 通知設定を更新
   */
  const handleUpdateNotificationSettings = async (
    memberId: string,
    settings: Partial<LineNotifyConfig>
  ) => {
    const member = familyMembers.find(m => m.id === memberId);
    if (!member) return;

    try {
      await updateFamilyMember(memberId, {
        notificationSettings: {
          ...member.notificationSettings,
          ...settings,
        },
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      Alert.alert('エラー', '設定の更新に失敗しました');
    }
  };

  /**
   * 家族メンバーを削除
   */
  const handleRemoveMember = (memberId: string) => {
    Alert.alert(
      '確認',
      '家族メンバーを削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => removeFamilyMember(memberId),
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>読み込み中...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>家族設定</Text>
        <Text style={styles.subtitle}>
          家族への通知設定を管理できます
        </Text>
      </View>

      {/* 既存の家族メンバー一覧 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>登録済み家族</Text>
        {familyMembers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              まだ家族が登録されていません
            </Text>
          </View>
        ) : (
          familyMembers.map(member => (
            <FamilyMemberCard
              key={member.id}
              member={member}
              onUpdateSettings={handleUpdateNotificationSettings}
              onRemove={handleRemoveMember}
            />
          ))
        )}
      </View>

      {/* 新しい家族メンバー追加 */}
      <View style={styles.section}>
        {!showAddForm ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddForm(true)}
            accessibilityRole="button"
            accessibilityLabel="家族メンバーを追加"
          >
            <Text style={styles.addButtonText}>+ 家族メンバーを追加</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.addForm}>
            <Text style={styles.formTitle}>新しい家族メンバー</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>名前 *</Text>
              <TextInput
                style={styles.input}
                value={newMember.name}
                onChangeText={(text) => setNewMember(prev => ({ ...prev, name: text }))}
                placeholder="田中 太郎"
                accessibilityLabel="名前を入力"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>続柄 *</Text>
              <TextInput
                style={styles.input}
                value={newMember.relationship}
                onChangeText={(text) => setNewMember(prev => ({ ...prev, relationship: text }))}
                placeholder="息子"
                accessibilityLabel="続柄を入力"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>メールアドレス</Text>
              <TextInput
                style={styles.input}
                value={newMember.email}
                onChangeText={(text) => setNewMember(prev => ({ ...prev, email: text }))}
                placeholder="example@email.com"
                keyboardType="email-address"
                accessibilityLabel="メールアドレスを入力"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>電話番号</Text>
              <TextInput
                style={styles.input}
                value={newMember.phone}
                onChangeText={(text) => setNewMember(prev => ({ ...prev, phone: text }))}
                placeholder="090-1234-5678"
                keyboardType="phone-pad"
                accessibilityLabel="電話番号を入力"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>LINE Notifyトークン</Text>
              <TextInput
                style={styles.input}
                value={newMember.lineNotifyToken}
                onChangeText={(text) => setNewMember(prev => ({ ...prev, lineNotifyToken: text }))}
                placeholder="LINE Notifyトークンを入力"
                secureTextEntry
                accessibilityLabel="LINE Notifyトークンを入力"
              />
              <Text style={styles.helperText}>
                LINE Notifyのトークンを設定すると、通知を受け取れます
              </Text>
            </View>

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowAddForm(false)}
                accessibilityRole="button"
                accessibilityLabel="キャンセル"
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleAddMember}
                disabled={validatingToken}
                accessibilityRole="button"
                accessibilityLabel="保存"
              >
                {validatingToken ? (
                  <ActivityIndicator size="small" color={Colors.surface} />
                ) : (
                  <Text style={styles.saveButtonText}>保存</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

/**
 * 家族メンバーカードコンポーネント
 */
interface FamilyMemberCardProps {
  member: FamilyMember;
  onUpdateSettings: (id: string, settings: Partial<LineNotifyConfig>) => void;
  onRemove: (id: string) => void;
}

const FamilyMemberCard: React.FC<FamilyMemberCardProps> = ({
  member,
  onUpdateSettings,
  onRemove,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.memberCard}>
      <TouchableOpacity
        style={styles.memberHeader}
        onPress={() => setExpanded(!expanded)}
        accessibilityRole="button"
        accessibilityLabel={`${member.name}さんの設定を${expanded ? '閉じる' : '開く'}`}
      >
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member.name}</Text>
          <Text style={styles.memberRelation}>{member.relationship}</Text>
        </View>
        <View style={styles.memberStatus}>
          <Text style={[
            styles.statusText,
            { color: member.notificationSettings.enabled ? Colors.success : Colors.textSecondary }
          ]}>
            {member.notificationSettings.enabled ? '通知ON' : '通知OFF'}
          </Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.memberSettings}>
          {/* 通知有効/無効 */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>LINE通知</Text>
            <Switch
              value={member.notificationSettings.enabled}
              onValueChange={(value) => 
                onUpdateSettings(member.id, { enabled: value })
              }
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={member.notificationSettings.enabled ? Colors.primary : Colors.textSecondary}
            />
          </View>

          {/* 週次レポート曜日 */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>週次レポート送信日</Text>
            <Text style={styles.settingValue}>
              {getDayText(member.notificationSettings.weeklyReportDay)}
            </Text>
          </View>

          {/* 緊急アラート */}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>緊急アラート</Text>
            <Switch
              value={member.notificationSettings.emergencyAlerts}
              onValueChange={(value) => 
                onUpdateSettings(member.id, { emergencyAlerts: value })
              }
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={member.notificationSettings.emergencyAlerts ? Colors.primary : Colors.textSecondary}
            />
          </View>

          {/* リスク閾値設定 */}
          <Text style={styles.subSectionTitle}>通知するリスクレベル</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>高リスク</Text>
            <Switch
              value={member.notificationSettings.riskThresholds.high}
              onValueChange={(value) => 
                onUpdateSettings(member.id, { 
                  riskThresholds: { 
                    ...member.notificationSettings.riskThresholds,
                    high: value 
                  }
                })
              }
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={member.notificationSettings.riskThresholds.high ? Colors.primary : Colors.textSecondary}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>中リスク</Text>
            <Switch
              value={member.notificationSettings.riskThresholds.medium}
              onValueChange={(value) => 
                onUpdateSettings(member.id, { 
                  riskThresholds: { 
                    ...member.notificationSettings.riskThresholds,
                    medium: value 
                  }
                })
              }
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={member.notificationSettings.riskThresholds.medium ? Colors.primary : Colors.textSecondary}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>低リスク</Text>
            <Switch
              value={member.notificationSettings.riskThresholds.low}
              onValueChange={(value) => 
                onUpdateSettings(member.id, { 
                  riskThresholds: { 
                    ...member.notificationSettings.riskThresholds,
                    low: value 
                  }
                })
              }
              trackColor={{ false: Colors.border, true: Colors.primaryLight }}
              thumbColor={member.notificationSettings.riskThresholds.low ? Colors.primary : Colors.textSecondary}
            />
          </View>

          {/* 削除ボタン */}
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemove(member.id)}
            accessibilityRole="button"
            accessibilityLabel={`${member.name}さんを削除`}
          >
            <Text style={styles.removeButtonText}>削除</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

/**
 * 曜日テキストを取得
 */
const getDayText = (day: string): string => {
  const dayMap: { [key: string]: string } = {
    monday: '月曜日',
    tuesday: '火曜日',
    wednesday: '水曜日',
    thursday: '木曜日',
    friday: '金曜日',
    saturday: '土曜日',
    sunday: '日曜日',
  };
  return dayMap[day] || day;
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
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.medium,
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
  },
  header: {
    padding: Spacing.screenPadding,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSizes.h1,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
  },
  subtitle: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
  },
  section: {
    marginVertical: Spacing.medium,
    paddingHorizontal: Spacing.screenPadding,
  },
  sectionTitle: {
    fontSize: FontSizes.h2,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.medium,
  },
  emptyState: {
    padding: Spacing.large,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.medium,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: TouchTargets.buttonHeight,
    justifyContent: 'center',
  },
  addButtonText: {
    color: Colors.surface,
    fontSize: FontSizes.medium,
    fontWeight: 'bold',
  },
  addForm: {
    backgroundColor: Colors.surface,
    padding: Spacing.large,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  formTitle: {
    fontSize: FontSizes.h3,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.large,
  },
  inputGroup: {
    marginBottom: Spacing.medium,
  },
  label: {
    fontSize: FontSizes.medium,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.medium,
    fontSize: FontSizes.medium,
    backgroundColor: Colors.surface,
    minHeight: TouchTargets.buttonHeight,
  },
  helperText: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    marginTop: Spacing.small,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.large,
  },
  button: {
    flex: 1,
    padding: Spacing.medium,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: TouchTargets.buttonHeight,
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.small,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.medium,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    marginLeft: Spacing.small,
  },
  saveButtonText: {
    color: Colors.surface,
    fontSize: FontSizes.medium,
    fontWeight: 'bold',
  },
  memberCard: {
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.medium,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.medium,
    minHeight: TouchTargets.buttonHeight,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: FontSizes.medium,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  memberRelation: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  memberStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: FontSizes.small,
    fontWeight: 'bold',
  },
  memberSettings: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: Spacing.medium,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.small,
    minHeight: TouchTargets.minimum,
  },
  settingLabel: {
    fontSize: FontSizes.medium,
    color: Colors.textPrimary,
    flex: 1,
  },
  settingValue: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
  },
  subSectionTitle: {
    fontSize: FontSizes.medium,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginTop: Spacing.medium,
    marginBottom: Spacing.small,
  },
  removeButton: {
    backgroundColor: Colors.error,
    padding: Spacing.small,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: Spacing.large,
    minHeight: TouchTargets.buttonHeight,
    justifyContent: 'center',
  },
  removeButtonText: {
    color: Colors.surface,
    fontSize: FontSizes.medium,
    fontWeight: 'bold',
  },
});