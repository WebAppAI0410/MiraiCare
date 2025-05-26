// useStepCounterフック（TDD Phase 2）

import { useState, useEffect, useCallback, useRef } from 'react';
import { StepCountData, SensorError } from '../types/userData';
import { 
  startStepCountTracking, 
  stopStepCountTracking, 
  getCurrentStepCount,
  StepCountSubscription 
} from '../services/sensorService';

// フックの状態管理型定義
interface UseStepCounterState {
  stepCount: number;
  isTracking: boolean;
  isLoading: boolean;
  error: SensorError | null;
  lastUpdated: number | null;
}

// フックの返り値型定義
interface UseStepCounterReturn extends UseStepCounterState {
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  getCurrentSteps: () => Promise<void>;
  clearError: () => void;
}

/**
 * 歩数カウンターフック
 * 歩数の取得、トラッキング開始/停止、エラーハンドリングを管理
 * 
 * @returns 歩数関連の状態と操作関数
 */
export const useStepCounter = (): UseStepCounterReturn => {
  // 状態管理
  const [state, setState] = useState<UseStepCounterState>({
    stepCount: 0,
    isTracking: false,
    isLoading: false,
    error: null,
    lastUpdated: null,
  });

  // トラッキングサブスクリプションの参照
  const subscriptionRef = useRef<StepCountSubscription | null>(null);

  /**
   * 歩数データのコールバック処理
   */
  const handleStepCountUpdate = useCallback((data: StepCountData) => {
    setState(prevState => ({
      ...prevState,
      stepCount: data.steps,
      lastUpdated: data.timestamp,
      error: null, // 正常にデータを受信した場合はエラーをクリア
    }));
  }, []);

  /**
   * トラッキングを開始
   */
  const startTracking = useCallback(async (): Promise<void> => {
    // 既にトラッキング中の場合は重複開始しない
    if (state.isTracking) {
      return;
    }

    setState(prevState => ({
      ...prevState,
      isLoading: true,
      error: null,
    }));

    try {
      const result = await startStepCountTracking(handleStepCountUpdate);

      if (result.success && result.data) {
        subscriptionRef.current = result.data;
        setState(prevState => ({
          ...prevState,
          isTracking: true,
          isLoading: false,
          error: null,
        }));
      } else {
        setState(prevState => ({
          ...prevState,
          isTracking: false,
          isLoading: false,
          error: result.error || {
            code: 'UNKNOWN_ERROR',
            message: 'トラッキング開始に失敗しました',
            timestamp: Date.now(),
          },
        }));
      }
    } catch (error) {
      console.error('トラッキング開始エラー:', error);
      setState(prevState => ({
        ...prevState,
        isTracking: false,
        isLoading: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'トラッキング開始中に予期しないエラーが発生しました',
          timestamp: Date.now(),
        },
      }));
    }
  }, [state.isTracking, handleStepCountUpdate]);

  /**
   * トラッキングを停止
   */
  const stopTracking = useCallback((): void => {
    try {
      if (subscriptionRef.current) {
        stopStepCountTracking(subscriptionRef.current);
        subscriptionRef.current = null;
      }

      setState(prevState => ({
        ...prevState,
        isTracking: false,
      }));
    } catch (error) {
      console.error('トラッキング停止エラー:', error);
      // トラッキング停止は失敗してもUI状態は更新する
      setState(prevState => ({
        ...prevState,
        isTracking: false,
      }));
    }
  }, []);

  /**
   * 現在の歩数を取得
   */
  const getCurrentSteps = useCallback(async (): Promise<void> => {
    setState(prevState => ({
      ...prevState,
      isLoading: true,
      error: null,
    }));

    try {
      const result = await getCurrentStepCount();

      if (result.success && result.data) {
        setState(prevState => ({
          ...prevState,
          stepCount: result.data!.steps,
          lastUpdated: result.data!.timestamp,
          isLoading: false,
          error: null,
        }));
      } else {
        setState(prevState => ({
          ...prevState,
          isLoading: false,
          error: result.error || {
            code: 'UNKNOWN_ERROR',
            message: '歩数取得に失敗しました',
            timestamp: Date.now(),
          },
        }));
      }
    } catch (error) {
      console.error('歩数取得エラー:', error);
      setState(prevState => ({
        ...prevState,
        isLoading: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: '歩数取得中に予期しないエラーが発生しました',
          timestamp: Date.now(),
        },
      }));
    }
  }, []);

  /**
   * エラーをクリア
   */
  const clearError = useCallback((): void => {
    setState(prevState => ({
      ...prevState,
      error: null,
    }));
  }, []);

  /**
   * クリーンアップ処理（アンマウント時）
   */
  useEffect(() => {
    return () => {
      // コンポーネントのアンマウント時にトラッキングを停止
      if (subscriptionRef.current) {
        stopStepCountTracking(subscriptionRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startTracking,
    stopTracking,
    getCurrentSteps,
    clearError,
  };
};