import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Colors, FontSizes, TouchTargets, Spacing, RiskLevel, RootStackParamList } from '../types';
import i18n from '../config/i18n';
import { useHealthData } from '../hooks/useHealthData';
import { RiskCard } from '../components/RiskCard';

const { width } = Dimensions.get('window');

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

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
  
  // ヘルスデータフック
  const {
    healthData,
    riskScore,
    permissions,
    isLoading,
    isInitializing,
    error,
    refreshData,
    recordManualSteps,
    clearError,
    improvementSuggestions,
    riskDescription,
  } = useHealthData();
  
  // ローカル状態
  const [currentMood, setCurrentMood] = useState('good');
  const [waterData, setWaterData] = useState({ current: 400, target: 1200 });
  const [badgeCount, setBadgeCount] = useState(2);

  useEffect(() => {
    // 初期データの読み込み
    loadDashboardData();
  }, []);

  useEffect(() => {
    // エラーハンドリング
    if (error) {
      Alert.alert(
        'ヘルスデータエラー',
        error,
        [
          { text: 'リトライ', onPress: refreshData },
          { text: '閉じる', onPress: clearError, style: 'cancel' },
        ]
      );
    }
  }, [error, refreshData, clearError]);

  const loadDashboardData = async () => {
    // TODO: Supabaseから追加データを取得
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

  const handleManualStepsInput = () => {
    Alert.prompt(
      '歩数の手動入力',
      '今日の歩数を入力してください',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '記録',
          onPress: async (steps) => {
            const stepsNumber = parseInt(steps || '0', 10);
            if (stepsNumber > 0) {
              const success = await recordManualSteps(stepsNumber);
              if (success) {
                Alert.alert('記録完了', `${stepsNumber}歩を記録しました`);
              }
            }
          },
        },
      ],
      'plain-text',
      undefined,
      'number-pad'
    );
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
          {riskScore ? (
            <RiskCard 
              riskScore={riskScore} 
              onPress={handleRiskCardPress}
              showDetailedView={false}
            />
          ) : (
            <View style={styles.loadingCard}>
              <Text style={styles.loadingText}>
                {isInitializing ? 'ヘルスデータを初期化中...' : 'リスクスコアを計算中...'}
              </Text>
            </View>
          )}
          <MoodChip mood={currentMood} onPress={handleMoodPress} />
        </View>

        {/* 進捗セクション */}
        <View style={styles.progressSection}>
          <ProgressBar
            label={i18n.t('home.steps')}
            current={healthData?.averageSteps || 0}
            target={4000}
            unit="歩"
          />
          {healthData && (
            <TouchableOpacity 
              style={styles.stepsDetailButton}
              onPress={handleManualStepsInput}
              accessibilityLabel="歩数を手動で入力"
            >
              <Text style={styles.stepsDetailText}>
                7日平均: {healthData.averageSteps}歩 | 手動入力
              </Text>
            </TouchableOpacity>
          )}
          <ProgressBar
            label={i18n.t('home.water')}
            current={waterData.current}
            target={waterData.target}
            unit="ml"
          />
        </View>

        {/* 改善提案セクション */}
        {improvementSuggestions.length > 0 && (
          <View style={styles.suggestionsSection}>
            <Text style={styles.suggestionsTitle}>💡 今日の健康アドバイス</Text>
            {improvementSuggestions.slice(0, 2).map((suggestion, index) => (
              <Text key={index} style={styles.suggestionText}>
                • {suggestion}
              </Text>
            ))}
          </View>
        )}

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
  
  // 新しいスタイル
  loadingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.cardPadding,
    marginBottom: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  loadingText: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  stepsDetailButton: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  stepsDetailText: {
    fontSize: FontSizes.small,
    color: Colors.primary,
    textAlign: 'center',
  },
  suggestionsSection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.cardPadding,
    marginBottom: Spacing.sectionGap,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  suggestionsTitle: {
    fontSize: FontSizes.medium,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  suggestionText: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: FontSizes.medium * 1.4,
  },
});

export default HomeScreen; 