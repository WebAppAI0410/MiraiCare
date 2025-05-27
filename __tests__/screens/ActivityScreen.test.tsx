import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import ActivityScreen from '../../src/screens/ActivityScreen';
import { pedometerService } from '../../src/services/pedometerService';
import { auth } from '../../src/config/firebase';

// モックの設定
jest.mock('../../src/services/pedometerService', () => ({
  pedometerService: {
    isAvailable: jest.fn(),
    requestPermissions: jest.fn(),
    getTodaySteps: jest.fn(),
    getWeeklyHistory: jest.fn(),
    calculateDistance: jest.fn(),
    calculateCalories: jest.fn(),
    calculateWeeklyAverage: jest.fn(),
    calculateAchievementRate: jest.fn(),
    startWatching: jest.fn(),
    stopWatching: jest.fn(),
    showAchievementAlert: jest.fn(),
  },
}));

jest.mock('../../src/config/firebase', () => ({
  auth: {
    currentUser: { uid: 'test-user-id' },
  },
}));

jest.spyOn(Alert, 'alert');

describe('ActivityScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // デフォルトのモック設定
    (pedometerService.isAvailable as jest.Mock).mockResolvedValue(true);
    (pedometerService.requestPermissions as jest.Mock).mockResolvedValue({
      granted: true,
      status: 'granted',
    });
    (pedometerService.getTodaySteps as jest.Mock).mockResolvedValue(5000);
    (pedometerService.getWeeklyHistory as jest.Mock).mockResolvedValue([
      { date: '2024-01-20', steps: 5000 },
      { date: '2024-01-21', steps: 6000 },
      { date: '2024-01-22', steps: 4500 },
      { date: '2024-01-23', steps: 7000 },
      { date: '2024-01-24', steps: 5500 },
      { date: '2024-01-25', steps: 6500 },
      { date: '2024-01-26', steps: 8000 },
    ]);
    (pedometerService.calculateDistance as jest.Mock).mockReturnValue(3.5);
    (pedometerService.calculateCalories as jest.Mock).mockReturnValue(250);
    (pedometerService.calculateWeeklyAverage as jest.Mock).mockReturnValue(6071);
    (pedometerService.calculateAchievementRate as jest.Mock).mockReturnValue(62.5);
  });

  describe('画面表示', () => {
    it('画面が正常にレンダリングされる', async () => {
      const { getByText } = render(<ActivityScreen />);
      
      await waitFor(() => {
        expect(getByText('アクティビティ')).toBeTruthy();
      });
    });

    it('今日の歩数が表示される', async () => {
      const { getByText, getAllByText } = render(<ActivityScreen />);
      
      await waitFor(() => {
        // 複数の5,000が表示される可能性があるので、最初のものを確認
        const stepsElements = getAllByText('5,000');
        expect(stepsElements.length).toBeGreaterThan(0);
        expect(getByText('歩')).toBeTruthy();
      });
    });

    it('推定距離とカロリーが表示される', async () => {
      const { getByText } = render(<ActivityScreen />);
      
      await waitFor(() => {
        expect(getByText('3.5 km')).toBeTruthy();
        expect(getByText('250 kcal')).toBeTruthy();
      });
    });

    it('週間平均が表示される', async () => {
      const { getByText } = render(<ActivityScreen />);
      
      await waitFor(() => {
        // テキストが分割されている可能性があるので、部分一致で確認
        expect(getByText(/週間平均:/)).toBeTruthy();
        expect(getByText(/6,071歩/)).toBeTruthy();
      });
    });
  });

  describe('パーミッション処理', () => {
    it('歩数計が利用不可の場合エラーメッセージを表示', async () => {
      (pedometerService.isAvailable as jest.Mock).mockResolvedValue(false);
      
      const { getByText } = render(<ActivityScreen />);
      
      await waitFor(() => {
        expect(getByText('歩数計が利用できません')).toBeTruthy();
        expect(getByText('このデバイスは歩数計測に対応していません。')).toBeTruthy();
      });
    });

    it('パーミッションが拒否された場合警告を表示', async () => {
      (pedometerService.requestPermissions as jest.Mock).mockResolvedValue({
        granted: false,
        status: 'denied',
      });
      
      render(<ActivityScreen />);
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'パーミッションが必要です',
          '歩数を計測するには、モーションセンサーへのアクセス許可が必要です。',
          expect.any(Array)
        );
      });
    });
  });

  describe('週間グラフ', () => {
    it('過去7日間の歩数グラフが表示される', async () => {
      const { getByTestId } = render(<ActivityScreen />);
      
      await waitFor(() => {
        // 7日分のバーが表示されることを確認
        for (let i = 0; i < 7; i++) {
          expect(getByTestId(`step-bar-${i}`)).toBeTruthy();
        }
      });
    });

    it('各日の歩数と日付が表示される', async () => {
      const { getByText } = render(<ActivityScreen />);
      
      await waitFor(() => {
        // 最新日（今日）の歩数が表示される
        expect(getByText('8,000')).toBeTruthy();
        expect(getByText('1/26')).toBeTruthy();
      });
    });
  });

  describe('リアルタイム更新', () => {
    it('歩数の変化をリアルタイムで監視する', async () => {
      const mockSubscription = { remove: jest.fn() };
      (pedometerService.startWatching as jest.Mock).mockResolvedValue(mockSubscription);
      
      render(<ActivityScreen />);
      
      await waitFor(() => {
        expect(pedometerService.startWatching).toHaveBeenCalled();
      });
    });

    it('画面を離れる時に監視を停止する', async () => {
      const mockSubscription = { remove: jest.fn() };
      (pedometerService.startWatching as jest.Mock).mockResolvedValue(mockSubscription);
      
      const { unmount } = render(<ActivityScreen />);
      
      await waitFor(() => {
        expect(pedometerService.startWatching).toHaveBeenCalled();
      });
      
      unmount();
      
      expect(mockSubscription.remove).toHaveBeenCalled();
    });
  });

  describe('データ更新', () => {
    it('プルトゥリフレッシュでデータを更新できる', async () => {
      const { getByTestId } = render(<ActivityScreen />);
      
      await waitFor(() => {
        expect(pedometerService.getTodaySteps).toHaveBeenCalledTimes(1);
      });
      
      const scrollView = getByTestId('activity-scroll-view');
      
      // プルトゥリフレッシュをシミュレート
      const { refreshControl } = scrollView.props;
      await refreshControl.props.onRefresh();
      
      await waitFor(() => {
        expect(pedometerService.getTodaySteps).toHaveBeenCalledTimes(2); // 初回 + リフレッシュ
        expect(pedometerService.getWeeklyHistory).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('データ取得エラー時にエラーメッセージを表示', async () => {
      (pedometerService.getTodaySteps as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );
      
      render(<ActivityScreen />);
      
      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'データ取得エラー',
          '歩数データの取得に失敗しました。',
          expect.any(Array)
        );
      });
    });
  });

  describe('目標設定', () => {
    it('歩数目標に対する達成率が表示される', async () => {
      const { getByText } = render(<ActivityScreen />);
      
      await waitFor(() => {
        // デフォルト目標8000歩に対して5000歩 = 62.5%
        expect(getByText(/62\.5%/)).toBeTruthy();
        expect(getByText('目標達成率')).toBeTruthy();
      });
    });

    it('目標達成時に祝福メッセージが表示される', async () => {
      (pedometerService.getTodaySteps as jest.Mock).mockResolvedValue(8500);
      (pedometerService.calculateAchievementRate as jest.Mock).mockReturnValue(106.25);
      
      const { getByText } = render(<ActivityScreen />);
      
      await waitFor(() => {
        expect(getByText(/🎉 目標達成！/)).toBeTruthy();
      });
      
      // showAchievementAlertが呼ばれることも確認
      expect(pedometerService.showAchievementAlert).toHaveBeenCalled();
    });
  });
});