import * as ImageManipulator from 'expo-image-manipulator';

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png';
}

export interface ImageProcessingResult {
  uri: string;
  width: number;
  height: number;
  size: number; // in bytes
  format: string;
}

/**
 * Compress and optimize images for better performance
 * @param imageUri - URI of the image to process
 * @param options - Compression options
 * @returns Processed image information
 */
export async function compressImage(
  imageUri: string,
  options: ImageCompressionOptions = {}
): Promise<ImageProcessingResult> {
  const {
    maxWidth = 1024,
    maxHeight = 1024,
    quality = 0.8,
    format = 'jpeg',
  } = options;

  try {
    // Get original image info
    const originalInfo = await ImageManipulator.getActionsAsync(imageUri);
    
    // Calculate new dimensions while maintaining aspect ratio
    const { width: originalWidth, height: originalHeight } = originalInfo;
    let newWidth = originalWidth;
    let newHeight = originalHeight;

    if (originalWidth > maxWidth || originalHeight > maxHeight) {
      const aspectRatio = originalWidth / originalHeight;
      
      if (originalWidth > originalHeight) {
        newWidth = maxWidth;
        newHeight = maxWidth / aspectRatio;
      } else {
        newHeight = maxHeight;
        newWidth = maxHeight * aspectRatio;
      }
    }

    // Compress the image
    const result = await ImageManipulator.manipulateAsync(imageUri, [
      { resize: { width: newWidth, height: newHeight } },
    ], {
      compress: quality,
      format: format === 'jpeg' ? ImageManipulator.SaveFormat.JPEG : ImageManipulator.SaveFormat.PNG,
    });

    // Get file size (approximate)
    const response = await fetch(result.uri);
    const blob = await response.blob();
    const size = blob.size;

    return {
      uri: result.uri,
      width: newWidth,
      height: newHeight,
      size,
      format: format,
    };
  } catch (error) {
    console.error('Error compressing image:', error);
    throw new Error('Failed to compress image');
  }
}

/**
 * Generate thumbnail for prescription images
 * @param imageUri - URI of the original image
 * @param size - Thumbnail size (default: 200)
 * @returns Thumbnail image URI
 */
export async function generateThumbnail(
  imageUri: string,
  size: number = 200
): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(imageUri, [
      { resize: { width: size, height: size } },
    ], {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    return result.uri;
  } catch (error) {
    console.error('Error generating thumbnail:', error);
    throw new Error('Failed to generate thumbnail');
  }
}

/**
 * Validate image before processing
 * @param imageUri - URI of the image to validate
 * @returns Validation result
 */
export async function validateImage(imageUri: string): Promise<{
  isValid: boolean;
  error?: string;
  info?: ImageManipulator.ImageResult;
}> {
  try {
    const info = await ImageManipulator.getActionsAsync(imageUri);
    
    // Check file size (approximate check)
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const sizeInMB = blob.size / (1024 * 1024);

    // Validate constraints
    if (sizeInMB > 10) {
      return {
        isValid: false,
        error: 'Image size too large (max 10MB)',
      };
    }

    if (info.width < 100 || info.height < 100) {
      return {
        isValid: false,
        error: 'Image resolution too low (minimum 100x100)',
      };
    }

    if (info.width > 4000 || info.height > 4000) {
      return {
        isValid: false,
        error: 'Image resolution too high (maximum 4000x4000)',
      };
    }

    return {
      isValid: true,
      info,
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid image file',
    };
  }
}

/**
 * Get image dimensions without loading the full image
 * @param imageUri - URI of the image
 * @returns Image dimensions
 */
export async function getImageDimensions(imageUri: string): Promise<{
  width: number;
  height: number;
}> {
  try {
    const info = await ImageManipulator.getActionsAsync(imageUri);
    return {
      width: info.width,
      height: info.height,
    };
  } catch (error) {
    console.error('Error getting image dimensions:', error);
    throw new Error('Failed to get image dimensions');
  }
}

/**
 * Format file size for display
 * @param bytes - Size in bytes
 * @returns Formatted size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Check if image needs compression
 * @param imageUri - URI of the image to check
 * @param maxSize - Maximum allowed size in MB (default: 1)
 * @returns Whether compression is needed
 */
export async function needsCompression(
  imageUri: string,
  maxSize: number = 1
): Promise<boolean> {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const sizeInMB = blob.size / (1024 * 1024);
    
    return sizeInMB > maxSize;
  } catch (error) {
    console.error('Error checking compression need:', error);
    return true; // Default to compressing if we can't check
  }
}
