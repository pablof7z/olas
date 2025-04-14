import * as RNFS from 'react-native-fs';

export default async function sha256(file: string): Promise<string> {
    return await RNFS.hash(file, 'sha256');
}
