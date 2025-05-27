import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, FontSizes, Spacing } from '../types';
import { reportService, HealthReport } from '../services/reportService';
import { auth } from '../config/firebase';
import i18n from '../config/i18n';

type ReportType = 'weekly' | 'monthly';

export const ReportScreen: React.FC = () => {
  const navigation = useNavigation();
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('monthly');
  const [report, setReport] = useState<HealthReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    generateReport();
  }, [selectedReportType]);

  const generateReport = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      const generatedReport = selectedReportType === 'monthly'
        ? await reportService.generateMonthlyReport(user.uid)
        : await reportService.generateWeeklyReport(user.uid);
      
      setReport(generatedReport);
    } catch (error) {
      console.error('レポート生成エラー:', error);
      Alert.alert('エラー', 'レポートの生成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!report) return;

    setExporting(true);
    try {
      const pdfPath = await reportService.exportToPDF(report);
      
      if (Platform.OS === 'ios') {
        await Share.share({
          url: `file://${pdfPath}`,
          title: 'Health Report',
        });
      } else {
        Alert.alert('成功', 'PDFが保存されました', [
          { text: 'OK' }
        ]);
      }
    } catch (error) {
      console.error('PDF エクスポートエラー:', error);
      Alert.alert('エラー', 'PDFの生成に失敗しました');
    } finally {
      setExporting(false);
    }
  };

  const handleShareText = async () => {
    if (!report) return;

    try {
      const reportText = reportService.formatReportForDisplay(report);
      await Share.share({
        message: reportText,
        title: 'Health Report',
      });
    } catch (error) {
      console.error('シェアエラー:', error);
    }
  };

  const getRiskLevelColor = (level?: string) => {
    switch (level) {
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

  const getRiskLevelText = (level?: string) => {
    switch (level) {
      case 'low':
        return '低リスク';
      case 'medium':
        return '中リスク';
      case 'high':
        return '高リスク';
      default:
        return '未評価';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>レポート生成中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>健康レポート</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleShareText}
            disabled={!report}
          >
            <Ionicons name="share-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleExportPDF}
            disabled={!report || exporting}
          >
            {exporting ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Ionicons name="download-outline" size={24} color={Colors.primary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.reportTypeSelector}>
        <TouchableOpacity
          style={[
            styles.reportTypeButton,
            selectedReportType === 'weekly' && styles.reportTypeButtonActive,
          ]}
          onPress={() => setSelectedReportType('weekly')}
        >
          <Text
            style={[
              styles.reportTypeButtonText,
              selectedReportType === 'weekly' && styles.reportTypeButtonTextActive,
            ]}
          >
            週間
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.reportTypeButton,
            selectedReportType === 'monthly' && styles.reportTypeButtonActive,
          ]}
          onPress={() => setSelectedReportType('monthly')}
        >
          <Text
            style={[
              styles.reportTypeButtonText,
              selectedReportType === 'monthly' && styles.reportTypeButtonTextActive,
            ]}
          >
            月間
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {report && (
          <>
            <View style={styles.periodInfo}>
              <Text style={styles.periodText}>
                期間: {report.period.start} 〜 {report.period.end}
              </Text>
            </View>

            {/* サマリーセクション */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>サマリー</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryCard}>
                  <Ionicons name="footsteps" size={24} color={Colors.primary} />
                  <Text style={styles.summaryValue}>
                    {report.summary.averageSteps.toLocaleString()}
                  </Text>
                  <Text style={styles.summaryLabel}>平均歩数/日</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Ionicons name="calendar" size={24} color={Colors.primary} />
                  <Text style={styles.summaryValue}>
                    {report.summary.activeDays}
                  </Text>
                  <Text style={styles.summaryLabel}>活動日数</Text>
                </View>
                {report.summary.averageMood && (
                  <View style={styles.summaryCard}>
                    <Ionicons name="happy" size={24} color={Colors.primary} />
                    <Text style={styles.summaryValue}>
                      {report.summary.averageMood}
                    </Text>
                    <Text style={styles.summaryLabel}>平均気分</Text>
                  </View>
                )}
                {report.summary.currentRiskLevel && (
                  <View style={styles.summaryCard}>
                    <Ionicons 
                      name="shield-checkmark" 
                      size={24} 
                      color={getRiskLevelColor(report.summary.currentRiskLevel)} 
                    />
                    <Text style={[
                      styles.summaryValue,
                      { color: getRiskLevelColor(report.summary.currentRiskLevel) }
                    ]}>
                      {getRiskLevelText(report.summary.currentRiskLevel)}
                    </Text>
                    <Text style={styles.summaryLabel}>現在のリスク</Text>
                  </View>
                )}
              </View>
            </View>

            {/* 歩数分析セクション */}
            {report.stepAnalysis && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>歩数分析</Text>
                <View style={styles.analysisCard}>
                  <View style={styles.analysisRow}>
                    <Text style={styles.analysisLabel}>目標達成率</Text>
                    <Text style={styles.analysisValue}>
                      {report.stepAnalysis.targetAchievementRate}%
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill,
                        { width: `${report.stepAnalysis.targetAchievementRate}%` }
                      ]} 
                    />
                  </View>
                </View>
                <View style={styles.analysisCard}>
                  <View style={styles.analysisRow}>
                    <Text style={styles.analysisLabel}>最高記録</Text>
                    <Text style={styles.analysisValue}>
                      {report.stepAnalysis.bestDay.steps.toLocaleString()}歩
                    </Text>
                  </View>
                  <Text style={styles.analysisSubtext}>
                    {report.stepAnalysis.bestDay.date}
                  </Text>
                </View>
                <View style={styles.analysisCard}>
                  <View style={styles.analysisRow}>
                    <Text style={styles.analysisLabel}>トレンド</Text>
                    <Text style={styles.analysisValue}>
                      {report.stepAnalysis.weeklyTrend === 'improving' ? '改善' :
                       report.stepAnalysis.weeklyTrend === 'declining' ? '低下' : '安定'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* リスク評価セクション */}
            {report.riskSummary && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>リスク評価</Text>
                {report.riskSummary.recommendations.map((rec, index) => (
                  <View key={index} style={styles.recommendationCard}>
                    <Ionicons 
                      name="information-circle" 
                      size={20} 
                      color={Colors.primary} 
                    />
                    <Text style={styles.recommendationText}>{rec}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                生成日時: {new Date(report.generatedAt).toLocaleString('ja-JP')}
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
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
  },
  loadingText: {
    marginTop: Spacing.medium,
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
  },
  title: {
    fontSize: FontSizes.xlarge,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  iconButton: {
    padding: Spacing.small,
    marginLeft: Spacing.small,
  },
  reportTypeSelector: {
    flexDirection: 'row',
    marginHorizontal: Spacing.medium,
    marginBottom: Spacing.medium,
    backgroundColor: Colors.white,
    borderRadius: 25,
    padding: 4,
  },
  reportTypeButton: {
    flex: 1,
    paddingVertical: Spacing.small,
    alignItems: 'center',
    borderRadius: 20,
  },
  reportTypeButtonActive: {
    backgroundColor: Colors.primary,
  },
  reportTypeButtonText: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
  },
  reportTypeButtonTextActive: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: Spacing.medium,
    paddingBottom: Spacing.xlarge,
  },
  periodInfo: {
    backgroundColor: Colors.white,
    padding: Spacing.medium,
    borderRadius: 8,
    marginBottom: Spacing.medium,
  },
  periodText: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: Spacing.large,
  },
  sectionTitle: {
    fontSize: FontSizes.large,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.medium,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.small / 2,
  },
  summaryCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.medium,
    alignItems: 'center',
    margin: Spacing.small / 2,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryValue: {
    fontSize: FontSizes.xlarge,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginVertical: Spacing.small,
  },
  summaryLabel: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
  },
  analysisCard: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: Spacing.medium,
    marginBottom: Spacing.small,
  },
  analysisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  analysisLabel: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
  },
  analysisValue: {
    fontSize: FontSizes.medium,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  analysisSubtext: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.background,
    borderRadius: 4,
    marginTop: Spacing.small,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  recommendationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: Spacing.medium,
    marginBottom: Spacing.small,
  },
  recommendationText: {
    flex: 1,
    fontSize: FontSizes.medium,
    color: Colors.textPrimary,
    marginLeft: Spacing.small,
  },
  footer: {
    marginTop: Spacing.large,
    paddingTop: Spacing.medium,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerText: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});