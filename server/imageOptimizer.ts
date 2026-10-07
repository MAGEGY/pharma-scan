import sharp from 'sharp';
import { createHash } from 'crypto';

// Image optimization configuration
interface ImageOptimizationConfig {
  maxWidth: number;
  maxHeight: number;
  quality: number; // 1-100
  format: 'jpeg' | 'png' | 'webp';
  progressive: boolean;
}

// Default configurations for different use cases
export const IMAGE_CONFIGS = {
  // Thumbnail for previews - small, fast loading
  thumbnail: {
    maxWidth: 300,
    maxHeight: 300,
    quality: 80,
    format: 'webp' as const,
    progressive: true,
  },
  
  // Standard display image - balanced quality and size
  standard: {
    maxWidth: 800,
    maxHeight: 1200,
    quality: 85,
    format: 'webp' as const,
    progressive: true,
  },
  
  // High quality for analysis - preserve details
  analysis: {
    maxWidth: 1200,
    maxHeight: 1800,
    quality: 90,
    format: 'jpeg' as const,
    progressive: false,
  },
  
  // Preview for OCR - optimized for text recognition
  ocr: {
    maxWidth: 1024,
    maxHeight: 1536,
    quality: 95,
    format: 'jpeg' as const,
    progressive: false,
  },
};

// Image metadata
export interface ImageMetadata {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  dimensions: { width: number; height: number };
  format: string;
  hash: string;
  processingTime: number;
}

// Image optimization service
export class ImageOptimizer {
  private static instance: ImageOptimizer;
  
  static getInstance(): ImageOptimizer {
    if (!ImageOptimizer.instance) {
      ImageOptimizer.instance = new ImageOptimizer();
    }
    return ImageOptimizer.instance;
  }

