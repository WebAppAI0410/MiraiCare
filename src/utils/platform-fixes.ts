import { Platform, ViewStyle, TextStyle } from 'react-native';

// Web環境でのTouchableOpacityの問題を修正
export const webTouchableOpacityFix = Platform.select<ViewStyle>({
  web: {
    cursor: 'pointer' as any,
    userSelect: 'none' as any,
    WebkitTapHighlightColor: 'transparent' as any,
    transition: 'opacity 0.2s' as any,
  } as ViewStyle,
  default: {},
});

// Web環境でのScrollViewの問題を修正
export const webScrollViewFix = Platform.select<ViewStyle>({
  web: {
    height: '100%' as any,
    overflowY: 'auto' as any,
  } as ViewStyle,
  default: {},
});

// Web環境でのTextInputの問題を修正
export const webTextInputFix = Platform.select<TextStyle>({
  web: {
    outlineStyle: 'none' as any,
    boxSizing: 'border-box' as any,
  } as TextStyle,
  default: {},
});