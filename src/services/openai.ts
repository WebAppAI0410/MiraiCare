import OpenAI from 'openai';
import * as SecureStore from 'expo-secure-store';

interface OpenAIConfig {
  apiKey: string;
  model: string;
}

interface MoodAnalysisRequest {
  answers: string[];
  previousMoodData?: {
    moodLabel: string;
    intensity: number;
    date: string;
  }[];
}

interface MoodAnalysisResponse {
  moodLabel: string;
  intensity: number;
  suggestion: string;
  keywords: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

class OpenAIService {
  private client: OpenAI | null = null;
  private config: OpenAIConfig | null = null;

  constructor() {
    this.initializeClient();
  }

  private async initializeClient(): Promise<void> {
    try {
      // 本番環境では環境変数から取得
      // 開発環境では設定から取得
      const apiKey = await this.getApiKey();
      
      if (!apiKey) {
        console.warn('OpenAI API key not found');
        return;
      }

      this.config = {
        apiKey,
        model: 'gpt-4o',
      };

      this.client = new OpenAI({
        apiKey: this.config.apiKey,
      });
    } catch (error) {
      console.error('Failed to initialize OpenAI client:', error);
    }
  }

  private async getApiKey(): Promise<string | null> {
    try {
      // セキュアストレージからAPIキーを取得
      const apiKey = await SecureStore.getItemAsync('openai_api_key', {
        requireAuthentication: false, // 生体認証要求なし（頻繁アクセス対応）
      });
      
      // 開発環境用のデフォルト値（実際の運用では設定画面で入力）
      if (!apiKey || apiKey.trim() === '') {
        console.warn('OpenAI API key not configured. Please set up in settings.');
        return null;
      }
      
      // APIキー形式の基本的な検証
      if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
        console.error('Invalid OpenAI API key format');
        return null;
      }
      
      return apiKey;
    } catch (error) {
      console.error('Failed to get API key from secure storage:', error);
      // セキュリティ上、詳細なエラーはログに記録するが、ユーザーには一般的なメッセージを表示
      throw new Error('設定の読み込みに失敗しました。アプリを再起動してください。');
    }
  }

  // APIキーを設定（設定画面から呼び出し）
  async setApiKey(apiKey: string): Promise<void> {
    try {
      await SecureStore.setItemAsync('openai_api_key', apiKey);
      await this.initializeClient();
    } catch (error) {
      console.error('Failed to set API key:', error);
      throw error;
    }
  }

  // APIキーが設定されているかチェック
  async isConfigured(): Promise<boolean> {
    const apiKey = await this.getApiKey();
    return !!apiKey;
  }

