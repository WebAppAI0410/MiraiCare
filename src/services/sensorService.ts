// TDD Phase 2: Expo Sensorsセンサーサービス実装
// GREEN フェーズ: テストを通すための実装

import {
  Pedometer,
  Accelerometer,
  Gyroscope,
  Magnetometer,
  AccelerometerMeasurement,
} from 'expo-sensors';
import type {
  SensorResult,
  SensorAvailability,
  StepCountData,
  VitalData,
} from '../types/userData';

/**
 * Expo Sensorsサービス
 * デバイスセンサーからデータを取得・監視する機能を提供
 */
class SensorService {
  private stepCountSubscription: any = null;
  private accelerometerSubscription: any = null;

  /**
   * センサー可用性チェック
   */

  // 全センサーの可用性確認
  async checkSensorAvailability(): Promise<SensorAvailability> {
    try {
      const [pedometer, accelerometer, gyroscope, magnetometer] = await Promise.all([
        Pedometer.isAvailableAsync(),
        Accelerometer.isAvailableAsync(),
        Gyroscope.isAvailableAsync(),
        Magnetometer.isAvailableAsync(),
      ]);

      return {
        pedometer,
        accelerometer,
        gyroscope,
        magnetometer,
      };
    } catch (error) {
      console.error('センサー可用性チェックに失敗:', error);
      // エラー時は全てfalseを返す
      return {
        pedometer: false,
        accelerometer: false,
        gyroscope: false,
        magnetometer: false,
      };
    }
  }

  // 歩数計センサーの可用性確認
  async isPedometerAvailable(): Promise<boolean> {
    try {
      return await Pedometer.isAvailableAsync();
    } catch (error) {
      console.error('歩数計可用性チェックに失敗:', error);
      return false;
    }
  }

  /**
   * 歩数計操作
   */

