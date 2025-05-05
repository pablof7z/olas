import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import CopyToClipboard from '../CopyToClipboard';

// Mock expo-clipboard
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));

// Mock useColorScheme
jest.mock('@/lib/useColorScheme', () => ({
  useColorScheme: () => ({
    colors: { muted: '#888' },
  }),
}));

describe('CopyToClipboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders Copy icon initially', () => {
    const { getByTestId } = render(<CopyToClipboard text="test" />);
    expect(getByTestId('copy-icon')).toBeTruthy();
  });

  it('renders with custom size', () => {
    const { getByTestId } = render(<CopyToClipboard text="test" size={32} />);
    expect(getByTestId('copy-icon').props.size).toBe(32);
  });

  it('copies text to clipboard and shows Check icon on press', () => {
    const { getByTestId, queryByTestId } = render(<CopyToClipboard text="copied!" />);
    const pressable = getByTestId('copy-pressable');
    const clipboard = require('expo-clipboard');

    // Initially shows Copy icon
    expect(getByTestId('copy-icon')).toBeTruthy();

    // Press to copy
    act(() => {
      fireEvent.press(pressable);
    });

    expect(clipboard.setStringAsync).toHaveBeenCalledWith('copied!');
    expect(getByTestId('check-icon')).toBeTruthy();
    expect(queryByTestId('copy-icon')).toBeNull();

    // After 2 seconds, reverts to Copy icon
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(getByTestId('copy-icon')).toBeTruthy();
  });
});