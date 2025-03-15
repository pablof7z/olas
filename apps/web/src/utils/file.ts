/**
 * Utility functions for file handling and image processing
 */

/**
 * Check if a file's MIME type is an acceptable image format
 */
export function isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
}

/**
 * Check if a file's MIME type is an acceptable video format
 */
export function isVideoFile(file: File): boolean {
    return file.type.startsWith('video/');
}

/**
 * Check if the file size is within acceptable limits
 * @param file The file to check
 * @param maxSizeMB Maximum file size in MB
 */
export function isFileSizeValid(file: File, maxSizeMB: number = 10): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
}

/**
 * Create a thumbnail preview from an image file
 * @param file The image file
 * @param maxWidth Maximum width of the thumbnail
 * @param maxHeight Maximum height of the thumbnail
 * @returns A promise that resolves to the thumbnail URL
 */
export function createImageThumbnail(
    file: File,
    maxWidth: number = 200,
    maxHeight: number = 200
): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (!event.target?.result) {
                return reject(new Error("Failed to read file"));
            }
            
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Calculate dimensions while maintaining aspect ratio
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round(height * (maxWidth / width));
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round(width * (maxHeight / height));
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error("Failed to get canvas context"));
                }
                
                ctx.drawImage(img, 0, 0, width, height);
                
                // Create thumbnail URL
                const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.85);
                resolve(thumbnailUrl);
            };
            
            img.onerror = () => {
                reject(new Error("Failed to load image"));
            };
            
            img.src = event.target.result as string;
        };
        
        reader.onerror = () => {
            reject(new Error("Failed to read file"));
        };
        
        reader.readAsDataURL(file);
    });
}

/**
 * Optimize an image file by resizing it and reducing quality
 * @param file The image file to optimize
 * @param maxWidth Maximum width of the optimized image
 * @param maxHeight Maximum height of the optimized image
 * @param quality JPEG quality (0-1)
 * @returns A promise that resolves to the optimized image as a Blob
 */
export function optimizeImage(
    file: File,
    maxWidth: number = 1600,
    maxHeight: number = 1600,
    quality: number = 0.85
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (!event.target?.result) {
                return reject(new Error("Failed to read file"));
            }
            
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Calculate dimensions while maintaining aspect ratio
                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round(height * (maxWidth / width));
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round(width * (maxHeight / height));
                        height = maxHeight;
                    }
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return reject(new Error("Failed to get canvas context"));
                }
                
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to blob
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            return reject(new Error("Failed to create blob"));
                        }
                        resolve(blob);
                    },
                    'image/jpeg',
                    quality
                );
            };
            
            img.onerror = () => {
                reject(new Error("Failed to load image"));
            };
            
            img.src = event.target.result as string;
        };
        
        reader.onerror = () => {
            reject(new Error("Failed to read file"));
        };
        
        reader.readAsDataURL(file);
    });
}

/**
 * Get image dimensions from a file
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            if (!event.target?.result) {
                return reject(new Error("Failed to read file"));
            }
            
            const img = new Image();
            img.onload = () => {
                resolve({
                    width: img.width,
                    height: img.height
                });
            };
            
            img.onerror = () => {
                reject(new Error("Failed to load image"));
            };
            
            img.src = event.target.result as string;
        };
        
        reader.onerror = () => {
            reject(new Error("Failed to read file"));
        };
        
        reader.readAsDataURL(file);
    });
} 