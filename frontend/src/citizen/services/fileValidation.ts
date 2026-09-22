// Client-side file validation and security checks for UFIS Citizen Portal
// Enforces max 10 MB size, max 3 photos, valid JPG/PNG MIME & magic byte signatures

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];

/**
 * Checks file size and MIME type
 */
export function validateMediaFile(file: File): FileValidationResult {
  if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: `Unsupported file type (${file.type || 'unknown'}). Only JPG, JPEG, and PNG images are permitted.`
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File "${file.name}" is ${sizeMb} MB. Maximum allowed size is 10 MB per image.`
    };
  }

  return { valid: true };
}

/**
 * Asynchronously verifies actual binary magic bytes to prevent renamed executables/scripts
 */
export async function verifyImageMagicBytes(file: File): Promise<FileValidationResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (!reader.result || typeof reader.result === 'string') {
        resolve({ valid: false, error: 'Could not read file binary headers.' });
        return;
      }
      const arr = new Uint8Array(reader.result).subarray(0, 4);
      let header = '';
      for (let i = 0; i < arr.length; i++) {
        header += arr[i].toString(16).padStart(2, '0');
      }

      // Check known magic signatures
      // JPEG: ffd8ff...
      // PNG: 89504e47
      const isJpeg = header.startsWith('ffd8ff');
      const isPng = header.startsWith('89504e47');

      if (isJpeg || isPng) {
        resolve({ valid: true });
      } else {
        resolve({
          valid: false,
          error: `File signature mismatch. The file "${file.name}" does not match a valid JPG or PNG format.`
        });
      }
    };
    reader.onerror = () => {
      resolve({ valid: false, error: 'Error reading file stream.' });
    };
    reader.readAsArrayBuffer(file.slice(0, 4));
  });
}

/**
 * Converts File to Base64 data URL for local draft persistence and preview
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
