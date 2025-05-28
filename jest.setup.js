// Mock react-native modules
global.__DEV__ = true;

// Mock React Native modules before they are imported
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Alert = {
    alert: jest.fn(),
  };
  return RN;
});

// Mock Expo modules
jest.mock('expo-constants', () => ({
  default: {
    debugMode: false,
    executionEnvironment: 'storeClient',
    experienceUrl: 'exp://test',
  },
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: jest.fn(() => null),
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Pedometerモックのファクトリー関数
const createPedometerMock = () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  getStepCountAsync: jest.fn().mockResolvedValue({ steps: 5000 }),
  watchStepCount: jest.fn().mockReturnValue({
    remove: jest.fn(),
  }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({
    status: 'granted',
    granted: true,
  }),
  Subscription: jest.fn(),
});

jest.mock('expo-sensors', () => ({
  Pedometer: createPedometerMock(),
}));

// expo-sensors/build/Pedometerのモック
jest.mock('expo-sensors/build/Pedometer', () => createPedometerMock());

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
    onAuthStateChanged: jest.fn((callback) => {
      // 初期状態でコールバックを呼ぶ
      callback(null);
      // unsubscribe関数を返す
      return jest.fn();
    }),
  })),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  updateProfile: jest.fn(),
  sendEmailVerification: jest.fn(),
  User: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  setDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  limit: jest.fn(),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn(() => new Date()),
  connectFirestoreEmulator: jest.fn(),
}));

jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({})),
  connectFunctionsEmulator: jest.fn(),
}));

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  const mockIcon = (name) => {
    return React.forwardRef((props, ref) => {
      return React.createElement(View, { ...props, ref });
    });
  };
  
  return {
    Ionicons: mockIcon('Ionicons'),
    MaterialIcons: mockIcon('MaterialIcons'),
    MaterialCommunityIcons: mockIcon('MaterialCommunityIcons'),
    FontAwesome: mockIcon('FontAwesome'),
    FontAwesome5: mockIcon('FontAwesome5'),
    Feather: mockIcon('Feather'),
    AntDesign: mockIcon('AntDesign'),
    Entypo: mockIcon('Entypo'),
    Foundation: mockIcon('Foundation'),
    SimpleLineIcons: mockIcon('SimpleLineIcons'),
    Octicons: mockIcon('Octicons'),
    Zocial: mockIcon('Zocial'),
    EvilIcons: mockIcon('EvilIcons'),
  };
});

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  return React.forwardRef((props, ref) => {
    return React.createElement(View, { ...props, ref });
  });
});

jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  return React.forwardRef((props, ref) => {
    return React.createElement(View, { ...props, ref });
  });
});

jest.mock('react-native-vector-icons/FontAwesome', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  return React.forwardRef((props, ref) => {
    return React.createElement(View, { ...props, ref });
  });
});

jest.mock('react-native-vector-icons/Ionicons', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  return React.forwardRef((props, ref) => {
    return React.createElement(View, { ...props, ref });
  });
});

// Mock React Native Alert (グローバル変数としても設定)
global.Alert = {
  alert: jest.fn(),
};

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};