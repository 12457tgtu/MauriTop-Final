import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

/**
 * Converts a base64 / data URL string to a standard Blob
 */
export function dataURLtoBlob(dataurl: string): Blob {
  try {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/webp';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (e) {
    throw new Error("Failed to convert image data URL to Blob: " + (e as Error).message);
  }
}

/**
 * Uploads a file to Firebase Storage with progress tracking.
 * @param file The file to upload (File, Blob, or base64 data URL)
 * @param path The path in storage (e.g., 'services/image.webp')
 * @param onProgress Callback for progress updates (0-100)
 * @returns Promise resolving to the download URL
 */
export function uploadFileWithProgress(
  file: File | Blob | string,
  path: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const uploadTarget: Blob = typeof file === 'string' ? dataURLtoBlob(file) : file;
      const storageRef = ref(storage, path);
      const task = uploadBytesResumable(storageRef, uploadTarget);

      // Add a 60 second timeout
      const timeout = setTimeout(() => {
        task.cancel();
        reject(new Error("Upload timed out after 60 seconds"));
      }, 60000);

      task.on(
        'state_changed',
        (snapshot) => {
          const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          console.log(`Upload progress for ${path}: ${percent}%`);
          onProgress?.(percent);
        },
        (error) => {
          clearTimeout(timeout);
          console.error('UPLOAD ERROR:', error.code, error.message);
          reject(error);
        },
        async () => {
          clearTimeout(timeout);
          try {
            const url = await getDownloadURL(task.snapshot.ref);
            console.log(`Upload completed for ${path}: ${url}`);
            resolve(url);
          } catch (err) {
            console.error('FAILED TO GET DOWNLOAD URL:', err);
            reject(err);
          }
        }
      );
    } catch (err) {
      console.error('INITIAL UPLOAD ERROR:', err);
      reject(err);
    }
  });
}
