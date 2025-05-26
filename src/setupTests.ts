// Jest setup file for React Native
import 'react-native-gesture-handler/jestSetup';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock expo modules
jest.mock('expo-font');
jest.mock('expo-splash-screen');
jest.mock('expo-secure-store');
jest.mock('expo-constants');

// Mock Firebase
jest.mock('firebase/app');
jest.mock('firebase/auth');
jest.mock('firebase/firestore');

// Mock OpenAI
jest.mock('openai');

// Setup testing library
import '@testing-library/jest-native/extend-expect';

// Global test setup
global.__DEV__ = true;