// TDD Phase 2: useStepCounterカスタムHook実装
// GREEN フェーズ: テストを通すための実装

import { useState, useEffect, useCallback, useRef } from 'react';
import { sensorService } from '../services/sensorService';
import { firestoreService } from '../services/firestoreService';
import type { StepCountData } from '../types/userData';

interface UseStepCounterOptions {
  autoStart?: boolean;
  autoSave?: boolean;
  autoSaveInterval?: number; // ms
  monitoringInterval?: number; // ms
}

interface UseStepCounterState {
  steps: number;
  isLoading: boolean;
  error: string | null;
  isMonitoring: boolean;
  permissionStatus: 'undetermined' | 'granted' | 'denied' | 'error';
  sensorAvailable: boolean;
  userId: string;
  todayData: StepCountData | null;
  weeklyData: StepCountData[] | null;
  options: UseStepCounterOptions;
}

interface UseStepCounterActions {
  requestPermission: () => Promise<void>;
  fetchCurrentSteps: () => Promise<void>;
  fetchTodaySteps: () => Promise<void>;
  fetchWeeklySteps: () => Promise<void>;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  saveToFirestore: () => Promise<void>;
  loadFromFirestore: (date: string) => Promise<void>;
  resetSteps: () => void;
  setSteps: (steps: number) => void;
}

type UseStepCounterReturn = UseStepCounterState & UseStepCounterActions;

/**
 * 歩数計カスタムHook
 * センサーからの歩数取得とFirestoreへの保存を統合管理
 */
