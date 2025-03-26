import { Image } from "expo-image";
import { convertMediaPath } from ".";

export default async function dimensions(file: string): Promise<{ width: number, height: number }> {
    const normalizedUri = await convertMediaPath(file, 'image');
    const imageData = await Image.loadAsync(normalizedUri);
    return { width: imageData.width, height: imageData.height };
}