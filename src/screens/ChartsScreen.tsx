import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { HealthChart } from '../components/HealthChart';
import { Colors, Spacing } from '../types';
import { firestoreService } from '../services/firestoreService';
import { auth } from '../config/firebase';
import { StepData, MoodData } from '../types';

interface RiskChartData {
  date: string;
  score: number;
  level: 'low' | 'medium' | 'high';
}

export const ChartsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [stepData, setStepData] = useState<StepData[]>([]);
  const [moodData, setMoodData] = useState<MoodData[]>([]);
  const [riskData, setRiskChartData] = useState<RiskChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      setLoading(true);

      // 並列でデータを取得
      const [steps, moods, risks] = await Promise.all([
        firestoreService.getStepHistory(user.uid, 30),
        firestoreService.getUserMoodHistory(user.uid, 30),
        firestoreService.getRiskAssessmentHistory(user.uid, 30),
      ]);

      // 歩数データの設定
      setStepData(steps);

      // 気分データの設定
      setMoodData(moods);

      // リスクデータの変換
      const riskChartData: RiskChartData[] = risks.map((assessment: any) => ({
        date: assessment.assessmentDate,
        score: assessment.overallRiskScore,
        level: assessment.overallRiskLevel,
      }));
      setRiskChartData(riskChartData);
    } catch (error) {
      console.error('データ読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <HealthChart
          type="steps"
          data={stepData.slice(-7)} // 直近7日間
          title="週間歩数推移"
          showAverage={true}
          targetValue={8000}
        />

        <HealthChart
          type="steps"
          data={stepData} // 全期間（30日）
          title="月間歩数推移"
          showPeriodSelector={true}
          showAverage={true}
          targetValue={8000}
        />

        <HealthChart
          type="mood"
          data={moodData.slice(-7)} // 直近7日間
          title="週間気分推移"
          showAverage={true}
        />

        <HealthChart
          type="risk"
          data={riskData.slice(-7)} // 直近7日間
          title="週間リスクスコア推移"
          showAverage={true}
        />

        <HealthChart
          type="risk"
          data={riskData} // 全期間（30日）
          title="月間リスクトレンド"
          showPeriodSelector={true}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.medium,
    paddingBottom: Spacing.xlarge,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});