  // 期間内歩数データ取得
  async getStepCount(startDate: Date, endDate: Date): Promise<SensorResult<{ steps: number }>> {
    try {
      const isAvailable = await this.isPedometerAvailable();
      if (!isAvailable) {
        return {
          data: null,
          error: '歩数計が利用できません',
          timestamp: new Date(),
        };
      }

      const result = await Pedometer.getStepCountAsync(startDate, endDate);
      
      return {
        data: { steps: result.steps },
        error: null,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('歩数データ取得に失敗:', error);
      return {
        data: null,
        error: '歩数データの取得に失敗しました',
        timestamp: new Date(),
      };
    }
  }

  // 現在の歩数取得（今日の0時から現在まで）
  async getCurrentStepCount(): Promise<SensorResult<{ steps: number }>> {
    try {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      return await this.getStepCount(startOfDay, now);
    } catch (error) {
      console.error('現在の歩数取得に失敗:', error);
      return {
        data: null,
        error: '現在の歩数取得に失敗しました',
        timestamp: new Date(),
      };
    }
  }

  // 今日の歩数取得
  async getTodayStepCount(): Promise<SensorResult<StepCountData>> {
    try {
      const currentStepResult = await this.getCurrentStepCount();
      
      if (currentStepResult.error || !currentStepResult.data) {
        return {
          data: null,
          error: currentStepResult.error,
          timestamp: new Date(),
        };
      }

      const today = new Date();
      const dateString = this.formatDateString(today);
      
      const stepCountData: StepCountData = {
        userId: '', // ユーザーIDは後で設定
        steps: currentStepResult.data.steps,
        date: dateString,
        startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
        endTime: today,
        timestamp: Date.now(),
      };

      return {
        data: stepCountData,
        error: null,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('今日の歩数取得に失敗:', error);
      return {
        data: null,
        error: '今日の歩数取得に失敗しました',
        timestamp: new Date(),
      };
    }
  }

  // 週間歩数データ取得
  async getWeeklyStepCount(): Promise<SensorResult<StepCountData[]>> {
    try {
      const today = new Date();
      const weekData: StepCountData[] = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
        
        const stepResult = await this.getStepCount(startOfDay, endOfDay);
        
        if (stepResult.data) {
          weekData.push({
            userId: '', // ユーザーIDは後で設定
            steps: stepResult.data.steps,
            date: this.formatDateString(date),
            startTime: startOfDay,
            endTime: endOfDay,
            timestamp: Date.now(),
          });
        }
      }

      return {
        data: weekData,
        error: null,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('週間歩数データ取得に失敗:', error);
      return {
        data: null,
        error: '週間歩数データの取得に失敗しました',
        timestamp: new Date(),
      };
    }
  }

  /**
   * リアルタイム歩数監視
   */

  // 歩数監視開始
  startStepCountMonitoring(callback: (data: { steps: number; timestamp: Date }) => void): { remove: () => void } {
    try {
      this.stopStepCountMonitoring(); // 既存の監視を停止

      this.stepCountSubscription = Pedometer.watchStepCount((result) => {
        callback({
          steps: result.steps,
          timestamp: new Date(),
        });
      });

      return {
        remove: () => this.stopStepCountMonitoring(),
      };
    } catch (error) {
      console.error('歩数監視開始に失敗:', error);
      return {
        remove: () => {},
      };
    }
  }

  // 歩数監視停止
  stopStepCountMonitoring(): void {
    try {
      if (this.stepCountSubscription) {
        this.stepCountSubscription.remove();
        this.stepCountSubscription = null;
      }
    } catch (error) {
      console.error('歩数監視停止に失敗:', error);
    }
  }

  /**
   * 権限管理
   */

  // センサー権限要求
  async requestSensorPermissions(): Promise<{ granted: boolean; status: string }> {
    try {
      const result = await Pedometer.requestPermissionsAsync();
      
      return {
        granted: result.granted,
        status: result.status,
      };
    } catch (error) {
      console.error('センサー権限要求に失敗:', error);
      return {
        granted: false,
        status: 'error',
      };
    }
  }

  /**
   * 加速度センサー
   */

  // 加速度センサー監視開始
  startAccelerometerMonitoring(
    callback: (data: AccelerometerMeasurement) => void
  ): { remove: () => void } {
    try {
      this.stopAccelerometerMonitoring(); // 既存の監視を停止

      this.accelerometerSubscription = Accelerometer.addListener(callback);

      return {
        remove: () => this.stopAccelerometerMonitoring(),
      };
    } catch (error) {
      console.error('加速度センサー監視開始に失敗:', error);
      return {
        remove: () => {},
      };
    }
  }

  // 加速度センサー監視停止
  stopAccelerometerMonitoring(): void {
    try {
      if (this.accelerometerSubscription) {
        this.accelerometerSubscription.remove();
        this.accelerometerSubscription = null;
      }
    } catch (error) {
      console.error('加速度センサー監視停止に失敗:', error);
    }
  }

  // 加速度センサー更新間隔設定
  setAccelerometerInterval(intervalMs: number): void {
    try {
      Accelerometer.setUpdateInterval(intervalMs);
    } catch (error) {
      console.error('加速度センサー更新間隔設定に失敗:', error);
    }
  }

  /**
   * センサーデータ統合
   */

  // 歩数データオブジェクト作成
  createStepCountData(userId: string, steps: number, date: string): StepCountData {
    const dateObj = new Date(date);
    const startTime = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    const endTime = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), 23, 59, 59);

    return {
      userId,
      steps,
      date,
      startTime,
      endTime,
      timestamp: Date.now(),
    };
  }

  // センサーデータのフォーマット
  formatSensorData(rawData: any, userId: string): VitalData {
    return {
      userId,
      type: 'steps',
      value: rawData.steps || 0,
      unit: 'steps',
      source: 'sensor',
      measuredAt: new Date(),
      createdAt: new Date(),
    };
  }

  /**
   * ユーティリティメソッド
   */

  // 日付文字列フォーマット（YYYY-MM-DD）
  private formatDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * センサーサービスの停止（リソース解放）
   */
  destroy(): void {
    this.stopStepCountMonitoring();
    this.stopAccelerometerMonitoring();
    
    // 他のセンサーも停止
    try {
      Accelerometer.removeAllListeners();
      Gyroscope.removeAllListeners();
      Magnetometer.removeAllListeners();
    } catch (error) {
      console.error('センサーリスナー削除に失敗:', error);
    }
  }
}

// シングルトンインスタンスをエクスポート
export const sensorService = new SensorService();