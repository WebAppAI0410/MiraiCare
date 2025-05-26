import * as SecureStore from 'expo-secure-store';
import { openAIService, type MoodAnalysisResponse } from './openai';

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  moodData?: MoodAnalysisResponse;
}

export interface MoodSession {
  id: string;
  date: string;
  messages: ChatMessage[];
  answers: string[];
  finalMoodData?: MoodAnalysisResponse;
  completed: boolean;
  createdAt: Date;
}

export interface DailyUsageInfo {
  lastUsedDate: string;
  todayUsageCount: number;
  maxDailyUsage: number;
}

class MoodAnalysisService {
  private readonly STORAGE_KEYS = {
    CHAT_HISTORY: 'mood_chat_history',
    DAILY_USAGE: 'mood_daily_usage',
    LAST_QUESTIONS: 'mood_last_questions',
  };

  private readonly MAX_DAILY_USAGE = 1; // 1日1回制限
  private readonly CHAT_HISTORY_DAYS = 30; // 30日間保存

  // 衝突しにくいIDを生成（タイムスタンプ + ランダム値）
  public generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${timestamp}_${random}`;
  }

  // 今日の使用可能回数をチェック
  async checkDailyUsage(): Promise<DailyUsageInfo> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const usageData = await SecureStore.getItemAsync(this.STORAGE_KEYS.DAILY_USAGE);
      
      if (!usageData) {
        return {
          lastUsedDate: '',
          todayUsageCount: 0,
          maxDailyUsage: this.MAX_DAILY_USAGE,
        };
      }

      let parsed: any;
      try {
        parsed = JSON.parse(usageData);
      } catch (parseError) {
        console.error('Failed to parse usage data:', parseError);
        // パース失敗時はデフォルト値を返す
        return {
          lastUsedDate: '',
          todayUsageCount: 0,
          maxDailyUsage: this.MAX_DAILY_USAGE,
        };
      }
      
      // データ形式の検証
      if (!parsed || typeof parsed !== 'object' || 
          typeof parsed.lastUsedDate !== 'string' ||
          typeof parsed.todayUsageCount !== 'number') {
        console.warn('Invalid usage data format, resetting');
        return {
          lastUsedDate: '',
          todayUsageCount: 0,
          maxDailyUsage: this.MAX_DAILY_USAGE,
        };
      }
      
      // 日付が変わった場合はリセット
      if (parsed.lastUsedDate !== today) {
        return {
          lastUsedDate: today,
          todayUsageCount: 0,
          maxDailyUsage: this.MAX_DAILY_USAGE,
        };
      }

      return {
        lastUsedDate: parsed.lastUsedDate,
        todayUsageCount: parsed.todayUsageCount || 0,
        maxDailyUsage: this.MAX_DAILY_USAGE,
      };
    } catch (error) {
      console.error('Failed to check daily usage:', error);
      return {
        lastUsedDate: '',
        todayUsageCount: 0,
        maxDailyUsage: this.MAX_DAILY_USAGE,
      };
    }
  }

  // 使用回数を記録
  async recordUsage(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const currentUsage = await this.checkDailyUsage();
      
      const newUsageData = {
        lastUsedDate: today,
        todayUsageCount: currentUsage.lastUsedDate === today 
          ? currentUsage.todayUsageCount + 1 
          : 1,
      };

      await SecureStore.setItemAsync(
        this.STORAGE_KEYS.DAILY_USAGE,
        JSON.stringify(newUsageData)
      );
    } catch (error) {
      console.error('Failed to record usage:', error);
    }
  }

  // 今日使用可能かチェック
  async canUseToday(): Promise<boolean> {
    const usage = await this.checkDailyUsage();
    return usage.todayUsageCount < usage.maxDailyUsage;
  }

  // 新しいセッションを開始
  async startNewSession(): Promise<MoodSession> {
    const canUse = await this.canUseToday();
    if (!canUse) {
      throw new Error('今日はすでにムード・ミラーを使用しました。明日またお試しください。');
    }

    const session: MoodSession = {
      id: this.generateId(),
      date: new Date().toISOString().split('T')[0],
      messages: [],
      answers: [],
      completed: false,
      createdAt: new Date(),
    };

    return session;
  }

  // 今日の質問を取得
  async getTodayQuestions(): Promise<string[]> {
    try {
      // OpenAIで動的に質問を生成
      const isConfigured = await openAIService.isConfigured();
      if (!isConfigured) {
        // OpenAI未設定時のフォールバック質問
        return this.getFallbackQuestions();
      }

      // 前回の質問を取得して重複を避ける
      const lastQuestionsData = await SecureStore.getItemAsync(this.STORAGE_KEYS.LAST_QUESTIONS);
      const previousQuestions = lastQuestionsData ? JSON.parse(lastQuestionsData) : null;

      const questions = await openAIService.generateDailyQuestions(previousQuestions);
      
      // 今回の質問を保存
      await SecureStore.setItemAsync(
        this.STORAGE_KEYS.LAST_QUESTIONS,
        JSON.stringify(questions)
      );

      return questions;
    } catch (error) {
      console.error('Failed to get today questions:', error);
      return this.getFallbackQuestions();
    }
  }

  private getFallbackQuestions(): string[] {
    const questionSets = [
      [
        '今日の気分はいかがですか？',
        '最近、心配していることはありますか？',
        '今日、楽しかったことを教えてください',
      ],
      [
        '今朝起きた時の気持ちはどうでしたか？',
        '最近よく眠れていますか？',
        '今日、嬉しく感じたことはありますか？',
      ],
      [
        '今の気持ちを一言で表すとしたら？',
        '最近気になっていることはありますか？',
        '今日の中で一番印象に残ったことは？',
      ],
    ];

    // 日付ベースでランダムに選択（同じ日は同じ質問セット）
    const today = new Date().toISOString().split('T')[0];
    const dateSum = today.split('-').reduce((sum, part) => sum + parseInt(part), 0);
    const index = dateSum % questionSets.length;
    
    return questionSets[index];
  }

  // ムード分析を実行
  async analyzeMood(answers: string[]): Promise<MoodAnalysisResponse> {
    try {
      const isConfigured = await openAIService.isConfigured();
      if (!isConfigured) {
        // OpenAI未設定時のフォールバック分析
        return this.getFallbackAnalysis(answers);
      }

      // 過去のムードデータを取得
      const previousMoodData = await this.getRecentMoodHistory(7);

      const result = await openAIService.analyzeMood({
        answers,
        previousMoodData,
      });

      return result;
    } catch (error) {
      console.error('Failed to analyze mood:', error);
      return this.getFallbackAnalysis(answers);
    }
  }

  private getFallbackAnalysis(answers: string[]): MoodAnalysisResponse {
    // 簡単な感情分析（キーワードベース）
    const positiveKeywords = ['嬉しい', '楽しい', '良い', '元気', '幸せ', '満足'];
    const negativeKeywords = ['悲しい', '不安', '心配', '疲れ', 'つらい', '憂鬱'];
    
    const answersText = answers.join(' ').toLowerCase();
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveKeywords.forEach(keyword => {
      if (answersText.includes(keyword)) positiveCount++;
    });
    
    negativeKeywords.forEach(keyword => {
      if (answersText.includes(keyword)) negativeCount++;
    });

    let moodLabel = '穏やか';
    let intensity = 3;
    let suggestion = '今日も一日お疲れさまでした。';
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    if (positiveCount > negativeCount) {
      moodLabel = '元気';
      intensity = 4;
      suggestion = '今日は良い気分でお過ごしのようですね。この調子で前向きに過ごしてください。';
    } else if (negativeCount > positiveCount) {
      moodLabel = '少し不安';
      intensity = 2;
      suggestion = '少し心配事がおありのようですね。深呼吸をして、リラックスする時間を作ってください。';
      riskLevel = negativeCount > 2 ? 'medium' : 'low';
    }

    return {
      moodLabel,
      intensity,
      suggestion,
      keywords: [],
      riskLevel,
    };
  }

  // セッションを保存
  async saveSession(session: MoodSession): Promise<void> {
    try {
      // 使用回数を記録
      await this.recordUsage();

      // チャット履歴を取得
      const historyData = await SecureStore.getItemAsync(this.STORAGE_KEYS.CHAT_HISTORY);
      const history: MoodSession[] = historyData ? JSON.parse(historyData) : [];

      // 新しいセッションを追加
      history.push(session);

      // 古いデータを削除（30日以前）
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.CHAT_HISTORY_DAYS);
      
      const filteredHistory = history.filter(s => 
        new Date(s.createdAt) > cutoffDate
      );

      // 暗号化して保存
      await SecureStore.setItemAsync(
        this.STORAGE_KEYS.CHAT_HISTORY,
        JSON.stringify(filteredHistory)
      );
    } catch (error) {
      console.error('Failed to save session:', error);
      throw new Error('セッションの保存に失敗しました。');
    }
  }

  // チャット履歴を取得
  async getChatHistory(days: number = 7): Promise<MoodSession[]> {
    try {
      const historyData = await SecureStore.getItemAsync(this.STORAGE_KEYS.CHAT_HISTORY);
      if (!historyData) return [];

      const history: MoodSession[] = JSON.parse(historyData);
      
      // 指定日数分のデータを返す
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      return history
        .filter(session => new Date(session.createdAt) > cutoffDate)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Failed to get chat history:', error);
      return [];
    }
  }

  // 最近のムードデータを取得
  async getRecentMoodHistory(days: number): Promise<Array<{
    moodLabel: string;
    intensity: number;
    date: string;
  }>> {
    try {
      const sessions = await this.getChatHistory(days);
      
      return sessions
        .filter(session => session.completed && session.finalMoodData)
        .map(session => ({
          moodLabel: session.finalMoodData!.moodLabel,
          intensity: session.finalMoodData!.intensity,
          date: session.date,
        }));
    } catch (error) {
      console.error('Failed to get recent mood history:', error);
      return [];
    }
  }

  // 今日のセッション履歴を取得
  async getTodaySession(): Promise<MoodSession | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const sessions = await this.getChatHistory(1);
      
      return sessions.find(session => session.date === today) || null;
    } catch (error) {
      console.error('Failed to get today session:', error);
      return null;
    }
  }

  // 統計データを取得
  async getMoodStats(days: number = 30): Promise<{
    averageIntensity: number;
    mostCommonMood: string;
    totalSessions: number;
    moodTrend: Array<{ date: string; intensity: number; mood: string }>;
  }> {
    try {
      const sessions = await this.getChatHistory(days);
      const completedSessions = sessions.filter(s => s.completed && s.finalMoodData);

      if (completedSessions.length === 0) {
        return {
          averageIntensity: 0,
          mostCommonMood: '',
          totalSessions: 0,
          moodTrend: [],
        };
      }

      // 平均強度を計算
      const averageIntensity = completedSessions.reduce(
        (sum, session) => sum + (session.finalMoodData?.intensity || 0), 0
      ) / completedSessions.length;

      // 最も多い気分を計算
      const moodCounts: Record<string, number> = {};
      completedSessions.forEach(session => {
        const mood = session.finalMoodData?.moodLabel || '';
        moodCounts[mood] = (moodCounts[mood] || 0) + 1;
      });

      const mostCommonMood = Object.entries(moodCounts)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

      // トレンドデータ
      const moodTrend = completedSessions.map(session => ({
        date: session.date,
        intensity: session.finalMoodData?.intensity || 0,
        mood: session.finalMoodData?.moodLabel || '',
      })).reverse(); // 古い順にソート

      return {
        averageIntensity: Math.round(averageIntensity * 10) / 10,
        mostCommonMood,
        totalSessions: completedSessions.length,
        moodTrend,
      };
    } catch (error) {
      console.error('Failed to get mood stats:', error);
      return {
        averageIntensity: 0,
        mostCommonMood: '',
        totalSessions: 0,
        moodTrend: [],
      };
    }
  }
}

export const moodAnalysisService = new MoodAnalysisService();