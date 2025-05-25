// Jest設定ファイル
import 'react-native-gesture-handler/jestSetup';

// react-native-reanimated/lib/reanimated2/jestUtils のモック
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// react-native-vector-icons のモック
jest.mock('react-native-vector-icons/Ionicons', () => 'Icon');

// expo関連のモック
jest.mock('expo-constants', () => ({
  default: {
    appOwnership: 'standalone',
  },
}));

// Firebase のモック
jest.mock('@react-native-firebase/app', () => () => ({
  onReady: jest.fn(() => Promise.resolve()),
}));

// ネイティブモジュールのモック
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    NativeModules: {
      ...RN.NativeModules,
    },
  };
});

// グローバルfetchのモック
global.fetch = jest.fn();

// console.warnの抑制（テスト時のノイズ削減）
console.warn = jest.fn();