import React from 'react';
import { render } from '@testing-library/react-native';
import Greeting from '../../src/components/Greeting';

describe('Greeting Component', () => {
  it('正常にレンダリングされる', () => {
    const { getByText } = render(<Greeting name="テストユーザー" />);
    expect(getByText('こんにちは、テストユーザーさん！')).toBeTruthy();
  });

  it('名前が空の場合デフォルトメッセージが表示される', () => {
    const { getByText } = render(<Greeting name="" />);
    expect(getByText('こんにちは！')).toBeTruthy();
  });

  it('適切なアクセシビリティラベルが設定される', () => {
    const { getByLabelText } = render(<Greeting name="テストユーザー" />);
    expect(getByLabelText('挨拶メッセージ')).toBeTruthy();
  });
});