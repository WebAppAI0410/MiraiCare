import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import HomeScreen from '../../src/screens/HomeScreen';
import { Colors } from '../../src/types';

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

    expect(getByText('おはようございます')).toBeTruthy();
    expect(getByText('今日のリスク')).toBeTruthy();
  });

  it('リスクカードがタップ可能である', async () => {
    const { getByLabelText } = render(
      <TestWrapper>
        <HomeScreen />
      </TestWrapper>
    );

    const riskCard = getByLabelText('今日のリスク 中');
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

    expect(getByText('歩数')).toBeTruthy();
  });

  it('気分データが表示される', () => {
    const { getByText } = render(
      <TestWrapper>
        <HomeScreen />
      </TestWrapper>
    );

    expect(getByText(/ムード/)).toBeTruthy();
  });

  it('リマインダーセクションが表示される', () => {
    const { getByText } = render(
      <TestWrapper>
        <HomeScreen />
      </TestWrapper>
    );

    // リマインダーセクションが表示されることを確認
    expect(getByText('水分を飲む')).toBeTruthy();
  });

  it('アクセシビリティラベルが適切に設定されている', () => {
    const { getByLabelText } = render(
      <TestWrapper>
        <HomeScreen />
      </TestWrapper>
    );

    expect(getByLabelText('今日のリスク 中')).toBeTruthy();
  });

  it('異なるリスクレベルで適切な色が表示される', () => {
    const { getByText } = render(
      <TestWrapper>
        <HomeScreen />
      </TestWrapper>
    );

    const levelText = getByText('中');
    expect(levelText.props.style).toEqual(
      expect.objectContaining({ color: Colors.warning })
    );
  });

  it('ローディングインジケーターが表示されていない', () => {
    const { queryByTestId } = render(
      <TestWrapper>
        <HomeScreen />
      </TestWrapper>
    );

    expect(queryByTestId('loading-indicator')).toBeNull();
  });
});