export function useStepCounter(
  userId: string,
  options: UseStepCounterOptions = {}
): UseStepCounterReturn {
  const defaultOptions: UseStepCounterOptions = {
    autoStart: false,
    autoSave: false,
    autoSaveInterval: 60000, // 1分
    monitoringInterval: 1000, // 1秒
    ...options,
  };

  // 状態管理
  const [state, setState] = useState<UseStepCounterState>({
    steps: 0,
    isLoading: false,
    error: null,
    isMonitoring: false,
    permissionStatus: 'undetermined',
    sensorAvailable: false,
    userId,
    todayData: null,
    weeklyData: null,
    options: defaultOptions,
  });

  // リファレンス管理
  const monitoringSubscription = useRef<{ remove: () => void } | null>(null);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

  /**
   * センサー権限要求
   */
  const requestPermission = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const result = await sensorService.requestSensorPermissions();
      
      const permissionStatus = result.granted ? 'granted' : 'denied';
      const error = result.granted ? null : '歩数計の権限が拒否されました。設定から権限を許可してください。';

      setState(prev => ({
        ...prev,
        permissionStatus,
        error,
        isLoading: false,
      }));

      // 権限が許可された場合、センサーの可用性をチェック
      if (result.granted) {
        const isAvailable = await sensorService.isPedometerAvailable();
        setState(prev => ({ ...prev, sensorAvailable: isAvailable }));
      }
    } catch (error) {
      console.error('権限要求に失敗:', error);
      setState(prev => ({
        ...prev,
        permissionStatus: 'error',
        error: '権限要求中にエラーが発生しました',
        isLoading: false,
      }));
    }
  }, []);

  /**
   * 現在の歩数取得
   */
  const fetchCurrentSteps = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const result = await sensorService.getCurrentStepCount();
      
      if (result.error || !result.data) {
        setState(prev => ({
          ...prev,
          error: result.error || '歩数データの取得に失敗しました',
          isLoading: false,
        }));
        return;
      }

      setState(prev => ({
        ...prev,
        steps: result.data?.steps || 0,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      console.error('歩数取得に失敗:', error);
      setState(prev => ({
        ...prev,
        error: '歩数データの取得中にエラーが発生しました',
        isLoading: false,
      }));
    }
  }, []);

  /**
   * 今日の歩数取得
   */
  const fetchTodaySteps = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const result = await sensorService.getTodayStepCount();
      
      if (result.error || !result.data) {
        setState(prev => ({
          ...prev,
          error: result.error || '今日の歩数データの取得に失敗しました',
          isLoading: false,
        }));
        return;
      }

      const todayData = { ...result.data, userId };

      setState(prev => ({
        ...prev,
        steps: result.data?.steps || 0,
        todayData,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      console.error('今日の歩数取得に失敗:', error);
      setState(prev => ({
        ...prev,
        error: '今日の歩数データの取得中にエラーが発生しました',
        isLoading: false,
      }));
    }
  }, [userId]);

  /**
   * 週間歩数取得
   */
  const fetchWeeklySteps = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const result = await sensorService.getWeeklyStepCount();
      
      if (result.error || !result.data) {
        setState(prev => ({
          ...prev,
          error: result.error || '週間歩数データの取得に失敗しました',
          isLoading: false,
        }));
        return;
      }

      const weeklyData = result.data.map(data => ({ ...data, userId }));

      setState(prev => ({
        ...prev,
        weeklyData,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      console.error('週間歩数取得に失敗:', error);
      setState(prev => ({
        ...prev,
        error: '週間歩数データの取得中にエラーが発生しました',
        isLoading: false,
      }));
    }
  }, [userId]);

  /**
   * リアルタイム監視開始
   */
  const startMonitoring = useCallback(() => {
    try {
      // 既存の監視を停止
      if (monitoringSubscription.current) {
        monitoringSubscription.current.remove();
      }

      // リアルタイム監視開始
      monitoringSubscription.current = sensorService.startStepCountMonitoring((data) => {
        setState(prev => ({
          ...prev,
          steps: data.steps,
          error: null,
        }));

        // 自動保存が有効な場合
        if (state.options.autoSave) {
          if (autoSaveTimer.current) {
            clearTimeout(autoSaveTimer.current);
          }
          
          autoSaveTimer.current = setTimeout(() => {
            saveToFirestore().catch(error => {
              console.error('自動保存に失敗:', error);
            });
          }, state.options.autoSaveInterval);
        }
      });

      setState(prev => ({ ...prev, isMonitoring: true }));
    } catch (error) {
      console.error('リアルタイム監視開始に失敗:', error);
      setState(prev => ({
        ...prev,
        error: 'リアルタイム監視の開始に失敗しました',
      }));
    }
  }, [state.options.autoSave, state.options.autoSaveInterval]);

  /**
   * リアルタイム監視停止
   */
  const stopMonitoring = useCallback(() => {
    try {
      if (monitoringSubscription.current) {
        monitoringSubscription.current.remove();
        monitoringSubscription.current = null;
      }

      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = null;
      }

      setState(prev => ({ ...prev, isMonitoring: false }));
    } catch (error) {
      console.error('リアルタイム監視停止に失敗:', error);
    }
  }, []);

  /**
   * Firestoreへの保存
   */
  const saveToFirestore = useCallback(async () => {
    try {
      if (!state.todayData && state.steps > 0) {
        // 今日のデータを作成
        const now = new Date();
        const dateString = now.toISOString().split('T')[0];
        const todayData = sensorService.createStepCountData(userId, state.steps, dateString);
        
        await firestoreService.addStepCount(todayData);
      } else if (state.todayData) {
        await firestoreService.addStepCount(state.todayData);
      }
    } catch (error) {
      console.error('Firestore保存に失敗:', error);
      setState(prev => ({
        ...prev,
        error: 'データの保存に失敗しました',
      }));
    }
  }, [userId, state.steps, state.todayData]);

  /**
   * Firestoreからの読み込み
   */
  const loadFromFirestore = useCallback(async (date: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const stepData = await firestoreService.getStepCountByDate(userId, date);
      
      if (stepData) {
        setState(prev => ({
          ...prev,
          steps: stepData.steps,
          todayData: stepData,
          isLoading: false,
          error: null,
        }));
      } else {
        setState(prev => ({
          ...prev,
          steps: 0,
          todayData: null,
          isLoading: false,
          error: null,
        }));
      }
    } catch (error) {
      console.error('Firestore読み込みに失敗:', error);
      setState(prev => ({
        ...prev,
        error: 'データの読み込みに失敗しました',
        isLoading: false,
      }));
    }
  }, [userId]);

  /**
   * 歩数リセット
   */
  const resetSteps = useCallback(() => {
    setState(prev => ({
      ...prev,
      steps: 0,
      todayData: null,
      error: null,
    }));
  }, []);

  /**
   * 手動歩数設定
   */
  const setSteps = useCallback((steps: number) => {
    setState(prev => ({ ...prev, steps }));
  }, []);

  /**
   * 初期化処理
   */
  useEffect(() => {
    // ユーザーIDが変更された時の処理
    setState(prev => ({ ...prev, userId }));
  }, [userId]);

  useEffect(() => {
    // 自動開始が有効な場合
    if (defaultOptions.autoStart) {
      requestPermission().then(() => {
        if (state.permissionStatus === 'granted' && state.sensorAvailable) {
          startMonitoring();
        }
      });
    }

    // センサーの可用性をチェック
    sensorService.isPedometerAvailable().then(isAvailable => {
      setState(prev => ({ ...prev, sensorAvailable: isAvailable }));
    });

    // クリーンアップ
    return () => {
      stopMonitoring();
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
  }, []);

  return {
    ...state,
    requestPermission,
    fetchCurrentSteps,
    fetchTodaySteps,
    fetchWeeklySteps,
    startMonitoring,
    stopMonitoring,
    saveToFirestore,
    loadFromFirestore,
    resetSteps,
    setSteps,
  };
}