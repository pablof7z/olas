import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import About from '../About';

// Mock Jotai atoms
const setEditProfileMock = jest.fn();

jest.mock('jotai', () => ({
  useAtom: () => [ { about: 'Hello world' }, setEditProfileMock ],
  useAtomValue: () => 'edit',
}));

// Mock EventContent
jest.mock('@/components/ui/event/content', () => ({
  __esModule: true,
  default: ({ content }: { content: string }) => <Text testID="event-content">{content}</Text>,
}));

describe('About component', () => {
  const colors = { foreground: '#000', grey3: '#ccc' };
  const userProfile = { about: 'User bio' };

  beforeEach(() => {
    setEditProfileMock.mockClear();
  });

  it('renders TextInput in edit mode with correct value', () => {
    const { getByDisplayValue } = render(
      <About userProfile={userProfile as any} colors={colors} />
    );
    expect(getByDisplayValue('Hello world')).toBeTruthy();
  });

  it('calls setEditProfile on text change', () => {
    const { getByDisplayValue } = render(
      <About userProfile={userProfile as any} colors={colors} />
    );
    const input = getByDisplayValue('Hello world');
    fireEvent.changeText(input, 'New about');
    expect(setEditProfileMock).toHaveBeenCalledWith({ about: 'New about' });
  });

  it('renders EventContent in view mode with about from editProfile', () => {
    jest.spyOn(require('jotai'), 'useAtomValue').mockImplementation(() => 'view');
    const { getByTestId } = render(
      <About userProfile={userProfile as any} colors={colors} />
    );
    expect(getByTestId('event-content').props.children).toBe('Hello world');
    jest.spyOn(require('jotai'), 'useAtomValue').mockRestore();
  });

  it('renders EventContent in view mode with about from userProfile if editProfile.about is empty', () => {
    jest.spyOn(require('jotai'), 'useAtom').mockImplementation(() => [ {}, setEditProfileMock ]);
    jest.spyOn(require('jotai'), 'useAtomValue').mockImplementation(() => 'view');
    const { getByTestId } = render(
      <About userProfile={userProfile as any} colors={colors} />
    );
    expect(getByTestId('event-content').props.children).toBe('User bio');
    jest.spyOn(require('jotai'), 'useAtom').mockRestore();
    jest.spyOn(require('jotai'), 'useAtomValue').mockRestore();
  });

  it('renders nothing if no about text is present', () => {
    jest.spyOn(require('jotai'), 'useAtom').mockImplementation(() => [ {}, setEditProfileMock ]);
    jest.spyOn(require('jotai'), 'useAtomValue').mockImplementation(() => 'view');
    const { queryByTestId } = render(
      <About userProfile={{} as any} colors={colors} />
    );
    expect(queryByTestId('event-content')).toBeNull();
    jest.spyOn(require('jotai'), 'useAtom').mockRestore();
    jest.spyOn(require('jotai'), 'useAtomValue').mockRestore();
  });
});