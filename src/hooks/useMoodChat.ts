import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { 
  moodAnalysisService, 
  type ChatMessage, 
  type MoodSession, 
  type DailyUsageInfo 
} from '../services/moodAnalysis';
import type { MoodAnalysisResponse } from '../services/openai';

interface UseMoodChatResult {
  // セッション状態
  session: MoodSession | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  
  // 質問関連
  questions: string[];
  currentQuestionIndex: number;
  answers: string[];
  
  // 使用制限関連
  dailyUsage: DailyUsageInfo | null;
  canUseToday: boolean;
  
  // セッション管理
  isSessionActive: boolean;
  isSessionCompleted: boolean;
  finalMoodData: MoodAnalysisResponse | null;
  
  // アクション
  startSession: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  completeSession: () => Promise<void>;
  resetSession: () => void;
  
  // ユーティリティ
  addMessage: (message: ChatMessage) => void;
  retryLastMessage: () => Promise<void>;
}

export const useMoodChat = (): UseMoodChatResult => {
  // 状態管理
  const [session, setSession] = useState<MoodSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  
  const [dailyUsage, setDailyUsage] = useState<DailyUsageInfo | null>(null);
  const [canUseToday, setCanUseToday] = useState(true);
  const [finalMoodData, setFinalMoodData] = useState<MoodAnalysisResponse | null>(null);

  // 計算プロパティ
  const isSessionActive = session !== null && !session.completed;
  const isSessionCompleted = session?.completed || false;

  // 初期化
  useEffect(() => {
    initializeChat();
  }, []);

  const initializeChat = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // 今日の使用状況をチェック
      const usage = await moodAnalysisService.checkDailyUsage();
      setDailyUsage(usage);
      
      const canUse = await moodAnalysisService.canUseToday();
      setCanUseToday(canUse);

      // 今日のセッションがあるかチェック
      const todaySession = await moodAnalysisService.getTodaySession();
      if (todaySession) {
        setSession(todaySession);
        setMessages(todaySession.messages);
        setAnswers(todaySession.answers);
        setCurrentQuestionIndex(todaySession.answers.length);
        if (todaySession.finalMoodData) {
          setFinalMoodData(todaySession.finalMoodData);
        }
      }

      // 今日の質問を取得
      const todayQuestions = await moodAnalysisService.getTodayQuestions();
      setQuestions(todayQuestions);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '初期化に失敗しました';
      setError(errorMessage);
      console.error('Failed to initialize chat:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // セッション開始
  const startSession = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      // 使用可能かチェック
      const canUse = await moodAnalysisService.canUseToday();
      if (!canUse) {
        throw new Error('今日はすでにムード・ミラーを使用しました。明日またお試しください。');
      }

      // 新しいセッションを作成
      const newSession = await moodAnalysisService.startNewSession();
      setSession(newSession);
      
      // 初期メッセージを追加
      const welcomeMessage: ChatMessage = {
        id: moodAnalysisService.generateId(),
        type: 'ai',
        content: 'こんにちは！今日もあなたの気持ちをお聞かせください。3つの簡単な質問をさせていただきますね。',
        timestamp: new Date(),
      };
      
      setMessages([welcomeMessage]);
      setAnswers([]);
      setCurrentQuestionIndex(0);
      setFinalMoodData(null);

      // 最初の質問を送信
      setTimeout(() => {
        sendQuestion(0);
      }, 1500);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'セッションの開始に失敗しました';
      setError(errorMessage);
      Alert.alert('エラー', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 質問を送信
  const sendQuestion = useCallback((questionIndex: number): void => {
    if (questionIndex >= questions.length) {
      return;
    }

    const question = questions[questionIndex];
    const questionMessage: ChatMessage = {
      id: moodAnalysisService.generateId(),
      type: 'ai',
      content: question,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, questionMessage]);
  }, [questions]);

  // メッセージ送信
  const sendMessage = useCallback(async (content: string): Promise<void> => {
    if (!session || !content.trim()) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // ユーザーメッセージを追加
      const userMessage: ChatMessage = {
        id: moodAnalysisService.generateId(),
        type: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);

      // 回答を記録
      const newAnswers = [...answers, content.trim()];
      setAnswers(newAnswers);

      // セッションを更新
      const updatedSession = {
        ...session,
        messages: [...messages, userMessage],
        answers: newAnswers,
      };
      setSession(updatedSession);

      // 次の質問に進むか完了処理
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);

      if (nextIndex >= questions.length) {
        // すべての質問が終了 - ムード分析実行
        await performMoodAnalysis(newAnswers, updatedSession);
      } else {
        // 次の質問を送信
        setTimeout(() => {
          sendQuestion(nextIndex);
        }, 2000);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'メッセージの送信に失敗しました';
      setError(errorMessage);
      Alert.alert('エラー', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [session, answers, currentQuestionIndex, questions, messages, sendQuestion]);

  // ムード分析実行
  const performMoodAnalysis = useCallback(async (
    sessionAnswers: string[], 
    currentSession: MoodSession
  ): Promise<void> => {
    try {
      setIsLoading(true);

      // ムード分析を実行
      const analysisResult = await moodAnalysisService.analyzeMood(sessionAnswers);
      setFinalMoodData(analysisResult);

      // 分析結果メッセージを作成
      const analysisMessage: ChatMessage = {
        id: moodAnalysisService.generateId(),
        type: 'ai',
        content: `分析完了しました！\n\n今日のムード: ${analysisResult.moodLabel}\n強度: ${analysisResult.intensity}/5\n\n${analysisResult.suggestion}`,
        timestamp: new Date(),
        moodData: analysisResult,
      };

      setMessages(prev => [...prev, analysisMessage]);

      // セッションを完了
      const completedSession: MoodSession = {
        ...currentSession,
        messages: [...currentSession.messages, analysisMessage],
        answers: sessionAnswers,
        finalMoodData: analysisResult,
        completed: true,
      };

      setSession(completedSession);

      // セッションを保存
      await moodAnalysisService.saveSession(completedSession);

      // 使用状況を更新
      const newUsage = await moodAnalysisService.checkDailyUsage();
      setDailyUsage(newUsage);
      
      const canUse = await moodAnalysisService.canUseToday();
      setCanUseToday(canUse);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ムード分析に失敗しました';
      setError(errorMessage);
      
      // エラーメッセージを表示
      const errorAIMessage: ChatMessage = {
        id: moodAnalysisService.generateId(),
        type: 'ai',
        content: 'ごめんなさい、分析中にエラーが発生しました。でも、今日もお話しできて嬉しかったです。',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorAIMessage]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // セッション完了
  const completeSession = useCallback(async (): Promise<void> => {
    if (!session || session.completed) {
      return;
    }

    try {
      const completedSession = {
        ...session,
        completed: true,
        messages,
        answers,
        finalMoodData,
      };

      await moodAnalysisService.saveSession(completedSession);
      setSession(completedSession);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'セッションの完了に失敗しました';
      setError(errorMessage);
      console.error('Failed to complete session:', err);
    }
  }, [session, messages, answers, finalMoodData]);

  // セッションリセット
  const resetSession = useCallback((): void => {
    setSession(null);
    setMessages([]);
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setFinalMoodData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  // メッセージ追加（ユーティリティ）
  const addMessage = useCallback((message: ChatMessage): void => {
    setMessages(prev => [...prev, message]);
    
    if (session) {
      setSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, message],
      } : null);
    }
  }, [session]);

  // 最後のメッセージを再試行
  const retryLastMessage = useCallback(async (): Promise<void> => {
    if (answers.length === 0) {
      return;
    }

    const lastAnswer = answers[answers.length - 1];
    
    // 最後のユーザーメッセージとAIレスポンスを削除
    const filteredMessages = messages.filter(msg => 
      !(msg.type === 'user' && msg.content === lastAnswer) &&
      !(msg.type === 'ai' && msg.timestamp > new Date(Date.now() - 10000))
    );
    
    setMessages(filteredMessages);
    setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
    
    // 再送信
    await sendMessage(lastAnswer);
  }, [answers, messages, sendMessage]);

  return {
    // 状態
    session,
    messages,
    isLoading,
    error,
    
    // 質問関連
    questions,
    currentQuestionIndex,
    answers,
    
    // 使用制限関連
    dailyUsage,
    canUseToday,
    
    // セッション管理
    isSessionActive,
    isSessionCompleted,
    finalMoodData,
    
    // アクション
    startSession,
    sendMessage,
    completeSession,
    resetSession,
    
    // ユーティリティ
    addMessage,
    retryLastMessage,
  };
};