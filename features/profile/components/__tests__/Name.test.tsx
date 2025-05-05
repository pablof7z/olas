import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { View } from 'react-native';
import Name from '../Name';

// Mock Jotai atoms
const setEditProfileMock = jest.fn();

jest.mock('jotai', () => ({
  useAtom: () => [ { name: 'Alice' }, setEditProfileMock ],
  useAtomValue: () => 'edit',
}));

// Mock User.Name
jest.mock('@/components/ui/user', () => ({
  Name: (props: object) => <View testID="mock-username" {...props} />,
}));

describe('Name component', () => {
  const colors = { foreground: '#000', grey3: '#ccc' };
  const pubkey = 'pubkey123';
  const userProfile = { name: 'Alice' };

  beforeEach(() => {
    setEditProfileMock.mockClear();
  });

  it('renders TextInput in edit mode with correct value', () => {
    const { getByDisplayValue } = render(
      <Name userProfile={userProfile as any} pubkey={pubkey} colors={colors} />
    );
    expect(getByDisplayValue('Alice')).toBeTruthy();
  });

  it('calls setEditProfile on text change', () => {
    const { getByDisplayValue } = render(
      <Name userProfile={userProfile as any} pubkey={pubkey} colors={colors} />
    );
    const input = getByDisplayValue('Alice');
    fireEvent.changeText(input, 'Bob');
    expect(setEditProfileMock).toHaveBeenCalledWith({ name: 'Bob' });
  });

  it('renders User.Name in view mode', () => {
    // Override useAtomValue to return 'view'
    jest.spyOn(require('jotai'), 'useAtomValue').mockImplementation(() => 'view');
    const { getByTestId } = render(
      <Name userProfile={userProfile as any} pubkey={pubkey} colors={colors} />
    );
    expect(getByTestId('mock-username')).toBeTruthy();
    // Restore for other tests
    jest.spyOn(require('jotai'), 'useAtomValue').mockRestore();
  });
});