  // ムード分析を実行
  async analyzeMood(request: MoodAnalysisRequest): Promise<MoodAnalysisResponse> {
    if (!this.client) {
      throw new Error('OpenAI client not initialized');
    }

    try {
      const systemPrompt = this.buildSystemPrompt();
      const userPrompt = this.buildUserPrompt(request);

      const completion = await this.client.chat.completions.create({
        model: this.config!.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      const responseContent = completion.choices[0]?.message?.content;
      if (!responseContent) {
        throw new Error('No response from OpenAI');
      }

      return this.parseResponse(responseContent);
    } catch (error) {
      console.error('Error analyzing mood with OpenAI:', error);
      throw this.handleError(error);
    }
  }

  private buildSystemPrompt(): string {
    return `あなたは高齢者向けヘルスケアアプリの専門的な感情分析AIです。

役割:
- 高齢者の感情状態を優しく分析
- 適切な精神的サポートとアドバイスを提供
- メンタルヘルスリスクを評価

応答形式:
以下のJSON形式で応答してください:
{
  "moodLabel": "感情ラベル（例：穏やか、元気、少し不安、憂鬱など）",
  "intensity": 1-5の数値（1=とても低い、5=とても高い）,
  "suggestion": "具体的で実践可能なアドバイス（150文字以内）",
  "keywords": ["キーワード1", "キーワード2"],
  "riskLevel": "low/medium/high"
}

注意事項:
- 高齢者に適した優しい言葉遣い
- 具体的で実践しやすいアドバイス
- 医学的診断は避ける
- ポジティブな視点を重視
- リスクレベルは慎重に判断`;
  }

  private buildUserPrompt(request: MoodAnalysisRequest): string {
    const answersText = request.answers.map((answer, index) => 
      `回答${index + 1}: ${answer}`
    ).join('\n');

    let prompt = `今日の気分に関する回答:\n${answersText}`;

    // 過去のデータがある場合は含める
    if (request.previousMoodData && request.previousMoodData.length > 0) {
      const historyText = request.previousMoodData
        .slice(-7) // 過去7日分
        .map(data => `${data.date}: ${data.moodLabel} (強度: ${data.intensity})`)
        .join('\n');
      
      prompt += `\n\n過去の気分データ:\n${historyText}`;
    }

    prompt += '\n\nこの情報を基に、感情状態を分析してJSON形式で応答してください。';

    return prompt;
  }

  private parseResponse(response: string): MoodAnalysisResponse {
    try {
      // JSONブロックを抽出
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid response format');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // バリデーション
      if (!parsed.moodLabel || typeof parsed.intensity !== 'number') {
        throw new Error('Missing required fields');
      }

      return {
        moodLabel: parsed.moodLabel,
        intensity: Math.max(1, Math.min(5, parsed.intensity)),
        suggestion: parsed.suggestion || '今日も一日お疲れさまでした。',
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
        riskLevel: ['low', 'medium', 'high'].includes(parsed.riskLevel) 
          ? parsed.riskLevel 
          : 'low',
      };
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      
      // フォールバック応答
      return {
        moodLabel: '穏やか',
        intensity: 3,
        suggestion: 'お話をお聞かせいただき、ありがとうございました。今日も一日お疲れさまでした。',
        keywords: [],
        riskLevel: 'low',
      };
    }
  }

  private handleError(error: any): Error {
    if (error?.error?.type === 'insufficient_quota') {
      return new Error('API利用制限に達しました。しばらく待ってから再度お試しください。');
    }
    
    if (error?.error?.type === 'invalid_api_key') {
      return new Error('APIキーが無効です。設定を確認してください。');
    }
    
    if (error?.error?.type === 'rate_limit_exceeded') {
      return new Error('リクエストが多すぎます。少し待ってから再度お試しください。');
    }

    return new Error('ムード分析中にエラーが発生しました。');
  }

  // 今日の質問を生成
  async generateDailyQuestions(previousQuestions?: string[]): Promise<string[]> {
    if (!this.client) {
      // フォールバック質問
      return [
        '今日の気分はいかがですか？',
        '最近、心配していることはありますか？',
        '今日、楽しかったことを教えてください'
      ];
    }

    try {
      const systemPrompt = `高齢者向けの気分チェック質問を3つ生成してください。

要件:
- 優しく親しみやすい表現
- 感情状態を把握できる内容
- 高齢者が答えやすい質問
- 前回と異なるバリエーション

形式: 質問1\\n質問2\\n質問3`;

      const userPrompt = previousQuestions 
        ? `前回の質問: ${previousQuestions.join(', ')}\n\n新しい質問を生成してください。`
        : '今日の気分チェック用の質問を生成してください。';

      const completion = await this.client.chat.completions.create({
        model: this.config!.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 200,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      return response.split('\n').filter(q => q.trim().length > 0).slice(0, 3);
    } catch (error) {
      console.error('Failed to generate questions:', error);
      
      // フォールバック質問
      return [
        '今日の気分はいかがですか？',
        '最近、心配していることはありますか？',
        '今日、楽しかったことを教えてください'
      ];
    }
  }
}

export const openAIService = new OpenAIService();
export type { MoodAnalysisRequest, MoodAnalysisResponse };