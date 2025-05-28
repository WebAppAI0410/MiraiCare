import { Platform } from 'react-native';
import {
  androidEmailInputFix,
  androidScreenTransitionFix,
  androidKeyboardAvoidingViewProps,
  androidElevationStyle,
  validateEmailForAndroid,
  androidScrollViewOptimization,
} from '../../src/utils/android-fixes';

// Platform.OSのモック
jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
    select: jest.fn((obj) => obj.android || obj.default),
  },
  TextInput: {
    State: {
      currentlyFocusedInput: jest.fn(() => ({
        blur: jest.fn(),
      })),
    },
  },
}));

describe('android-fixes', () => {
  describe('androidEmailInputFix', () => {
    it('Androidでメール入力フィールドの設定が適用される', () => {
      expect(androidEmailInputFix).toEqual({
        autoCorrect: false,
        autoCapitalize: 'none',
        textContentType: 'emailAddress',
        importantForAutofill: 'no',
        keyboardType: 'email-address',
      });
    });
  });

  describe('androidScreenTransitionFix', () => {
    it('Androidで画面遷移のアニメーション設定が適用される', () => {
      expect(androidScreenTransitionFix).toHaveProperty('cardStyleInterpolator');
    });
  });

  describe('androidKeyboardAvoidingViewProps', () => {
    it('AndroidではbehaviorがundefinedになるI', () => {
      expect(androidKeyboardAvoidingViewProps).toEqual({
        behavior: undefined,
        keyboardVerticalOffset: 0,
      });
    });
  });

  describe('androidElevationStyle', () => {
    it('Androidでelevationスタイルが適用される', () => {
      const style = androidElevationStyle(4);
      expect(style).toEqual({ elevation: 4 });
    });
  });

  describe('validateEmailForAndroid', () => {
    it('有効なメールアドレスを正しく検証する', () => {
      expect(validateEmailForAndroid('test@example.com')).toBe(true);
      expect(validateEmailForAndroid('user.name+tag@example.co.jp')).toBe(true);
    });

    it('無効なメールアドレスを正しく拒否する', () => {
      expect(validateEmailForAndroid('')).toBe(false);
      expect(validateEmailForAndroid('invalid')).toBe(false);
      expect(validateEmailForAndroid('@example.com')).toBe(false);
      expect(validateEmailForAndroid('test@')).toBe(false);
    });

    it('空白文字を含むメールアドレスをクリーンアップする', () => {
      expect(validateEmailForAndroid(' test@example.com ')).toBe(true);
      expect(validateEmailForAndroid('test @example.com')).toBe(true); // 内部の空白も除去
    });

    it('非破壊スペースを含むメールアドレスをクリーンアップする', () => {
      expect(validateEmailForAndroid('test\u00A0@example.com')).toBe(true);
    });
  });

  describe('androidScrollViewOptimization', () => {
    it('AndroidでScrollViewの最適化設定が適用される', () => {
      expect(androidScrollViewOptimization).toEqual({
        nestedScrollEnabled: true,
        removeClippedSubviews: true,
        scrollEventThrottle: 16,
      });
    });
  });
});

// iOS用のテスト
describe('android-fixes - iOS', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.doMock('react-native', () => ({
      Platform: {
        OS: 'ios',
        select: jest.fn((obj) => obj.ios || obj.default),
      },
      TextInput: {
        State: {
          currentlyFocusedInput: jest.fn(() => ({
            blur: jest.fn(),
          })),
        },
      },
    }));
  });

  afterEach(() => {
    jest.resetModules();
  });

  it('iOSではandroidEmailInputFixが空オブジェクトを返す', () => {
    const { androidEmailInputFix } = require('../../src/utils/android-fixes');
    expect(androidEmailInputFix).toEqual({});
  });

  it('iOSではKeyboardAvoidingViewのbehaviorがpaddingになる', () => {
    const { androidKeyboardAvoidingViewProps } = require('../../src/utils/android-fixes');
    expect(androidKeyboardAvoidingViewProps).toEqual({
      behavior: 'padding',
      keyboardVerticalOffset: 0,
    });
  });

  it('iOSではelevationの代わりにshadowスタイルが適用される', () => {
    const { androidElevationStyle } = require('../../src/utils/android-fixes');
    const style = androidElevationStyle(4);
    expect(style).toHaveProperty('shadowColor');
    expect(style).toHaveProperty('shadowOffset');
    expect(style).toHaveProperty('shadowOpacity');
    expect(style).toHaveProperty('shadowRadius');
  });
});