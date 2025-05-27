import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors, VitalData, RiskLevel } from '../types';
import i18n from '../config/i18n';
import { auth } from '../config/firebase';
import { getUserVitalHistory } from '../services/firestoreService';

const { width } = Dimensions.get('window');

interface DailyData {
  date: string;
  steps: number;
  distance: number;
  calories: number;
  heartRate?: number;
}

interface WeeklyStats {
  totalSteps: number;
  avgSteps: number;
  totalDistance: number;
  totalCalories: number;
}

interface BarChartProps {
  data: DailyData[];
  height: number;
}

const BarChart: React.FC<BarChartProps> = ({ data, height }) => {
  const maxSteps = Math.max(...data.map(d => d.steps));
  const chartWidth = width - 60;
  const barWidth = chartWidth / data.length - 8;

  return (
    <View style={[styles.chartContainer, { height }]}>
      <View style={styles.chartContent}>
        {data.map((item, index) => {
          const barHeight = maxSteps > 0 ? (item.steps / maxSteps) * (height - 60) : 0;
          
          return (
            <View key={index} style={styles.barContainer}>
              <View 
                style={[
                  styles.bar, 
                  { 
                    height: barHeight, 
                    width: barWidth,
                    backgroundColor: item.steps >= 4000 ? Colors.success : Colors.primary 
                  }
                ]} 
              />
              <Text style={styles.barValue}>{item.steps}</Text>
              <Text style={styles.barLabel}>
                {new Date(item.date).toLocaleDateString('ja-JP', { weekday: 'short' })}
              </Text>
            </View>
          );
        })}
      </View>
      
      {/* Y軸ラベル */}
      <View style={styles.yAxisLabels}>
        <Text style={styles.axisLabel}>{maxSteps}</Text>
        <Text style={styles.axisLabel}>{Math.round(maxSteps / 2)}</Text>
        <Text style={styles.axisLabel}>0</Text>
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
  <View style={[styles.statsCard, { borderColor: color }]}>
    <Text style={styles.statsIcon}>{icon}</Text>
    <Text style={styles.statsTitle}>{title}</Text>
    <Text style={[styles.statsValue, { color }]}>{value}</Text>
    {subtitle && <Text style={styles.statsSubtitle}>{subtitle}</Text>}
  </View>
);

interface RiskIndicatorProps {
  level: RiskLevel;
  type: string;
}

const RiskIndicator: React.FC<RiskIndicatorProps> = ({ level, type }) => {
  const getRiskColor = (riskLevel: RiskLevel) => {
    switch (riskLevel) {
      case 'low': return Colors.success;
      case 'medium': return Colors.warning;
      case 'high': return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  const getRiskLabel = (riskLevel: RiskLevel) => {
    return i18n.t(`home.riskLevels.${riskLevel}`);
  };

  return (
    <View style={styles.riskIndicator}>
      <Text style={styles.riskType}>{type}</Text>
      <View style={[styles.riskBadge, { backgroundColor: getRiskColor(level) }]}>
        <Text style={styles.riskBadgeText}>{getRiskLabel(level)}</Text>
      </View>
    </View>
  );
};

const ActivityScreen: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  const [weeklyData, setWeeklyData] = useState<DailyData[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    totalSteps: 0,
    avgSteps: 0,
    totalDistance: 0,
    totalCalories: 0,
  });
  const [currentRisks, setCurrentRisks] = useState({
    fall: 'medium' as RiskLevel,
    frailty: 'low' as RiskLevel,
    mental: 'medium' as RiskLevel,
  });

  useEffect(() => {
    loadActivityData();
  }, [selectedPeriod]);

  const loadActivityData = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log('No authenticated user');
        return;
      }

      // 選択された期間に基づいてデータを取得
      const days = selectedPeriod === 'week' ? 7 : 30;
      const vitalHistory = await getUserVitalHistory(currentUser.uid, days);

      // データをDailyData形式に変換
      const dailyDataMap = new Map<string, DailyData>();
      
      vitalHistory.forEach(vital => {
        const date = vital.date;
        if (!dailyDataMap.has(date)) {
          dailyDataMap.set(date, {
            date,
            steps: vital.steps,
            distance: Math.round(vital.steps * 0.00075 * 10) / 10, // 歩数から距離を推定 (1歩 = 0.75m)
            calories: Math.round(vital.steps * 0.05), // 歩数からカロリーを推定
          });
        }
      });

      // 日付でソートして配列に変換
      const sortedData = Array.from(dailyDataMap.values())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // データがない場合はダミーデータを生成
      if (sortedData.length === 0) {
        const today = new Date();
        const dummyData: DailyData[] = [];
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          dummyData.push({
            date: date.toISOString().split('T')[0],
            steps: 0,
            distance: 0,
            calories: 0,
          });
        }
        setWeeklyData(dummyData);
        setWeeklyStats({
          totalSteps: 0,
          avgSteps: 0,
          totalDistance: 0,
          totalCalories: 0,
        });
        return;
      }

      setWeeklyData(sortedData);

      // 統計計算
      const totalSteps = sortedData.reduce((sum, day) => sum + day.steps, 0);
      const totalDistance = sortedData.reduce((sum, day) => sum + day.distance, 0);
      const totalCalories = sortedData.reduce((sum, day) => sum + day.calories, 0);

      setWeeklyStats({
        totalSteps,
        avgSteps: Math.round(totalSteps / sortedData.length),
        totalDistance: Math.round(totalDistance * 10) / 10,
        totalCalories,
      });

    } catch (error) {
      console.error('活動データの取得エラー:', error);
      Alert.alert(
        'データ取得エラー',
        '活動データの取得に失敗しました。',
        [{ text: 'OK' }]
      );
    }
  };

  const getPeriodLabel = () => {
    return selectedPeriod === 'week' ? '今週' : '今月';
  };

  const getGoalAchievementRate = () => {
    const goal = 4000; // 1日の目標歩数
    const achievedDays = weeklyData.filter(day => day.steps >= goal).length;
    return weeklyData.length > 0 ? Math.round((achievedDays / weeklyData.length) * 100) : 0;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={Colors.primary} />
      
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>活動詳細</Text>
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'week' && styles.activePeriodButton
            ]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === 'week' && styles.activePeriodButtonText
            ]}>週</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'month' && styles.activePeriodButton
            ]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === 'month' && styles.activePeriodButtonText
            ]}>月</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 週間サマリー */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{getPeriodLabel()}のサマリー</Text>
          <View style={styles.statsGrid}>
            <StatsCard
              title="総歩数"
              value={weeklyStats.totalSteps.toLocaleString()}
              subtitle="歩"
              icon="👣"
              color={Colors.primary}
            />
            <StatsCard
              title="平均歩数"
              value={weeklyStats.avgSteps.toLocaleString()}
              subtitle="歩/日"
              icon="📊"
              color={Colors.secondary}
            />
            <StatsCard
              title="総距離"
              value={`${weeklyStats.totalDistance}`}
              subtitle="km"
              icon="📍"
              color={Colors.success}
            />
            <StatsCard
              title="消費カロリー"
              value={weeklyStats.totalCalories.toString()}
              subtitle="kcal"
              icon="🔥"
              color={Colors.warning}
            />
          </View>
        </View>

        {/* 目標達成率 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>目標達成状況</Text>
          <View style={styles.achievementCard}>
            <Text style={styles.achievementTitle}>歩数目標達成率</Text>
            <Text style={styles.achievementValue}>{getGoalAchievementRate()}%</Text>
            <Text style={styles.achievementSubtitle}>
              {weeklyData.filter(day => day.steps >= 4000).length} / {weeklyData.length} 日達成
            </Text>
            <View style={styles.achievementBar}>
              <View 
                style={[
                  styles.achievementBarFill, 
                  { width: `${getGoalAchievementRate()}%` }
                ]} 
              />
            </View>
          </View>
        </View>

        {/* 歩数グラフ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>日別歩数</Text>
          <BarChart data={weeklyData} height={200} />
        </View>

        {/* リスク指標 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>現在のリスク指標</Text>
          <View style={styles.riskContainer}>
            <RiskIndicator level={currentRisks.fall} type="転倒リスク" />
            <RiskIndicator level={currentRisks.frailty} type="フレイルリスク" />
            <RiskIndicator level={currentRisks.mental} type="メンタルヘルス" />
          </View>
        </View>

        {/* 活動履歴 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>詳細データ</Text>
          {weeklyData.map((day, index) => (
            <View key={index} style={styles.historyItem}>
              <View style={styles.historyDate}>
                <Text style={styles.historyDateText}>
                  {new Date(day.date).toLocaleDateString('ja-JP', {
                    month: 'short',
                    day: 'numeric',
                    weekday: 'short'
                  })}
                </Text>
              </View>
              <View style={styles.historyData}>
                <Text style={styles.historySteps}>{day.steps.toLocaleString()} 歩</Text>
                <Text style={styles.historyDetails}>
                  {day.distance}km • {day.calories}kcal
                </Text>
              </View>
              <View style={styles.historyStatus}>
                {day.steps >= 4000 ? (
                  <Text style={styles.achievedBadge}>達成</Text>
                ) : (
                  <Text style={styles.pendingBadge}>未達成</Text>
                )}
              </View>
            </View>
          ))}
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
  header: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.surface,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 2,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
  },
  activePeriodButton: {
    backgroundColor: Colors.surface,
  },
  periodButtonText: {
    fontSize: 14,
    color: Colors.surface,
    fontWeight: '500',
  },
  activePeriodButtonText: {
    color: Colors.primary,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: Colors.surface,
    marginBottom: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statsCard: {
    width: '48%',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  statsIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statsTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statsSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  achievementCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  achievementTitle: {
    fontSize: 16,
    color: Colors.text,
    marginBottom: 8,
  },
  achievementValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  achievementSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  achievementBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  achievementBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  chartContainer: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    position: 'relative',
  },
  chartContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingLeft: 30,
  },
  barContainer: {
    alignItems: 'center',
  },
  bar: {
    borderRadius: 4,
    marginBottom: 8,
  },
  barValue: {
    fontSize: 12,
    color: Colors.text,
    marginBottom: 4,
    fontWeight: '500',
  },
  barLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  yAxisLabels: {
    position: 'absolute',
    left: 0,
    top: 16,
    bottom: 50,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 8,
  },
  axisLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  riskContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  riskIndicator: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  riskType: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  riskBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  riskBadgeText: {
    fontSize: 12,
    color: Colors.surface,
    fontWeight: 'bold',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  historyDate: {
    width: 80,
  },
  historyDateText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  historyData: {
    flex: 1,
    marginLeft: 16,
  },
  historySteps: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: 'bold',
  },
  historyDetails: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  historyStatus: {
    alignItems: 'center',
  },
  achievedBadge: {
    fontSize: 12,
    color: Colors.success,
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: 'bold',
  },
  pendingBadge: {
    fontSize: 12,
    color: Colors.warning,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: 'bold',
  },
});

export default ActivityScreen; 