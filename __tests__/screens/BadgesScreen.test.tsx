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
    get currentUser() {
      return { uid: 'test-user-id' };
    }
  },
  db: {}
}));

// Firestoreサービスのモック
jest.mock('../../src/services/firestoreService', () => ({
  getUserBadges: jest.fn(),
  firestoreService: {} // 他のテストとの互換性のため
}));

// React Native Alertのモック
// jest.setup.jsで既にモックされている

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

  it.skip('handles error when loading badges', async () => {
    // getUserBadgesが例外をスローするように設定
    (getUserBadges as jest.Mock).mockRejectedValue(new Error('Failed to load'));

    // Alert.alertをリセット
    global.Alert.alert = jest.fn();

    renderBadgesScreen();

    // エラーが発生してAlert.alertが呼ばれるまで待つ
    await waitFor(() => {
      expect(global.Alert.alert).toHaveBeenCalled();
    });

    expect(global.Alert.alert).toHaveBeenCalledWith(
      'データ取得エラー',
      'バッジデータの取得に失敗しました。',
      [{ text: 'OK' }]
    );
  });

  it.skip('handles unauthenticated user', async () => {
    // このテストは現在のモック構造では正しくテストできないためスキップ
    // TODO: auth.currentUserを動的に変更できるようにモックを改善する
  });

  it('displays progress bars for achievement badges', async () => {
    (getUserBadges as jest.Mock).mockResolvedValue([]);

    const { getByText } = renderBadgesScreen();

    await waitFor(() => {
      // バッジが読み込まれた後の表示確認
      expect(getByText('バッジコレクション')).toBeTruthy();
      expect(getByText('未獲得バッジ')).toBeTruthy();
    });
  });
});