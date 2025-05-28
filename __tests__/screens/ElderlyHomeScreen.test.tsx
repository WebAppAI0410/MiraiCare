/**
 * 高齢者向けHomeScreenのテスト
 * UX/UI改善とナビゲーション動線のテスト
 */

import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ElderlyHomeScreen } from '../../src/screens/ElderlyHomeScreen';

// モック
jest.mock('react-native-vector-icons/MaterialIcons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  
  return (props: any) => React.createElement(Text, { testID: 'mock-icon', ...props }, props.name || 'Icon');
});

jest.mock('../../src/services/firestoreService', () => ({
  firestoreService: {
    getUserProfile: jest.fn(),
    getLatestRiskAssessment: jest.fn(),
    getTodayStepData: jest.fn(),
    getTodayMoodData: jest.fn(),
  },
}));

jest.mock('../../src/services/riskCalculationService', () => ({
  calculateOverallRisk: jest.fn(),
}));

const mockNavigation = {
  navigate: jest.fn(),
};

describe('ElderlyHomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // デフォルトで成功レスポンスを設定
    const { firestoreService } = require('../../src/services/firestoreService');
    const { calculateOverallRisk } = require('../../src/services/riskCalculationService');
    
    firestoreService.getUserProfile.mockResolvedValue({
      id: 'user1',
      fullName: 'テストユーザー',
      email: 'test@example.com',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    });
    
    firestoreService.getLatestRiskAssessment.mockResolvedValue({
      id: 'risk1',
      userId: 'user1',
      overallRisk: 30,
      createdAt: '2024-01-01',
    });
    
    firestoreService.getTodayStepData.mockResolvedValue({
      id: 'step1',
      userId: 'user1',
      steps: 8500,
      date: '2024-01-01',
    });
    
    firestoreService.getTodayMoodData.mockResolvedValue({
      id: 'mood1',
      userId: 'user1',
      mood: '良い',
      date: '2024-01-01',
    });
    
    calculateOverallRisk.mockReturnValue(30);
  });

  describe('ダッシュボードレイアウト', () => {
    it('高齢者向けの大きなカードレイアウトを表示する', async () => {
      const { getByTestId, getByText } = render(
        <ElderlyHomeScreen navigation={mockNavigation as any} />
      );

      // メインカードが表示される
      await waitFor(() => {
        expect(getByTestId('health-status-card')).toBeDefined();
        expect(getByTestId('today-activity-card')).toBeDefined();
        expect(getByTestId('quick-actions-card')).toBeDefined();
      });

      // カードタイトルが大きなフォントで表示される
      expect(getByText('今日の健康状態')).toBeDefined();
      expect(getByText('今日の活動')).toBeDefined();
      expect(getByText('よく使う機能')).toBeDefined();
    });

    it('健康状態を色と大きなアイコンで表示する', async () => {
      const { getByTestId } = render(
        <ElderlyHomeScreen navigation={mockNavigation as any} />
      );

      await waitFor(() => {
        const healthStatusCard = getByTestId('health-status-card');
        expect(healthStatusCard).toBeDefined();

        // リスクレベルのアイコンが表示される
        const riskIcon = getByTestId('risk-level-icon');
        expect(riskIcon).toBeDefined();

        // リスクレベルのテキストが表示される
        const riskText = getByTestId('risk-level-text');
        expect(riskText).toBeDefined();
      });
    });
  });

  describe('ナビゲーション動線', () => {
    it('「気分を記録」ボタンでムードミラー画面に遷移する', async () => {
      const { getByTestId } = render(
        <ElderlyHomeScreen navigation={mockNavigation as any} />
      );

      await waitFor(() => {
        const moodButton = getByTestId('mood-record-button');
        fireEvent.press(moodButton);
      });

      expect(mockNavigation.navigate).toHaveBeenCalledWith('MoodMirror');
    });

    it('「歩数を確認」ボタンで活動画面に遷移する', async () => {
      const { getByTestId } = render(
        <ElderlyHomeScreen navigation={mockNavigation as any} />
      );

      await waitFor(() => {
        const activityButton = getByTestId('activity-view-button');
        fireEvent.press(activityButton);
      });

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Activity');
    });

    it('「レポートを見る」ボタンでレポート画面に遷移する', async () => {
      const { getByTestId } = render(
        <ElderlyHomeScreen navigation={mockNavigation as any} />
      );

      await waitFor(() => {
        const reportButton = getByTestId('report-view-button');
        fireEvent.press(reportButton);
      });

      expect(mockNavigation.navigate).toHaveBeenCalledWith('Report');
    });

    it('「設定」ボタンで設定画面に遷移する', async () => {
      const { getByTestId } = render(
        <ElderlyHomeScreen navigation={mockNavigation as any} />
      );

      await waitFor(() => {
        const settingsButton = getByTestId('settings-button');
        fireEvent.press(settingsButton);
      });

      expect(mockNavigation.navigate).toHaveBeenCalledWith('NotificationSettings');
    });
  });

  describe('アクセシビリティ', () => {
    it('すべてのボタンに適切なアクセシビリティラベルがある', async () => {
      const { getByLabelText } = render(
        <ElderlyHomeScreen navigation={mockNavigation as any} />
      );

      await waitFor(() => {
        expect(getByLabelText('気分を記録する')).toBeDefined();
        expect(getByLabelText('歩数を確認する')).toBeDefined();
        expect(getByLabelText('健康レポートを見る')).toBeDefined();
        expect(getByLabelText('設定を開く')).toBeDefined();
      });
    });

    it('健康状態カードに説明的なアクセシビリティラベルがある', async () => {
      const { getByLabelText } = render(
        <ElderlyHomeScreen navigation={mockNavigation as any} />
      );

      await waitFor(() => {
        const healthCard = getByLabelText(/現在の健康状態/);
        expect(healthCard).toBeDefined();
      });
    });
  });

  describe('エラーハンドリング', () => {
    it('データ取得エラー時に分かりやすいメッセージを表示する', async () => {
      // テスト専用のエラーモックを設定
      jest.clearAllMocks();
      const { firestoreService } = require('../../src/services/firestoreService');
      firestoreService.getUserProfile.mockRejectedValue(new Error('ネットワークエラー'));
      firestoreService.getLatestRiskAssessment.mockRejectedValue(new Error('ネットワークエラー'));
      firestoreService.getTodayStepData.mockRejectedValue(new Error('ネットワークエラー'));
      firestoreService.getTodayMoodData.mockRejectedValue(new Error('ネットワークエラー'));

      const { getByText } = render(
        <ElderlyHomeScreen navigation={mockNavigation as any} />
      );

      await waitFor(() => {
        expect(getByText(/データを取得できませんでした/)).toBeDefined();
        expect(getByText(/もう一度お試しください/)).toBeDefined();
      });
    });

    it('エラー時に「再試行」ボタンを表示する', async () => {
      // テスト専用のエラーモックを設定
      jest.clearAllMocks();
      const { firestoreService } = require('../../src/services/firestoreService');
      firestoreService.getUserProfile.mockRejectedValue(new Error('ネットワークエラー'));
      firestoreService.getLatestRiskAssessment.mockRejectedValue(new Error('ネットワークエラー'));
      firestoreService.getTodayStepData.mockRejectedValue(new Error('ネットワークエラー'));
      firestoreService.getTodayMoodData.mockRejectedValue(new Error('ネットワークエラー'));

      const { getByTestId } = render(
        <ElderlyHomeScreen navigation={mockNavigation as any} />
      );

      await waitFor(() => {
        const retryButton = getByTestId('retry-button');
        expect(retryButton).toBeDefined();
      });
    });
  });

  describe('パフォーマンス', () => {
    it('初期表示時にローディング状態を表示する', () => {
      // すべてのサービスを遅延させてローディング状態を確認
      jest.clearAllMocks();
      const { firestoreService } = require('../../src/services/firestoreService');
      
      // 永続的なPendingプロミスを作成してローディング状態を維持
      firestoreService.getUserProfile.mockReturnValue(new Promise(() => {}));
      firestoreService.getLatestRiskAssessment.mockReturnValue(new Promise(() => {}));
      firestoreService.getTodayStepData.mockReturnValue(new Promise(() => {}));
      firestoreService.getTodayMoodData.mockReturnValue(new Promise(() => {}));

      const { getByTestId } = render(
        <ElderlyHomeScreen navigation={mockNavigation as any} />
      );

      expect(getByTestId('loading-indicator')).toBeDefined();
    });

    it('データ取得完了後にローディングが非表示になる', async () => {
      // デフォルトの成功モックが設定されているので、ローディングは完了するはず
      const { queryByTestId, getByTestId } = render(
        <ElderlyHomeScreen navigation={mockNavigation as any} />
      );

      // 最初はローディングが表示される
      expect(queryByTestId('loading-indicator')).not.toBeNull();

      // データ取得完了後はカードが表示されローディングが非表示になる
      await waitFor(() => {
        expect(getByTestId('health-status-card')).toBeDefined();
        expect(queryByTestId('loading-indicator')).toBeNull();
      });
    });
  });
});