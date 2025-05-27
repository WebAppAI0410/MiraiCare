import { Platform } from 'react-native';

// Web環境でのTouchableOpacityの問題を修正
export const webTouchableOpacityFix = Platform.select({
  web: {
    cursor: 'pointer',
    userSelect: 'none' as const,
    WebkitTapHighlightColor: 'transparent',
    transition: 'opacity 0.2s',
  },
  default: {},
});

// Web環境でのScrollViewの問題を修正
export const webScrollViewFix = Platform.select({
  web: {
    height: '100%',
    overflowY: 'auto' as const,
  },
  default: {},
});

// Web環境でのTextInputの問題を修正
export const webTextInputFix = Platform.select({
  web: {
    outlineStyle: 'none',
    boxSizing: 'border-box' as const,
  },
  default: {},
});