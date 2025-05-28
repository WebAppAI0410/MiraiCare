/**
 * ムード分析サービス（モック実装）
 * 
 * 将来的にはGPT-4 APIと連携
 */

interface MoodAnalysisResult {
  mood_label: string;
  intensity: number;
  suggestion: string;
}

// 簡単なキーワードベースの分析（モック）
export async function analyzeMoodWithGPT(answers: string[]): Promise<MoodAnalysisResult> {
  // 擬似的な遅延
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 回答を結合してテキスト分析
  const combinedText = answers.join(' ').toLowerCase();
  
  // キーワードベースの簡易分析
  let mood = 'neutral';
  let intensity = 3;
  let suggestion = '';
  
  // ポジティブキーワード
  const positiveKeywords = ['良い', 'いい', '元気', '楽しい', '嬉しい', 'happy', 'good', '幸せ'];
  const negativeKeywords = ['悪い', '疲れ', '辛い', '悲しい', '不安', 'bad', 'tired', '心配'];
  
  const positiveCount = positiveKeywords.filter(keyword => combinedText.includes(keyword)).length;
  const negativeCount = negativeKeywords.filter(keyword => combinedText.includes(keyword)).length;
  
  if (positiveCount > negativeCount) {
    mood = '良好';
    intensity = Math.min(5, 3 + positiveCount);
    suggestion = '今日は良い一日のようですね！この調子を保つために、適度な運動と十分な睡眠を心がけましょう。';
  } else if (negativeCount > positiveCount) {
    mood = '注意';
    intensity = Math.max(1, 3 - negativeCount);
    suggestion = 'お疲れのようですね。今日は早めに休んで、リラックスする時間を作りましょう。必要であれば、誰かに相談することも大切です。';
  } else {
    mood = '普通';
    intensity = 3;
    suggestion = '安定した一日でしたね。健康的な生活リズムを維持することで、より良い毎日を送ることができます。';
  }
  
  return {
    mood_label: mood,
    intensity,
    suggestion
  };
}