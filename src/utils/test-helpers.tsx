import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// カスタムレンダー関数
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRouteName?: string;
}

export const renderWithProviders = (
  ui: ReactElement,
  options?: CustomRenderOptions
) => {
  const AllProviders = ({ children }: { children: React.ReactNode }) => {
    return (
      <SafeAreaProvider>
        <NavigationContainer>
          {children}
        </NavigationContainer>
      </SafeAreaProvider>
    );
  };

  return render(ui, { wrapper: AllProviders, ...options });
};

// モックデータ生成ヘルパー
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  fullName: 'テストユーザー',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockVitalData = (overrides = {}) => ({
  id: 'test-vital-id',
  userId: 'test-user-id',
  type: 'steps',
  value: 5000,
  unit: '歩',
  measuredAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const createMockMoodData = (overrides = {}) => ({
  id: 'test-mood-id',
  userId: 'test-user-id',
  moodLabel: '元気',
  intensity: 80,
  notes: 'とても良い一日でした',
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const createMockReminder = (overrides = {}) => ({
  id: 'test-reminder-id',
  userId: 'test-user-id',
  type: 'water',
  title: '水分補給',
  scheduledTime: new Date().toISOString(),
  completed: false,
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const createMockBadge = (overrides = {}) => ({
  id: 'badge-1',
  name: '初回ログイン',
  description: 'MiraiCareを初めて使用しました',
  iconName: 'log-in',
  unlockedAt: new Date().toISOString(),
  ...overrides,
});

// よく使うFirebaseエラーのモック
export const mockFirebaseErrors = {
  authEmailAlreadyInUse: {
    code: 'auth/email-already-in-use',
    message: 'The email address is already in use by another account.',
  },
  authInvalidEmail: {
    code: 'auth/invalid-email',
    message: 'The email address is badly formatted.',
  },
  authWeakPassword: {
    code: 'auth/weak-password',
    message: 'The password must be 6 characters long or more.',
  },
  authUserNotFound: {
    code: 'auth/user-not-found',
    message: 'There is no user record corresponding to this identifier.',
  },
  authWrongPassword: {
    code: 'auth/wrong-password',
    message: 'The password is invalid or the user does not have a password.',
  },
  authNetworkRequestFailed: {
    code: 'auth/network-request-failed',
    message: 'A network error has occurred.',
  },
};

// 非同期処理のテストヘルパー
export const waitForAsync = async (callback: () => void, timeout = 1000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      callback();
      return;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  callback(); // 最後に一度実行してエラーを出す
};

// テスト用のコンソールログ抑制
export const suppressConsoleErrors = () => {
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });
};

// re-export
export * from '@testing-library/react-native';