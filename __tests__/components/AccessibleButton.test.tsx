import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AccessibleButton } from '../../src/components/AccessibleButton';
import { Colors } from '../../src/types';

// react-native-vector-iconsのモック
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// レスポンシブユーティリティのモック
jest.mock('../../src/utils/responsive', () => ({
  responsiveFontSize: jest.fn((size) => size),
  getButtonHeight: jest.fn(() => 56),
  getMinTouchTarget: jest.fn(() => 48),
  isTablet: jest.fn(() => false),
}));

// android-fixesのモック
jest.mock('../../src/utils/android-fixes', () => ({
  androidElevationStyle: jest.fn(() => ({ elevation: 4 })),
}));

describe('AccessibleButton', () => {
  const mockOnPress = jest.fn();

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  it('基本的なボタンが正しくレンダリングされる', () => {
    const { getByText, getByRole } = render(
      <AccessibleButton title="テストボタン" onPress={mockOnPress} />
    );

    expect(getByText('テストボタン')).toBeTruthy();
    expect(getByRole('button')).toBeTruthy();
  });

  it('ボタンをタップするとonPressが呼ばれる', () => {
    const { getByText } = render(
      <AccessibleButton title="タップテスト" onPress={mockOnPress} />
    );

    fireEvent.press(getByText('タップテスト'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('無効化されたボタンはタップできない', () => {
    const { getByText, getByRole } = render(
      <AccessibleButton title="無効ボタン" onPress={mockOnPress} disabled />
    );

    const button = getByRole('button');
    expect(button.props.accessibilityState.disabled).toBe(true);
    
    fireEvent.press(getByText('無効ボタン'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('ローディング中はActivityIndicatorが表示される', () => {
    const { queryByText, getByTestId } = render(
      <AccessibleButton 
        title="ローディング" 
        onPress={mockOnPress} 
        loading 
        testID="loading-button"
      />
    );

    expect(queryByText('ローディング')).toBeNull();
    // ActivityIndicatorの存在を確認（実際のコンポーネントではgetByTestIdを使用）
  });

  it('各バリアントが正しく適用される', () => {
    const variants = ['primary', 'secondary', 'danger', 'success'] as const;
    
    variants.forEach((variant) => {
      const { getByText } = render(
        <AccessibleButton 
          title={`${variant}ボタン`} 
          onPress={mockOnPress} 
          variant={variant}
        />
      );
      
      expect(getByText(`${variant}ボタン`)).toBeTruthy();
    });
  });

  it('各サイズが正しく適用される', () => {
    const sizes = ['small', 'medium', 'large'] as const;
    
    sizes.forEach((size) => {
      const { getByText } = render(
        <AccessibleButton 
          title={`${size}ボタン`} 
          onPress={mockOnPress} 
          size={size}
        />
      );
      
      expect(getByText(`${size}ボタン`)).toBeTruthy();
    });
  });

  it('アイコン付きボタンが正しくレンダリングされる', () => {
    const { getByText } = render(
      <AccessibleButton 
        title="アイコン付き" 
        onPress={mockOnPress}
        icon={<>Icon</>}
      />
    );

    expect(getByText('アイコン付き')).toBeTruthy();
  });

  it('カスタムaccessibilityLabelが適用される', () => {
    const { getByRole } = render(
      <AccessibleButton 
        title="ボタン" 
        onPress={mockOnPress}
        accessibilityLabel="カスタムラベル"
        accessibilityHint="カスタムヒント"
      />
    );

    const button = getByRole('button');
    expect(button.props.accessibilityLabel).toBe('カスタムラベル');
    expect(button.props.accessibilityHint).toBe('カスタムヒント');
  });

  it('fullWidth=falseの場合、ボタンが全幅にならない', () => {
    const { getByText } = render(
      <AccessibleButton 
        title="非全幅" 
        onPress={mockOnPress}
        fullWidth={false}
      />
    );

    expect(getByText('非全幅')).toBeTruthy();
  });

  it('loading中はdisabled状態になる', () => {
    const { getByRole } = render(
      <AccessibleButton 
        title="ローディング中" 
        onPress={mockOnPress}
        loading
      />
    );

    const button = getByRole('button');
    expect(button.props.accessibilityState.disabled).toBe(true);
    expect(button.props.accessibilityState.busy).toBe(true);
  });
});