const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;

/**
 * Downscales and re-encodes an image file client-side via canvas so uploads
 * stay small on mobile connections. Falls back to the original file if the
 * browser can't decode/encode it (e.g. unsupported format).
 */
export async function compressImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) return file;

    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
    );

    if (!blob) return file;

    const compressedName = file.name.replace(/\.\w+$/, '.jpg');
    return new File([blob], compressedName, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
