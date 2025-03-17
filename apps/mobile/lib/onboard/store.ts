import { atom } from 'jotai';

// Atoms for onboarding state
export const avatarAtom = atom<string>('');
export const usernameAtom = atom<string>('@');
export const modeAtom = atom<'login' | 'signup'>('signup');
export const payloadAtom = atom<string | undefined>(undefined);
export const scanQRAtom = atom<boolean>(false);
