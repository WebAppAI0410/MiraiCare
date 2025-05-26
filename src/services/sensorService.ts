// センサーサービス（TDD Phase 2）

import { Pedometer } from 'expo-sensors';
import { StepCountData, SensorError } from '../types/userData';

// サービス応答の型定義
export interface SensorServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: SensorError;
}

// トラッキングサブスクリプションの型定義
export interface StepCountSubscription {
  remove: () => void;
}

/**
 * 歩数トラッキングを開始
 * @param callback 歩数データのコールバック関数
 * @returns トラッキング開始結果とサブスクリプション
 */
export const startStepCountTracking = async (
  callback: (data: StepCountData) => void
): Promise<SensorServiceResponse<StepCountSubscription>> => {
  try {
    // センサーの利用可能性をチェック
    const isAvailable = await Pedometer.isAvailableAsync();
    if (!isAvailable) {
      return {
        success: false,
        error: {
          code: 'SENSOR_UNAVAILABLE',
          message: '歩数センサーが利用できません。デバイスがセンサーをサポートしていない可能性があります。',
          timestamp: Date.now(),
        },
      };
    }

    // 権限を要求
    const { status } = await Pedometer.requestPermissionsAsync();
    if (status !== 'granted') {
      return {
        success: false,
        error: {
          code: 'PERMISSION_DENIED',
          message: '歩数センサーの権限が必要です。設定から権限を許可してください。',
          timestamp: Date.now(),
        },
      };
    }

    // 歩数トラッキングを開始
    const subscription = Pedometer.watchStepCount((result) => {
      const stepData: StepCountData = {
        steps: result.steps,
        timestamp: Date.now(),
      };
      callback(stepData);
    });

    return {
      success: true,
      data: subscription,
    };
  } catch (error) {
    console.error('歩数トラッキング開始エラー:', error);
    return {
      success: false,
      error: {
        code: 'SENSOR_ERROR',
        message: '歩数トラッキングの開始に失敗しました。',
        timestamp: Date.now(),
      },
    };
  }
};

/**
 * 歩数トラッキングを停止
 * @param subscription トラッキングサブスクリプション
 */
export const stopStepCountTracking = (subscription: StepCountSubscription | null): void => {
  try {
    if (subscription && typeof subscription.remove === 'function') {
      subscription.remove();
    }
  } catch (error) {
    console.error('歩数トラッキング停止エラー:', error);
    // エラーでも続行（停止処理なので）
  }
};

/**
 * 現在の歩数を取得
 * @returns 現在の歩数データ
 */
export const getCurrentStepCount = async (): Promise<SensorServiceResponse<StepCountData>> => {
  try {
    // センサーの利用可能性をチェック
    const isAvailable = await Pedometer.isAvailableAsync();
    if (!isAvailable) {
      return {
        success: false,
        error: {
          code: 'SENSOR_UNAVAILABLE',
          message: '歩数センサーが利用できません。',
          timestamp: Date.now(),
        },
      };
    }

    // 今日の開始時刻から現在まで
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const now = new Date();

    const result = await Pedometer.getStepCountAsync(startOfDay, now);

    return {
      success: true,
      data: {
        steps: result.steps,
        timestamp: Date.now(),
      },
    };
  } catch (error) {
    console.error('現在の歩数取得エラー:', error);
    return {
      success: false,
      error: {
        code: 'SENSOR_ERROR',
        message: '歩数の取得に失敗しました。',
        timestamp: Date.now(),
      },
    };
  }
};

/**
 * 指定期間の歩数履歴を取得
 * @param days 取得する日数（1-365）
 * @returns 期間内の歩数データ配列
 */
export const getStepCountHistory = async (days: number): Promise<SensorServiceResponse<StepCountData[]>> => {
  try {
    // パラメータバリデーション
    if (days < 1) {
      return {
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: '日数は1以上である必要があります。',
          timestamp: Date.now(),
        },
      };
    }

    if (days > 365) {
      return {
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: '日数は365日以下である必要があります。',
          timestamp: Date.now(),
        },
      };
    }

    // センサーの利用可能性をチェック
    const isAvailable = await Pedometer.isAvailableAsync();
    if (!isAvailable) {
      return {
        success: false,
        error: {
          code: 'SENSOR_UNAVAILABLE',
          message: '歩数センサーが利用できません。',
          timestamp: Date.now(),
        },
      };
    }

    const history: StepCountData[] = [];
    const today = new Date();

    // 指定された日数分のデータを取得
    for (let i = 0; i < days; i++) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - i);
      
      const startOfDay = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate()
      );
      
      const endOfDay = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
        23, 59, 59, 999
      );

      try {
        const result = await Pedometer.getStepCountAsync(startOfDay, endOfDay);
        history.push({
          steps: result.steps,
          timestamp: startOfDay.getTime(),
        });
      } catch (dayError) {
        // 個別の日でエラーが発生した場合は0歩として記録
        console.warn(`歩数取得エラー (${startOfDay.toDateString()}):`, dayError);
        history.push({
          steps: 0,
          timestamp: startOfDay.getTime(),
        });
      }
    }

    return {
      success: true,
      data: history,
    };
  } catch (error) {
    console.error('歩数履歴取得エラー:', error);
    return {
      success: false,
      error: {
        code: 'SENSOR_ERROR',
        message: '歩数履歴の取得に失敗しました。',
        timestamp: Date.now(),
      },
    };
  }
};

/**
 * センサーエラーの共通ハンドラ
 * @param error エラーオブジェクト
 * @returns 標準化されたSensorError
 */
export const handleSensorError = (error: any): SensorError => {
  let code = 'SENSOR_ERROR';
  let message = '歩数センサーでエラーが発生しました。';

  if (error?.message) {
    message = `歩数センサーエラー: ${error.message}`;
  }

  // 特定のエラーコードに基づく分類
  if (error?.code === 'E_SENSOR_UNAVAILABLE') {
    code = 'SENSOR_UNAVAILABLE';
    message = '歩数センサーが利用できません。';
  } else if (error?.code === 'E_PERMISSION_DENIED') {
    code = 'PERMISSION_DENIED';
    message = '歩数センサーの権限が拒否されました。';
  }

  return {
    code,
    message,
    timestamp: Date.now(),
  };
};