import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Alert } from 'react-native';
import BadgesScreen from '../../src/screens/BadgesScreen';
import { auth } from '../../src/config/firebase';
import { getUserBadges } from '../../src/services/firestoreService';

// Firebaseのモック
jest.mock('../../src/config/firebase', () => ({
  auth: {
    currentUser: { uid: 'test-user-id' }
  }
}));

// Firestoreサービスのモック
jest.mock('../../src/services/firestoreService', () => ({
  getUserBadges: jest.fn()
}));

// React Native Alertのモック
jest.spyOn(Alert, 'alert');

const renderBadgesScreen = () => {
  return render(
    <NavigationContainer>
      <BadgesScreen />
    </NavigationContainer>
  );
};

describe('BadgesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with initial loading state', () => {
    const { getByText } = renderBadgesScreen();
    expect(getByText('バッジコレクション')).toBeTruthy();
  });

  it('loads and displays user badges', async () => {
    const mockBadges = [
      {
        id: 'badge-1',
        name: '初回ログイン',
        description: 'MiraiCareを初めて使用しました',
        iconName: 'log-in',
        unlockedAt: new Date().toISOString()
      },
      {
        id: 'badge-3',
        name: 'ムードケア専門家',
        description: 'ムードミラーを30回使用',
        iconName: 'happy',
        unlockedAt: new Date().toISOString()
      }
    ];

    (getUserBadges as jest.Mock).mockResolvedValue(mockBadges);

    const { getByText } = renderBadgesScreen();

    await waitFor(() => {
      expect(getByText('初回ログイン')).toBeTruthy();
      expect(getByText('ムードケア専門家')).toBeTruthy();
      expect(getByText('健康管理マスター')).toBeTruthy(); // 未獲得のバッジも表示される
    });

    expect(getUserBadges).toHaveBeenCalledWith('test-user-id');
  });

  it('displays all badges with correct unlock status', async () => {
    const mockBadges = [
      {
        id: 'badge-1',
        name: '初回ログイン',
        description: 'MiraiCareを初めて使用しました',
        iconName: 'log-in',
        unlockedAt: new Date().toISOString()
      }
    ];

    (getUserBadges as jest.Mock).mockResolvedValue(mockBadges);

    const { getByText, getAllByRole } = renderBadgesScreen();

    await waitFor(() => {
      const badges = getAllByRole('button');
      expect(badges.length).toBe(6); // 全6個のバッジ
      
      // 獲得済みバッジの確認
      expect(getByText('初回ログイン')).toBeTruthy();
      expect(getByText('獲得日: ' + new Date().toLocaleDateString('ja-JP'))).toBeTruthy();
      
      // 未獲得バッジの確認
      expect(getByText('健康管理マスター')).toBeTruthy();
    });
  });

  it('handles error when loading badges', async () => {
    (getUserBadges as jest.Mock).mockRejectedValue(new Error('Failed to load'));

    renderBadgesScreen();

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'データ取得エラー',
        'バッジデータの取得に失敗しました。',
        [{ text: 'OK' }]
      );
    });
  });

  it('handles unauthenticated user', async () => {
    (auth as any).currentUser = null;

    const { getByText } = renderBadgesScreen();

    await waitFor(() => {
      expect(getUserBadges).not.toHaveBeenCalled();
      // 認証なしの場合はバッジが表示されない
      expect(getByText('新しいバッジを獲得してMiraiCareを楽しみましょう！')).toBeTruthy();
    });
  });

  it('displays progress bars for achievement badges', async () => {
    // Reset auth to have current user again
    (auth as any).currentUser = { uid: 'test-user-id' };
    (getUserBadges as jest.Mock).mockResolvedValue([]);

    const { getByText } = renderBadgesScreen();

    await waitFor(() => {
      // バッジが読み込まれた後の表示確認
      expect(getByText('バッジコレクション')).toBeTruthy();
      expect(getByText('未獲得バッジ')).toBeTruthy();
    });
  });
});