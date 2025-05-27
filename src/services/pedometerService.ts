import * as Pedometer from 'expo-sensors/build/Pedometer';
import { Alert } from 'react-native';
import { StepData, VitalData } from '../types';
import { firestoreService } from './firestoreService';

class PedometerService {
  private watchSubscription: Pedometer.Subscription | null = null;

  /**
   * 歩数計が利用可能かチェック
   */
  async isAvailable(): Promise<boolean> {
    try {
      return await Pedometer.isAvailableAsync();
    } catch (error) {
      console.error('歩数計の利用可能チェックエラー:', error);
      return false;
    }
  }

  /**
   * パーミッションをリクエスト
   */
  async requestPermissions(): Promise<{ granted: boolean; status: string }> {
    try {
      const result = await Pedometer.requestPermissionsAsync();
      return {
        granted: result.granted,
        status: result.status,
      };
    } catch (error) {
      console.error('パーミッションリクエストエラー:', error);
      return {
        granted: false,
        status: 'denied',
      };
    }
  }

  /**
   * 今日の歩数を取得
   */
  async getTodaySteps(): Promise<number> {
    try {
      const end = new Date();
      const start = new Date();
      start.setHours(0, 0, 0, 0); // 今日の0時

      const result = await Pedometer.getStepCountAsync(start, end);
      return result.steps;
    } catch (error) {
      console.error('歩数取得エラー:', error);
      return 0;
    }
  }

  /**
   * 過去7日間の歩数履歴を取得
   */
  async getWeeklyHistory(): Promise<StepData[]> {
    const history: StepData[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      try {
        const result = await Pedometer.getStepCountAsync(start, end);
        history.push({
          date: this.formatDate(date),
          steps: result.steps,
        });
      } catch (error) {
        console.error(`${this.formatDate(date)}の歩数取得エラー:`, error);
        history.push({
          date: this.formatDate(date),
          steps: 0,
        });
      }
    }

    return history;
  }

  /**
   * リアルタイム歩数監視を開始
   */
  async startWatching(
    callback: (result: { steps: number }) => void
  ): Promise<Pedometer.Subscription> {
    // 既存の監視を停止
    if (this.watchSubscription) {
      this.watchSubscription.remove();
    }

    this.watchSubscription = Pedometer.watchStepCount(callback);
    return this.watchSubscription;
  }

  /**
   * 歩数監視を停止
   */
  async stopWatching(subscription: Pedometer.Subscription): Promise<void> {
    subscription.remove();
    if (this.watchSubscription === subscription) {
      this.watchSubscription = null;
    }
  }

  /**
   * 今日の歩数をFirestoreに保存
   */
  async saveTodaySteps(userId: string, steps: number): Promise<void> {
    const vitalData: Partial<VitalData> = {
      type: 'steps',
      value: steps,
      unit: '歩',
      measuredAt: new Date().toISOString(),
    };

    await firestoreService.saveVitalData(userId, vitalData);
  }

  /**
   * 歩数目標を設定
   */
  async setStepTarget(userId: string, target: number): Promise<void> {
    await firestoreService.updateUserSettings(userId, {
      stepTarget: target,
    });
  }

  /**
   * 歩数達成率を計算
   */
  calculateAchievementRate(current: number, target: number): number {
    if (target === 0) return 0;
    const rate = (current / target) * 100;
    return Math.min(rate, 100);
  }

  /**
   * 歩数から推定距離を計算（km）
   */
  calculateDistance(steps: number, strideLength: number = 0.7): number {
    return (steps * strideLength) / 1000;
  }

  /**
   * 歩数から推定カロリーを計算（kcal）
   */
  calculateCalories(steps: number, weight: number = 60): number {
    // 簡易計算: 1歩あたり約0.05kcal × 体重補正
    const caloriesPerStep = 0.05 * (weight / 60);
    return Math.round(steps * caloriesPerStep * 10) / 10;
  }

  /**
   * 週間平均歩数を計算
   */
  calculateWeeklyAverage(weeklyData: StepData[]): number {
    if (weeklyData.length === 0) return 0;
    
    const total = weeklyData.reduce((sum, day) => sum + day.steps, 0);
    return Math.floor(total / weeklyData.length);
  }

  /**
   * 目標達成アラートを表示
   */
  async showAchievementAlert(): Promise<void> {
    Alert.alert(
      '🎉 目標達成！',
      '今日の歩数目標を達成しました！素晴らしい！',
      [{ text: 'OK' }]
    );
  }

  /**
   * 低活動警告を表示
   */
  async showLowActivityWarning(): Promise<void> {
    Alert.alert(
      '⚠️ 活動量が少ないです',
      '健康のために、少し歩いてみませんか？',
      [
        { text: '後で', style: 'cancel' },
        { text: '歩く', onPress: () => console.log('ユーザーが歩くことを選択') }
      ]
    );
  }

  /**
   * 日付をYYYY-MM-DD形式にフォーマット
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

export const pedometerService = new PedometerService();