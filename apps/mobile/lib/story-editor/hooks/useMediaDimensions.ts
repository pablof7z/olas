import { useEffect, useMemo, useState } from 'react';
import { Dimensions } from 'react-native';

export interface MediaDimensions {
    width: number;
    height: number;
}

export const useMediaDimensions = () => {
    const dimensions = Dimensions.get('window');
    const [canvasSize, setCanvasSize] = useState<MediaDimensions>(dimensions);
    const [mediaSize, setMediaSize] = useState<MediaDimensions | null>(null);
    const [containerWidth, setContainerWidth] = useState('100%');
    
    // Calculate the container width for panning properly - make it exactly match the media's visible width
    useEffect(() => {
        if (!mediaSize || !canvasSize) return;
        
        const mediaAspect = mediaSize.width / mediaSize.height;
        const canvasAspect = canvasSize.width / canvasSize.height;
        
        if (mediaAspect > canvasAspect) {
            // Media is wider than canvas aspect - set container width to exactly match visible width
            const visibleMediaWidth = mediaSize.width * (canvasSize.height / mediaSize.height);
            const widthRatio = visibleMediaWidth / canvasSize.width;
            setContainerWidth(`${widthRatio * 100}%`);
        } else {
            // Media is taller or equal to canvas aspect - no need for extra width
            setContainerWidth('100%');
        }
    }, [mediaSize, canvasSize]);

    // Set a numeric width for the Animated.View
    const containerWidthValue = useMemo(() => {
        if (canvasSize && containerWidth) {
            // Convert percentage string to numeric value
            const percentage = parseFloat(containerWidth);
            return canvasSize.width * (percentage / 100);
        }
        return canvasSize.width || dimensions.width;
    }, [containerWidth, canvasSize]);

    // Handle image load to get dimensions
    const onImageLoad = (event: any) => {
        if (event.source) {
            const { width, height } = event.source;
            setMediaSize({ width, height });
        }
    };

    return {
        canvasSize,
        setCanvasSize,
        mediaSize,
        setMediaSize,
        containerWidth,
        containerWidthValue,
        onImageLoad,
    };
}; 