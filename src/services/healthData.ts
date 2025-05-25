import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as HealthKit from 'expo-health-kit';
import { HealthDataPoint, WeeklyHealthData, HealthPermissions } from '../types';

class HealthDataService {
  private static instance: HealthDataService;
  private isInitialized = false;
  private permissions: HealthPermissions = { steps: false, granted: false };

  public static getInstance(): HealthDataService {
    if (!HealthDataService.instance) {
      HealthDataService.instance = new HealthDataService();
    }
    return HealthDataService.instance;
  }

  /**
   * ヘルスデータサービスの初期化
   */
  async initialize(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        return await this.initializeHealthKit();
      } else if (Platform.OS === 'android') {
        return await this.initializeGoogleFit();
      }
      return false;
    } catch (error) {
      console.error('HealthDataService初期化エラー:', error);
      return false;
    }
  }

  /**
   * iOS HealthKit初期化
   */
  private async initializeHealthKit(): Promise<boolean> {
    try {
      const isAvailable = await HealthKit.isHealthKitAvailableAsync();
      if (!isAvailable) {
        console.warn('HealthKitが利用できません');
        return false;
      }

      const permissions = {
        read: [HealthKit.HealthKitQuantityTypeIdentifier.stepCount],
        write: [],
      };

      const { granted } = await HealthKit.requestAuthorizationAsync(permissions);
      
      this.permissions = {
        steps: granted,
        granted: granted,
      };

      this.isInitialized = granted;
      return granted;
    } catch (error) {
      console.error('HealthKit初期化エラー:', error);
      return false;
    }
  }

  /**
   * Android Google Fit初期化
   * 注: 実際の実装では react-native-google-fit を使用
   */
  private async initializeGoogleFit(): Promise<boolean> {
    try {
      // Google Fit APIの初期化ロジック
      // 今回はダミー実装
      this.permissions = {
        steps: true,
        granted: true,
      };
      
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Google Fit初期化エラー:', error);
      return false;
    }
  }

  /**
   * 権限状態の確認
   */
  async checkPermissions(): Promise<HealthPermissions> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.permissions;
  }

  /**
   * 過去7日間の歩数データを取得
   */
  async getWeeklyStepsData(): Promise<WeeklyHealthData> {
    try {
      if (!this.isInitialized || !this.permissions.granted) {
        return this.getFallbackData();
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);

      let stepsData: HealthDataPoint[] = [];

      if (Platform.OS === 'ios') {
        stepsData = await this.getHealthKitStepsData(startDate, endDate);
      } else if (Platform.OS === 'android') {
        stepsData = await this.getGoogleFitStepsData(startDate, endDate);
      }

      const averageSteps = this.calculateAverageSteps(stepsData);
      
      // データをローカルストレージに保存
      await this.saveHealthDataToStorage(stepsData);

      return {
        steps: stepsData,
        averageSteps,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('歩数データ取得エラー:', error);
      return this.getFallbackData();
    }
  }

  /**
   * HealthKitから歩数データを取得
   */
  private async getHealthKitStepsData(startDate: Date, endDate: Date): Promise<HealthDataPoint[]> {
    try {
      const options = {
        quantityType: HealthKit.HealthKitQuantityTypeIdentifier.stepCount,
        startDate,
        endDate,
        interval: 'day' as const,
      };

      const results = await HealthKit.queryQuantitySamplesAsync(options);
      
      return results.map((sample: any) => ({
        value: Math.round(sample.quantity),
        date: sample.startDate,
        source: 'health_kit' as const,
      }));
    } catch (error) {
      console.error('HealthKit歩数取得エラー:', error);
      return [];
    }
  }

  /**
   * Google Fitから歩数データを取得
   */
  private async getGoogleFitStepsData(startDate: Date, endDate: Date): Promise<HealthDataPoint[]> {
    try {
      // Google Fit APIの実装
      // 今回はダミーデータを返す
      const dummyData: HealthDataPoint[] = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        dummyData.push({
          value: Math.floor(Math.random() * 5000) + 2000, // 2000-7000歩のランダム値
          date: date.toISOString(),
          source: 'google_fit',
        });
      }
      
      return dummyData;
    } catch (error) {
      console.error('Google Fit歩数取得エラー:', error);
      return [];
    }
  }

  /**
   * 7日平均歩数の計算
   */
  private calculateAverageSteps(stepsData: HealthDataPoint[]): number {
    if (stepsData.length === 0) return 0;
    
    const totalSteps = stepsData.reduce((sum, data) => sum + data.value, 0);
    return Math.round(totalSteps / stepsData.length);
  }

  /**
   * フォールバックデータの取得（権限がない場合）
   */
  private async getFallbackData(): Promise<WeeklyHealthData> {
    try {
      // ローカルストレージから過去のデータを取得
      const savedData = await AsyncStorage.getItem('health_data_fallback');
      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch (error) {
      console.error('フォールバックデータ取得エラー:', error);
    }

    // デフォルトのダミーデータ
    const dummySteps: HealthDataPoint[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      
      dummySteps.push({
        value: Math.floor(Math.random() * 3000) + 1500, // 1500-4500歩
        date: date.toISOString(),
        source: 'manual',
      });
    }

    return {
      steps: dummySteps,
      averageSteps: this.calculateAverageSteps(dummySteps),
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * ヘルスデータをローカルストレージに保存
   */
  private async saveHealthDataToStorage(stepsData: HealthDataPoint[]): Promise<void> {
    try {
      const dataToSave = {
        steps: stepsData,
        averageSteps: this.calculateAverageSteps(stepsData),
        lastUpdated: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem('health_data_cache', JSON.stringify(dataToSave));
    } catch (error) {
      console.error('ヘルスデータ保存エラー:', error);
    }
  }

  /**
   * キャッシュされたヘルスデータの取得
   */
  async getCachedHealthData(): Promise<WeeklyHealthData | null> {
    try {
      const cachedData = await AsyncStorage.getItem('health_data_cache');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        
        // データが24時間以内のものかチェック
        const lastUpdated = new Date(parsed.lastUpdated);
        const now = new Date();
        const hoursDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          return parsed;
        }
      }
      return null;
    } catch (error) {
      console.error('キャッシュデータ取得エラー:', error);
      return null;
    }
  }

  /**
   * 手動で歩数を記録
   */
  async recordManualSteps(steps: number, date?: Date): Promise<boolean> {
    try {
      const recordDate = date || new Date();
      const healthDataPoint: HealthDataPoint = {
        value: steps,
        date: recordDate.toISOString(),
        source: 'manual',
      };

      // 既存のデータに追加
      const existingData = await this.getCachedHealthData();
      if (existingData) {
        existingData.steps.push(healthDataPoint);
        existingData.averageSteps = this.calculateAverageSteps(existingData.steps);
        existingData.lastUpdated = new Date().toISOString();
        
        await AsyncStorage.setItem('health_data_cache', JSON.stringify(existingData));
      }

      return true;
    } catch (error) {
      console.error('手動歩数記録エラー:', error);
      return false;
    }
  }
}

export default HealthDataService.getInstance();