/**
 * Calculate SHA256 hash for a file in browser
 * 
 * @param file The file to hash
 * @returns Promise that resolves to the SHA256 hash as a hex string
 */
export async function calculateSHA256(file: File): Promise<string> {
    // Read the file as an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Hash the file data using SubtleCrypto API (available in modern browsers)
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    
    // Convert the hash to a hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
}

/**
 * Calculate SHA256 hash for a string or buffer
 * 
 * @param data The data to hash as a string or buffer
 * @returns Promise that resolves to the SHA256 hash as a hex string
 */
export async function calculateSHA256FromData(data: string | ArrayBuffer): Promise<string> {
    let buffer: ArrayBuffer | Uint8Array;
    
    if (typeof data === 'string') {
        // Convert string to ArrayBuffer
        const encoder = new TextEncoder();
        buffer = encoder.encode(data);
    } else {
        buffer = data;
    }
    
    // Hash the data using SubtleCrypto API
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    
    // Convert the hash to a hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
} 