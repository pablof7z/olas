import { Ionicons } from '@expo/vector-icons';
import { type BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { atom, useSetAtom } from 'jotai';
import React, {
    forwardRef,
    type RefObject,
    useCallback,
    useImperativeHandle,
    useMemo,
    useEffect,
} from 'react';
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Sheet, useSheetRef } from '@/components/nativewindui/Sheet';
import { useEditorStore } from '@/lib/publish/store/editor';
import { useColorScheme } from '@/lib/useColorScheme';

// import { AppleMaps, GoogleMaps } from 'expo-maps';

export const locationBottomSheetRefAtom = atom<RefObject<BottomSheetModal> | null>(null);

export interface LocationBottomSheetRef {
    present: () => void;
    dismiss: () => void;
}

const MAX_HEIGHT = Dimensions.get('window').height * 0.8;

const LocationBottomSheet = forwardRef<LocationBottomSheetRef, object>((_, ref) => {
    const sheetRef = useSheetRef();
    const setBottomSheetRef = useSetAtom(locationBottomSheetRefAtom);
    const location = useEditorStore((state) => state.location);
    const includeLocation = useEditorStore((state) => state.includeLocation);
    const setIncludeLocation = useEditorStore((state) => state.setIncludeLocation);
    const { colors } = useColorScheme();

    useImperativeHandle(
        ref,
        () => ({
            present: () => sheetRef.current?.present(),
            dismiss: () => sheetRef.current?.dismiss(),
        }),
        [sheetRef]
    );

    useEffect(() => {
        setBottomSheetRef(sheetRef);
    }, [setBottomSheetRef]);

    const handleToggleLocation = useCallback(() => {
        setIncludeLocation(!includeLocation);
    }, [includeLocation, setIncludeLocation]);

    if (!location) return null;

    return (
        <Sheet ref={sheetRef} maxDynamicContentSize={MAX_HEIGHT} enablePanDownToClose>
            <BottomSheetView style={styles.contentContainer}>
                <View style={styles.header}>
                    <Text style={styles.title}>Location</Text>
                    <TouchableOpacity style={styles.toggleButton} onPress={handleToggleLocation}>
                        <Text style={[styles.toggleText, { color: colors.primary }]}>
                            {includeLocation ? 'Exclude' : 'Include'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* <View style={styles.mapContainer}>
                    {Platform.OS === 'ios' ? (
                        <AppleMaps.View
                            style={styles.map}
                            cameraPosition={{
                                coordinates: {
                                    latitude: location.latitude,
                                    longitude: location.longitude,
                                },
                                zoom: 15,
                            }}
                            uiSettings={{
                                scrollGesturesEnabled: false,
                                zoomGesturesEnabled: false,
                                rotationGesturesEnabled: false,
                                tiltGesturesEnabled: false,
                            }}
                            markers={[
                                {
                                    coordinates: {
                                        latitude: location.latitude,
                                        longitude: location.longitude,
                                    },
                                },
                            ]}
                        />
                    ) : (
                        <GoogleMaps.View
                            style={styles.map}
                            cameraPosition={{
                                coordinates: {
                                    latitude: location.latitude,
                                    longitude: location.longitude,
                                },
                                zoom: 15,
                            }}
                            uiSettings={{
                                scrollGesturesEnabled: false,
                                zoomGesturesEnabled: false,
                                rotationGesturesEnabled: false,
                                tiltGesturesEnabled: false,
                            }}
                            markers={[
                                {
                                    coordinates: {
                                        latitude: location.latitude,
                                        longitude: location.longitude,
                                    },
                                },
                            ]}
                        />
                    )}
                </View> */}

                <View style={styles.infoContainer}>
                    <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={20} color={colors.primary} />
                        <Text style={styles.infoText}>
                            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                        </Text>
                    </View>
                    <Text style={styles.disclaimer}>
                        {includeLocation
                            ? 'Location data will be included in your post'
                            : 'Location data will not be included in your post'}
                    </Text>
                </View>
            </BottomSheetView>
        </Sheet>
    );
});

const styles = StyleSheet.create({
    contentContainer: {
        flex: 1,
        padding: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    toggleButton: {
        padding: 8,
    },
    toggleText: {
        fontWeight: '600',
    },
    mapContainer: {
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    infoContainer: {
        padding: 16,
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoText: {
        fontSize: 16,
        marginLeft: 8,
    },
    disclaimer: {
        fontSize: 14,
        color: '#666666',
        marginTop: 8,
    },
});

export default LocationBottomSheet;
