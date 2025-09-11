/**
 * Compresses an image file to reduce its size while maintaining reasonable quality
 * @param file The original image file
 * @param maxWidth Maximum width for the compressed image (default: 1200)
 * @param maxHeight Maximum height for the compressed image (default: 1200)
 * @param quality JPEG quality (0-1, default: 0.8)
 * @param maxSizeKB Maximum file size in KB (default: 500)
 * @returns Promise<File> The compressed image file
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1200,
  maxHeight: number = 1200,
  quality: number = 0.8,
  maxSizeKB: number = 500
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress the image
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Try different quality levels to meet size requirement
      let currentQuality = quality;
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Check if size is acceptable or if we've tried minimum quality
            if (blob.size <= maxSizeKB * 1024 || currentQuality <= 0.1) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              // Reduce quality and try again
              currentQuality -= 0.1;
              tryCompress();
            }
          },
          'image/jpeg',
          currentQuality
        );
      };

      tryCompress();
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Compresses multiple images in parallel
 * @param files Array of image files to compress
 * @param options Compression options
 * @returns Promise<File[]> Array of compressed image files
 */
export async function compressImages(
  files: File[],
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    maxSizeKB?: number;
  } = {}
): Promise<File[]> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.8,
    maxSizeKB = 500
  } = options;

  const compressionPromises = files.map(file => 
    compressImage(file, maxWidth, maxHeight, quality, maxSizeKB)
  );

  return Promise.all(compressionPromises);
}
