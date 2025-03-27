import { Skia, ImageFormat } from '@shopify/react-native-skia';
import { Buffer } from 'buffer';
import * as FileSystem from 'expo-file-system';
import { v4 as uuidv4 } from 'uuid';

import { createColorMatrix } from './createColorMatrix';
import { FilterParameters } from '../types';

/**
 * Captures and saves a filtered image using Skia
 *
 * @param sourceUri Original image URI
 * @param filterParams Filter parameters to apply
 * @returns Promise resolving to the new file URI or null if failed
 */
export async function saveFilteredImage(sourceUri: string, filterParams: FilterParameters): Promise<string | null> {
    try {
        console.log('Saving filtered image:', { sourceUri, filterParams });

        // Load the source image as a binary file
        const imageData = await FileSystem.readAsStringAsync(sourceUri, {
            encoding: FileSystem.EncodingType.Base64,
        });

        // Create Skia image from base64 data
        const skImage = Skia.Image.MakeImageFromEncoded(Skia.Data.fromBase64(imageData));

        if (!skImage) {
            console.error('Failed to create Skia image from source');
            return null;
        }

        // Get original image dimensions
        const width = skImage.width();
        const height = skImage.height();

        // Create color matrix from filter parameters
        const colorMatrix = createColorMatrix(filterParams);

        // Create a surface to draw on
        const surface = Skia.Surface.Make(width, height);
        if (!surface) {
            console.error('Failed to create Skia surface');
            return null;
        }

        // Get the canvas from the surface
        const canvas = surface.getCanvas();

        // Create a color filter from the matrix
        const filter = Skia.ColorFilter.MakeMatrix(colorMatrix);

        // Create a paint with the color filter
        const paint = Skia.Paint();
        paint.setColorFilter(filter);

        // Draw the image with the filter applied
        canvas.drawImage(skImage, 0, 0, paint);

        // Get the snapshot from the surface
        const snapshot = surface.makeImageSnapshot();
        if (!snapshot) {
            console.error('Failed to create snapshot from surface');
            return null;
        }

        // Encode the image as PNG bytes
        const bytes = snapshot.encodeToBytes(ImageFormat.PNG);
        if (!bytes) {
            console.error('Failed to encode image to PNG data');
            return null;
        }

        // Convert to base64 for writing to file
        const base64 = Buffer.from(bytes).toString('base64');

        // Generate a unique filename
        const filename = `${uuidv4()}.png`;
        const newUri = `${FileSystem.cacheDirectory}${filename}`;

        // Write the image data to the file system
        await FileSystem.writeAsStringAsync(newUri, base64, {
            encoding: FileSystem.EncodingType.Base64,
        });

        console.log('Filtered image saved:', newUri);
        return newUri;
    } catch (error) {
        console.error('Error saving filtered image:', error);
        return null;
    }
}
