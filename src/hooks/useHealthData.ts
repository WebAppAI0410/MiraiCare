import { useState, useEffect, useCallback } from 'react';
import { RiskScore, WeeklyHealthData, HealthPermissions } from '../types';
import HealthDataService from '../services/healthData';
import RiskCalculationService from '../services/riskCalculation';

interface UseHealthDataReturn {
  // データ状態
  healthData: WeeklyHealthData | null;
  riskScore: RiskScore | null;
  permissions: HealthPermissions;
  
  // ローディング状態
  isLoading: boolean;
  isInitializing: boolean;
  
  // エラー状態
  error: string | null;
  
  // アクション
  initialize: () => Promise<boolean>;
  refreshData: () => Promise<void>;
  recordManualSteps: (steps: number, date?: Date) => Promise<boolean>;
  clearError: () => void;
  
  // 改善提案
  improvementSuggestions: string[];
  riskDescription: string;
}

/**
 * ヘルスデータと関連機能を管理するカスタムフック
 */
export const useHealthData = (): UseHealthDataReturn => {
  // 状態管理
  const [healthData, setHealthData] = useState<WeeklyHealthData | null>(null);
  const [riskScore, setRiskScore] = useState<RiskScore | null>(null);
  const [permissions, setPermissions] = useState<HealthPermissions>({
    steps: false,
    granted: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [improvementSuggestions, setImprovementSuggestions] = useState<string[]>([]);
  const [riskDescription, setRiskDescription] = useState<string>('');

  /**
   * ヘルスサービスの初期化
   */
  const initialize = useCallback(async (): Promise<boolean> => {
    try {
      setIsInitializing(true);
      setError(null);

      // ヘルスデータサービスの初期化
      const initialized = await HealthDataService.initialize();
      
      // 権限状態の取得
      const currentPermissions = await HealthDataService.checkPermissions();
      setPermissions(currentPermissions);

      if (initialized && currentPermissions.granted) {
        // 初期データの読み込み
        await loadHealthData();
      } else {
        // キャッシュされたデータがあれば読み込む
        const cachedData = await HealthDataService.getCachedHealthData();
        if (cachedData) {
          setHealthData(cachedData);
          calculateRiskScore(cachedData);
        }
      }

      return initialized;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ヘルスデータの初期化に失敗しました';
      setError(errorMessage);
      console.error('ヘルスデータ初期化エラー:', err);
      return false;
    } finally {
      setIsInitializing(false);
    }
  }, []);

  /**
   * ヘルスデータの読み込み
   */
  const loadHealthData = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      
      const weeklyData = await HealthDataService.getWeeklyStepsData();
      setHealthData(weeklyData);
      
      // リスクスコアの計算
      calculateRiskScore(weeklyData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'ヘルスデータの読み込みに失敗しました';
      setError(errorMessage);
      console.error('ヘルスデータ読み込みエラー:', err);
    }
  }, []);

  /**
   * リスクスコアの計算と関連情報の更新
   */
  const calculateRiskScore = useCallback((data: WeeklyHealthData): void => {
    try {
      const calculatedRiskScore = RiskCalculationService.calculateRiskScore(data);
      setRiskScore(calculatedRiskScore);

      // 改善提案の生成
      const suggestions = RiskCalculationService.generateImprovementSuggestions(calculatedRiskScore);
      setImprovementSuggestions(suggestions);

      // リスクの説明文を生成
      const description = RiskCalculationService.getRiskDescription(
        calculatedRiskScore.overall,
        'overall'
      );
      setRiskDescription(description);
    } catch (err) {
      console.error('リスクスコア計算エラー:', err);
      setError('リスクスコアの計算に失敗しました');
    }
  }, []);

  /**
   * データの再読み込み
   */
  const refreshData = useCallback(async (): Promise<void> => {
    if (!permissions.granted) {
      setError('ヘルスデータへのアクセス権限がありません');
      return;
    }

    setIsLoading(true);
    try {
      await loadHealthData();
    } finally {
      setIsLoading(false);
    }
  }, [permissions.granted, loadHealthData]);

  /**
   * 手動歩数の記録
   */
  const recordManualSteps = useCallback(async (steps: number, date?: Date): Promise<boolean> => {
    try {
      setError(null);
      
      const success = await HealthDataService.recordManualSteps(steps, date);
      
      if (success) {
        // データを再読み込み
        await loadHealthData();
        return true;
      } else {
        setError('歩数の記録に失敗しました');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '歩数の記録に失敗しました';
      setError(errorMessage);
      console.error('歩数記録エラー:', err);
      return false;
    }
  }, [loadHealthData]);

  /**
   * エラーのクリア
   */
  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  // 初期化の実行
  useEffect(() => {
    initialize();
  }, [initialize]);

  // 定期的なデータ更新（5分間隔）
  useEffect(() => {
    if (!permissions.granted) return;

    const interval = setInterval(() => {
      refreshData();
    }, 5 * 60 * 1000); // 5分

    return () => clearInterval(interval);
  }, [permissions.granted, refreshData]);

  // アプリがフォアグラウンドに戻ったときのデータ更新
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && permissions.granted) {
        refreshData();
      }
    };

    // Note: 実際のReact Nativeアプリでは AppState.addEventListener を使用
    // ここではWeb環境での動作を考慮してコメントアウト
    // const subscription = AppState.addEventListener('change', handleAppStateChange);
    // return () => subscription?.remove();
  }, [permissions.granted, refreshData]);

  return {
    // データ状態
    healthData,
    riskScore,
    permissions,
    
    // ローディング状態
    isLoading,
    isInitializing,
    
    // エラー状態
    error,
    
    // アクション
    initialize,
    refreshData,
    recordManualSteps,
    clearError,
    
    // 改善提案
    improvementSuggestions,
    riskDescription,
  };
};

export default useHealthData;