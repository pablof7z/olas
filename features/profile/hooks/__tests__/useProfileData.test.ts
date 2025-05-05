import { renderHook } from '@testing-library/react';
import * as ndkMobile from '@nostr-dev-kit/ndk-mobile';
import * as userFlare from '@/lib/user/stores/flare';
import useProfileData from '../useProfileData';

jest.mock('@nostr-dev-kit/ndk-mobile', () => ({
  useNDK: jest.fn(),
  useProfileValue: jest.fn(),
  useSubscribe: jest.fn(),
  NDKKind: { Contacts: 1, Image: 2, VerticalVideo: 3, Text: 4, Metadata: 0, 30402: 30402 },
}));
jest.mock('@/lib/user/stores/flare', () => ({
  useUserFlare: jest.fn(),
}));

describe('useProfileData', () => {
  it('should return user, profile, content, flare, followCount, and hasProducts', () => {
    const pubkey = 'test_pubkey';
    const user = { pubkey };
    const userProfile = { name: 'Test User' };
    const content = [
      { kind: 1, tags: [['p', 'a'], ['p', 'b'], ['e', 'x']] },
      { kind: 30402 },
    ];
    (ndkMobile.useNDK as jest.Mock).mockReturnValue({ ndk: { getUser: () => user } });
    (ndkMobile.useProfileValue as jest.Mock).mockReturnValue(userProfile);
    (ndkMobile.useSubscribe as jest.Mock).mockReturnValue({ events: content });
    (userFlare.useUserFlare as jest.Mock).mockReturnValue('flare');

    const { result } = renderHook(() => useProfileData(pubkey));

    expect(result.current.user).toEqual(user);
    expect(result.current.userProfile).toEqual(userProfile);
    expect(result.current.content).toEqual(content);
    expect(result.current.flare).toBe('flare');
    expect(result.current.followCount).toBe(2); // two 'p' tags
    expect(result.current.hasProducts).toBe(true);
  });
});