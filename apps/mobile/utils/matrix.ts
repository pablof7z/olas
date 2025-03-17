import { Skia } from '@shopify/react-native-skia';
import type { SkMatrix } from '@shopify/react-native-skia';

/**
 * Converts a SkMatrix to a transformation array that can be used in React Native
 */
export const skiaMatrixToRN = (m: SkMatrix): number[] => {
    // In current versions of react-native-skia, matrices are represented internally as arrays
    // Use type assertion to access the matrix values
    const matrixArray = m as unknown as number[];
    return [
        matrixArray[0],
        matrixArray[1],
        0,
        matrixArray[2],
        matrixArray[3],
        matrixArray[4],
        0,
        matrixArray[5],
        0,
        0,
        1,
        0,
        matrixArray[6],
        matrixArray[7],
        0,
        matrixArray[8],
    ];
};

/**
 * Translates a matrix by x and y
 */
export const translate = (matrix: SkMatrix, x: number, y: number): SkMatrix => {
    const m = Skia.Matrix();
    m.translate(x, y);
    const result = Skia.Matrix();
    result.concat(matrix);
    result.concat(m);
    return result;
};

/**
 * Scales a matrix by factor from pivot point
 */
export const scale = (matrix: SkMatrix, factor: number, pivotX: number, pivotY: number): SkMatrix => {
    const m = Skia.Matrix();
    m.translate(pivotX, pivotY);
    m.scale(factor, factor);
    m.translate(-pivotX, -pivotY);

    const result = Skia.Matrix();
    result.concat(matrix);
    result.concat(m);
    return result;
};

/**
 * Rotates a matrix by angle (in radians) from pivot point
 */
export const rotate = (matrix: SkMatrix, angle: number, pivotX: number, pivotY: number): SkMatrix => {
    const m = Skia.Matrix();
    m.translate(pivotX, pivotY);
    m.rotate(angle);
    m.translate(-pivotX, -pivotY);

    const result = Skia.Matrix();
    result.concat(matrix);
    result.concat(m);
    return result;
};

/**
 * Creates a matrix buffer for efficient animations without creating new objects
 */
export const createMatrixBuffer = (): {
    current: SkMatrix;
    buffer: SkMatrix;
    swap: () => void;
} => {
    const a = Skia.Matrix();
    const b = Skia.Matrix();
    let useCurrent = true;

    return {
        get current() {
            return useCurrent ? a : b;
        },
        get buffer() {
            return useCurrent ? b : a;
        },
        swap: () => {
            useCurrent = !useCurrent;
        },
    };
};

/**
 * Fits an element with specified dimensions into a destination rect
 */
export const fitBox = (
    srcWidth: number,
    srcHeight: number,
    dstWidth: number,
    dstHeight: number
): { scale: number; x: number; y: number } => {
    const aspectRatio = srcWidth / srcHeight;
    const containerRatio = dstWidth / dstHeight;

    let scale: number;
    let x: number;
    let y: number;

    if (aspectRatio > containerRatio) {
        // Source is wider than container
        scale = dstWidth / srcWidth;
        x = 0;
        y = (dstHeight - srcHeight * scale) / 2;
    } else {
        // Source is taller than container
        scale = dstHeight / srcHeight;
        x = (dstWidth - srcWidth * scale) / 2;
        y = 0;
    }

    return { scale, x, y };
};
