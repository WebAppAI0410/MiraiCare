import React, { useState, useRef, useEffect } from 'react';
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
import { Colors } from '../types';
import i18n from '../config/i18n';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  moodData?: {
    mood_label: string;
    intensity: number;
    suggestion: string;
  };
}

interface MoodQuestion {
  id: string;
  question: string;
  type: 'scale' | 'choice' | 'text';
  options?: string[];
}

const MoodMirrorScreen: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [sessionAnswers, setSessionAnswers] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  // 今日の3つの質問（ダミーデータ - 後でGPT-4oから動的生成）
  const todayQuestions: MoodQuestion[] = [
    {
      id: '1',
      question: '今日の気分はいかがですか？',
      type: 'scale',
    },
    {
      id: '2', 
      question: '最近、心配していることはありますか？',
      type: 'choice',
      options: ['特にない', '健康について', '家族について', 'お金について', 'その他'],
    },
    {
      id: '3',
      question: '今日、楽しかったことを教えてください',
      type: 'text',
    },
  ];

  useEffect(() => {
    // 初回のあいさつメッセージ
    const initialMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'ai',
      content: 'こんにちは！今日もあなたの気持ちをお聞かせください。3つの簡単な質問をさせていただきますね。',
      timestamp: new Date(),
    };
    setMessages([initialMessage]);
    
    // 最初の質問を送信
    setTimeout(() => {
      sendQuestion(0);
    }, 1500);
  }, []);

  const sendQuestion = (questionIndex: number) => {
    if (questionIndex >= todayQuestions.length) {
      processFinalAnswer();
      return;
    }

    const question = todayQuestions[questionIndex];
    const questionMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'ai',
      content: question.question,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, questionMessage]);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    // ユーザーのメッセージを追加
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    
    // 回答を記録
    const newAnswers = [...sessionAnswers, inputText.trim()];
    setSessionAnswers(newAnswers);
    
    setInputText('');
    setIsLoading(true);

    try {
      // 次の質問へ進む
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);

      // 短い待機後に次の質問を送信
      setTimeout(() => {
        setIsLoading(false);
        sendQuestion(nextIndex);
      }, 2000);

    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
      Alert.alert('エラー', 'メッセージの送信に失敗しました。もう一度お試しください。');
    }
  };

  const processFinalAnswer = async () => {
    setIsLoading(true);
    
    try {
      // TODO: GPT-4o APIを呼び出して感情分析と提案を取得
      const moodAnalysis = await analyzeMoodWithGPT(sessionAnswers);
      
      const finalMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: `分析完了しました！\n\n今日のムード: ${moodAnalysis.mood_label}\n強度: ${moodAnalysis.intensity}/5\n\n${moodAnalysis.suggestion}`,
        timestamp: new Date(),
        moodData: moodAnalysis,
      };

      setMessages(prev => [...prev, finalMessage]);
      
      // TODO: Supabaseにムードデータを保存
      // await saveMoodData(moodAnalysis);
      
    } catch (error) {
      console.error('Error analyzing mood:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'ai',
        content: 'ごめんなさい、分析中にエラーが発生しました。でも、今日もお話しできて嬉しかったです。',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
    
    setIsLoading(false);
  };

  const analyzeMoodWithGPT = async (answers: string[]): Promise<{
    mood_label: string;
    intensity: number;
    suggestion: string;
  }> => {
    // TODO: 実際のGPT-4o API呼び出し
    // 現在はダミーデータを返す
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          mood_label: '穏やか',
          intensity: 3,
          suggestion: '今日は穏やかな気持ちでお過ごしのようですね。このまま落ち着いた時間を大切にしてください。深呼吸をしたり、好きな音楽を聴いたりするのも良いでしょう。',
        });
      }, 2000);
    });
  };

  const handleQuickResponse = (response: string) => {
    setInputText(response);
  };

  const renderMessage = (message: ChatMessage) => {
    const isUser = message.type === 'user';
    
    return (
      <View key={message.id} style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.aiMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isUser ? styles.userMessageBubble : styles.aiMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.aiMessageText
          ]}>
            {message.content}
          </Text>
          <Text style={[
            styles.messageTime,
            isUser ? styles.userMessageTime : styles.aiMessageTime
          ]}>
            {message.timestamp.toLocaleTimeString('ja-JP', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
      </View>
    );
  };

  const renderQuickResponses = () => {
    const currentQuestion = todayQuestions[currentQuestionIndex];
    
    if (!currentQuestion || currentQuestionIndex >= todayQuestions.length) {
      return null;
    }

    if (currentQuestion.type === 'scale') {
      return (
        <View style={styles.quickResponseContainer}>
          {['とても良い', '良い', '普通', '少し悪い', '悪い'].map((response, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickResponseButton}
              onPress={() => handleQuickResponse(response)}
            >
              <Text style={styles.quickResponseText}>{response}</Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    if (currentQuestion.type === 'choice' && currentQuestion.options) {
      return (
        <View style={styles.quickResponseContainer}>
          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickResponseButton}
              onPress={() => handleQuickResponse(option)}
            >
              <Text style={styles.quickResponseText}>{option}</Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" backgroundColor={Colors.primary} />
      
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ムード・ミラー</Text>
        <Text style={styles.headerSubtitle}>
          質問 {Math.min(currentQuestionIndex + 1, todayQuestions.length)} / {todayQuestions.length}
        </Text>
      </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* チャットメッセージ */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(renderMessage)}
          
          {isLoading && (
            <View style={[styles.messageContainer, styles.aiMessageContainer]}>
              <View style={[styles.messageBubble, styles.aiMessageBubble]}>
                <Text style={styles.loadingText}>考え中...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* クイックレスポンス */}
        {renderQuickResponses()}

        {/* 入力エリア */}
        {currentQuestionIndex < todayQuestions.length && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="メッセージを入力..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              <Text style={styles.sendButtonText}>送信</Text>
            </TouchableOpacity>
          </View>
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
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.surface,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.surface,
    opacity: 0.8,
  },
  content: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  aiMessageContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userMessageBubble: {
    backgroundColor: Colors.primary,
  },
  aiMessageBubble: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: Colors.surface,
  },
  aiMessageText: {
    color: Colors.text,
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  aiMessageTime: {
    color: Colors.textSecondary,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  quickResponseContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  quickResponseButton: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  quickResponseText: {
    fontSize: 16,
    color: Colors.primary,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 48,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.6,
  },
  sendButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MoodMirrorScreen; 