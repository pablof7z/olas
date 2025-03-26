import { atom } from 'jotai';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { RefObject } from 'react';

type SettingsBottomSheetRef = RefObject<BottomSheetModal> | null;

export const settingsSheetRefAtom = atom<SettingsBottomSheetRef>(null);
