import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import {
    Canvas,
    Image,
    useImage,
    Skia,
    Paint,
    SkImage,
    ColorMatrix
} from '@shopify/react-native-skia';
import { FilterParameters } from '../presets';
import { createColorMatrix, createVignettePaint } from '../utils';
import { getRealPath } from 'react-native-compressor';
import { Text } from '@/components/nativewindui/Text';

interface FilteredImageProps {
    style?: StyleProp<ViewStyle>;
    filterParams: FilterParameters;
    contentFit?: 'cover' | 'contain' | 'fill' | 'none';
    width?: number;
    height?: number;
    filePath?: string;
}

export function FilteredImage({
    style,
    filterParams,
    contentFit = 'contain',
    width,
    height,
    filePath
}: FilteredImageProps) {
    const image = useImage(filePath);
    
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
    
    if (!image) {
        return <View style={[styles.container, style]}>
            <Text style={{ color: 'white',  }}>filepath = {filePath}</Text>
        </View>;
    }

    return (
        <Canvas style={[styles.container, style ]}>
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