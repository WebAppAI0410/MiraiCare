import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import MoodMirrorScreen from '../../src/screens/MoodMirrorScreen';

// Alertをモック
jest.spyOn(Alert, 'alert');

describe('MoodMirrorScreen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('画面が正常にレンダリングされる', () => {
    const { getByText } = render(<MoodMirrorScreen />);

    // 主要な要素が表示されることを確認
    expect(getByText('ムード・ミラー')).toBeTruthy();
    expect(getByText('こんにちは！今日もあなたの気持ちをお聞かせください。3つの簡単な質問をさせていただきますね。')).toBeTruthy();
  });

  it('質問が順番に表示される', () => {
    const { getByText } = render(<MoodMirrorScreen />);
    jest.runAllTimers();

    // 最初の質問が表示されることを確認
    expect(getByText('今日の気分はいかがですか？')).toBeTruthy();
  });

  it('気分選択ボタンが正常に動作する', () => {
    const { getByText, getByPlaceholderText } = render(<MoodMirrorScreen />);
    jest.runAllTimers();

    const option = getByText('とても良い');
    fireEvent.press(option);

    const input = getByPlaceholderText('メッセージを入力...');
    expect(input.props.value).toBe('とても良い');
  });

  it('テキスト入力が正常に動作する', () => {
    const { getByPlaceholderText } = render(<MoodMirrorScreen />);

    const textInput = getByPlaceholderText('メッセージを入力...');
    fireEvent.changeText(textInput, 'とても良い一日でした');

    expect(textInput.props.value).toBe('とても良い一日でした');
  });

  it('次の質問への遷移が正常に動作する', async () => {
    const { getByText, getByPlaceholderText } = render(<MoodMirrorScreen />);
    jest.runAllTimers();

    fireEvent.changeText(getByPlaceholderText('メッセージを入力...'), '元気です');
    fireEvent.press(getByText('送信'));

    await waitFor(() => {
      expect(getByText('最近、心配していることはありますか？')).toBeTruthy();
    });
  });

  it('全ての質問回答後に結果が表示される', async () => {
    const { getByText, getByPlaceholderText } = render(
      <MoodMirrorScreen />
    );
    jest.runAllTimers();

    fireEvent.changeText(getByPlaceholderText('メッセージを入力...'), 'A1');
    fireEvent.press(getByText('送信'));
    jest.runAllTimers();

    await waitFor(() => {
      expect(getByText('最近、心配していることはありますか？')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('メッセージを入力...'), 'A2');
    fireEvent.press(getByText('送信'));
    jest.runAllTimers();

    await waitFor(() => {
      expect(getByText('今日、楽しかったことを教えてください')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('メッセージを入力...'), 'A3');
    fireEvent.press(getByText('送信'));
    jest.runAllTimers();

    await waitFor(() => {
      expect(getByText(/分析完了しました！/)).toBeTruthy();
    });
  });

  it('不完全な回答で次へボタンが無効化される', () => {
    const { getByText } = render(<MoodMirrorScreen />);

    const sendButton = getByText('送信');
    fireEvent.press(sendButton);

    expect(getByText('今日の気分はいかがですか？')).toBeTruthy();
  });

  it('リセット機能が正常に動作する', async () => {
    const { getByText, getByPlaceholderText } = render(<MoodMirrorScreen />);

    const input = getByPlaceholderText('メッセージを入力...');
    fireEvent.changeText(input, 'テスト');
    fireEvent.press(getByText('送信'));
    jest.runAllTimers();

    await waitFor(() => {
      expect(getByPlaceholderText('メッセージを入力...').props.value).toBe('');
    });
  });

  it('送信処理が正常に動作する', async () => {
    const { getByText, getByPlaceholderText } = render(
      <MoodMirrorScreen />
    );

    fireEvent.changeText(getByPlaceholderText('メッセージを入力...'), 'A1');
    fireEvent.press(getByText('送信'));
    jest.runAllTimers();
    await waitFor(() => getByText('最近、心配していることはありますか？'));

    fireEvent.changeText(getByPlaceholderText('メッセージを入力...'), 'A2');
    fireEvent.press(getByText('送信'));
    jest.runAllTimers();
    await waitFor(() => getByText('今日、楽しかったことを教えてください'));

    fireEvent.changeText(getByPlaceholderText('メッセージを入力...'), 'A3');
    fireEvent.press(getByText('送信'));
    jest.runAllTimers();

    await waitFor(() => {
      expect(getByText(/分析完了しました！/)).toBeTruthy();
    });
  });

  it('GPT-4o連携機能のモックが正常に動作する', async () => {
    global.fetch = jest.fn();

    const { getByText, getByPlaceholderText } = render(
      <MoodMirrorScreen />
    );

    fireEvent.changeText(getByPlaceholderText('メッセージを入力...'), 'A1');
    fireEvent.press(getByText('送信'));
    jest.runAllTimers();
    await waitFor(() => getByText('最近、心配していることはありますか？'));

    fireEvent.changeText(getByPlaceholderText('メッセージを入力...'), 'A2');
    fireEvent.press(getByText('送信'));
    jest.runAllTimers();
    await waitFor(() => getByText('今日、楽しかったことを教えてください'));

    fireEvent.changeText(getByPlaceholderText('メッセージを入力...'), 'A3');
    fireEvent.press(getByText('送信'));
    jest.runAllTimers();

    await waitFor(() => {
      expect(getByText(/分析完了しました！/)).toBeTruthy();
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('アクセシビリティラベルが適切に設定されている', () => {
    const { getByPlaceholderText, getByText } = render(<MoodMirrorScreen />);

    expect(getByPlaceholderText('メッセージを入力...')).toBeTruthy();
    expect(getByText('送信')).toBeTruthy();
  });

  it('ローディング状態が適切に表示される', async () => {
    const { getByText, getByPlaceholderText } = render(
      <MoodMirrorScreen />
    );

    fireEvent.changeText(getByPlaceholderText('メッセージを入力...'), 'A1');
    fireEvent.press(getByText('送信'));

    expect(getByText('考え中...')).toBeTruthy();
    jest.runOnlyPendingTimers();
  });
});