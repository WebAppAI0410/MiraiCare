import { useState, useEffect } from 'react';
import { create } from 'zustand';
import { supabase } from '../config/supabase';
import { 
  FamilyMember, 
  LineNotifyConfig, 
  WeeklyReport, 
  EmergencyAlert,
  VitalData,
  MoodData 
} from '../types';
import { LineNotifyService } from '../services/lineNotify';
import { ReportGeneratorService } from '../services/reportGenerator';

/**
 * 家族管理ストア
 */
interface FamilyStore {
  familyMembers: FamilyMember[];
  isLoading: boolean;
  error: string | null;
  
  // アクション
  loadFamilyMembers: (userId: string) => Promise<void>;
  addFamilyMember: (member: FamilyMember) => Promise<void>;
  updateFamilyMember: (id: string, updates: Partial<FamilyMember>) => Promise<void>;
  removeFamilyMember: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useFamilyStore = create<FamilyStore>((set, get) => ({
  familyMembers: [],
  isLoading: false,
  error: null,

  loadFamilyMembers: async (userId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: true });

      if (error) throw error;

      set({ familyMembers: data || [], isLoading: false });
    } catch (error) {
      console.error('家族メンバー読み込みエラー:', error);
      set({ error: '家族メンバーの読み込みに失敗しました', isLoading: false });
    }
  },

  addFamilyMember: async (member: FamilyMember) => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase
        .from('family_members')
        .insert([member]);

      if (error) throw error;

