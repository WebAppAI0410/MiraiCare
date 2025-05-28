// レスポンシブユーティリティのモックを使用
import {
  isTablet,
  isLargeTablet,
  responsiveSize,
  responsiveFontSize,
  responsiveSpacing,
  getColumnCount,
  getScreenPadding,
  getButtonHeight,
  getCardLayout,
  getMinTouchTarget,
  getIconSize,
  isLandscape,
  getMaxTextLines,
  getDeviceInfo,
  __setMockDimensions,
} from '../../src/utils/responsive';

jest.mock('../../src/utils/responsive');

describe('responsive utilities', () => {
  beforeEach(() => {
    // デフォルトをiPhone Xサイズにリセット
    (__setMockDimensions as any)(375, 812);
    jest.clearAllMocks();
  });

  describe('isTablet', () => {
    it('iPhoneではfalseを返す', () => {
      expect(isTablet()).toBe(false);
    });

    it('iPadではtrueを返す', () => {
      (__setMockDimensions as any)(768, 1024);
      expect(isTablet()).toBe(true);
    });

    it('AndroidタブレットではtrueをA返す', () => {
      (__setMockDimensions as any)(600, 960);
      expect(isTablet()).toBe(true);
    });
  });

  describe('isLargeTablet', () => {
    it('大型タブレットでtrueを返す', () => {
      (__setMockDimensions as any)(1024, 1366);
      expect(isLargeTablet()).toBe(true);
    });

    it('通常のタブレットでfalseを返す', () => {
      (__setMockDimensions as any)(768, 1024);
      expect(isLargeTablet()).toBe(false);
    });
  });

  describe('responsiveSize', () => {
    it('スマートフォンでは第1引数の値を返す', () => {
      expect(responsiveSize(10, 20, 30)).toBe(10);
    });

    it('タブレットでは第2引数の値を返す', () => {
      (__setMockDimensions as any)(768, 1024);
      expect(responsiveSize(10, 20, 30)).toBe(20);
    });

    it('大型タブレットでは第3引数の値を返す', () => {
      (__setMockDimensions as any)(1024, 1366);
      expect(responsiveSize(10, 20, 30)).toBe(30);
    });
  });

  describe('responsiveFontSize', () => {
    it('基準サイズ（375px）では元のサイズを返す', () => {
      expect(responsiveFontSize(16)).toBe(16);
    });

    it('大きい画面ではサイズが拡大される', () => {
      (__setMockDimensions as any)(414, 896);
      const scaledSize = responsiveFontSize(16);
      expect(scaledSize).toBeGreaterThan(16);
    });

    it('タブレットでは0.85倍にスケールされる', () => {
      (__setMockDimensions as any)(768, 1024);
      const scaledSize = responsiveFontSize(20);
      // タブレットでは768/375*20*0.85 = 約35になる
      expect(scaledSize).toBe(35);
    });
  });

  describe('responsiveSpacing', () => {
    it('スマートフォンでは元のサイズを返す', () => {
      expect(responsiveSpacing(16)).toBe(16);
    });

    it('タブレットでは1.25倍になる', () => {
      (__setMockDimensions as any)(768, 1024);
      expect(responsiveSpacing(16)).toBe(20);
    });

    it('大型タブレットでは1.5倍になる', () => {
      (__setMockDimensions as any)(1024, 1366);
      expect(responsiveSpacing(16)).toBe(24);
    });
  });

  describe('getColumnCount', () => {
    it('スマートフォンでは1カラム', () => {
      expect(getColumnCount()).toBe(1);
    });

    it('タブレットでは2カラム', () => {
      (__setMockDimensions as any)(768, 1024);
      expect(getColumnCount()).toBe(2);
    });

    it('大型タブレットでは3カラム', () => {
      (__setMockDimensions as any)(1024, 1366);
      expect(getColumnCount()).toBe(3);
    });
  });

  describe('getScreenPadding', () => {
    it('スマートフォンでは16px', () => {
      expect(getScreenPadding()).toBe(16);
    });

    it('タブレットでは24px', () => {
      (__setMockDimensions as any)(768, 1024);
      expect(getScreenPadding()).toBe(24);
    });

    it('大型タブレットでは32px', () => {
      (__setMockDimensions as any)(1024, 1366);
      expect(getScreenPadding()).toBe(32);
    });
  });

  describe('getButtonHeight', () => {
    it('スマートフォンでは56px', () => {
      expect(getButtonHeight()).toBe(56);
    });

    it('タブレットでは64px', () => {
      (__setMockDimensions as any)(768, 1024);
      expect(getButtonHeight()).toBe(64);
    });
  });

  describe('getCardLayout', () => {
    it('スマートフォンでは全幅のカードを返す', () => {
      const layout = getCardLayout();
      expect(layout.columns).toBe(1);
      expect(layout.cardWidth).toBeLessThan(375); // パディングを引いた値
    });

    it('タブレットでは2カラムレイアウトを返す', () => {
      (__setMockDimensions as any)(768, 1024);
      const layout = getCardLayout();
      expect(layout.columns).toBe(2);
      expect(layout.cardWidth).toBeLessThan(384); // 約半分
    });
  });

  describe('getMinTouchTarget', () => {
    it('スマートフォンでは48px', () => {
      expect(getMinTouchTarget()).toBe(48);
    });

    it('タブレットでは64px', () => {
      (__setMockDimensions as any)(768, 1024);
      expect(getMinTouchTarget()).toBe(64);
    });
  });

  describe('getIconSize', () => {
    it('スマートフォンではベースサイズを返す', () => {
      expect(getIconSize(24)).toBe(24);
    });

    it('タブレットでは1.25倍', () => {
      (__setMockDimensions as any)(768, 1024);
      expect(getIconSize(24)).toBe(30);
    });

    it('大型タブレットでは1.5倍', () => {
      (__setMockDimensions as any)(1024, 1366);
      expect(getIconSize(24)).toBe(36);
    });
  });

  describe('isLandscape', () => {
    it('縦向きではfalse', () => {
      expect(isLandscape()).toBe(false);
    });

    it('横向きではtrue', () => {
      (__setMockDimensions as any)(812, 375);
      expect(isLandscape()).toBe(true);
    });
  });

  describe('getMaxTextLines', () => {
    it('スマートフォンでは3行', () => {
      expect(getMaxTextLines()).toBe(3);
    });

    it('タブレットでは4行', () => {
      (__setMockDimensions as any)(768, 1024);
      expect(getMaxTextLines()).toBe(4);
    });
  });

  describe('getDeviceInfo', () => {
    it('デバイス情報を正しく返す', () => {
      const info = getDeviceInfo();
      expect(info).toEqual({
        isTablet: false,
        isLargeTablet: false,
        isLandscape: false,
        screenWidth: 375,
        screenHeight: 812,
        pixelRatio: 3,
        fontScale: 1,
      });
    });
  });
});