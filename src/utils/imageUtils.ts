/**
 * Compresses an image file client-side using Canvas to prevent localStorage overflow.
 * Supports JPEG, PNG, and WebP, converting them to optimized JPEGs.
 */
export function compressImage(
  file: File,
  maxWidth = 400,
  maxHeight = 400,
  quality = 0.7
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      reject(new Error('Invalid file type. Please select a JPEG, PNG, or WebP image.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize if larger than bounds, maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not create 2D canvas context for compression.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        try {
          // Convert to JPEG base64 with target quality
          const base64 = canvas.toDataURL('image/jpeg', quality);
          resolve(base64);
        } catch (e) {
          reject(e);
        }
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image. The file may be corrupt or invalid.'));
      };
      
      if (event.target?.result) {
        img.src = event.target.result as string;
      } else {
        reject(new Error('FileReader failed to read the file.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('FileReader error occurred while reading the image file.'));
    };
    
    reader.readAsDataURL(file);
  });
}
