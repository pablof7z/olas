import {
    Canvas,
    ColorMatrix,
    Image,
    ImageFormat,
    ImageShader,
    Paint,
    Rect,
    type SkImage,
    Skia,
    useCanvasRef,
    useImage,
    useVideo,
} from '@shopify/react-native-skia';
import React, { useEffect, useMemo, useState, forwardRef, useImperativeHandle } from 'react';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';
import { getRealPath } from 'react-native-compressor';

import type { FilterParameters } from '../types';
import { createColorMatrix, createVignettePaint } from '../utils/createColorMatrix';

import { Text } from '@/components/nativewindui/Text';

export interface FilteredImageRef {
    captureImage: () => Promise<Uint8Array | null>;
}

interface FilteredImageProps {
    image?: SkImage | null;
    style?: StyleProp<ViewStyle>;
    filterParams: FilterParameters;
    contentFit?: 'cover' | 'contain' | 'fill' | 'none';
    width?: number;
    height?: number;
    filePath?: string;
}

export const FilteredImage = forwardRef<FilteredImageRef, FilteredImageProps>(
    ({ image, style, filterParams, contentFit = 'contain', width, height, filePath }, ref) => {
        image ??= useImage(filePath || '');
        const canvasRef = useCanvasRef();

        const colorMatrix = useMemo(() => {
            console.log('FilteredImage: Creating color matrix with params:', filterParams);
            return createColorMatrix(filterParams);
        }, [filterParams]);

        useImperativeHandle(
            ref,
            () => ({
                captureImage: async () => {
                    try {
                        if (!canvasRef.current || !image) {
                            console.error('Canvas or image not available for capture');
                            return null;
                        }

                        // Capture the current canvas state as an image
                        const snapshot = canvasRef.current.makeImageSnapshot();
                        if (!snapshot) {
                            console.error('Failed to create snapshot from canvas');
                            return null;
                        }

                        // Encode the image as PNG bytes
                        const bytes = snapshot.encodeToBytes(ImageFormat.PNG);

                        return bytes;
                    } catch (error) {
                        console.error('Error capturing filtered image:', error);
                        return null;
                    }
                },
            }),
            [canvasRef, image]
        );

        if (!image) {
            return (
                <View style={[styles.container, style]}>
                    <Text style={{ color: 'white' }}>Loading image...</Text>
                </View>
            );
        }

        return (
            <Canvas ref={canvasRef} style={[styles.container, style]}>
                <FilteredImageInner
                    image={image}
                    colorMatrix={colorMatrix}
                    filterParams={filterParams}
                    contentFit={contentFit}
                    width={width}
                    height={height}
                />
            </Canvas>
        );
    }
);

// Separated inner component to prevent re-renders
interface FilteredImageInnerProps {
    image: SkImage;
    colorMatrix: number[];
    filterParams: FilterParameters;
    contentFit: 'cover' | 'contain' | 'fill' | 'none';
    width?: number;
    height?: number;
}

function FilteredImageInner({
    image,
    colorMatrix,
    filterParams,
    contentFit,
    width,
    height,
}: FilteredImageInnerProps) {
    const imageWidth = width || image.width();
    const imageHeight = height || image.height();

    // Create vignette paint if needed
    const vignettePaint = useMemo(() => {
        if (filterParams.vignette && filterParams.vignette > 0) {
            return createVignettePaint(filterParams.vignette);
        }
        return null;
    }, [filterParams.vignette]);

    return (
        <>
            {/* Base image with color matrix filter */}
            <Image
                image={image}
                x={0}
                y={0}
                width={imageWidth}
                height={imageHeight}
                fit={contentFit}
            >
                <ColorMatrix matrix={colorMatrix} />
            </Image>

            {/* Vignette effect */}
            {vignettePaint && (
                <Rect x={0} y={0} width={imageWidth} height={imageHeight} paint={vignettePaint} />
            )}

            {/* Grain effect would be added here similarly */}
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
});
