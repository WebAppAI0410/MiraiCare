import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';

// Mock expo modules
jest.mock('expo-font');
jest.mock('expo-splash-screen');

jest.mock('../src/navigation/AppNavigator', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { View } = require('react-native');
  const MockAppNavigator = () => <View testID="mock-app-navigator" />;
  return MockAppNavigator;
});

describe('App', () => {
  it('renders without crashing', () => {
    const { getByTestId } = render(<App />);
    // Add specific test assertions here
    expect(true).toBe(true); // Placeholder test
  });
}); 