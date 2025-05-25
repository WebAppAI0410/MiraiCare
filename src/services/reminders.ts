import { supabase } from '../config/supabase';
import { notificationService } from './notifications';
import { Reminder } from '../types';

export interface ReminderTemplate {
  id: string;
  type: 'water' | 'medication';
  title: string;
  description?: string;
  defaultTimes: string[]; // ['08:00', '12:00', '18:00']
  icon: string;
  category: 'health' | 'medication' | 'exercise';
}

export interface ReminderSchedule {
  id: string;
  userId: string;
  templateId: string;
  customTitle?: string;
  scheduledTimes: string[]; // ['08:00', '12:00', '18:00']
  enabled: boolean;
  daysOfWeek: number[]; // 0-6 (Sunday to Saturday)
  startDate: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReminderCompletion {
  id: string;
  userId: string;
  scheduleId: string;
  scheduledTime: Date;
  completedAt: Date;
  method: 'manual' | 'camera' | 'voice';
  notes?: string;
  photoUrl?: string;
}

class ReminderService {
  // デフォルトリマインダーテンプレート
  private defaultTemplates: ReminderTemplate[] = [
    {
      id: 'water_basic',
      type: 'water',
      title: '水分補給',
      description: '定期的な水分補給で健康維持',
      defaultTimes: ['08:00', '12:00', '15:00', '18:00'],
      icon: '💧',
      category: 'health',
    },
    {
      id: 'medication_morning',
      type: 'medication',
      title: '朝の服薬',
      description: '朝食後のお薬',
      defaultTimes: ['08:30'],
      icon: '💊',
      category: 'medication',
    },
    {
      id: 'medication_lunch',
      type: 'medication',
      title: '昼の服薬',
      description: '昼食後のお薬',
      defaultTimes: ['12:30'],
      icon: '💊',
      category: 'medication',
    },
    {
      id: 'medication_evening',
      type: 'medication',
      title: '夜の服薬',
      description: '夕食後のお薬',
      defaultTimes: ['18:30'],
      icon: '💊',
      category: 'medication',
    },
  ];

  /**
   * リマインダーテンプレートの取得
   */
  async getTemplates(): Promise<ReminderTemplate[]> {
    try {
      // TODO: Supabaseからカスタムテンプレートも取得
      return this.defaultTemplates;
    } catch (error) {
      console.error('テンプレート取得エラー:', error);
      return this.defaultTemplates;
    }
  }

  /**
   * ユーザーのリマインダースケジュール取得
   */
  async getUserSchedules(userId: string): Promise<ReminderSchedule[]> {
    try {
      const { data, error } = await supabase
        .from('reminder_schedules')
        .select('*')
        .eq('user_id', userId)
        .eq('enabled', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('スケジュール取得エラー:', error);
        return [];
      }

      return data?.map(item => ({
        id: item.id,
        userId: item.user_id,
        templateId: item.template_id,
        customTitle: item.custom_title,
        scheduledTimes: item.scheduled_times,
        enabled: item.enabled,
        daysOfWeek: item.days_of_week,
        startDate: new Date(item.start_date),
        endDate: item.end_date ? new Date(item.end_date) : undefined,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      })) || [];
    } catch (error) {
      console.error('スケジュール取得に失敗:', error);
      return [];
    }
  }

