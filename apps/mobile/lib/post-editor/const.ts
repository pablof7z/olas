import { editImageAtom, editCallbackAtom } from "@/app/edit";
import { atom, useAtom, useAtomValue } from "jotai";
import { useState, useRef } from "react";
import {
    Sepia,
    Polaroid,
    Kodachrome,
    Grayscale,
    Warm,
    Cool,
    Browni,
    Achromatopsia,
    Deuteranopia,
    Tritanopia,
    DuoTone,
    Contrast,
    Invert,
    Saturate,
    HueRotate,
    Temperature,
} from 'react-native-color-matrix-image-filters';

export type FilterSetting = {
    component: React.ComponentType,
    hasAmount: boolean
};

export const availableFilters: Record<string, FilterSetting> = {
    "Sepia": { component: Sepia, hasAmount: true },
    "Browni": { component: Browni, hasAmount: false },
    "Polaroid": { component: Polaroid, hasAmount: false },
    "Kodachrome": { component: Kodachrome, hasAmount: false },
    "Grayscale": { component: Grayscale, hasAmount: true },
    "Warm": { component: Warm, hasAmount: false },
    "Cool": { component: Cool, hasAmount: false },
    "Achromatopsia": { component: Achromatopsia, hasAmount: false },
    "Deuteranopia": { component: Deuteranopia, hasAmount: false },
    "Tritanopia": { component: Tritanopia, hasAmount: false },
    "DuoTone": { component: DuoTone, hasAmount: false },
    "Contrast": { component: Contrast, hasAmount: true },
    "Invert": { component: Invert, hasAmount: false },
    "Saturate": { component: Saturate, hasAmount: true },
    "HueRotate": { component: HueRotate, hasAmount: true },
    "Temperature": { component: Temperature, hasAmount: true },
};