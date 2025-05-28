/**
 * レスポンシブ対応高齢者向けホーム画面
 * 
 * 特徴：
 * - タブレット対応のグリッドレイアウト
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
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';

// コンポーネント
import { AccessibleCard } from '../components/AccessibleCard';
import { AccessibleButton } from '../components/AccessibleButton';

// レスポンシブユーティリティ
import { 
  responsiveFontSize, 
  responsiveSpacing, 
  getCardLayout, 
  isTablet,
  getScreenPadding,
  getIconSize,
} from '../utils/responsive';

// テーマ
import { elderlyTheme } from '../styles/elderly-theme';
import { Colors } from '../types';

// サービス
import { firestoreService } from '../services/firestoreService';
import { riskCalculationService } from '../services/riskCalculationService';
import { getCurrentUser } from '../services/authService';

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

export const ResponsiveElderlyHomeScreen: React.FC<Props> = ({ navigation }) => {
  const [data, setData] = useState<HomeData>({
    userProfile: null,
    riskLevel: 'low',
    todaySteps: 0,
    todayMood: null,
    loading: true,
    error: null,
  });

  const [refreshing, setRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const cardLayout = getCardLayout();

  // データ取得
  const loadData = async () => {
    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      // 現在のユーザーを取得
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        throw new Error('ログインが必要です');
      }
      const userId = currentUser.id;
      
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
        throw new Error('すべてのデータ取得に失敗しました。データベースの権限設定を確認してください。');
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
            color={Colors.primary}
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
            size={getIconSize(48)} 
            color={Colors.error}
          />
          <Text style={styles.errorTitle}>接続エラー</Text>
          <Text style={styles.errorMessage}>{data.error}</Text>
          <AccessibleButton
            title="再試行"
            onPress={onRetry}
            variant="primary"
            size="large"
            icon={<Icon name="refresh" size={getIconSize(24)} color={Colors.surface} />}
            accessibilityLabel="データ取得を再試行"
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
          color: Colors.error,
          text: '注意が必要',
          description: '健康状態に注意してください',
        };
      case 'medium':
        return {
          icon: 'info',
          color: Colors.warning,
          text: '普通',
          description: '健康状態は安定しています',
        };
      default:
        return {
          icon: 'check-circle',
          color: Colors.success,
          text: '良好',
          description: '健康状態は良好です',
        };
    }
  };

  const riskDisplay = getRiskDisplay();

  // 機能ボタンのデータ
  const quickActions = [
    {
      id: 'mood',
      title: '気分を記録',
      icon: 'mood',
      screen: 'MoodMirror',
      color: Colors.primary,
    },
    {
      id: 'activity',
      title: '歩数を確認',
      icon: 'directions-walk',
      screen: 'Activity',
      color: Colors.info,
    },
    {
      id: 'report',
      title: 'レポートを見る',
      icon: 'assessment',
      screen: 'Report',
      color: Colors.secondary,
    },
    {
      id: 'settings',
      title: '設定',
      icon: 'settings',
      screen: 'NotificationSettings',
      color: Colors.textSecondary,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={[Colors.primary]}
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

        {/* カードグリッド */}
        <View style={[styles.cardGrid, isTablet() && styles.tabletGrid]}>
          {/* 健康状態カード */}
          <AccessibleCard
            title="今日の健康状態"
            subtitle={riskDisplay.text}
            description={riskDisplay.description}
            icon={
              <Icon 
                name={riskDisplay.icon}
                size={getIconSize(32)}
                color={riskDisplay.color}
              />
            }
            variant={data.riskLevel === 'high' ? 'warning' : 'default'}
            style={isTablet() ? styles.gridCard : undefined}
            accessibilityLabel={`現在の健康状態: ${riskDisplay.text}。${riskDisplay.description}`}
          />

          {/* 今日の活動カード */}
          <AccessibleCard
            title="今日の活動"
            subtitle={`${data.todaySteps.toLocaleString()} 歩`}
            description={data.todayMood ? `気分: ${data.todayMood.moodLabel || '記録済み'}` : '気分未記録'}
            icon={
              <Icon 
                name="directions-walk"
                size={getIconSize(32)}
                color={Colors.info}
              />
            }
            style={isTablet() ? styles.gridCard : undefined}
            accessibilityLabel={`今日の歩数: ${data.todaySteps}歩`}
          />
        </View>

        {/* よく使う機能 */}
        <Text style={styles.sectionTitle}>よく使う機能</Text>
        <View style={[styles.actionGrid, isTablet() && styles.tabletActionGrid]}>
          {quickActions.map((action) => (
            <View key={action.id} style={isTablet() && styles.actionGridItem}>
              <AccessibleButton
                title={action.title}
                onPress={() => navigation.navigate(action.screen)}
                variant="secondary"
                size={isTablet() ? 'large' : 'medium'}
                icon={
                  <Icon 
                    name={action.icon} 
                    size={getIconSize(24)} 
                    color={action.color}
                  />
                }
                accessibilityLabel={`${action.title}画面を開く`}
                fullWidth={!isTablet()}
              />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: getScreenPadding(),
    paddingBottom: responsiveSpacing(32),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: responsiveSpacing(32),
  },
  loadingText: {
    fontSize: responsiveFontSize(18),
    color: Colors.textSecondary,
    marginTop: responsiveSpacing(16),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: responsiveSpacing(32),
  },
  errorTitle: {
    fontSize: responsiveFontSize(24),
    fontWeight: 'bold',
    color: Colors.error,
    marginTop: responsiveSpacing(16),
    marginBottom: responsiveSpacing(8),
  },
  errorMessage: {
    fontSize: responsiveFontSize(16),
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: responsiveSpacing(24),
    lineHeight: responsiveFontSize(16) * 1.5,
  },
  header: {
    marginBottom: responsiveSpacing(24),
  },
  greeting: {
    fontSize: responsiveFontSize(24),
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: responsiveSpacing(8),
  },
  date: {
    fontSize: responsiveFontSize(16),
    color: Colors.textSecondary,
  },
  cardGrid: {
    marginBottom: responsiveSpacing(32),
    gap: responsiveSpacing(16),
  },
  tabletGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridCard: {
    flex: 1,
    minWidth: 300,
  },
  sectionTitle: {
    fontSize: responsiveFontSize(20),
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: responsiveSpacing(16),
  },
  actionGrid: {
    gap: responsiveSpacing(12),
  },
  tabletActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionGridItem: {
    width: '48%',
    marginBottom: responsiveSpacing(12),
    marginRight: '2%',
  },
});