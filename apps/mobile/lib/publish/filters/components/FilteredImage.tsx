import React, { useEffect, useMemo, useState, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import {
    Canvas,
    Image,
    useImage,
    Skia,
    Paint,
    SkImage,
    ColorMatrix,
    useCanvasRef,
    makeImageSnapshot,
    ImageFormat
} from '@shopify/react-native-skia';
import { FilterParameters } from '../presets';
import { createColorMatrix, createVignettePaint } from '../utils';
import { getRealPath } from 'react-native-compressor';
import { Text } from '@/components/nativewindui/Text';

export interface FilteredImageRef {
    captureImage: () => Promise<Uint8Array | null>;
}

interface FilteredImageProps {
    style?: StyleProp<ViewStyle>;
    filterParams: FilterParameters;
    contentFit?: 'cover' | 'contain' | 'fill' | 'none';
    width?: number;
    height?: number;
    filePath?: string;
}

export const FilteredImage = forwardRef<FilteredImageRef, FilteredImageProps>((
    {
        style,
        filterParams,
        contentFit = 'contain',
        width,
        height,
        filePath
    }, 
    ref
) => {
    const image = useImage(filePath);
    const canvasRef = useCanvasRef();
    
    console.log('FilteredImage render:', {
        hasImage: !!image,
        filterParams,
        width,
        height,
        filePath
    });

    const colorMatrix = useMemo(() => {
        console.log('Creating color matrix with params:', filterParams);
        return createColorMatrix(filterParams);
    }, [filterParams]);
    
    useImperativeHandle(ref, () => ({
        captureImage: async () => {
            try {
                if (!canvasRef.current || !image) {
                    console.error('Canvas or image not available for capture');
                    return null;
                }
                
                // Capture the current canvas state as an image
                const snapshot = makeImageSnapshot(canvasRef.current);
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
        }
    }), [canvasRef, image]);
    
    if (!image) {
        return <View style={[styles.container, style]}>
            <Text style={{ color: 'white' }}>No image found, this is a bug: {filePath}</Text>
        </View>;
    }

    return (
        <Canvas ref={canvasRef} style={[styles.container, style ]}>
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
});

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
    height
}: FilteredImageInnerProps) {
    console.log('FilteredImageInner render:', {
        filterParams,
        colorMatrix,
        width,
        height
    });

    return (
        <>
            {/* Base image with color matrix filter */}
            <Image
                image={image}
                x={0}
                y={0}
                width={width || image.width()}
                height={height || image.height()}
                fit={contentFit}
            >
                <ColorMatrix matrix={colorMatrix} />
            </Image>
            
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