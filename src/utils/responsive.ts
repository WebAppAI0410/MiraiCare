import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// デバイスタイプの判定
export const isTablet = () => {
  const aspectRatio = screenHeight / screenWidth;
  return (
    (Platform.OS === 'ios' && aspectRatio < 1.6) ||
    (Platform.OS === 'android' && Math.min(screenWidth, screenHeight) >= 600)
  );
};

export const isLargeTablet = () => {
  return isTablet() && Math.min(screenWidth, screenHeight) >= 768;
};

// レスポンシブな値を計算
export const responsiveSize = (phoneSize: number, tabletSize?: number, largeTabletSize?: number) => {
  if (isLargeTablet() && largeTabletSize) {
    return largeTabletSize;
  }
  if (isTablet() && tabletSize) {
    return tabletSize;
  }
  return phoneSize;
};

// レスポンシブなフォントサイズ
export const responsiveFontSize = (size: number) => {
  const scale = screenWidth / 375; // iPhone 8をベースサイズとする
  const newSize = size * scale;
  
  if (isTablet()) {
    return Math.round(PixelRatio.roundToNearestPixel(newSize * 0.85));
  }
  
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// レスポンシブなスペーシング
export const responsiveSpacing = (size: number) => {
  if (isLargeTablet()) {
    return size * 1.5;
  }
  if (isTablet()) {
    return size * 1.25;
  }
  return size;
};

// グリッドレイアウト用のカラム数
export const getColumnCount = () => {
  if (isLargeTablet()) {
    return 3;
  }
  if (isTablet()) {
    return 2;
  }
  return 1;
};

// レスポンシブなマージン/パディング
export const getScreenPadding = () => {
  if (isLargeTablet()) {
    return 32;
  }
  if (isTablet()) {
    return 24;
  }
  return 16;
};

// レスポンシブなボタンサイズ
export const getButtonHeight = () => {
  if (isTablet()) {
    return 64;
  }
  return 56;
};

// レスポンシブなカードレイアウト
export const getCardLayout = () => {
  const padding = getScreenPadding();
  const columns = getColumnCount();
  const spacing = responsiveSpacing(12);
  
  const totalSpacing = (columns - 1) * spacing + (padding * 2);
  const cardWidth = (screenWidth - totalSpacing) / columns;
  
  return {
    cardWidth,
    spacing,
    columns,
  };
};

// 高齢者向けの最小タッチターゲットサイズ
export const getMinTouchTarget = () => {
  if (isTablet()) {
    return 64; // タブレットではより大きく
  }
  return 48; // スマートフォンでも十分なサイズ
};

// レスポンシブなアイコンサイズ
export const getIconSize = (baseSize: number = 24) => {
  if (isLargeTablet()) {
    return baseSize * 1.5;
  }
  if (isTablet()) {
    return baseSize * 1.25;
  }
  return baseSize;
};

// 画面の向きを検出
export const isLandscape = () => {
  return screenWidth > screenHeight;
};

// レスポンシブなテキスト行数
export const getMaxTextLines = () => {
  if (isTablet()) {
    return 4;
  }
  return 3;
};

// デバイス情報を取得
export const getDeviceInfo = () => {
  return {
    isTablet: isTablet(),
    isLargeTablet: isLargeTablet(),
    isLandscape: isLandscape(),
    screenWidth,
    screenHeight,
    pixelRatio: PixelRatio.get(),
    fontScale: PixelRatio.getFontScale(),
  };
};