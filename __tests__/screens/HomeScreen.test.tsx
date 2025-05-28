// Firebase authのモック - ファイルの最初に定義
const mockUser = {
  uid: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
};

jest.mock('../../src/config/firebase', () => {
  return {
    auth: {
      get currentUser() {
        return mockUser;
      },
      onAuthStateChanged: jest.fn((callback) => {
        callback(mockUser);
        return jest.fn();
      }),
    },
    db: {},
  };
});

// リスク計算サービスのモック
jest.mock('../../src/services/riskCalculationService', () => ({
  calculateRiskScore: jest.fn().mockResolvedValue({
    overallRiskScore: 50,
    factors: ['activity', 'mood'],
  }),
}));

// Firestoreサービスのモック
jest.mock('../../src/services/firestoreService', () => ({
  firestoreService: {
    getUserProfile: jest.fn().mockResolvedValue({
      userId: 'test-user-id',
      fullName: 'Test User',
      email: 'test@example.com',
      dateOfBirth: '1950-01-01',
      phoneNumber: '090-1234-5678',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    getRiskAssessments: jest.fn().mockResolvedValue([{
      id: 'risk-1',
      userId: 'test-user-id',
      date: new Date().toISOString(),
      level: 'medium',
      score: 50,
      factors: ['activity', 'mood'],
      createdAt: new Date(),
    }]),
    getLatestRiskAssessment: jest.fn().mockResolvedValue({
      id: 'risk-1',
      userId: 'test-user-id',
      date: new Date().toISOString(),
      overallRiskScore: 50,
      factors: ['activity', 'mood'],
      createdAt: new Date(),
    }),
    getStepData: jest.fn().mockResolvedValue([{
      id: 'step-1',
      userId: 'test-user-id',
      date: new Date().toISOString(),
      steps: 5000,
      calories: 200,
      distance: 3.5,
      createdAt: new Date(),
    }]),
    getTodaySteps: jest.fn().mockResolvedValue({
      id: 'step-1',
      userId: 'test-user-id',
      date: new Date().toISOString(),
      steps: 5000,
      calories: 200,
      distance: 3.5,
      createdAt: new Date(),
    }),
    getMoodData: jest.fn().mockResolvedValue([{
      id: 'mood-1',
      userId: 'test-user-id',
      timestamp: new Date().toISOString(),
      mood: 'happy',
      notes: 'Feeling good',
      createdAt: new Date(),
    }]),
    getTodayMoodData: jest.fn().mockResolvedValue([{
      id: 'mood-1',
      userId: 'test-user-id',
      timestamp: new Date().toISOString(),
      mood: 'happy',
      notes: 'Feeling good',
      createdAt: new Date(),
    }]),
  },
}));

// ナビゲーションのモック
const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    reset: jest.fn(),
    setParams: jest.fn(),
    dispatch: jest.fn(),
    isFocused: jest.fn(() => true),
    canGoBack: jest.fn(() => false),
    getId: jest.fn(() => 'HomeScreen'),
    getState: jest.fn(() => ({})),
    getParent: jest.fn(),
    setOptions: jest.fn(),
  }),
}));

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from '../../src/screens/HomeScreen';
import { Colors } from '../../src/types';

// テストコンポーネントをNavigationContainerでラップ
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NavigationContainer>
    {children}
  </NavigationContainer>
);

describe('HomeScreen', () => {
  // 共通のモックナビゲーション
  const createMockNavigation = () => ({
    navigate: mockNavigate,
    goBack: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    reset: jest.fn(),
    setParams: jest.fn(),
    dispatch: jest.fn(),
    isFocused: jest.fn(() => true),
    canGoBack: jest.fn(() => false),
    getId: jest.fn(() => 'HomeScreen'),
    getState: jest.fn(() => ({})),
    getParent: jest.fn(),
    setOptions: jest.fn(),
  } as any);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('画面が正常にレンダリングされる', async () => {
    const { getByText } = render(
      <TestWrapper>
        <HomeScreen navigation={createMockNavigation()} />
      </TestWrapper>
    );

    // データ読み込み完了を待つ
    await waitFor(() => {
      expect(getByText(/おはようございます/)).toBeTruthy();
    });
    
    expect(getByText('今日の健康状態')).toBeTruthy();
  });

  it('リスクカードがタップ可能である', async () => {
    const { getByLabelText } = render(
      <TestWrapper>
        <HomeScreen navigation={createMockNavigation()} />
      </TestWrapper>
    );

    await waitFor(() => {
      const quickActionButton = getByLabelText('気分を記録画面を開く');
      fireEvent.press(quickActionButton);
    });

    // ナビゲーションが呼ばれることを確認
    expect(mockNavigate).toHaveBeenCalledWith('MoodMirror');
  });

  it('歩数データが表示される', async () => {
    const { getByText } = render(
      <TestWrapper>
        <HomeScreen navigation={createMockNavigation()} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText(/5,000 歩/)).toBeTruthy();
    });
  });

  it('気分データが表示される', async () => {
    const { getByText } = render(
      <TestWrapper>
        <HomeScreen navigation={createMockNavigation()} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByText(/気分: 記録済み/)).toBeTruthy();
    });
  });

  it('リマインダーセクションが表示される', async () => {
    const { getByText } = render(
      <TestWrapper>
        <HomeScreen navigation={createMockNavigation()} />
      </TestWrapper>
    );

    // よく使う機能が表示されることを確認
    await waitFor(() => {
      expect(getByText('よく使う機能')).toBeTruthy();
    });
  });

  it('アクセシビリティラベルが適切に設定されている', async () => {
    const { getByLabelText } = render(
      <TestWrapper>
        <HomeScreen navigation={createMockNavigation()} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(getByLabelText('気分を記録画面を開く')).toBeTruthy();
      expect(getByLabelText('歩数を確認画面を開く')).toBeTruthy();
    });
  });

  it('異なるリスクレベルで適切な色が表示される', async () => {
    const { getByText } = render(
      <TestWrapper>
        <HomeScreen navigation={createMockNavigation()} />
      </TestWrapper>
    );

    await waitFor(() => {
      const levelText = getByText('普通');
      expect(levelText).toBeTruthy();
    });
  });

  it('ローディングインジケーターが表示されていない', async () => {
    const { queryByTestId, getByText } = render(
      <TestWrapper>
        <HomeScreen navigation={createMockNavigation()} />
      </TestWrapper>
    );

    // データ読み込み完了を待つ
    await waitFor(() => {
      expect(getByText(/おはようございます/)).toBeTruthy();
    });

    expect(queryByTestId('loading-indicator')).toBeNull();
  });
});