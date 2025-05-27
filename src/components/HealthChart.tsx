import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  LineChart,
  BarChart,
  ChartConfig,
} from 'react-native-chart-kit';
import { Colors, FontSizes, Spacing } from '../types';
import { StepData, MoodData } from '../types';

const { width: screenWidth } = Dimensions.get('window');

type ChartType = 'steps' | 'mood' | 'risk';
type PeriodType = 'week' | 'month' | 'quarter';

interface RiskData {
  date: string;
  score: number;
  level: 'low' | 'medium' | 'high';
}

interface HealthChartProps {
  type: ChartType;
  data: StepData[] | MoodData[] | RiskData[];
  title: string;
  showPeriodSelector?: boolean;
  showAverage?: boolean;
  targetValue?: number;
}

export const HealthChart: React.FC<HealthChartProps> = ({
  type,
  data,
  title,
  showPeriodSelector = false,
  showAverage = false,
  targetValue,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('week');

  const chartConfig: ChartConfig = {
    backgroundColor: Colors.white,
    backgroundGradientFrom: Colors.white,
    backgroundGradientTo: Colors.white,
    decimalPlaces: 0,
    color: (opacity = 1) => {
      switch (type) {
        case 'steps':
          return `rgba(0, 123, 255, ${opacity})`;
        case 'mood':
          return `rgba(76, 175, 80, ${opacity})`;
        case 'risk':
          return `rgba(255, 152, 0, ${opacity})`;
        default:
          return `rgba(0, 0, 0, ${opacity})`;
      }
    },
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: Colors.primary,
    },
  };

  const processStepData = (stepData: StepData[]) => {
    const labels = stepData.map(item => {
      const date = new Date(item.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    const values = stepData.map(item => item.steps);
    
    return {
      labels,
      datasets: [{
        data: values,
        color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
        strokeWidth: 2,
      }],
    };
  };

  const processMoodData = (moodData: MoodData[]) => {
    const labels = moodData.map(item => {
      const date = new Date(item.createdAt);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    const values = moodData.map(item => item.mood);
    
    return {
      labels,
      datasets: [{
        data: values,
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 2,
      }],
    };
  };

  const processRiskData = (riskData: RiskData[]) => {
    const labels = riskData.map(item => {
      const date = new Date(item.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    const values = riskData.map(item => item.score);
    
    return {
      labels,
      datasets: [{
        data: values,
        color: (opacity = 1) => `rgba(255, 152, 0, ${opacity})`,
        strokeWidth: 2,
      }],
    };
  };

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    switch (type) {
      case 'steps':
        return processStepData(data as StepData[]);
      case 'mood':
        return processMoodData(data as MoodData[]);
      case 'risk':
        return processRiskData(data as RiskData[]);
      default:
        return null;
    }
  }, [data, type]);

  const average = useMemo(() => {
    if (!data || data.length === 0 || !showAverage) return null;

    let sum = 0;
    let count = 0;

    switch (type) {
      case 'steps':
        (data as StepData[]).forEach(item => {
          sum += item.steps;
          count++;
        });
        break;
      case 'mood':
        (data as MoodData[]).forEach(item => {
          sum += item.mood;
          count++;
        });
        break;
      case 'risk':
        (data as RiskData[]).forEach(item => {
          sum += item.score;
          count++;
        });
        break;
    }

    return count > 0 ? Math.round(sum / count) : 0;
  }, [data, type, showAverage]);

  const formatValue = (value: number): string => {
    if (type === 'steps') {
      return value.toLocaleString('ja-JP');
    }
    return value.toString();
  };

  const getUnit = (): string => {
    switch (type) {
      case 'steps':
        return '歩';
      case 'mood':
        return '点';
      case 'risk':
        return '点';
      default:
        return '';
    }
  };

  if (!chartData) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>データがありません</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        
        {showPeriodSelector && (
          <View style={styles.periodSelector}>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === 'week' && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod('week')}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === 'week' && styles.periodButtonTextActive,
                ]}
              >
                1週間
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === 'month' && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod('month')}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === 'month' && styles.periodButtonTextActive,
                ]}
              >
                1ヶ月
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.periodButton,
                selectedPeriod === 'quarter' && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod('quarter')}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === 'quarter' && styles.periodButtonTextActive,
                ]}
              >
                3ヶ月
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.statsContainer}>
          {showAverage && average !== null && (
            <Text style={styles.statText}>
              平均: {formatValue(average)}{getUnit()}
            </Text>
          )}
          {targetValue && (
            <Text style={styles.statText}>
              目標: {formatValue(targetValue)}{getUnit()}
            </Text>
          )}
        </View>

        <LineChart
          data={chartData}
          width={screenWidth - 32}
          height={220}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          testID={`${type}-line-chart`}
          accessibilityLabel={`${title}のグラフ`}
          accessibilityRole="image"
          withVerticalLabels={true}
          withHorizontalLabels={true}
          withDots={true}
          withInnerLines={true}
          withOuterLines={true}
          withVerticalLines={false}
          withHorizontalLines={true}
          fromZero={true}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    padding: Spacing.medium,
    borderRadius: 12,
    marginVertical: Spacing.small,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: FontSizes.large,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.small,
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: Spacing.medium,
  },
  periodButton: {
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderRadius: 20,
    backgroundColor: Colors.background,
    marginRight: Spacing.small,
  },
  periodButtonActive: {
    backgroundColor: Colors.primary,
  },
  periodButtonText: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
  },
  periodButtonTextActive: {
    color: Colors.white,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.small,
  },
  statText: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
  },
  chart: {
    marginVertical: Spacing.small,
    borderRadius: 16,
  },
  noDataContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
  },
});