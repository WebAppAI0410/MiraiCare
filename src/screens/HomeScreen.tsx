import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Colors, FontSizes, TouchTargets, Spacing, RiskLevel, RootStackParamList } from '../types';
import i18n from '../config/i18n';

const { width } = Dimensions.get('window');

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface RiskCardProps {
  level: RiskLevel;
  onPress: () => void;
}

const RiskCard: React.FC<RiskCardProps> = ({ level, onPress }) => {
  const getRiskColor = (riskLevel: RiskLevel) => {
    switch (riskLevel) {
      case 'low':
        return Colors.success;
      case 'medium':
        return Colors.warning;
      case 'high':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getRiskLabel = (riskLevel: RiskLevel) => {
    return i18n.t(`home.riskLevels.${riskLevel}`);
  };

  return (
    <TouchableOpacity
      style={[styles.riskCard, { borderColor: getRiskColor(level) }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${i18n.t('home.todayRisk')} ${getRiskLabel(level)}`}
      accessibilityHint="タップして詳細を確認"
    >
      <Text style={styles.riskTitle}>{i18n.t('home.todayRisk')}</Text>
      <Text style={[styles.riskLevel, { color: getRiskColor(level) }]}>
        {getRiskLabel(level)}
      </Text>
      <View style={[styles.riskIndicator, { backgroundColor: getRiskColor(level) }]} />
    </TouchableOpacity>
  );
};

interface MoodChipProps {
  mood: string;
  onPress: () => void;
}

const MoodChip: React.FC<MoodChipProps> = ({ mood, onPress }) => {
  const getMoodEmoji = (moodType: string) => {
    switch (moodType) {
      case 'happy':
        return '😊';
      case 'good':
        return '🙂';
      case 'neutral':
        return '😐';
      case 'sad':
        return '😔';
      case 'worried':
        return '😰';
      default:
        return '🙂';
    }
  };

  return (
    <TouchableOpacity
      style={styles.moodChip}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${i18n.t('home.mood')} ${i18n.t(`home.moods.${mood}`)}`}
      accessibilityHint="タップして気分を記録"
    >
      <Text style={styles.moodEmoji}>{getMoodEmoji(mood)}</Text>
      <Text style={styles.moodText}>
        {i18n.t('home.mood')} {i18n.t(`home.moods.${mood}`)}
      </Text>
    </TouchableOpacity>
  );
};

interface ProgressBarProps {
  label: string;
  current: number;
  target: number;
  unit: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ label, current, target, unit }) => {
  const percentage = Math.min((current / target) * 100, 100);
  const isCompleted = current >= target;

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={[styles.progressValue, isCompleted && styles.progressCompleted]}>
          {current} / {target} {unit}
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percentage}%` }]} />
      </View>
      {isCompleted && (
        <Text style={styles.achievementText}>🎉 目標達成！</Text>
      )}
    </View>
  );
};

interface ActionButtonProps {
  title: string;
  icon: string;
  onPress: () => void;
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ title, icon, onPress, disabled = false }) => (
  <TouchableOpacity
    style={[styles.actionButton, disabled && styles.actionButtonDisabled]}
    onPress={onPress}
    disabled={disabled}
    accessibilityRole="button"
    accessibilityLabel={title}
    accessibilityHint={disabled ? "現在利用できません" : "タップして実行"}
    accessibilityState={{ disabled }}
  >
    <Text style={styles.actionIcon}>{icon}</Text>
    <Text style={[styles.actionText, disabled && styles.actionTextDisabled]}>
      {title}
    </Text>
  </TouchableOpacity>
);

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  
  // ダミーデータ（後でAPIから取得）
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('medium');
  const [currentMood, setCurrentMood] = useState('good');
  const [stepsData, setStepsData] = useState({ current: 3250, target: 4000 });
  const [waterData, setWaterData] = useState({ current: 400, target: 1200 });
  const [badgeCount, setBadgeCount] = useState(2);

  useEffect(() => {
    // 初期データの読み込み
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // TODO: Supabaseからデータを取得
    console.log('Loading dashboard data...');
  };

  const handleRiskCardPress = () => {
    navigation.navigate('Activity');
  };

  const handleMoodPress = () => {
    navigation.navigate('MoodMirror');
  };

  const handleDrinkWater = () => {
    setWaterData(prev => ({
      ...prev,
      current: Math.min(prev.current + 200, prev.target),
    }));
    console.log('Water intake recorded');
  };

  const handleMedicationCheck = () => {
    navigation.navigate('Reminders');
  };

  const handleBadgePress = () => {
    navigation.navigate('Badges');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={Colors.background} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>おはようございます</Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('ja-JP', {
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </Text>
        </View>

        {/* リスクカードとムード */}
        <View style={styles.statusSection}>
          <RiskCard level={riskLevel} onPress={handleRiskCardPress} />
          <MoodChip mood={currentMood} onPress={handleMoodPress} />
        </View>

        {/* 進捗セクション */}
        <View style={styles.progressSection}>
          <ProgressBar
            label={i18n.t('home.steps')}
            current={stepsData.current}
            target={stepsData.target}
            unit="歩"
          />
          <ProgressBar
            label={i18n.t('home.water')}
            current={waterData.current}
            target={waterData.target}
            unit="ml"
          />
        </View>

        {/* アクションボタン */}
        <View style={styles.actionSection}>
          <ActionButton
            title={i18n.t('home.drinkWater')}
            icon="💧"
            onPress={handleDrinkWater}
            disabled={waterData.current >= waterData.target}
          />
          <ActionButton
            title={i18n.t('home.medicationCheck')}
            icon="💊"
            onPress={handleMedicationCheck}
          />
        </View>

        {/* バッジセクション */}
        <TouchableOpacity
          style={styles.badgeSection}
          onPress={handleBadgePress}
          accessibilityRole="button"
          accessibilityLabel={`${i18n.t('home.badges')} ${badgeCount}個取得`}
        >
          <Text style={styles.badgeTitle}>{i18n.t('home.badges')}</Text>
          <Text style={styles.badgeCount}>
            {'★'.repeat(badgeCount)}{'☆'.repeat(Math.max(0, 4 - badgeCount))}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: Spacing.md,
  },
  header: {
    marginBottom: Spacing.lg,
  },
  welcomeText: {
    fontSize: FontSizes.h1,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  dateText: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
  },
  statusSection: {
    marginBottom: Spacing.sectionGap,
  },
  riskCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.cardPadding,
    marginBottom: Spacing.md,
    borderWidth: 3,
    minHeight: TouchTargets.comfortable,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  riskTitle: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  riskLevel: {
    fontSize: FontSizes.status,
    fontWeight: 'bold',
  },
  riskIndicator: {
    height: 8,
    borderRadius: 4,
    marginTop: Spacing.sm,
  },
  moodChip: {
    backgroundColor: Colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: 24,
    minHeight: TouchTargets.minimum,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  moodEmoji: {
    fontSize: TouchTargets.iconMedium,
    marginRight: Spacing.sm,
  },
  moodText: {
    fontSize: FontSizes.medium,
    color: Colors.text,
  },
  progressSection: {
    marginBottom: Spacing.sectionGap,
  },
  progressContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.cardPadding,
    marginBottom: Spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  progressLabel: {
    fontSize: FontSizes.medium,
    color: Colors.text,
    fontWeight: '600',
  },
  progressValue: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
  },
  progressCompleted: {
    color: Colors.success,
    fontWeight: 'bold',
  },
  progressTrack: {
    height: 12,
    backgroundColor: Colors.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 6,
  },
  achievementText: {
    fontSize: FontSizes.medium,
    color: Colors.success,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sectionGap,
  },
  actionButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: (width - Spacing.screenPadding * 2 - Spacing.md) / 2,
    minHeight: TouchTargets.buttonHeightLarge,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  actionButtonDisabled: {
    backgroundColor: Colors.disabled,
    opacity: 0.6,
  },
  actionIcon: {
    fontSize: TouchTargets.iconLarge,
    marginBottom: Spacing.xs,
  },
  actionText: {
    fontSize: FontSizes.button,
    fontWeight: 'bold',
    color: Colors.surface,
    textAlign: 'center',
  },
  actionTextDisabled: {
    color: Colors.textLight,
  },
  badgeSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.cardPadding,
    alignItems: 'center',
    minHeight: TouchTargets.comfortable,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  badgeTitle: {
    fontSize: FontSizes.medium,
    color: Colors.text,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  badgeCount: {
    fontSize: FontSizes.h1,
    color: Colors.accent,
  },
});

export default HomeScreen; 