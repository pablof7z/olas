import Slider from '@react-native-community/slider';
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useMediaFilter } from '../hooks/useMediaFilter';
import type { FilterParameters } from '../types';

interface AdjustmentOption {
    id: keyof FilterParameters;
    label: string;
    min: number;
    max: number;
    step: number;
    defaultValue: number;
}

const ADJUSTMENT_OPTIONS: AdjustmentOption[] = [
    {
        id: 'brightness',
        label: 'Brightness',
        min: 0.5,
        max: 1.5,
        step: 0.05,
        defaultValue: 1,
    },
    {
        id: 'contrast',
        label: 'Contrast',
        min: 0.5,
        max: 1.5,
        step: 0.05,
        defaultValue: 1,
    },
    {
        id: 'saturation',
        label: 'Saturation',
        min: 0,
        max: 2,
        step: 0.05,
        defaultValue: 1,
    },
    {
        id: 'temperature',
        label: 'Warmth',
        min: -1,
        max: 1,
        step: 0.05,
        defaultValue: 0,
    },
    {
        id: 'vignette',
        label: 'Vignette',
        min: 0,
        max: 1,
        step: 0.05,
        defaultValue: 0,
    },
];

export function FilterAdjustments() {
    const { currentFilterParams, updateFilterParams } = useMediaFilter();

    const handleValueChange = useCallback(
        (parameter: keyof FilterParameters, value: number) => {
            updateFilterParams({ [parameter]: value });
        },
        [updateFilterParams]
    );

    const handleReset = useCallback(
        (parameter: keyof FilterParameters) => {
            const option = ADJUSTMENT_OPTIONS.find((opt) => opt.id === parameter);
            if (option) {
                updateFilterParams({ [parameter]: option.defaultValue });
            }
        },
        [updateFilterParams]
    );

    return (
        <View style={styles.container}>
            {ADJUSTMENT_OPTIONS.map((option) => {
                const currentValue =
                    currentFilterParams[option.id] !== undefined
                        ? (currentFilterParams[option.id] as number)
                        : option.defaultValue;

                const isDefault = Math.abs(currentValue - option.defaultValue) < 0.001;

                return (
                    <View key={option.id} style={styles.adjustmentRow}>
                        <View style={styles.labelContainer}>
                            <Text style={styles.label}>{option.label}</Text>
                            {!isDefault && (
                                <Pressable onPress={() => handleReset(option.id)}>
                                    <Text style={styles.resetText}>Reset</Text>
                                </Pressable>
                            )}
                        </View>
                        <Slider
                            style={styles.slider}
                            minimumValue={option.min}
                            maximumValue={option.max}
                            step={option.step}
                            value={currentValue}
                            onValueChange={(value) => handleValueChange(option.id, value)}
                            minimumTrackTintColor="#fff"
                            maximumTrackTintColor="#444"
                            thumbTintColor="#fff"
                        />
                        <Text style={styles.valueText}>{currentValue.toFixed(2)}</Text>
                    </View>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#111',
        padding: 16,
    },
    adjustmentRow: {
        marginBottom: 16,
    },
    labelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    label: {
        color: '#fff',
        fontSize: 16,
    },
    resetText: {
        color: '#3498db',
        fontSize: 14,
    },
    slider: {
        height: 40,
        width: '100%',
    },
    valueText: {
        color: '#999',
        fontSize: 12,
        textAlign: 'center',
    },
});
