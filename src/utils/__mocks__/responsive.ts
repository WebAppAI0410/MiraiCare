// レスポンシブユーティリティのモック実装
let mockIsTablet = false;
let mockIsLargeTablet = false;
let mockScreenWidth = 375;
let mockScreenHeight = 812;

export const __setMockDimensions = (width: number, height: number) => {
  mockScreenWidth = width;
  mockScreenHeight = height;
  
  // デバイスタイプの判定も更新（iOS基準）
  const aspectRatio = height / width;
  mockIsTablet = (aspectRatio < 1.6) || (Math.min(width, height) >= 600);
  mockIsLargeTablet = mockIsTablet && Math.min(width, height) >= 768;
  
  // 768x1024は通常のiPad、それ以上が大型タブレット
  if (width === 768 && height === 1024) {
    mockIsTablet = true;
    mockIsLargeTablet = false;
  }
};

export const isTablet = jest.fn(() => mockIsTablet);
export const isLargeTablet = jest.fn(() => mockIsLargeTablet);

export const responsiveSize = jest.fn((phoneSize: number, tabletSize?: number, largeTabletSize?: number) => {
  if (mockIsLargeTablet && largeTabletSize) return largeTabletSize;
  if (mockIsTablet && tabletSize) return tabletSize;
  return phoneSize;
});

export const responsiveFontSize = jest.fn((size: number) => {
  const scale = mockScreenWidth / 375;
  const newSize = size * scale;
  
  if (mockIsTablet) {
    return Math.round(newSize * 0.85);
  }
  
  return Math.round(newSize);
});

export const responsiveSpacing = jest.fn((size: number) => {
  if (mockIsLargeTablet) return size * 1.5;
  if (mockIsTablet) return size * 1.25;
  return size;
});

export const getColumnCount = jest.fn(() => {
  if (mockIsLargeTablet) return 3;
  if (mockIsTablet) return 2;
  return 1;
});

export const getScreenPadding = jest.fn(() => {
  if (mockIsLargeTablet) return 32;
  if (mockIsTablet) return 24;
  return 16;
});

export const getButtonHeight = jest.fn(() => {
  if (mockIsTablet) return 64;
  return 56;
});

export const getCardLayout = jest.fn(() => {
  const padding = getScreenPadding();
  const columns = getColumnCount();
  const spacing = responsiveSpacing(12);
  
  const totalSpacing = (columns - 1) * spacing + (padding * 2);
  const cardWidth = (mockScreenWidth - totalSpacing) / columns;
  
  return { cardWidth, spacing, columns };
});

export const getMinTouchTarget = jest.fn(() => {
  if (mockIsTablet) return 64;
  return 48;
});

export const getIconSize = jest.fn((baseSize: number = 24) => {
  if (mockIsLargeTablet) return baseSize * 1.5;
  if (mockIsTablet) return baseSize * 1.25;
  return baseSize;
});

export const isLandscape = jest.fn(() => mockScreenWidth > mockScreenHeight);

export const getMaxTextLines = jest.fn(() => {
  if (mockIsTablet) return 4;
  return 3;
});

export const getDeviceInfo = jest.fn(() => ({
  isTablet: mockIsTablet,
  isLargeTablet: mockIsLargeTablet,
  isLandscape: mockScreenWidth > mockScreenHeight,
  screenWidth: mockScreenWidth,
  screenHeight: mockScreenHeight,
  pixelRatio: 3,
  fontScale: 1,
}));