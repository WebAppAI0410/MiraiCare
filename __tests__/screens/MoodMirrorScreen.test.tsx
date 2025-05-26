import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import MoodMirrorScreen from '../../src/screens/MoodMirrorScreen';

// i18nをモック
jest.mock('../../src/config/i18n', () => ({
  t: jest.fn((key: string) => {
    const translations: Record<string, string> = {
      'mood.title': 'ムードミラー',
      'mood.subtitle': '今日の気分を教えてください',
      'mood.question1': '今日はどんな気分ですか？',
      'mood.question2': '何か特別なことがありましたか？',
      'mood.question3': '明日に向けてどんな気持ちですか？',
      'mood.submit': '送信',
      'mood.reset': 'リセット',
    };
    return translations[key] || key;
  }),
}));

// Alertをモック
jest.spyOn(Alert, 'alert');

describe('MoodMirrorScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('画面が正常にレンダリングされる', () => {
    const { getByText } = render(<MoodMirrorScreen />);

    // 主要な要素が表示されることを確認
    expect(getByText('ムード・ミラー')).toBeTruthy();
    expect(getByText('こんにちは！今日もあなたの気持ちをお聞かせください。3つの簡単な質問をさせていただきますね。')).toBeTruthy();
  });

  it('質問が順番に表示される', () => {
    const { getByText } = render(<MoodMirrorScreen />);

    // 最初の質問が表示されることを確認
    expect(getByText('今日はどんな気分ですか？')).toBeTruthy();
  });

  it('気分選択ボタンが正常に動作する', () => {
    const { getByText, getByTestId } = render(<MoodMirrorScreen />);

    // 気分選択ボタンをタップ
    const happyButton = getByTestId('mood-happy');
    fireEvent.press(happyButton);

    // 選択状態が反映されることを確認
    expect(happyButton.props.style).toEqual(
      expect.objectContaining({
        backgroundColor: expect.any(String),
      })
    );
  });

  it('テキスト入力が正常に動作する', () => {
    const { getByPlaceholderText } = render(<MoodMirrorScreen />);

    const textInput = getByPlaceholderText('自由に入力してください...');
    fireEvent.changeText(textInput, 'とても良い一日でした');

    expect(textInput.props.value).toBe('とても良い一日でした');
  });

  it('次の質問への遷移が正常に動作する', async () => {
    const { getByText, getByTestId } = render(<MoodMirrorScreen />);

    // 気分を選択
    const happyButton = getByTestId('mood-happy');
    fireEvent.press(happyButton);

    // 次へボタンをタップ
    const nextButton = getByText('次へ');
    fireEvent.press(nextButton);

    await waitFor(() => {
      expect(getByText('何か特別なことがありましたか？')).toBeTruthy();
    });
  });

  it('全ての質問回答後に送信ボタンが表示される', async () => {
    const { getByText, getByTestId, getByPlaceholderText } = render(
      <MoodMirrorScreen />
    );

    // 1つ目の質問を回答
    const happyButton = getByTestId('mood-happy');
    fireEvent.press(happyButton);
    fireEvent.press(getByText('次へ'));

    await waitFor(() => {
      // 2つ目の質問を回答
      const textInput = getByPlaceholderText('自由に入力してください...');
      fireEvent.changeText(textInput, 'テストイベント');
      fireEvent.press(getByText('次へ'));
    });

    await waitFor(() => {
      // 3つ目の質問を回答
      const textInput = getByPlaceholderText('自由に入力してください...');
      fireEvent.changeText(textInput, '明日も頑張りたい');
    });

    await waitFor(() => {
      expect(getByText('送信')).toBeTruthy();
    });
  });

  it('不完全な回答で次へボタンが無効化される', () => {
    const { getByText } = render(<MoodMirrorScreen />);

    const nextButton = getByText('次へ');
    
    // 何も選択していない状態で次へボタンが無効であることを確認
    expect(nextButton.props.disabled).toBeTruthy();
  });

  it('リセット機能が正常に動作する', async () => {
    const { getByText, getByTestId } = render(<MoodMirrorScreen />);

    // 気分を選択
    const happyButton = getByTestId('mood-happy');
    fireEvent.press(happyButton);

    // リセットボタンをタップ
    const resetButton = getByText('リセット');
    fireEvent.press(resetButton);

    await waitFor(() => {
      // 最初の質問に戻ることを確認
      expect(getByText('今日はどんな気分ですか？')).toBeTruthy();
    });
  });

  it('送信処理が正常に動作する', async () => {
    const { getByText, getByTestId, getByPlaceholderText } = render(
      <MoodMirrorScreen />
    );

    // 全ての質問を回答
    const happyButton = getByTestId('mood-happy');
    fireEvent.press(happyButton);
    fireEvent.press(getByText('次へ'));

    await waitFor(() => {
      const textInput = getByPlaceholderText('自由に入力してください...');
      fireEvent.changeText(textInput, 'テストイベント');
      fireEvent.press(getByText('次へ'));
    });

    await waitFor(() => {
      const textInput = getByPlaceholderText('自由に入力してください...');
      fireEvent.changeText(textInput, '明日も頑張りたい');
    });

    const submitButton = getByText('送信');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        '送信完了',
        expect.stringContaining('気分データを保存しました')
      );
    });
  });

  it('GPT-4o連携機能のモックが正常に動作する', async () => {
    // GPT-4o APIのモック（実装に応じて調整）
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [
          {
            message: {
              content: 'とても良い気分ですね！明日も素晴らしい一日になりそうです。',
            },
          },
        ],
      }),
    });

    const { getByText, getByTestId, getByPlaceholderText } = render(
      <MoodMirrorScreen />
    );

    // 全ての質問を回答して送信
    const happyButton = getByTestId('mood-happy');
    fireEvent.press(happyButton);
    fireEvent.press(getByText('次へ'));

    await waitFor(() => {
      const textInput = getByPlaceholderText('自由に入力してください...');
      fireEvent.changeText(textInput, 'テストイベント');
      fireEvent.press(getByText('次へ'));
    });

    await waitFor(() => {
      const textInput = getByPlaceholderText('自由に入力してください...');
      fireEvent.changeText(textInput, '明日も頑張りたい');
    });

    const submitButton = getByText('送信');
    fireEvent.press(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });

  it('アクセシビリティラベルが適切に設定されている', () => {
    const { getByLabelText } = render(<MoodMirrorScreen />);

    expect(getByLabelText('ムードミラー画面')).toBeTruthy();
    expect(getByLabelText('気分選択: とても良い')).toBeTruthy();
    expect(getByLabelText('気分選択: 良い')).toBeTruthy();
    expect(getByLabelText('気分選択: 普通')).toBeTruthy();
  });

  it('ローディング状態が適切に表示される', async () => {
    const { getByText, getByTestId, getByPlaceholderText } = render(
      <MoodMirrorScreen />
    );

    // APIコールを遅延させるモック
    global.fetch = jest.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );

    // 送信処理を実行
    const happyButton = getByTestId('mood-happy');
    fireEvent.press(happyButton);
    fireEvent.press(getByText('次へ'));

    await waitFor(() => {
      const textInput = getByPlaceholderText('自由に入力してください...');
      fireEvent.changeText(textInput, 'テストイベント');
      fireEvent.press(getByText('次へ'));
    });

    await waitFor(() => {
      const textInput = getByPlaceholderText('自由に入力してください...');
      fireEvent.changeText(textInput, '明日も頑張りたい');
    });

    const submitButton = getByText('送信');
    fireEvent.press(submitButton);

    // ローディング状態が表示されることを確認
    expect(getByTestId('mood-loading')).toBeTruthy();
  });
});