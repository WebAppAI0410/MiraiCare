import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// 環境変数から設定を取得
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || 'YOUR_SUPABASE_ANON_KEY';

// Supabaseクライアントを作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// 型定義
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name?: string;
          avatar_url?: string;
          phone?: string;
          birth_date?: string;
          emergency_contact?: string;
          line_notify_token?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          full_name?: string;
          avatar_url?: string;
          phone?: string;
          birth_date?: string;
          emergency_contact?: string;
          line_notify_token?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          avatar_url?: string;
          phone?: string;
          birth_date?: string;
          emergency_contact?: string;
          line_notify_token?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      vitals: {
        Row: {
          id: string;
          user_id: string;
          type: 'steps' | 'heart_rate' | 'blood_pressure';
          value: number;
          unit: string;
          measured_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'steps' | 'heart_rate' | 'blood_pressure';
          value: number;
          unit: string;
          measured_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'steps' | 'heart_rate' | 'blood_pressure';
          value?: number;
          unit?: string;
          measured_at?: string;
          created_at?: string;
        };
      };
      moods: {
        Row: {
          id: string;
          user_id: string;
          mood_label: string;
          intensity: number;
          suggestion?: string;
          notes?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          mood_label: string;
          intensity: number;
          suggestion?: string;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          mood_label?: string;
          intensity?: number;
          suggestion?: string;
          notes?: string;
          created_at?: string;
        };
      };
      family_members: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          relationship: string;
          email?: string;
          phone?: string;
          line_notify_token?: string;
          notification_settings: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          relationship: string;
          email?: string;
          phone?: string;
          line_notify_token?: string;
          notification_settings?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          relationship?: string;
          email?: string;
          phone?: string;
          line_notify_token?: string;
          notification_settings?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      weekly_reports: {
        Row: {
          id: string;
          user_id: string;
          week_start_date: string;
          week_end_date: string;
          data: any;
          sent_at?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          week_start_date: string;
          week_end_date: string;
          data: any;
          sent_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          week_start_date?: string;
          week_end_date?: string;
          data?: any;
          sent_at?: string;
          created_at?: string;
        };
      };
      emergency_alerts: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          severity: string;
          message: string;
          data: any;
          sent_at?: string;
          acknowledged_at?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          severity: string;
          message: string;
          data?: any;
          sent_at?: string;
          acknowledged_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          severity?: string;
          message?: string;
          data?: any;
          sent_at?: string;
          acknowledged_at?: string;
          created_at?: string;
        };
      };
      risk_scores: {
        Row: {
          id: string;
          user_id: string;
          overall: string;
          fall_risk: string;
          frailty_risk: string;
          mental_health_risk: string;
          last_updated: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          overall: string;
          fall_risk: string;
          frailty_risk: string;
          mental_health_risk: string;
          last_updated?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          overall?: string;
          fall_risk?: string;
          frailty_risk?: string;
          mental_health_risk?: string;
          last_updated?: string;
          created_at?: string;
        };
      };
    };
  };
}; 