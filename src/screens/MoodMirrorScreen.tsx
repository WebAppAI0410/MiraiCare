import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors, FontSizes, Spacing, TouchTargets } from '../types';
import { useMoodChat } from '../hooks/useMoodChat';
import ChatBubble from '../components/ChatBubble';

const MoodMirrorScreen: React.FC = () => {
  const {
    messages,
    isLoading,
    error,
    questions,
    currentQuestionIndex,
    dailyUsage,
    canUseToday,
    isSessionActive,
    isSessionCompleted,
    finalMoodData,
    startSession,
    sendMessage,
  } = useMoodChat();

  const [inputText, setInputText] = React.useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  // メッセージが追加されたら自動スクロール
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // エラーハンドリング
  useEffect(() => {
    if (error) {
      Alert.alert('エラー', error);
    }
  }, [error]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const messageContent = inputText.trim();
    setInputText('');
    
    try {
      await sendMessage(messageContent);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleQuickResponse = (response: string) => {
    setInputText(response);
  };

  const handleStartSession = async () => {
    try {
      await startSession();
    } catch (err) {
      console.error('Failed to start session:', err);
    }
  };

  const handleMoodDataPress = (moodData: any) => {
    if (!moodData) return;
    
    const { moodLabel, intensity, suggestion, riskLevel } = moodData;
    
    Alert.alert(
      `ムード分析結果: ${moodLabel}`,
      `強度: ${intensity}/5\nリスクレベル: ${riskLevel}\n\n${suggestion}`,
      [{ text: 'OK' }]
    );
  };

  const renderQuickResponses = () => {
    if (isSessionCompleted || currentQuestionIndex >= questions.length) {
      return null;
    }

    // 質問タイプに基づいてクイックレスポンスを生成
    const questionTypes = [
      ['とても良い', '良い', '普通', '少し不安', '不安'],
      ['特にない', '健康について', '家族について', 'お金について', 'その他'],
      [], // テキスト入力用（クイックレスポンスなし）
    ];

    const responses = questionTypes[currentQuestionIndex] || [];
    
    if (responses.length === 0) return null;

    return (
      <View style={styles.quickResponseContainer}>
        <Text style={styles.quickResponseTitle}>クイック回答:</Text>
        {responses.map((response, index) => (
          <TouchableOpacity
            key={index}
            style={styles.quickResponseButton}
            onPress={() => handleQuickResponse(response)}
            accessibilityRole="button"
            accessibilityLabel={`クイック回答: ${response}`}
          >
            <Text style={styles.quickResponseText}>{response}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderDailyUsageInfo = () => {
    if (!dailyUsage) return null;

    if (!canUseToday) {
      return (
        <View style={styles.usageLimitContainer}>
          <Text style={styles.usageLimitTitle}>今日の使用制限に達しました</Text>
          <Text style={styles.usageLimitText}>
            ムード・ミラーは1日1回までご利用いただけます。{'\n'}
            明日またお試しください。
          </Text>
        </View>
      );
    }

    return null;
  };

  const renderWelcomeScreen = () => {
    if (isSessionActive || !canUseToday) return null;

    return (
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeTitle}>ムード・ミラー</Text>
        <Text style={styles.welcomeSubtitle}>
          AIがあなたの気持ちに寄り添います
        </Text>
        <Text style={styles.welcomeDescription}>
          今日の気分について3つの質問にお答えいただき、{'\n'}
          あなたの心の状態を分析してアドバイスをお届けします。
        </Text>
        
        {canUseToday ? (
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartSession}
            accessibilityRole="button"
            accessibilityLabel="セッションを開始"
          >
            <Text style={styles.startButtonText}>セッションを開始</Text>
          </TouchableOpacity>
        ) : (
          renderDailyUsageInfo()
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={Colors.primary} />
      
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ムード・ミラー</Text>
        {isSessionActive && (
          <Text style={styles.headerSubtitle}>
            質問 {Math.min(currentQuestionIndex + 1, questions.length)} / {questions.length}
          </Text>
        )}
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ウェルカム画面またはチャット */}
        {!isSessionActive && !isSessionCompleted ? (
          renderWelcomeScreen()
        ) : (
          <>
            {/* チャットメッセージ */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((message) => (
                <ChatBubble
                  key={message.id}
                  message={message}
                  onMoodDataPress={handleMoodDataPress}
                />
              ))}
              
              {isLoading && (
                <View style={[styles.messageContainer, styles.aiMessageContainer]}>
                  <View style={[styles.messageBubble, styles.aiMessageBubble]}>
                    <Text style={styles.loadingText}>考え中...</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* 使用制限情報 */}
            {renderDailyUsageInfo()}

            {/* クイックレスポンス */}
            {renderQuickResponses()}

            {/* 入力エリア */}
            {isSessionActive && currentQuestionIndex < questions.length && (
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="メッセージを入力..."
                  placeholderTextColor={Colors.textSecondary}
                  multiline
                  maxLength={500}
                  accessibilityLabel="メッセージ入力欄"
                  accessibilityHint="回答を入力してください"
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton, 
                    (!inputText.trim() || isLoading) && styles.sendButtonDisabled
                  ]}
                  onPress={handleSendMessage}
                  disabled={!inputText.trim() || isLoading}
                  accessibilityRole="button"
                  accessibilityLabel="メッセージを送信"
                >
                  <Text style={styles.sendButtonText}>送信</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* セッション完了時の表示 */}
            {isSessionCompleted && finalMoodData && (
              <View style={styles.completedContainer}>
                <Text style={styles.completedText}>
                  今日のセッションが完了しました。お話しいただき、ありがとうございました。
                </Text>
              </View>
            )}
          </>
        )}
      </KeyboardAvoidingView>
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
    paddingVertical: Spacing.medium,
    paddingHorizontal: Spacing.large,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FontSizes.h2,
    fontWeight: 'bold',
    color: Colors.surface,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: FontSizes.small,
    color: Colors.surface,
    opacity: 0.8,
  },
  content: {
    flex: 1,
  },
  
  // ウェルカム画面
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.large,
  },
  welcomeTitle: {
    fontSize: FontSizes.h1,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: Spacing.small,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: FontSizes.large,
    color: Colors.textSecondary,
    marginBottom: Spacing.medium,
    textAlign: 'center',
  },
  welcomeDescription: {
    fontSize: FontSizes.medium,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: FontSizes.medium * 1.4,
    marginBottom: Spacing.xlarge,
  },
  startButton: {
    backgroundColor: Colors.primary,
    borderRadius: 25,
    paddingHorizontal: Spacing.xlarge,
    paddingVertical: Spacing.medium,
    minHeight: TouchTargets.buttonHeightLarge,
    justifyContent: 'center',
    elevation: 3,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  startButtonText: {
    color: Colors.surface,
    fontSize: FontSizes.large,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  // チャットメッセージ
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: Spacing.medium,
  },
  messageContainer: {
    marginVertical: Spacing.xs,
    paddingHorizontal: Spacing.medium,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    borderRadius: 20,
    minHeight: TouchTargets.minimum,
    justifyContent: 'center',
  },
  userMessageBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 8,
  },
  aiMessageBubble: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: 8,
  },
  loadingText: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  
  // 使用制限表示
  usageLimitContainer: {
    margin: Spacing.medium,
    padding: Spacing.medium,
    backgroundColor: Colors.warningLight,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  usageLimitTitle: {
    fontSize: FontSizes.large,
    fontWeight: 'bold',
    color: Colors.warning,
    marginBottom: Spacing.xs,
  },
  usageLimitText: {
    fontSize: FontSizes.medium,
    color: Colors.text,
    lineHeight: FontSizes.medium * 1.3,
  },
  
  // クイックレスポンス
  quickResponseContainer: {
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
  },
  quickResponseTitle: {
    fontSize: FontSizes.medium,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.small,
  },
  quickResponseButton: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingVertical: Spacing.small,
    paddingHorizontal: Spacing.medium,
    marginVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.primary,
    minHeight: TouchTargets.minimum,
    justifyContent: 'center',
  },
  quickResponseText: {
    fontSize: FontSizes.medium,
    color: Colors.primary,
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // 入力エリア
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    fontSize: FontSizes.medium,
    maxHeight: 100,
    marginRight: Spacing.small,
    minHeight: TouchTargets.minimum,
    textAlignVertical: 'center',
  },
  sendButton: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: Spacing.large,
    paddingVertical: Spacing.small,
    minHeight: TouchTargets.minimum,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.6,
  },
  sendButtonText: {
    color: Colors.surface,
    fontSize: FontSizes.medium,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  // セッション完了
  completedContainer: {
    margin: Spacing.medium,
    padding: Spacing.medium,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  completedText: {
    fontSize: FontSizes.medium,
    color: Colors.text,
    textAlign: 'center',
    lineHeight: FontSizes.medium * 1.3,
  },
});

export default MoodMirrorScreen; 