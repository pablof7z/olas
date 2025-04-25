export interface FilterParameters {
    brightness?: number; // 0-2, default 1
    contrast?: number; // 0-2, default 1
    saturation?: number; // 0-2, default 1
    temperature?: number; // -1 to 1, negative = cooler, positive = warmer
    grayscale?: boolean;
    sepia?: number; // 0-1
    vignette?: number; // 0-1
    grain?: number; // 0-1
}

export interface FilterPreset {
    id: string;
    name: string;
    parameters: FilterParameters;
    thumbnailColor?: string; // For thumbnail background if no preview available
}

export interface FilterState {
    id: string;
    parameters: FilterParameters;
}
