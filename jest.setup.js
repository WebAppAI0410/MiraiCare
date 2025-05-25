// The newer @testing-library/react-native includes jest matchers by default

// React Native環境のモック
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

// Firebase Auth のモック
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  sendSignInLinkToEmail: jest.fn(),
  isSignInWithEmailLink: jest.fn(),
  signInWithEmailLink: jest.fn(),
  PhoneAuthProvider: jest.fn(),
  signInWithCredential: jest.fn(),
  RecaptchaVerifier: jest.fn(),
  updateProfile: jest.fn(),
}));

// Firebase Firestore のモック
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
}));

// AsyncStorage のモック
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Firebase config のモック
jest.mock('./src/config/firebase', () => ({
  auth: {},
  db: {},
  COLLECTIONS: {
    USERS: 'users',
    VITAL_DATA: 'vital_data',
    MOOD_DATA: 'mood_data',
  },
}));

// React Navigation のモック
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }) => children,
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  }),
}));

// Expo関連のモック
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {},
    },
  },
}));

jest.mock('expo-linking', () => ({
  default: {
    getInitialURL: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  },
}));

// グローバルなconsole.warnを抑制（テスト時のノイズ削減）
global.console = {
  ...console,
  warn: jest.fn(),
};