import { Skia, SkImage } from "@shopify/react-native-skia";
import { FilterParameters } from "./presets";

/**
 * Creates a Skia color matrix based on filter parameters
 */
export const createColorMatrix = (params: FilterParameters): number[] => {
    // Start with identity matrix
    const identityMatrix = [
        1, 0, 0, 0, 0,
        0, 1, 0, 0, 0,
        0, 0, 1, 0, 0,
        0, 0, 0, 1, 0
    ];
    
    let result = [...identityMatrix];
    
    // Apply grayscale first if needed
    if (params.grayscale) {
        result = [
            0.33, 0.33, 0.33, 0, 0,
            0.33, 0.33, 0.33, 0, 0,
            0.33, 0.33, 0.33, 0, 0,
            0   , 0   , 0   , 1, 0
        ];
    }

    // Apply sepia
    if (params.sepia !== undefined && params.sepia > 0) {
        const sepiaMatrix = [
            0.393, 0.769, 0.189, 0, 0,
            0.349, 0.686, 0.168, 0, 0,
            0.272, 0.534, 0.131, 0, 0,
            0    , 0    , 0    , 1, 0
        ];
        result = multiplyColorMatrices(result, sepiaMatrix);
        
        // Blend with identity matrix based on sepia strength
        const s = params.sepia;
        result = result.map((value, i) => 
            i % 5 < 4 ? value * s + identityMatrix[i] * (1 - s) : value
        );
    }
    
    // Apply saturation
    if (params.saturation !== undefined && params.saturation !== 1) {
        const s = params.saturation;
        const lumR = 0.3086;
        const lumG = 0.6094;
        const lumB = 0.0820;
        
        const saturationMatrix = [
            (1 - s) * lumR + s, (1 - s) * lumG    , (1 - s) * lumB    , 0, 0,
            (1 - s) * lumR    , (1 - s) * lumG + s, (1 - s) * lumB    , 0, 0,
            (1 - s) * lumR    , (1 - s) * lumG    , (1 - s) * lumB + s, 0, 0,
            0                 , 0                  , 0                  , 1, 0
        ];
        result = multiplyColorMatrices(result, saturationMatrix);
    }
    
    // Apply contrast
    if (params.contrast !== undefined && params.contrast !== 1) {
        // Scale contrast to a reasonable range
        // When contrast is 1.1, we want a small increase
        // When contrast is 0.9, we want a small decrease
        const c = params.contrast;
        // Scale factor to make small adjustments have subtle effects
        const scaledContrast = 1 + (c - 1) * 0.3;
        // Offset to maintain proper midtones
        const offset = -0.5 * (scaledContrast - 1);
        
        const contrastMatrix = [
            scaledContrast, 0, 0, 0, offset,
            0, scaledContrast, 0, 0, offset,
            0, 0, scaledContrast, 0, offset,
            0, 0, 0, 1, 0
        ];
        result = multiplyColorMatrices(result, contrastMatrix);
    }
    
    // Apply brightness
    if (params.brightness !== undefined && params.brightness !== 1) {
        const b = params.brightness;
        const brightnessMatrix = [
            b, 0, 0, 0, 0,
            0, b, 0, 0, 0,
            0, 0, b, 0, 0,
            0, 0, 0, 1, 0
        ];
        result = multiplyColorMatrices(result, brightnessMatrix);
    }
    
    // Apply temperature
    if (params.temperature !== undefined && params.temperature !== 0) {
        const t = params.temperature;
        const matrix = [
            1 + t * 0.3, 0, 0, 0, 0,
            0, 1, 0, 0, 0,
            0, 0, 1 - t * 0.3, 0, 0,
            0, 0, 0, 1, 0
        ];
        result = multiplyColorMatrices(result, matrix);
    }
    
    return result;
};

/**
 * Multiplies two color matrices together
 */
const multiplyColorMatrices = (m1: number[], m2: number[]): number[] => {
    const result = [];
    
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 5; j++) {
            let sum = 0;
            for (let k = 0; k < 4; k++) {
                sum += m1[i * 5 + k] * m2[k * 5 + j];
            }
            if (j === 4) {
                sum += m1[i * 5 + 4];
            }
            result[i * 5 + j] = sum;
        }
    }
    
    return result;
};

/**
 * Creates vignette mask for Skia canvas
 */
export const createVignettePaint = (strength: number = 0.5) => {
    const paint = Skia.Paint();
    const colorBlack = Skia.Color('#000000');
    const colorTransparent = Skia.Color('#00000000');
    const alpha = Math.round(Math.min(strength * 0.7, 0.7) * 255).toString(16).padStart(2, '0');
    
    // Create center coordinates for the gradient
    const center = { x: 0.5, y: 0.5 };
    
    try {
        // Try the newer API first
        const shader = Skia.Shader.RadialGradient(
            center,
            0.5,
            [colorTransparent, Skia.Color(`#000000${alpha}`)],
            [0, 1]
        );
        paint.setShader(shader);
    } catch (e) {
        // Fallback to older API if needed
        try {
            const shader = Skia.Shader.MakeRadialGradient(
                center,
                0.5,
                [colorTransparent, Skia.Color(`#000000${alpha}`)],
                [0, 1],
                0 // TileMode parameter (0 = Clamp)
            );
            paint.setShader(shader);
        } catch (e2) {
            console.error('Failed to create gradient:', e2);
            // Create a solid color as fallback
            paint.setColor(Skia.Color(`#000000${alpha}`));
        }
    }
    
    return paint;
};

/**
 * Creates noise/grain effect for Skia canvas
 */
export const createGrainPaint = (strength: number = 0.2) => {
    const paint = Skia.Paint();
    // Implementation would use Perlin noise or similar
    // This is a simplified version
    return paint;
}; 