  /**
   * リマインダースケジュールの作成
   */
  async createSchedule(
    userId: string, 
    templateId: string, 
    scheduledTimes: string[],
    options: {
      customTitle?: string;
      daysOfWeek?: number[];
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<ReminderSchedule | null> {
    try {
      const schedule = {
        user_id: userId,
        template_id: templateId,
        custom_title: options.customTitle,
        scheduled_times: scheduledTimes,
        enabled: true,
        days_of_week: options.daysOfWeek || [0, 1, 2, 3, 4, 5, 6], // 毎日
        start_date: (options.startDate || new Date()).toISOString(),
        end_date: options.endDate?.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('reminder_schedules')
        .insert(schedule)
        .select()
        .single();

      if (error) {
        console.error('スケジュール作成エラー:', error);
        return null;
      }

      const newSchedule: ReminderSchedule = {
        id: data.id,
        userId: data.user_id,
        templateId: data.template_id,
        customTitle: data.custom_title,
        scheduledTimes: data.scheduled_times,
        enabled: data.enabled,
        daysOfWeek: data.days_of_week,
        startDate: new Date(data.start_date),
        endDate: data.end_date ? new Date(data.end_date) : undefined,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      // 通知をスケジュール
      await this.scheduleNotificationsForSchedule(newSchedule);

      return newSchedule;
    } catch (error) {
      console.error('スケジュール作成に失敗:', error);
      return null;
    }
  }

  /**
   * リマインダースケジュールの更新
   */
  async updateSchedule(
    scheduleId: string, 
    updates: Partial<ReminderSchedule>
  ): Promise<boolean> {
    try {
      const updateData: any = {};
      
      if (updates.customTitle !== undefined) updateData.custom_title = updates.customTitle;
      if (updates.scheduledTimes !== undefined) updateData.scheduled_times = updates.scheduledTimes;
      if (updates.enabled !== undefined) updateData.enabled = updates.enabled;
      if (updates.daysOfWeek !== undefined) updateData.days_of_week = updates.daysOfWeek;
      if (updates.endDate !== undefined) updateData.end_date = updates.endDate?.toISOString();
      
      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('reminder_schedules')
        .update(updateData)
        .eq('id', scheduleId);

      if (error) {
        console.error('スケジュール更新エラー:', error);
        return false;
      }

      // 通知を再スケジュール
      await this.rescheduleNotifications(scheduleId);

      return true;
    } catch (error) {
      console.error('スケジュール更新に失敗:', error);
      return false;
    }
  }

  /**
   * リマインダースケジュールの削除
   */
  async deleteSchedule(scheduleId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('reminder_schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) {
        console.error('スケジュール削除エラー:', error);
        return false;
      }

      // 関連する通知をキャンセル
      await this.cancelNotificationsForSchedule(scheduleId);

      return true;
    } catch (error) {
      console.error('スケジュール削除に失敗:', error);
      return false;
    }
  }

  /**
   * 今日のリマインダー取得
   */
  async getTodayReminders(userId: string): Promise<Reminder[]> {
    try {
      const schedules = await this.getUserSchedules(userId);
      const today = new Date();
      const dayOfWeek = today.getDay();
      const todayStr = today.toDateString();

      const reminders: Reminder[] = [];

      for (const schedule of schedules) {
        // 今日が対象曜日かチェック
        if (!schedule.daysOfWeek.includes(dayOfWeek)) continue;

        // 期間内かチェック
        if (schedule.startDate > today) continue;
        if (schedule.endDate && schedule.endDate < today) continue;

        const template = this.defaultTemplates.find(t => t.id === schedule.templateId);
        if (!template) continue;

        // 各時刻でリマインダーを作成
        for (const timeStr of schedule.scheduledTimes) {
          const [hours, minutes] = timeStr.split(':').map(Number);
          const scheduledTime = new Date(today);
          scheduledTime.setHours(hours, minutes, 0, 0);

          // 完了状況をチェック
          const completion = await this.getCompletion(userId, schedule.id, scheduledTime);

          reminders.push({
            id: `${schedule.id}_${timeStr}`,
            type: template.type,
            title: schedule.customTitle || template.title,
            scheduledTime: scheduledTime.toISOString(),
            completed: !!completion,
            completedAt: completion?.completedAt.toISOString(),
          });
        }
      }

      // 時刻順にソート
      return reminders.sort((a, b) => 
        new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
      );
    } catch (error) {
      console.error('今日のリマインダー取得に失敗:', error);
      return [];
    }
  }

  /**
   * リマインダー完了の記録
   */
  async completeReminder(
    userId: string,
    scheduleId: string,
    scheduledTime: Date,
    method: 'manual' | 'camera' | 'voice' = 'manual',
    notes?: string,
    photoUrl?: string
  ): Promise<boolean> {
    try {
      const completion = {
        user_id: userId,
        schedule_id: scheduleId,
        scheduled_time: scheduledTime.toISOString(),
        completed_at: new Date().toISOString(),
        method,
        notes,
        photo_url: photoUrl,
      };

      const { error } = await supabase
        .from('reminder_completions')
        .upsert(completion, {
          onConflict: 'user_id,schedule_id,scheduled_time',
        });

      if (error) {
        console.error('完了記録エラー:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('リマインダー完了記録に失敗:', error);
      return false;
    }
  }

  /**
   * リマインダー完了の取得
   */
  async getCompletion(
    userId: string,
    scheduleId: string,
    scheduledTime: Date
  ): Promise<ReminderCompletion | null> {
    try {
      const { data, error } = await supabase
        .from('reminder_completions')
        .select('*')
        .eq('user_id', userId)
        .eq('schedule_id', scheduleId)
        .eq('scheduled_time', scheduledTime.toISOString())
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        scheduleId: data.schedule_id,
        scheduledTime: new Date(data.scheduled_time),
        completedAt: new Date(data.completed_at),
        method: data.method,
        notes: data.notes,
        photoUrl: data.photo_url,
      };
    } catch (error) {
      console.error('完了記録取得に失敗:', error);
      return null;
    }
  }

  /**
   * 期間の完了統計取得
   */
  async getCompletionStats(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalScheduled: number;
    completed: number;
    completionRate: number;
    byType: Record<string, { scheduled: number; completed: number; rate: number }>;
  }> {
    try {
      const { data, error } = await supabase
        .from('reminder_completion_stats')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString())
        .lte('date', endDate.toISOString());

      if (error) {
        console.error('統計取得エラー:', error);
        return { totalScheduled: 0, completed: 0, completionRate: 0, byType: {} };
      }

      // 集計処理
      let totalScheduled = 0;
      let completed = 0;
      const byType: Record<string, { scheduled: number; completed: number; rate: number }> = {};

      data?.forEach(stat => {
        totalScheduled += stat.scheduled_count;
        completed += stat.completed_count;

        if (!byType[stat.reminder_type]) {
          byType[stat.reminder_type] = { scheduled: 0, completed: 0, rate: 0 };
        }
        byType[stat.reminder_type].scheduled += stat.scheduled_count;
        byType[stat.reminder_type].completed += stat.completed_count;
      });

      // 達成率計算
      Object.keys(byType).forEach(type => {
        const stats = byType[type];
        stats.rate = stats.scheduled > 0 ? (stats.completed / stats.scheduled) * 100 : 0;
      });

      const completionRate = totalScheduled > 0 ? (completed / totalScheduled) * 100 : 0;

      return {
        totalScheduled,
        completed,
        completionRate,
        byType,
      };
    } catch (error) {
      console.error('統計取得に失敗:', error);
      return { totalScheduled: 0, completed: 0, completionRate: 0, byType: {} };
    }
  }

  /**
   * スケジュールに対する通知設定
   */
  private async scheduleNotificationsForSchedule(schedule: ReminderSchedule): Promise<void> {
    try {
      const template = this.defaultTemplates.find(t => t.id === schedule.templateId);
      if (!template) return;

      for (const timeStr of schedule.scheduledTimes) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const scheduledTime = new Date();
        scheduledTime.setHours(hours, minutes, 0, 0);

        await notificationService.scheduleNotification({
          id: `${schedule.id}_${timeStr}`,
          type: template.type,
          title: `${template.icon} ${schedule.customTitle || template.title}`,
          body: template.description || 'リマインダーの時間です',
          scheduledTime,
          recurring: true,
          userId: schedule.userId,
        });
      }
    } catch (error) {
      console.error('通知スケジュール設定に失敗:', error);
    }
  }

  /**
   * スケジュールの通知を再設定
   */
  private async rescheduleNotifications(scheduleId: string): Promise<void> {
    try {
      // 既存の通知をキャンセル
      await this.cancelNotificationsForSchedule(scheduleId);

      // 新しい通知をスケジュール
      const { data } = await supabase
        .from('reminder_schedules')
        .select('*')
        .eq('id', scheduleId)
        .single();

      if (data && data.enabled) {
        const schedule: ReminderSchedule = {
          id: data.id,
          userId: data.user_id,
          templateId: data.template_id,
          customTitle: data.custom_title,
          scheduledTimes: data.scheduled_times,
          enabled: data.enabled,
          daysOfWeek: data.days_of_week,
          startDate: new Date(data.start_date),
          endDate: data.end_date ? new Date(data.end_date) : undefined,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
        };

        await this.scheduleNotificationsForSchedule(schedule);
      }
    } catch (error) {
      console.error('通知再スケジュールに失敗:', error);
    }
  }

  /**
   * スケジュールの通知をキャンセル
   */
  private async cancelNotificationsForSchedule(scheduleId: string): Promise<void> {
    try {
      const schedule = await supabase
        .from('reminder_schedules')
        .select('scheduled_times')
        .eq('id', scheduleId)
        .single();

      if (schedule.data) {
        for (const timeStr of schedule.data.scheduled_times) {
          await notificationService.cancelNotification(`${scheduleId}_${timeStr}`);
        }
      }
    } catch (error) {
      console.error('通知キャンセルに失敗:', error);
    }
  }
}

// シングルトンインスタンス
export const reminderService = new ReminderService();