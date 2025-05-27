import { Platform } from 'react-native';

// デバッグログ用のユーティリティ
export const debugLog = (component: string, action: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const platform = Platform.OS;
  
  console.log(`[${timestamp}] [${platform}] [${component}] ${action}`, data || '');
  
  // Web特有のデバッグ情報
  if (Platform.OS === 'web') {
    console.log('User Agent:', navigator.userAgent);
    console.log('Window size:', window.innerWidth, 'x', window.innerHeight);
  }
};

// エラーログ用のユーティリティ
export const debugError = (component: string, error: any) => {
  const timestamp = new Date().toISOString();
  const platform = Platform.OS;
  
  console.error(`[${timestamp}] [${platform}] [${component}] ERROR:`, error);
  
  // スタックトレースを表示
  if (error.stack) {
    console.error('Stack trace:', error.stack);
  }
  
  // Firebase エラーの詳細を表示
  if (error.code) {
    console.error('Error code:', error.code);
  }
};