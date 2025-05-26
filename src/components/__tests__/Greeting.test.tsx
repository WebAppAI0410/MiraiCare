import React from 'react';
import { render, screen } from '@testing-library/react-native';
import Greeting from '../Greeting';

describe('Greeting', () => {
  it('renders a greeting message with the default name if no name is provided', () => {
    render(<Greeting />);
    expect(screen.getByText('Hello, Guest!')).toBeVisible();
  });

  it('renders a greeting message with the provided name', () => {
    render(<Greeting name="John Doe" />);
    expect(screen.getByText('Hello, John Doe!')).toBeVisible();
  });
}); 