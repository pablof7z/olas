import * as FileSystem from 'expo-file-system';
import { decode, encode } from 'base64-arraybuffer';

const EXIF_MARKER = 0xffe1;
const JPEG_HEADER_OFFSET = 2;
const ORIENTATION_TAG = 0x0112;

const EXIF_TAGS: { [key: number]: string } = {
    0x010e: "ImageDescription",
    0x010f: "Make",
    0x0110: "Model",
    0x0112: "Orientation",
    0x0131: "Software",
    0x0132: "DateTime",
    // Add more tag mappings as needed
};

const cleanBuffer = (arrayBuffer: ArrayBuffer): ArrayBuffer => {
    const dataView = new DataView(arrayBuffer);
    let offset = JPEG_HEADER_OFFSET;
    let orientationBuffer: Uint8Array | null = null;

    while (offset < dataView.byteLength) {
        const marker = dataView.getUint16(offset, false);
        const segmentLength = dataView.getUint16(offset + 2, false);
        if (marker === EXIF_MARKER) {
            console.log(`Found EXIF marker at offset ${offset}`);
            const exifData = arrayBuffer.slice(offset + 4, offset + 2 + segmentLength);
            const { orientationTag, otherTags } = extractExifData(exifData);
            
            // Log kept EXIF data
            if (orientationTag) {
                console.log(`Keeping EXIF tag: ${EXIF_TAGS[ORIENTATION_TAG] || `0x${ORIENTATION_TAG.toString(16)}`}`);
                orientationBuffer = buildOrientationBuffer(arrayBuffer, offset, orientationTag);
            }

            // Log removed EXIF data
            otherTags.forEach(tag => {
                console.log(`Removed EXIF tag: ${EXIF_TAGS[tag] || `0x${tag.toString(16)}`}`);
            });

            return reconstructBuffer(arrayBuffer, offset, segmentLength, orientationBuffer);
        }
        offset += 2 + segmentLength;
    }
    return arrayBuffer;
};

const extractExifData = (exifData: ArrayBuffer): { orientationTag: Uint8Array | null, otherTags: number[] } => {
    const view = new DataView(exifData);
    const byteOrder = view.getUint16(0, false);
    // print the byte order in hex
    console.log('byteOrder 0x' + byteOrder.toString(16));
    if (![0x4949, 0x4d4d].includes(byteOrder)) return { orientationTag: null, otherTags: [] };

    const ifdOffset = view.getUint32(4, byteOrder === 0x4949);
    let offset = ifdOffset + 4;
    const numEntries = view.getUint16(offset, byteOrder === 0x4949);
    offset += 2;

    let orientationTag: Uint8Array | null = null;
    const otherTags: number[] = [];

    for (let i = 0; i < numEntries; i++) {
        const tag = view.getUint16(offset, byteOrder === 0x4949);
        if (tag === ORIENTATION_TAG) {
            const orientation = view.getUint16(offset + 8, byteOrder === 0x4949);
            orientationTag = new Uint8Array([0x01, 0x12, 0x00, orientation]);
        } else {
            otherTags.push(tag);
        }
        offset += 12;
    }

    return { orientationTag, otherTags };
};

const buildOrientationBuffer = (arrayBuffer: ArrayBuffer, offset: number, orientationTag: Uint8Array): Uint8Array => {
    const header = new Uint8Array(arrayBuffer.slice(offset, offset + 4));
    const buffer = new Uint8Array(header.length + orientationTag.length);
    buffer.set(header, 0);
    buffer.set(orientationTag, header.length);
    return buffer;
};

const reconstructBuffer = (arrayBuffer: ArrayBuffer, offset: number, segmentLength: number, orientationBuffer: Uint8Array | null): ArrayBuffer => {
    const before = new Uint8Array(arrayBuffer.slice(0, offset));
    const after = new Uint8Array(arrayBuffer.slice(offset + 2 + segmentLength));
    const newBuffer = orientationBuffer
        ? new Uint8Array(before.length + orientationBuffer.length + after.length)
        : new Uint8Array(before.length + after.length);

    newBuffer.set(before, 0);
    if (orientationBuffer) newBuffer.set(orientationBuffer, before.length);
    newBuffer.set(after, before.length + (orientationBuffer ? orientationBuffer.length : 0));

    return newBuffer.buffer;
};

export const removeExifData = async (uri: string): Promise<string> => {
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const arrayBuffer = decode(base64);
    const cleanedBuffer = cleanBuffer(arrayBuffer);
    const cleanedBase64 = encode(cleanedBuffer);
    const cleanedUri = `${FileSystem.cacheDirectory}cleaned-image.jpg`;
    await FileSystem.writeAsStringAsync(cleanedUri, cleanedBase64, { encoding: FileSystem.EncodingType.Base64 });
    return cleanedUri;
};