      set(state => ({
        familyMembers: [...state.familyMembers, member],
        isLoading: false
      }));
    } catch (error) {
      console.error('家族メンバー追加エラー:', error);
      set({ error: '家族メンバーの追加に失敗しました', isLoading: false });
      throw error;
    }
  },

  updateFamilyMember: async (id: string, updates: Partial<FamilyMember>) => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase
        .from('family_members')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        familyMembers: state.familyMembers.map(member =>
          member.id === id ? { ...member, ...updates } : member
        ),
        isLoading: false
      }));
    } catch (error) {
      console.error('家族メンバー更新エラー:', error);
      set({ error: '家族メンバーの更新に失敗しました', isLoading: false });
      throw error;
    }
  },

  removeFamilyMember: async (id: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        familyMembers: state.familyMembers.filter(member => member.id !== id),
        isLoading: false
      }));
    } catch (error) {
      console.error('家族メンバー削除エラー:', error);
      set({ error: '家族メンバーの削除に失敗しました', isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

/**
 * LINE連携カスタムフック
 */
export const useLineIntegration = (userId?: string) => {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [lastReportSent, setLastReportSent] = useState<Date | null>(null);

  const { 
    familyMembers, 
    isLoading, 
    error, 
    loadFamilyMembers,
    clearError 
  } = useFamilyStore();

  // ユーザーIDが変更されたら家族メンバーを読み込み
  useEffect(() => {
    if (userId) {
      loadFamilyMembers(userId);
    }
  }, [userId, loadFamilyMembers]);

  /**
   * 週次レポートを生成・送信
   * @param userId ユーザーID
   * @param userName ユーザー名
   * @returns 送信成功かどうか
   */
  const sendWeeklyReport = async (
    userId: string, 
    userName: string
  ): Promise<boolean> => {
    if (!userId || isGeneratingReport) return false;

    setIsGeneratingReport(true);
    
    try {
      // 今週の開始日・終了日を取得
      const weekStart = ReportGeneratorService.getWeekStartDate();
      const weekEnd = ReportGeneratorService.getWeekEndDate();

      // 週次レポートを生成
      const report = await ReportGeneratorService.generateWeeklyReport(
        userId,
        weekStart,
        weekEnd
      );

      if (!report) {
        throw new Error('レポートの生成に失敗しました');
      }

      // 通知が有効な家族メンバーに送信
      const sendPromises = familyMembers
        .filter(member => 
          member.notificationSettings.enabled && 
          member.notificationSettings.token
        )
        .map(member => 
          LineNotifyService.sendWeeklyReport(
            member.notificationSettings,
            report,
            userName
          )
        );

      const results = await Promise.all(sendPromises);
      const successCount = results.filter(Boolean).length;

      // 送信日時を更新
      if (successCount > 0) {
        const { error } = await supabase
          .from('weekly_reports')
          .update({ sentAt: new Date().toISOString() })
          .eq('id', report.id);

        if (!error) {
          setLastReportSent(new Date());
        }
      }

      return successCount > 0;
    } catch (error) {
      console.error('週次レポート送信エラー:', error);
      return false;
    } finally {
      setIsGeneratingReport(false);
    }
  };

  /**
   * 緊急アラートを送信
   * @param alert 緊急アラートデータ
   * @param userName ユーザー名
   * @returns 送信成功かどうか
   */
  const sendEmergencyAlert = async (
    alert: EmergencyAlert,
    userName: string
  ): Promise<boolean> => {
    if (isSendingAlert) return false;

    setIsSendingAlert(true);
    
    try {
      // 緊急アラートが有効な家族メンバーに送信
      const sendPromises = familyMembers
        .filter(member => 
          member.notificationSettings.enabled && 
          member.notificationSettings.emergencyAlerts &&
          member.notificationSettings.token
        )
        .map(member => 
          LineNotifyService.sendEmergencyAlert(
            member.notificationSettings,
            alert,
            userName
          )
        );

      const results = await Promise.all(sendPromises);
      const successCount = results.filter(Boolean).length;

      // 送信日時を更新
      if (successCount > 0) {
        const { error } = await supabase
          .from('emergency_alerts')
          .update({ sentAt: new Date().toISOString() })
          .eq('id', alert.id);

        if (error) {
          console.error('アラート送信日時更新エラー:', error);
        }
      }

      return successCount > 0;
    } catch (error) {
      console.error('緊急アラート送信エラー:', error);
      return false;
    } finally {
      setIsSendingAlert(false);
    }
  };

  /**
   * LINE Notifyトークンの有効性をテスト
   * @param token LINE Notifyトークン
   * @returns トークンが有効かどうか
   */
  const validateLineToken = async (token: string): Promise<boolean> => {
    return await LineNotifyService.validateToken(token);
  };

  /**
   * 最新の週次レポート送信日時を取得
   */
  const getLastReportDate = async (userId: string): Promise<Date | null> => {
    try {
      const { data, error } = await supabase
        .from('weekly_reports')
        .select('sentAt')
        .eq('userId', userId)
        .not('sentAt', 'is', null)
        .order('sentAt', { ascending: false })
        .limit(1)
        .single();

      if (error || !data?.sentAt) return null;
      return new Date(data.sentAt);
    } catch (error) {
      console.error('最終レポート日取得エラー:', error);
      return null;
    }
  };

  /**
   * 通知設定をまとめて更新
   * @param memberId 家族メンバーID
   * @param settings 新しい通知設定
   */
  const updateNotificationSettings = async (
    memberId: string,
    settings: Partial<LineNotifyConfig>
  ): Promise<void> => {
    const member = familyMembers.find(m => m.id === memberId);
    if (!member) {
      throw new Error('家族メンバーが見つかりません');
    }

    const updatedSettings = {
      ...member.notificationSettings,
      ...settings,
    };

    // LINE Notifyトークンが変更された場合は検証
    if (settings.token && settings.token !== member.notificationSettings.token) {
      const isValid = await LineNotifyService.validateToken(settings.token);
      if (!isValid) {
        throw new Error('LINE Notifyトークンが無効です');
      }
    }

    // データベースを更新
    await useFamilyStore.getState().updateFamilyMember(memberId, {
      notificationSettings: updatedSettings,
      updatedAt: new Date().toISOString(),
    });
  };

  return {
    // 状態
    familyMembers,
    isLoading,
    error,
    isGeneratingReport,
    isSendingAlert,
    lastReportSent,

    // アクション
    sendWeeklyReport,
    sendEmergencyAlert,
    validateLineToken,
    getLastReportDate,
    updateNotificationSettings,
    clearError,

    // 統計
    enabledMembersCount: familyMembers.filter(m => m.notificationSettings.enabled).length,
    totalMembersCount: familyMembers.length,
  };
};

/**
 * リスク監視フック
 * バイタルデータと気分データを監視して緊急アラートを自動送信
 */
export const useRiskMonitoring = (userId?: string, userName?: string) => {
  const { sendEmergencyAlert } = useLineIntegration(userId);
  const [isMonitoring, setIsMonitoring] = useState(false);

  /**
   * リスクを評価してアラートを送信
   * @param vitalData 最新のバイタルデータ
   * @param moodData 最新の気分データ
   */
  const evaluateAndAlert = async (
    vitalData?: VitalData,
    moodData?: MoodData
  ): Promise<void> => {
    if (!userId || !userName || isMonitoring) return;

    setIsMonitoring(true);

    try {
      const alerts: EmergencyAlert[] = [];

      // 気分チェック
      if (moodData && moodData.intensity <= 2) {
        alerts.push({
          id: `alert_mood_${Date.now()}`,
          userId,
          type: 'low_mood',
          severity: 'medium',
          message: `気分レベル${moodData.intensity}/5と低い状態です`,
          data: moodData,
          createdAt: new Date().toISOString(),
        });
      }

      // バイタルデータチェック（例：異常な心拍数）
      if (vitalData && vitalData.type === 'heart_rate') {
        if (vitalData.value > 100 || vitalData.value < 50) {
          alerts.push({
            id: `alert_vital_${Date.now()}`,
            userId,
            type: 'vital_abnormal',
            severity: vitalData.value > 120 || vitalData.value < 40 ? 'high' : 'medium',
            message: `心拍数が${vitalData.value}${vitalData.unit}です`,
            data: vitalData,
            createdAt: new Date().toISOString(),
          });
        }
      }

      // アラートを順次送信
      for (const alert of alerts) {
        await sendEmergencyAlert(alert, userName);
      }
    } catch (error) {
      console.error('リスク評価エラー:', error);
    } finally {
      setIsMonitoring(false);
    }
  };

  return {
    isMonitoring,
    evaluateAndAlert,
  };
};