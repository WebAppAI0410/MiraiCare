import { I18n } from 'i18n-js';

const i18n = new I18n({
  ja: {
    // 共通
    common: {
      save: '保存',
      cancel: 'キャンセル',
      delete: '削除',
      edit: '編集',
      back: '戻る',
      next: '次へ',
      skip: 'スキップ',
      done: '完了',
      loading: '読み込み中...',
      error: 'エラーが発生しました',
      retry: '再試行',
      yes: 'はい',
      no: 'いいえ',
      close: '閉じる',
    },
    
    // オンボーディング
    onboarding: {
      title: 'MiraiCare 360へようこそ',
      subtitle: 'あなたの健康をサポートします',
      step1: {
        title: '健康状態を見える化',
        description: '歩数や脈波から転倒・フレイルリスクを3段階で表示',
      },
      step2: {
        title: 'かんたんリマインド',
        description: '水分補給や服薬をやさしくお知らせ',
      },
      step3: {
        title: 'こころのケア',
        description: 'AIとの対話で気分を整理し、前向きな気持ちに',
      },
      step4: {
        title: '家族と安心共有',
        description: 'LINEで健康状態を家族に自動レポート',
      },
      getStarted: 'はじめる',
    },
    
    // ホーム画面
    home: {
      todayRisk: '今日のリスク',
      mood: 'ムード',
      steps: '歩数',
      water: '水分',
      badges: '取得バッジ',
      drinkWater: '水分を飲む',
      medicationCheck: '服薬確認',
      riskLevels: {
        low: '低',
        medium: '中',
        high: '高',
      },
      moods: {
        happy: '元気',
        good: '良い',
        neutral: '普通',
        sad: '少し沈み気味',
        worried: '心配',
      },
    },
    
    // 設定画面
    settings: {
      title: '設定',
      profile: 'プロフィール',
      notifications: '通知設定',
      lineIntegration: 'LINE連携',
      fontSize: '文字サイズ',
      language: '言語',
      privacy: 'プライバシー',
      about: 'このアプリについて',
      logout: 'ログアウト',
    },
    
    // エラーメッセージ
    errors: {
      networkError: 'ネットワークエラーが発生しました',
      authenticationFailed: '認証に失敗しました',
      permissionDenied: '権限が拒否されました',
      cameraNotAvailable: 'カメラが利用できません',
      sensorNotAvailable: 'センサーが利用できません',
    },
  },
  
  en: {
    // Common
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      back: 'Back',
      next: 'Next',
      skip: 'Skip',
      done: 'Done',
      loading: 'Loading...',
      error: 'An error occurred',
      retry: 'Retry',
      yes: 'Yes',
      no: 'No',
      close: 'Close',
    },
    
    // Onboarding
    onboarding: {
      title: 'Welcome to MiraiCare 360',
      subtitle: 'Supporting your health journey',
      step1: {
        title: 'Visualize Health Status',
        description: 'Display fall and frailty risk in 3 levels from steps and pulse wave',
      },
      step2: {
        title: 'Simple Reminders',
        description: 'Gentle notifications for hydration and medication',
      },
      step3: {
        title: 'Mental Care',
        description: 'Organize your feelings through AI dialogue for a positive mindset',
      },
      step4: {
        title: 'Peace of Mind for Family',
        description: 'Automatic health reports to family via LINE',
      },
      getStarted: 'Get Started',
    },
    
    // Home screen
    home: {
      todayRisk: "Today's Risk",
      mood: 'Mood',
      steps: 'Steps',
      water: 'Water',
      badges: 'Badges',
      drinkWater: 'Drink Water',
      medicationCheck: 'Medication Check',
      riskLevels: {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
      },
      moods: {
        happy: 'Happy',
        good: 'Good',
        neutral: 'Neutral',
        sad: 'Slightly down',
        worried: 'Worried',
      },
    },
    
    // Settings screen
    settings: {
      title: 'Settings',
      profile: 'Profile',
      notifications: 'Notifications',
      lineIntegration: 'LINE Integration',
      fontSize: 'Font Size',
      language: 'Language',
      privacy: 'Privacy',
      about: 'About',
      logout: 'Logout',
    },
    
    // Error messages
    errors: {
      networkError: 'Network error occurred',
      authenticationFailed: 'Authentication failed',
      permissionDenied: 'Permission denied',
      cameraNotAvailable: 'Camera not available',
      sensorNotAvailable: 'Sensor not available',
    },
  },
});

// デフォルト言語を日本語に設定
i18n.defaultLocale = 'ja';
i18n.locale = 'ja';

export default i18n; 