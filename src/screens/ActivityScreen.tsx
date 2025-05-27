import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors, StepData, FontSizes, Spacing, TouchTargets } from '../types';
import i18n from '../config/i18n';
import { auth } from '../config/firebase';
import { pedometerService } from '../services/pedometerService';
import * as Pedometer from 'expo-sensors/build/Pedometer';

const { width } = Dimensions.get('window');

interface BarChartProps {
  data: StepData[];
  height: number;
}

const BarChart: React.FC<BarChartProps> = ({ data, height }) => {
  // データが空の場合の処理
  if (data.length === 0) {
    return (
      <View style={[styles.chartContainer, { height, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.emptyChartText}>データがありません</Text>
      </View>
    );
  }
  
  const maxSteps = Math.max(...data.map(d => d.steps), 10000); // 最小値10000歩
  const chartWidth = width - 80;
  const barWidth = (chartWidth / data.length) - 10;

  return (
    <View style={[styles.chartContainer, { height }]}>
      <View style={styles.chartContent}>
        {data.map((item, index) => {
          const barHeight = maxSteps > 0 ? (item.steps / maxSteps) * (height - 80) : 0;
          const dateObj = new Date(item.date);
          const isToday = new Date().toDateString() === dateObj.toDateString();
          
          return (
            <View 
              key={index} 
              style={styles.barContainer}
              testID={`step-bar-${index}`}
            >
              <Text style={styles.barValue}>
                {item.steps.toLocaleString()}
              </Text>
              <View 
                style={[
                  styles.bar, 
                  { 
                    height: barHeight, 
                    width: barWidth,
                    backgroundColor: isToday ? Colors.accent : 
                                   item.steps >= 8000 ? Colors.success : 
                                   Colors.primary 
                  }
                ]} 
              />
              <Text style={[styles.barLabel, isToday && styles.todayLabel]}>
                {dateObj.toLocaleDateString('ja-JP', { 
                  month: 'numeric', 
                  day: 'numeric' 
                }).replace('月', '/')}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, subtitle, icon, color }) => (
  <View style={[styles.statsCard, { borderLeftColor: color }]}>
    <Text style={styles.statsIcon}>{icon}</Text>
    <View style={styles.statsContent}>
      <Text style={styles.statsTitle}>{title}</Text>
      <Text style={[styles.statsValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statsSubtitle}>{subtitle}</Text>}
    </View>
  </View>
);

const ActivityScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [todaySteps, setTodaySteps] = useState(0);
  const [weeklyHistory, setWeeklyHistory] = useState<StepData[]>([]);
  const [distance, setDistance] = useState(0);
  const [calories, setCalories] = useState(0);
  const [weeklyAverage, setWeeklyAverage] = useState(0);
  const [achievementRate, setAchievementRate] = useState(0);
  const [stepTarget] = useState(8000); // TODO: ユーザー設定から取得
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  
  const watchSubscription = useRef<Pedometer.Subscription | null>(null);

  useEffect(() => {
    initializePedometer();
    
    return () => {
      // クリーンアップ: 監視を停止
      if (watchSubscription.current) {
        watchSubscription.current.remove();
      }
    };
  }, []);

  const initializePedometer = async () => {
    try {
      // 歩数計の利用可能性をチェック
      const available = await pedometerService.isAvailable();
      setIsAvailable(available);
      
      if (!available) {
        setIsLoading(false);
        return;
      }

      // パーミッションをリクエスト
      const permission = await pedometerService.requestPermissions();
      setPermissionGranted(permission.granted);
      
      if (!permission.granted) {
        Alert.alert(
          'パーミッションが必要です',
          '歩数を計測するには、モーションセンサーへのアクセス許可が必要です。',
          [
            { text: 'キャンセル', style: 'cancel' },
            { text: '設定を開く', onPress: () => console.log('設定を開く') }
          ]
        );
        setIsLoading(false);
        return;
      }

      // データを読み込み
      await loadStepData();
      
      // リアルタイム監視を開始
      startWatchingSteps();
    } catch (error) {
      console.error('歩数計の初期化エラー:', error);
      Alert.alert(
        'エラー',
        '歩数計の初期化に失敗しました。',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const loadStepData = async () => {
    try {
      // 今日の歩数を取得
      const steps = await pedometerService.getTodaySteps();
      setTodaySteps(steps);
      
      // 週間履歴を取得
      const history = await pedometerService.getWeeklyHistory();
      setWeeklyHistory(history);
      
      // 統計情報を計算
      const dist = pedometerService.calculateDistance(steps);
      const cal = pedometerService.calculateCalories(steps);
      const avg = pedometerService.calculateWeeklyAverage(history);
      const rate = pedometerService.calculateAchievementRate(steps, stepTarget);
      
      setDistance(dist);
      setCalories(cal);
      setWeeklyAverage(avg);
      setAchievementRate(rate);
      
      // 目標達成時の通知
      if (rate >= 100 && steps > 0) {
        pedometerService.showAchievementAlert();
      }
    } catch (error) {
      console.error('歩数データの読み込みエラー:', error);
      Alert.alert(
        'データ取得エラー',
        '歩数データの取得に失敗しました。',
        [{ text: 'OK' }]
      );
    }
  };

  const startWatchingSteps = async () => {
    try {
      watchSubscription.current = await pedometerService.startWatching((result) => {
        // リアルタイムで歩数を更新
        setTodaySteps(prevSteps => prevSteps + result.steps);
      });
    } catch (error) {
      console.error('歩数監視の開始エラー:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStepData();
    setRefreshing(false);
  };

  if (!isAvailable) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>🚫</Text>
          <Text style={styles.errorTitle}>歩数計が利用できません</Text>
          <Text style={styles.errorMessage}>
            このデバイスは歩数計測に対応していません。
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" backgroundColor={Colors.background} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        testID="activity-scroll-view"
      >
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.title}>アクティビティ</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('ja-JP', { 
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}
          </Text>
        </View>

        {/* 今日の歩数 */}
        <View style={styles.todayStepsContainer}>
          <Text style={styles.todayStepsLabel}>今日の歩数</Text>
          <View style={styles.todayStepsRow}>
            <Text style={styles.todayStepsValue}>
              {todaySteps.toLocaleString()}
            </Text>
            <Text style={styles.todayStepsUnit}>歩</Text>
          </View>
          
          {/* 目標達成率 */}
          <View style={styles.achievementContainer}>
            <Text style={styles.achievementLabel}>目標達成率</Text>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar,
                  { width: `${Math.min(achievementRate, 100)}%` }
                ]}
              />
            </View>
            <Text style={styles.achievementText}>
              {achievementRate.toFixed(1)}%
              {achievementRate >= 100 && ' 🎉 目標達成！'}
            </Text>
          </View>
        </View>

        {/* 統計カード */}
        <View style={styles.statsContainer}>
          <StatsCard
            title="推定距離"
            value={`${distance.toFixed(1)} km`}
            icon="🚶"
            color={Colors.primary}
          />
          <StatsCard
            title="消費カロリー"
            value={`${calories} kcal`}
            icon="🔥"
            color={Colors.error}
          />
        </View>

        {/* 週間統計 */}
        <View style={styles.weeklyStatsContainer}>
          <Text style={styles.sectionTitle}>週間統計</Text>
          <Text style={styles.weeklyAverage}>
            週間平均: {weeklyAverage.toLocaleString()}歩
          </Text>
        </View>

        {/* 週間グラフ */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>過去7日間</Text>
          <BarChart data={weeklyHistory} height={250} />
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
  content: {
    paddingBottom: Spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenPadding,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: Spacing.lg,
  },
  errorTitle: {
    fontSize: FontSizes.h2,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontSize: FontSizes.h1,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  date: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
  },
  todayStepsContainer: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.screenPadding,
    padding: Spacing.cardPadding,
    borderRadius: 16,
    marginBottom: Spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  todayStepsLabel: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  todayStepsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.lg,
  },
  todayStepsValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  todayStepsUnit: {
    fontSize: FontSizes.large,
    color: Colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  achievementContainer: {
    marginTop: Spacing.md,
  },
  achievementLabel: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: 4,
  },
  achievementText: {
    fontSize: FontSizes.medium,
    color: Colors.text,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  statsCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statsIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  statsContent: {
    flex: 1,
  },
  statsTitle: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  statsValue: {
    fontSize: FontSizes.large,
    fontWeight: 'bold',
  },
  statsSubtitle: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  weeklyStatsContainer: {
    paddingHorizontal: Spacing.screenPadding,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSizes.h3,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  weeklyAverage: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
  },
  chartSection: {
    paddingHorizontal: Spacing.screenPadding,
  },
  chartContainer: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginTop: Spacing.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingTop: Spacing.sm,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    borderRadius: 4,
    marginVertical: Spacing.xs,
  },
  barValue: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  barLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  todayLabel: {
    fontWeight: 'bold',
    color: Colors.accent,
  },
  emptyChartText: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
  },
});

export default ActivityScreen;