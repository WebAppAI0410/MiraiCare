import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors, FontSizes, Spacing } from '../types';
import type { ChatMessage } from '../services/moodAnalysis';
import type { MoodAnalysisResponse } from '../services/openai';

interface ChatBubbleProps {
  message: ChatMessage;
  onMoodDataPress?: (moodData: MoodAnalysisResponse) => void;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ 
  message, 
  onMoodDataPress 
}) => {
  const isUser = message.type === 'user';
  const hasMoodData = message.moodData;

  const formatTime = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMoodData = () => {
    if (!hasMoodData || !message.moodData) return null;

    const { moodLabel, intensity, riskLevel, suggestion } = message.moodData;

    const getRiskColor = (risk: string) => {
      switch (risk) {
        case 'high':
          return Colors.error;
        case 'medium':
          return Colors.warning;
        default:
          return Colors.success;
      }
    };

    const getIntensityIndicator = (intensity: number) => {
      return '●'.repeat(intensity) + '○'.repeat(5 - intensity);
    };

    return (
      <TouchableOpacity
        style={styles.moodDataContainer}
        onPress={() => onMoodDataPress?.(message.moodData)}
        accessibilityRole="button"
        accessibilityLabel={`ムード分析結果: ${moodLabel}、強度${intensity}`}
        accessibilityHint="タップして詳細を表示"
      >
        <View style={styles.moodHeader}>
          <Text style={styles.moodLabel}>{moodLabel}</Text>
          <View style={[
            styles.riskIndicator,
            { backgroundColor: getRiskColor(riskLevel) }
          ]} />
        </View>
        
        <View style={styles.intensityContainer}>
          <Text style={styles.intensityLabel}>強度:</Text>
          <Text style={styles.intensityIndicator}>
            {getIntensityIndicator(intensity)}
          </Text>
          <Text style={styles.intensityValue}>({intensity}/5)</Text>
        </View>

        {suggestion && (
          <Text style={styles.suggestionText}>{suggestion}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.aiMessageContainer,
      ]}
      accessibilityRole="text"
    >
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userMessageBubble : styles.aiMessageBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.aiMessageText,
          ]}
          accessibilityLabel={`${isUser ? 'あなた' : 'AIアシスタント'}: ${message.content}`}
        >
          {message.content}
        </Text>

        {/* ムードデータがある場合は表示 */}
        {renderMoodData()}

        <Text
          style={[
            styles.messageTime,
            isUser ? styles.userMessageTime : styles.aiMessageTime,
          ]}
          accessibilityLabel={`送信時刻: ${formatTime(message.timestamp)}`}
        >
          {formatTime(message.timestamp)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    marginVertical: Spacing.xs,
    paddingHorizontal: Spacing.medium,
  } as ViewStyle,

  userMessageContainer: {
    alignItems: 'flex-end',
  } as ViewStyle,

  aiMessageContainer: {
    alignItems: 'flex-start',
  } as ViewStyle,

  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderRadius: 20,
    minHeight: 48, // アクセシビリティのための最小タップ領域
  } as ViewStyle,

  userMessageBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 8,
  } as ViewStyle,

  aiMessageBubble: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: 8,
  } as ViewStyle,

  messageText: {
    fontSize: FontSizes.medium,
    lineHeight: FontSizes.medium * 1.4,
  } as TextStyle,

  userMessageText: {
    color: Colors.surface,
  } as TextStyle,

  aiMessageText: {
    color: Colors.text,
  } as TextStyle,

  messageTime: {
    fontSize: FontSizes.small,
    marginTop: Spacing.xs,
  } as TextStyle,

  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  } as TextStyle,

  aiMessageTime: {
    color: Colors.textSecondary,
  } as TextStyle,

  // ムードデータ表示スタイル
  moodDataContainer: {
    marginTop: Spacing.small,
    padding: Spacing.small,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  } as ViewStyle,

  moodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  } as ViewStyle,

  moodLabel: {
    fontSize: FontSizes.large,
    fontWeight: 'bold',
    color: Colors.primary,
  } as TextStyle,

  riskIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  } as ViewStyle,

  intensityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  } as ViewStyle,

  intensityLabel: {
    fontSize: FontSizes.medium,
    color: Colors.text,
    marginRight: Spacing.xs,
  } as TextStyle,

  intensityIndicator: {
    fontSize: FontSizes.medium,
    color: Colors.primary,
    fontFamily: 'monospace',
    marginRight: Spacing.xs,
  } as TextStyle,

  intensityValue: {
    fontSize: FontSizes.small,
    color: Colors.textSecondary,
  } as TextStyle,

  suggestionText: {
    fontSize: FontSizes.medium,
    color: Colors.text,
    lineHeight: FontSizes.medium * 1.3,
    fontStyle: 'italic',
  } as TextStyle,
});

export default ChatBubble;