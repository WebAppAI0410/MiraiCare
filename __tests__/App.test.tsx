import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';

// Mock expo modules
jest.mock('expo-font');
jest.mock('expo-splash-screen');

describe('App', () => {
  it('renders without crashing', () => {
    const { getByTestId } = render(<App />);
    // Add specific test assertions here
    expect(true).toBe(true); // Placeholder test
  });
}); 