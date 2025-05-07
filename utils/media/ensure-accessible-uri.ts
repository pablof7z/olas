import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

/**
 * Ensures the given URI is accessible by the app (especially on Android).
 * If the URI is not in the app's storage, copies it to the cache directory and returns the new URI.
 * Handles both file:// and content:// URIs.
 * @param uri The original URI to check/copy.
 * @returns The accessible URI (string).
 */
export async function ensureAccessibleUri(uri: string): Promise<string> {
  try {
    if (!uri) throw new Error('No URI provided');

    // If already in app's cache or document directory, return as is
    if (
      uri.startsWith(FileSystem.cacheDirectory ?? '') ||
      uri.startsWith(FileSystem.documentDirectory ?? '')
    ) {
      return uri;
    }

    // For iOS, file:// URIs are generally accessible
    if (Platform.OS === 'ios' && uri.startsWith('file://')) {
      return uri;
    }

    // For Android, content:// and file:// URIs outside app storage need to be copied
    // Generate a unique filename
    // Extract the basename from the URI (remove query/hash if present)
    // Remove scheme for basename extraction
    let uriWithoutScheme = uri;
    if (uri.startsWith('file://')) {
      uriWithoutScheme = uri.slice(7);
    } else if (uri.startsWith('content://')) {
      uriWithoutScheme = uri.slice(10);
    }
    const uriWithoutParams = uriWithoutScheme.split('?')[0].split('#')[0];
    const basenameMatch = uriWithoutParams.match(/[^/]+$/);
    const basename = basenameMatch ? basenameMatch[0] : `media_${Date.now()}`;
    const filename = `media_${Date.now()}_${basename}`;
    const destPath = FileSystem.cacheDirectory
      ? FileSystem.cacheDirectory + filename
      : uri;

    // If content:// or file://, use FileSystem to copy
    if (uri.startsWith('content://') || uri.startsWith('file://')) {
      try {
        await FileSystem.copyAsync({
          from: uri,
          to: destPath,
        });
        return destPath;
      } catch (copyErr) {
        console.warn(
          `[ensureAccessibleUri] Failed to copy file from ${uri} to ${destPath}:`,
          copyErr
        );
        throw copyErr;
      }
    }

    // If already a remote URL (http/https), return as is
    if (uri.startsWith('http://') || uri.startsWith('https://')) {
      return uri;
    }

    // Fallback: return original URI
    return uri;
  } catch (err) {
    console.error('[ensureAccessibleUri] Error ensuring accessible URI:', err, uri);
    throw err;
  }
}