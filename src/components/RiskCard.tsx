import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { RiskLevel, RiskScore, Colors, FontSizes, TouchTargets, Spacing } from '../types';

const { width } = Dimensions.get('window');

interface RiskCardProps {
  riskScore: RiskScore;
  onPress?: () => void;
  showDetailedView?: boolean;
  style?: any;
}

interface RiskLevelDisplayProps {
  label: string;
  level: RiskLevel;
  compact?: boolean;
}

/**
 * リスクレベル表示コンポーネント
 */
const RiskLevelDisplay: React.FC<RiskLevelDisplayProps> = ({ 
  label, 
  level, 
  compact = false 
}) => {
  const getRiskColor = (riskLevel: RiskLevel): string => {
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

  const getRiskLabel = (riskLevel: RiskLevel): string => {
    switch (riskLevel) {
      case 'low':
        return '低';
      case 'medium':
        return '中';
      case 'high':
        return '高';
      default:
        return '不明';
    }
  };

  const getRiskIcon = (riskLevel: RiskLevel): string => {
    switch (riskLevel) {
      case 'low':
        return '🟢';
      case 'medium':
        return '🟡';
      case 'high':
        return '🔴';
      default:
        return '⚪';
    }
  };

  return (
    <View style={[styles.riskLevelContainer, compact && styles.riskLevelCompact]}>
      <Text style={[styles.riskLevelLabel, compact && styles.riskLevelLabelCompact]}>
        {label}
      </Text>
      <View style={styles.riskValueContainer}>
        <Text style={styles.riskIcon}>{getRiskIcon(level)}</Text>
        <Text style={[
          styles.riskValue, 
          { color: getRiskColor(level) },
          compact && styles.riskValueCompact
        ]}>
          {getRiskLabel(level)}リスク
        </Text>
      </View>
      <View style={[styles.riskIndicator, { backgroundColor: getRiskColor(level) }]} />
    </View>
  );
};

/**
 * リスクカードコンポーネント
 */
export const RiskCard: React.FC<RiskCardProps> = ({
  riskScore,
  onPress,
  showDetailedView = false,
  style,
}) => {
  const formatLastUpdated = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffMinutes < 60) {
        return `${diffMinutes}分前更新`;
      }
      
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) {
        return `${diffHours}時間前更新`;
      }
      
      return date.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return '更新時刻不明';
    }
  };

  const getOverallRiskMessage = (level: RiskLevel): string => {
    switch (level) {
      case 'low':
        return '健康状態は良好です';
      case 'medium':
        return '注意が必要な状態です';
      case 'high':
        return '要注意の状態です';
      default:
        return '評価中です';
    }
  };

  const CardWrapper = ({ children }: { children: React.ReactNode }) => {
    if (onPress) {
      return (
        <TouchableOpacity
          style={[styles.card, style]}
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`総合リスク ${riskScore.overall}レベル ${getOverallRiskMessage(riskScore.overall)}`}
          accessibilityHint="タップして詳細を確認"
        >
          {children}
        </TouchableOpacity>
      );
    }

    return (
      <View style={[styles.card, style]}>
        {children}
      </View>
    );
  };

  return (
    <CardWrapper>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.title}>今日の健康リスク</Text>
        <Text style={styles.lastUpdated}>
          {formatLastUpdated(riskScore.lastUpdated)}
        </Text>
      </View>

      {/* メインリスク表示 */}
      <RiskLevelDisplay 
        label="総合リスク" 
        level={riskScore.overall} 
      />

      <Text style={styles.overallMessage}>
        {getOverallRiskMessage(riskScore.overall)}
      </Text>

      {/* 詳細表示（オプション） */}
      {showDetailedView && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>詳細リスク</Text>
          
          <View style={styles.detailsGrid}>
            <RiskLevelDisplay 
              label="転倒" 
              level={riskScore.fallRisk} 
              compact={true}
            />
            <RiskLevelDisplay 
              label="フレイル" 
              level={riskScore.frailtyRisk} 
              compact={true}
            />
            <RiskLevelDisplay 
              label="メンタル" 
              level={riskScore.mentalHealthRisk} 
              compact={true}
            />
          </View>
        </View>
      )}

      {/* アクションボタン（タップ可能な場合は表示しない） */}
      {!onPress && (
        <View style={styles.actionHint}>
          <Text style={styles.actionHintText}>
            💡 詳細な分析結果は活動画面で確認できます
          </Text>
        </View>
      )}
    </CardWrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.cardPadding,
    marginVertical: Spacing.sm,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  
  // ヘッダースタイル
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSizes.h3,
    fontWeight: 'bold',
    color: Colors.text,
  },
  lastUpdated: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
  },

  // メインリスク表示
  riskLevelContainer: {
    marginBottom: Spacing.md,
  },
  riskLevelCompact: {
    marginBottom: Spacing.sm,
  },
  riskLevelLabel: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  riskLevelLabelCompact: {
    fontSize: FontSizes.small,
    marginBottom: Spacing.xs / 2,
  },
  riskValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  riskIcon: {
    fontSize: FontSizes.h2,
    marginRight: Spacing.sm,
  },
  riskValue: {
    fontSize: FontSizes.h2,
    fontWeight: 'bold',
  },
  riskValueCompact: {
    fontSize: FontSizes.medium,
  },
  riskIndicator: {
    height: 6,
    borderRadius: 3,
    width: '100%',
  },

  // 総合メッセージ
  overallMessage: {
    fontSize: FontSizes.medium,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    fontWeight: '500',
  },

  // 詳細表示
  detailsContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
    marginTop: Spacing.md,
  },
  detailsTitle: {
    fontSize: FontSizes.medium,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },

  // アクションヒント
  actionHint: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 8,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  actionHintText: {
    fontSize: FontSizes.small,
    color: Colors.primary,
    textAlign: 'center',
  },
});

export default RiskCard;