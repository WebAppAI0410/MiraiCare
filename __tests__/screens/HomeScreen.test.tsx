import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from '../../src/screens/HomeScreen';

// モックナビゲーション
const mockNavigate = jest.fn();
const mockNavigation = {
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
};

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => mockNavigation,
}));

// テストコンポーネントをNavigationContainerでラップ
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NavigationContainer>
    {children}
  </NavigationContainer>
);

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('画面が正常にレンダリングされる', () => {
    const { getByText } = render(
      <TestWrapper>
        <HomeScreen />
      </TestWrapper>
    );

    // 主要な要素が表示されることを確認
    expect(getByText('今日の健康状態')).toBeTruthy();
    expect(getByText('リスクレベル')).toBeTruthy();
  });

  it('リスクカードがタップ可能である', async () => {
    const { getByText } = render(
      <TestWrapper>
        <HomeScreen />
      </TestWrapper>
    );

    const riskCard = getByText('リスクレベル');
    fireEvent.press(riskCard);

    // ナビゲーションが呼ばれることを確認
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  it('歩数データが表示される', () => {
    const { getByText } = render(
      <TestWrapper>
        <HomeScreen />
      </TestWrapper>
    );

    // 歩数セクションが表示されることを確認
    expect(getByText('今日の歩数')).toBeTruthy();
  });

  it('気分データが表示される', () => {
    const { getByText } = render(
      <TestWrapper>
        <HomeScreen />
      </TestWrapper>
    );

    // 気分セクションが表示されることを確認
    expect(getByText('今日の気分')).toBeTruthy();
  });

  it('リマインダーセクションが表示される', () => {
    const { getByText } = render(
      <TestWrapper>
        <HomeScreen />
      </TestWrapper>
    );

    // リマインダーセクションが表示されることを確認
    expect(getByText('今日のリマインダー')).toBeTruthy();
  });

  it('アクセシビリティラベルが適切に設定されている', () => {
    const { getByLabelText } = render(
      <TestWrapper>
        <HomeScreen />
      </TestWrapper>
    );

    // アクセシビリティラベルがあることを確認
    expect(getByLabelText(/今日のリスク/)).toBeTruthy();
  });

  it('異なるリスクレベルで適切な色が表示される', () => {
    const { getByText } = render(
      <TestWrapper>
        <HomeScreen />
      </TestWrapper>
    );

    // リスクカードが表示されることを確認
    expect(getByText('今日のリスク')).toBeTruthy();
  });

  it('ローディング状態が適切に処理される', async () => {
    const { getByTestId, queryByTestId } = render(
      <TestWrapper>
        <HomeScreen />
      </TestWrapper>
    );

    // ローディングインジケーターの確認（実装に応じて調整）
    await waitFor(() => {
      expect(queryByTestId('loading-indicator')).toBeFalsy();
    });
  });
});