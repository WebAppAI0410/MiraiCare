import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors, Reminder } from '../types';
import i18n from '../config/i18n';

const { width } = Dimensions.get('window');

interface ReminderCardProps {
  reminder: Reminder;
  onToggle: (id: string) => void;
  onCameraCheck: (id: string) => void;
}

const ReminderCard: React.FC<ReminderCardProps> = ({ reminder, onToggle, onCameraCheck }) => {
  const getIcon = (type: string) => {
    return type === 'water' ? '💧' : '💊';
  };

  const getTitle = (type: string) => {
    return type === 'water' ? '水分補給' : '服薬';
  };

  const isOverdue = () => {
    const now = new Date();
    const scheduledTime = new Date(reminder.scheduledTime);
    return now > scheduledTime && !reminder.completed;
  };

  return (
    <View style={[
      styles.reminderCard,
      reminder.completed && styles.completedCard,
      isOverdue() && styles.overdueCard
    ]}>
      <View style={styles.reminderHeader}>
        <Text style={styles.reminderIcon}>{getIcon(reminder.type)}</Text>
        <View style={styles.reminderInfo}>
          <Text style={[styles.reminderTitle, reminder.completed && styles.completedText]}>
            {getTitle(reminder.type)}
          </Text>
          <Text style={[styles.reminderTime, reminder.completed && styles.completedText]}>
            {new Date(reminder.scheduledTime).toLocaleTimeString('ja-JP', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
        <View style={styles.reminderActions}>
          {reminder.completed && (
            <Text style={styles.completedBadge}>✓</Text>
          )}
          {isOverdue() && !reminder.completed && (
            <Text style={styles.overdueBadge}>!</Text>
          )}
        </View>
      </View>

      {!reminder.completed && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={() => onToggle(reminder.id)}
            accessibilityRole="button"
            accessibilityLabel={`${getTitle(reminder.type)}を完了`}
          >
            <Text style={styles.actionButtonText}>完了</Text>
          </TouchableOpacity>
          
          {reminder.type === 'medication' && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cameraButton]}
              onPress={() => onCameraCheck(reminder.id)}
              accessibilityRole="button"
              accessibilityLabel="カメラで確認"
            >
              <Text style={styles.actionButtonText}>📸 確認</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {reminder.completed && reminder.completedAt && (
        <Text style={styles.completedTime}>
          完了時刻: {new Date(reminder.completedAt).toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      )}
    </View>
  );
};

interface ProgressGaugeProps {
  label: string;
  current: number;
  target: number;
  unit: string;
  color: string;
}

const ProgressGauge: React.FC<ProgressGaugeProps> = ({ label, current, target, unit, color }) => {
  const percentage = Math.min((current / target) * 100, 100);
  const isCompleted = current >= target;

  return (
    <View style={styles.gaugeContainer}>
      <Text style={styles.gaugeLabel}>{label}</Text>
      <View style={styles.gaugeWrapper}>
        <View style={styles.gaugeTrack}>
          <View 
            style={[
              styles.gaugeFill, 
              { width: `${percentage}%`, backgroundColor: color }
            ]} 
          />
        </View>
        <Text style={[styles.gaugeText, isCompleted && { color }]}>
          {current} / {target} {unit}
        </Text>
      </View>
      {isCompleted && (
        <Text style={styles.completedLabel}>🎉 目標達成！</Text>
      )}
    </View>
  );
};

const ReminderScreen: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<string | null>(null);
  const [dailyProgress, setDailyProgress] = useState({
    water: { current: 600, target: 1200 },
    medication: { current: 2, target: 3 }
  });

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    // TODO: Supabaseからリマインダーデータを取得
    // 現在はダミーデータ
    const today = new Date();
    const dummyReminders: Reminder[] = [
      {
        id: '1',
        type: 'water',
        title: '朝の水分補給',
        scheduledTime: new Date(today.setHours(8, 0, 0, 0)).toISOString(),
        completed: true,
        completedAt: new Date(today.setHours(8, 15, 0, 0)).toISOString(),
      },
      {
        id: '2',
        type: 'medication',
        title: '朝の薬',
        scheduledTime: new Date(today.setHours(8, 30, 0, 0)).toISOString(),
        completed: true,
        completedAt: new Date(today.setHours(8, 35, 0, 0)).toISOString(),
      },
      {
        id: '3',
        type: 'water',
        title: '昼の水分補給',
        scheduledTime: new Date(today.setHours(12, 0, 0, 0)).toISOString(),
        completed: false,
      },
      {
        id: '4',
        type: 'medication',
        title: '昼の薬',
        scheduledTime: new Date(today.setHours(12, 30, 0, 0)).toISOString(),
        completed: false,
      },
      {
        id: '5',
        type: 'water',
        title: '夕方の水分補給',
        scheduledTime: new Date(today.setHours(18, 0, 0, 0)).toISOString(),
        completed: false,
      },
      {
        id: '6',
        type: 'medication',
        title: '夜の薬',
        scheduledTime: new Date(today.setHours(20, 0, 0, 0)).toISOString(),
        completed: false,
      },
    ];

    setReminders(dummyReminders);
  };

  const handleToggleReminder = async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (!reminder || reminder.completed) return;

    const now = new Date().toISOString();
    
    // 楽観的更新
    setReminders(prev => prev.map(r => 
      r.id === id 
        ? { ...r, completed: true, completedAt: now }
        : r
    ));

    // 進捗を更新
    if (reminder.type === 'water') {
      setDailyProgress(prev => ({
        ...prev,
        water: { ...prev.water, current: prev.water.current + 200 }
      }));
    } else {
      setDailyProgress(prev => ({
        ...prev,
        medication: { ...prev.medication, current: prev.medication.current + 1 }
      }));
    }

    // TODO: Supabaseで完了状態を更新
    try {
      // await updateReminderCompletion(id, now);
      console.log(`Reminder ${id} completed at ${now}`);
    } catch (error) {
      console.error('Error updating reminder:', error);
      // エラー時は状態を戻す
      setReminders(prev => prev.map(r => 
        r.id === id 
          ? { ...r, completed: false, completedAt: undefined }
          : r
      ));
    }
  };

  const handleCameraCheck = (id: string) => {
    setSelectedReminder(id);
    setShowCameraModal(true);
  };

  const handleCameraConfirm = () => {
    if (selectedReminder) {
      handleToggleReminder(selectedReminder);
    }
    setShowCameraModal(false);
    setSelectedReminder(null);
  };

  const handleCameraCancel = () => {
    setShowCameraModal(false);
    setSelectedReminder(null);
  };

  const getTodayReminders = () => {
    const today = new Date().toDateString();
    return reminders.filter(r => 
      new Date(r.scheduledTime).toDateString() === today
    ).sort((a, b) => 
      new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    );
  };

  const getCompletionStats = () => {
    const todayReminders = getTodayReminders();
    const completed = todayReminders.filter(r => r.completed).length;
    const total = todayReminders.length;
    return { completed, total, percentage: total > 0 ? (completed / total) * 100 : 0 };
  };

  const stats = getCompletionStats();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={Colors.primary} />
      
      {/* 今日の進捗サマリー */}
      <View style={styles.summarySection}>
        <Text style={styles.summaryTitle}>今日の進捗</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.completed}</Text>
            <Text style={styles.statLabel}>完了</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>合計</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{Math.round(stats.percentage)}%</Text>
            <Text style={styles.statLabel}>達成率</Text>
          </View>
        </View>
      </View>

      {/* 目標進捗ゲージ */}
      <View style={styles.gaugeSection}>
        <ProgressGauge
          label="水分補給"
          current={dailyProgress.water.current}
          target={dailyProgress.water.target}
          unit="ml"
          color={Colors.secondary}
        />
        <ProgressGauge
          label="服薬"
          current={dailyProgress.medication.current}
          target={dailyProgress.medication.target}
          unit="回"
          color={Colors.success}
        />
      </View>

      {/* リマインダー一覧 */}
      <ScrollView style={styles.remindersSection} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>今日のリマインダー</Text>
        {getTodayReminders().map(reminder => (
          <ReminderCard
            key={reminder.id}
            reminder={reminder}
            onToggle={handleToggleReminder}
            onCameraCheck={handleCameraCheck}
          />
        ))}
      </ScrollView>

      {/* カメラ確認モーダル */}
      <Modal
        visible={showCameraModal}
        transparent
        animationType="slide"
        onRequestClose={handleCameraCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>服薬確認</Text>
            <View style={styles.cameraPlaceholder}>
              <Text style={styles.cameraPlaceholderText}>
                📸{'\n'}
                カメラ機能{'\n'}
                (実装予定)
              </Text>
            </View>
            <Text style={styles.modalDescription}>
              薬を服用している様子をカメラで確認してください
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCameraCancel}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleCameraConfirm}
              >
                <Text style={styles.confirmButtonText}>確認完了</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  summarySection: {
    backgroundColor: Colors.surface,
    padding: 20,
    marginBottom: 8,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
  gaugeSection: {
    backgroundColor: Colors.surface,
    padding: 20,
    marginBottom: 8,
  },
  gaugeContainer: {
    marginBottom: 20,
  },
  gaugeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  gaugeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gaugeTrack: {
    flex: 1,
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    marginRight: 12,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 6,
  },
  gaugeText: {
    fontSize: 14,
    color: Colors.textSecondary,
    minWidth: 80,
    textAlign: 'right',
  },
  completedLabel: {
    fontSize: 14,
    color: Colors.success,
    marginTop: 4,
    textAlign: 'center',
  },
  remindersSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginVertical: 16,
  },
  reminderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  completedCard: {
    backgroundColor: '#F8F9FA',
    borderColor: Colors.success,
  },
  overdueCard: {
    borderColor: Colors.error,
    backgroundColor: '#FFF5F5',
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reminderIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  reminderTime: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  reminderActions: {
    alignItems: 'center',
  },
  completedBadge: {
    fontSize: 24,
    color: Colors.success,
  },
  overdueBadge: {
    fontSize: 24,
    color: Colors.error,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  completeButton: {
    backgroundColor: Colors.primary,
  },
  cameraButton: {
    backgroundColor: Colors.secondary,
  },
  actionButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  completedTime: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    width: width * 0.9,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  cameraPlaceholder: {
    height: 200,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cameraPlaceholderText: {
    fontSize: 24,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: Colors.textSecondary,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
  },
  cancelButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ReminderScreen; 