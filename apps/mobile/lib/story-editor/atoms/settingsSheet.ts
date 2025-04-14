import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { atom } from 'jotai';
import type { RefObject } from 'react';

type SettingsBottomSheetRef = RefObject<BottomSheetModal> | null;

export const settingsSheetRefAtom = atom<SettingsBottomSheetRef>(null);