  // Optimize image buffer
  async optimizeImage(
    imageBuffer: Buffer,
    config: ImageOptimizationConfig = IMAGE_CONFIGS.standard
  ): Promise<{ buffer: Buffer; metadata: ImageMetadata }> {
    const startTime = Date.now();
    const originalSize = imageBuffer.length;
    
    try {
      // Get image info first
      const metadata = await sharp(imageBuffer).metadata();
      
      // Create sharp instance with configuration
      let sharpInstance = sharp(imageBuffer);
      
      // Resize if necessary
      if (metadata.width && metadata.height) {
        const { width, height } = this.calculateDimensions(
          metadata.width,
          metadata.height,
          config.maxWidth,
          config.maxHeight
        );
        
        if (width !== metadata.width || height !== metadata.height) {
          sharpInstance = sharpInstance.resize(width, height, {
            fit: 'inside',
            withoutEnlargement: true,
          });
        }
      }
      
      // Apply format and quality settings
      const formatOptions: any = {
        quality: config.quality,
        progressive: config.progressive,
      };
      
      if (config.format === 'webp') {
        sharpInstance = sharpInstance.webp(formatOptions);
      } else if (config.format === 'png') {
        sharpInstance = sharpInstance.png({
          compressionLevel: 9,
          adaptiveFiltering: true,
          progressive: config.progressive,
        });
      } else {
        sharpInstance = sharpInstance.jpeg(formatOptions);
      }
      
      // Process image
      const optimizedBuffer = await sharpInstance.toBuffer();
      const processingTime = Date.now() - startTime;
      
      // Generate hash for cache key
      const hash = this.generateImageHash(optimizedBuffer);
      
      const imageMetadata: ImageMetadata = {
        originalSize,
        optimizedSize: optimizedBuffer.length,
        compressionRatio: originalSize > 0 ? (originalSize - optimizedBuffer.length) / originalSize : 0,
        dimensions: {
          width: metadata.width || 0,
          height: metadata.height || 0,
        },
        format: config.format,
        hash,
        processingTime,
      };
      
      return {
        buffer: optimizedBuffer,
        metadata: imageMetadata,
      };
      
    } catch (error) {
      console.error('Image optimization failed:', error);
      throw new Error(`Failed to optimize image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Calculate new dimensions maintaining aspect ratio
  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;
    
    let newWidth = originalWidth;
    let newHeight = originalHeight;
    
    // Scale down if necessary
    if (originalWidth > maxWidth) {
      newWidth = maxWidth;
      newHeight = maxWidth / aspectRatio;
    }
    
    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = maxHeight * aspectRatio;
    }
    
    return {
      width: Math.round(newWidth),
      height: Math.round(newHeight),
    };
  }

  // Generate consistent hash for image
  private generateImageHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex').substring(0, 16);
  }

  // Validate image buffer
  async validateImage(buffer: Buffer): Promise<boolean> {
    try {
      const metadata = await sharp(buffer).metadata();
      return !!(metadata.width && metadata.height && metadata.format);
    } catch {
      return false;
    }
  }

  // Get image info without processing
  async getImageInfo(buffer: Buffer): Promise<sharp.Metadata> {
    return await sharp(buffer).metadata();
  }

  // Batch optimize multiple images
  async optimizeBatch(
    images: Array<{ buffer: Buffer; config?: ImageOptimizationConfig }>
  ): Promise<Array<{ buffer: Buffer; metadata: ImageMetadata }>> {
    const results = [];
    
    for (const { buffer, config } of images) {
      try {
        const result = await this.optimizeImage(buffer, config);
        results.push(result);
      } catch (error) {
        console.error('Failed to optimize image in batch:', error);
        // Add original image as fallback
        results.push({
          buffer,
          metadata: {
            originalSize: buffer.length,
            optimizedSize: buffer.length,
            compressionRatio: 0,
            dimensions: { width: 0, height: 0 },
            format: 'original',
            hash: '',
            processingTime: 0,
          },
        });
      }
    }
    
    return results;
  }

  // Create multiple sizes from single image
  async createMultipleSizes(
    imageBuffer: Buffer,
    configs: Array<{ name: string; config: ImageOptimizationConfig }>
  ): Promise<Array<{ name: string; buffer: Buffer; metadata: ImageMetadata }>> {
    const results = [];
    
    for (const { name, config } of configs) {
      try {
        const result = await this.optimizeImage(imageBuffer, config);
        results.push({ name, ...result });
      } catch (error) {
        console.error(`Failed to create ${name} size:`, error);
      }
    }
    
    return results;
  }
}

// Middleware for image optimization in uploads
export function createImageUploadMiddleware(config: ImageOptimizationConfig = IMAGE_CONFIGS.standard) {
  return async (req: any, res: any, next: any) => {
    if (!req.file || !req.file.buffer) {
      return next();
    }

    try {
      const optimizer = ImageOptimizer.getInstance();
      const result = await optimizer.optimizeImage(req.file.buffer, config);
      
      // Replace the original buffer with optimized one
      req.file.buffer = result.buffer;
      req.file.originalSize = result.metadata.originalSize;
      req.file.optimizedSize = result.metadata.optimizedSize;
      req.file.compressionRatio = result.metadata.compressionRatio;
      req.file.dimensions = result.metadata.dimensions;
      
      next();
    } catch (error) {
      console.error('Image upload optimization failed:', error);
      // Continue with original image if optimization fails
      next();
    }
  };
}

// Utility functions for common operations
export const ImageUtils = {
  // Convert base64 to buffer
  base64ToBuffer(base64: string): Buffer {
    const base64Data = base64.replace(/^data:image\/[a-z]+;base64,/, '');
    return Buffer.from(base64Data, 'base64');
  },

  // Convert buffer to base64
  bufferToBase64(buffer: Buffer, mimeType: string = 'image/jpeg'): string {
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  },

  // Format file size for display
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Get image format from buffer
  async getImageFormat(buffer: Buffer): Promise<string> {
    try {
      const metadata = await sharp(buffer).metadata();
      return metadata.format || 'unknown';
    } catch {
      return 'unknown';
    }
  },
};

export default ImageOptimizer;
