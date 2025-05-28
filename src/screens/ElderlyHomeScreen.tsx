/**
 * 高齢者向けホーム画面
 * 
 * 特徴：
 * - 大きなカードレイアウト
 * - 明確なナビゲーション動線
 * - 高コントラストデザイン
 * - アクセシビリティ対応
 * - エラーハンドリング
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

// コンポーネント
import { ElderlyCard } from '../components/elderly-design/ElderlyCard';
import { ElderlyButton } from '../components/elderly-design/ElderlyButton';

// テーマ
import { elderlyTheme } from '../styles/elderly-theme';

// サービス
import { firestoreService } from '../services/firestoreService';
import { riskCalculationService } from '../services/riskCalculationService';

// タイプ
import { StackNavigationProp } from '@react-navigation/stack';
import { UserProfile, MoodData, StepData } from '../types';

interface Props {
  navigation: StackNavigationProp<any>;
}

interface HomeData {
  userProfile: UserProfile | null;
  riskLevel: 'low' | 'medium' | 'high';
  todaySteps: number;
  todayMood: MoodData | null;
  loading: boolean;
  error: string | null;
}

export const ElderlyHomeScreen: React.FC<Props> = ({ navigation }) => {
  const [data, setData] = useState<HomeData>({
    userProfile: null,
    riskLevel: 'low',
    todaySteps: 0,
    todayMood: null,
    loading: true,
    error: null,
  });

  const [refreshing, setRefreshing] = useState(false);

  // データ取得
  const loadData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      // ユーザーIDを取得（仮のユーザーIDを使用）
      const userId = 'user1'; // TODO: 実際のユーザーIDを取得する
      
      // 並行してデータを取得（エラーハンドリングあり）
      const results = await Promise.allSettled([
        firestoreService.getUserProfile(userId),
        firestoreService.getLatestRiskAssessment(userId),
        firestoreService.getTodaySteps(userId),
        firestoreService.getTodayMoodData(userId),
      ]);

      // すべて失敗した場合はエラー状態に
      const allFailed = results.every(result => result.status === 'rejected');
      if (allFailed) {
        throw new Error('すべてのデータ取得に失敗しました');
      }

      // 成功した結果を取得
      const [userProfileResult, riskAssessmentResult, stepDataResult, moodDataResult] = results;
      
      const userProfile = userProfileResult.status === 'fulfilled' ? userProfileResult.value : null;
      const riskAssessment = riskAssessmentResult.status === 'fulfilled' ? riskAssessmentResult.value : null;
      const stepData = stepDataResult.status === 'fulfilled' ? stepDataResult.value : null;
      const moodData = moodDataResult.status === 'fulfilled' ? moodDataResult.value : null;

      // リスクレベルを計算
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (riskAssessment && typeof riskAssessment === 'object' && 'overallRiskScore' in riskAssessment) {
        const risk = riskAssessment.overallRiskScore;
        if (risk >= 70) riskLevel = 'high';
        else if (risk >= 40) riskLevel = 'medium';
      }

      setData({
        userProfile,
        riskLevel,
        todaySteps: stepData?.steps || 0,
        todayMood: Array.isArray(moodData) && moodData.length > 0 ? moodData[0] : null,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('HomeScreen data loading error:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'データを取得できませんでした。もう一度お試しください。',
      }));
    }
  };

  // リフレッシュ
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // 再試行
  const onRetry = () => {
    loadData();
  };

  // 初期データ読み込み
  useEffect(() => {
    loadData();
  }, []);

  // ローディング画面
  if (data.loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size="large" 
            color={elderlyTheme.colors.primary}
            testID="loading-indicator"
          />
          <Text style={styles.loadingText}>データを読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // エラー画面
  if (data.error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon 
            name="error-outline" 
            size={elderlyTheme.iconSize.xlarge} 
            color={elderlyTheme.colors.error}
          />
          <Text style={styles.errorTitle}>接続エラー</Text>
          <Text style={styles.errorMessage}>{data.error}</Text>
          <ElderlyButton
            title="再試行"
            onPress={onRetry}
            variant="primary"
            icon="refresh"
            testID="retry-button"
          />
        </View>
      </SafeAreaView>
    );
  }

  // リスクレベルの表示設定
  const getRiskDisplay = () => {
    switch (data.riskLevel) {
      case 'high':
        return {
          icon: 'warning',
          color: elderlyTheme.colors.riskHigh,
          text: '注意が必要',
          description: '健康状態に注意してください',
        };
      case 'medium':
        return {
          icon: 'info',
          color: elderlyTheme.colors.riskMedium,
          text: '普通',
          description: '健康状態は安定しています',
        };
      default:
        return {
          icon: 'check-circle',
          color: elderlyTheme.colors.riskLow,
          text: '良好',
          description: '健康状態は良好です',
        };
    }
  };

  const riskDisplay = getRiskDisplay();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[elderlyTheme.colors.primary]}
          />
        }
      >
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            おはようございます{data.userProfile?.fullName ? `、${data.userProfile.fullName}さん` : ''}
          </Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </Text>
        </View>

        {/* 健康状態カード */}
        <ElderlyCard
          testID="health-status-card"
          accessibilityLabel={`現在の健康状態: ${riskDisplay.text}。${riskDisplay.description}`}
        >
          <View style={styles.cardHeader}>
            <Icon 
              name="favorite" 
              size={elderlyTheme.iconSize.large} 
              color={elderlyTheme.colors.primary}
            />
            <Text style={styles.cardTitle}>今日の健康状態</Text>
          </View>
          
          <View style={styles.healthStatus}>
            <View style={styles.riskIndicator}>
              <Icon 
                name={riskDisplay.icon}
                size={elderlyTheme.iconSize.xlarge}
                color={riskDisplay.color}
                testID="risk-level-icon"
              />
              <Text 
                style={[styles.riskText, { color: riskDisplay.color }]}
                testID="risk-level-text"
              >
                {riskDisplay.text}
              </Text>
            </View>
            <Text style={styles.riskDescription}>
              {riskDisplay.description}
            </Text>
          </View>
        </ElderlyCard>

        {/* 今日の活動カード */}
        <ElderlyCard
          testID="today-activity-card"
          accessibilityLabel={`今日の歩数: ${data.todaySteps}歩`}
        >
          <View style={styles.cardHeader}>
            <Icon 
              name="directions-walk" 
              size={elderlyTheme.iconSize.large} 
              color={elderlyTheme.colors.info}
            />
            <Text style={styles.cardTitle}>今日の活動</Text>
          </View>
          
          <View style={styles.activityData}>
            <View style={styles.stepCounter}>
              <Text style={styles.stepNumber}>{data.todaySteps.toLocaleString()}</Text>
              <Text style={styles.stepLabel}>歩</Text>
            </View>
            
            {data.todayMood && (
              <View style={styles.moodDisplay}>
                <Text style={styles.moodLabel}>今日の気分：</Text>
                <Text style={styles.moodValue}>{data.todayMood.moodLabel || '記録済み'}</Text>
              </View>
            )}
          </View>
        </ElderlyCard>

        {/* よく使う機能カード */}
        <ElderlyCard
          testID="quick-actions-card"
          accessibilityLabel="よく使う機能へのショートカット"
        >
          <View style={styles.cardHeader}>
            <Icon 
              name="apps" 
              size={elderlyTheme.iconSize.large} 
              color={elderlyTheme.colors.secondary}
            />
            <Text style={styles.cardTitle}>よく使う機能</Text>
          </View>
          
          <View style={styles.quickActions}>
            <ElderlyButton
              title="気分を記録"
              onPress={() => navigation.navigate('MoodMirror')}
              variant="secondary"
              icon="mood"
              accessibilityLabel="気分を記録する"
              testID="mood-record-button"
            />
            
            <ElderlyButton
              title="歩数を確認"
              onPress={() => navigation.navigate('Activity')}
              variant="secondary"
              icon="directions-walk"
              accessibilityLabel="歩数を確認する"
              testID="activity-view-button"
            />
            
            <ElderlyButton
              title="レポートを見る"
              onPress={() => navigation.navigate('Report')}
              variant="secondary"
              icon="assessment"
              accessibilityLabel="健康レポートを見る"
              testID="report-view-button"
            />
            
            <ElderlyButton
              title="設定"
              onPress={() => navigation.navigate('NotificationSettings')}
              variant="secondary"
              icon="settings"
              accessibilityLabel="設定を開く"
              testID="settings-button"
            />
          </View>
        </ElderlyCard>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: elderlyTheme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: elderlyTheme.spacing.medium,
    paddingBottom: elderlyTheme.spacing.xlarge,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: elderlyTheme.spacing.xlarge,
  },
  loadingText: {
    fontSize: elderlyTheme.fontSize.large,
    color: elderlyTheme.colors.textSecondary,
    marginTop: elderlyTheme.spacing.medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: elderlyTheme.spacing.xlarge,
  },
  errorTitle: {
    fontSize: elderlyTheme.fontSize.xlarge,
    fontWeight: elderlyTheme.fontWeight.bold,
    color: elderlyTheme.colors.error,
    marginTop: elderlyTheme.spacing.medium,
    marginBottom: elderlyTheme.spacing.small,
  },
  errorMessage: {
    fontSize: elderlyTheme.fontSize.medium,
    color: elderlyTheme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: elderlyTheme.spacing.large,
    lineHeight: elderlyTheme.fontSize.medium * 1.5,
  },
  header: {
    marginBottom: elderlyTheme.spacing.large,
  },
  greeting: {
    fontSize: elderlyTheme.fontSize.xlarge,
    fontWeight: elderlyTheme.fontWeight.bold,
    color: elderlyTheme.colors.text,
    marginBottom: elderlyTheme.spacing.small,
  },
  date: {
    fontSize: elderlyTheme.fontSize.medium,
    color: elderlyTheme.colors.textSecondary,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: elderlyTheme.spacing.medium,
  },
  cardTitle: {
    fontSize: elderlyTheme.fontSize.large,
    fontWeight: elderlyTheme.fontWeight.bold,
    color: elderlyTheme.colors.text,
    marginLeft: elderlyTheme.spacing.small,
  },
  healthStatus: {
    alignItems: 'center',
  },
  riskIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: elderlyTheme.spacing.small,
  },
  riskText: {
    fontSize: elderlyTheme.fontSize.xlarge,
    fontWeight: elderlyTheme.fontWeight.bold,
    marginLeft: elderlyTheme.spacing.small,
  },
  riskDescription: {
    fontSize: elderlyTheme.fontSize.medium,
    color: elderlyTheme.colors.textSecondary,
    textAlign: 'center',
  },
  activityData: {
    alignItems: 'center',
  },
  stepCounter: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: elderlyTheme.spacing.medium,
  },
  stepNumber: {
    fontSize: elderlyTheme.fontSize.xxxlarge,
    fontWeight: elderlyTheme.fontWeight.bold,
    color: elderlyTheme.colors.info,
  },
  stepLabel: {
    fontSize: elderlyTheme.fontSize.large,
    color: elderlyTheme.colors.textSecondary,
    marginLeft: elderlyTheme.spacing.small,
  },
  moodDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodLabel: {
    fontSize: elderlyTheme.fontSize.medium,
    color: elderlyTheme.colors.textSecondary,
  },
  moodValue: {
    fontSize: elderlyTheme.fontSize.medium,
    fontWeight: elderlyTheme.fontWeight.bold,
    color: elderlyTheme.colors.text,
    marginLeft: elderlyTheme.spacing.small,
  },
  quickActions: {
    gap: elderlyTheme.spacing.medium,
  },
});