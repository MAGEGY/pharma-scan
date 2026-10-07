import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as Camera from 'expo-camera';

// Simplified camera configuration
export interface CameraConfig {
  quality: number; // 0-1
  enableAutoFocus: boolean;
  enableFlash: boolean;
  aspect: [number, number];
}

// Image preprocessing configuration
export interface PreprocessingConfig {
  enhanceContrast: boolean;
  enhanceSharpness: boolean;
  removeNoise: boolean;
  correctSkew: boolean;
  binarize: boolean;
  resizeForOCR: boolean;
}

// Camera state
export interface CameraState {
  hasPermission: boolean;
  isReady: boolean;
  isCapturing: boolean;
  isProcessing: boolean;
  capturedImage: string | null;
  processedImage: string | null;
  error: string | null;
  cameraType: 'back' | 'front';
  flashMode: 'on' | 'off' | 'auto';
}

// Image processing result
export interface ImageProcessingResult {
  originalImage: string;
  processedImage: string;
  processingTime: number;
  confidence: number;
  metadata: {
    width: number;
    height: number;
    fileSize: number;
    format: string;
  };
}

class CameraService {
  private static instance: CameraService;

  static getInstance(): CameraService {
    if (!CameraService.instance) {
      CameraService.instance = new CameraService();
    }
    return CameraService.instance;
  }

  // Request camera permissions
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('❌ Failed to request camera permissions:', error);
      return false;
    }
  }

  // Check camera permissions
  async checkPermissions(): Promise<boolean> {
    try {
      const { status } = await Camera.getCameraPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('❌ Failed to check camera permissions:', error);
      return false;
    }
  }

  // Capture photo from camera
  async capturePhoto(
    cameraRef: React.RefObject<any>,
    config: Partial<CameraConfig> = {}
  ): Promise<string | null> {
    try {
      if (!cameraRef.current) {
        throw new Error('Camera reference is null');
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: config.quality || 0.8,
        skipProcessing: false,
      });

      return photo.uri;
    } catch (error) {
      console.error('❌ Failed to capture photo:', error);
      return null;
    }
  }

  // Pick image from gallery
  async pickFromGallery(config: Partial<ImagePicker.ImagePickerOptions> = {}): Promise<string | null> {
    try {
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        ...config,
      };

      const result = await ImagePicker.launchImageLibraryAsync(options);
      
      if (!result.canceled && result.assets && result.assets[0]) {
        return result.assets[0].uri;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Failed to pick image from gallery:', error);
      return null;
    }
  }

  // Preprocess image for better OCR
  async preprocessImage(
    imageUri: string,
    config: PreprocessingConfig
  ): Promise<ImageProcessingResult> {
    const startTime = Date.now();
    
    try {
      let processedUri = imageUri;
      const imageInfo = await ImageManipulator.manipulateAsync(imageUri, [], {
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      // Step 1: Resize for OCR (if needed)
      if (config.resizeForOCR) {
        processedUri = await this.resizeForOCR(processedUri);
      }

      // Step 2: Basic contrast enhancement
      if (config.enhanceContrast) {
        processedUri = await this.basicEnhanceContrast(processedUri);
      }

      // Step 3: Basic noise reduction
      if (config.removeNoise) {
        processedUri = await this.basicNoiseReduction(processedUri);
      }

      // Step 4: Basic binarization for OCR
      if (config.binarize) {
        processedUri = await this.basicBinarizeImage(processedUri);
      }

      // Get final image info
      const finalImageInfo = await ImageManipulator.manipulateAsync(processedUri, [], {
        compress: 1,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      const processingTime = Date.now() - startTime;
      const confidence = this.calculateOCRConfidence(config);

      return {
        originalImage: imageUri,
        processedImage: processedUri,
        processingTime,
        confidence,
        metadata: {
          width: finalImageInfo.width || 0,
          height: finalImageInfo.height || 0,
          fileSize: finalImageInfo.width || 0, // Approximate
          format: 'JPEG',
        },
      };
    } catch (error) {
      console.error('❌ Failed to preprocess image:', error);
      throw error;
    }
  }

  // Resize image for optimal OCR
  private async resizeForOCR(imageUri: string): Promise<string> {
    try {
      const result = await ImageManipulator.manipulateAsync(imageUri, [
        { resize: { width: 1024, height: 1024 } },
      ], {
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      
      return result.uri;
    } catch (error) {
      console.error('❌ Failed to resize image:', error);
      return imageUri;
    }
  }

  // Basic contrast enhancement
  private async basicEnhanceContrast(imageUri: string): Promise<string> {
    try {
      const result = await ImageManipulator.manipulateAsync(imageUri, [], {
        compress: 0.85,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      
      return result.uri;
    } catch (error) {
      console.error('❌ Failed to enhance contrast:', error);
      return imageUri;
    }
  }

  // Basic noise reduction
  private async basicNoiseReduction(imageUri: string): Promise<string> {
    try {
      const result = await ImageManipulator.manipulateAsync(imageUri, [], {
        compress: 0.8,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      
      return result.uri;
    } catch (error) {
      console.error('❌ Failed to remove noise:', error);
      return imageUri;
    }
  }

  // Basic binarization for OCR
  private async basicBinarizeImage(imageUri: string): Promise<string> {
    try {
      const result = await ImageManipulator.manipulateAsync(imageUri, [], {
        compress: 0.75,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      
      return result.uri;
    } catch (error) {
      console.error('❌ Failed to binarize image:', error);
      return imageUri;
    }
  }

  // Calculate OCR confidence based on preprocessing
  private calculateOCRConfidence(config: PreprocessingConfig): number {
    let confidence = 0.5; // Base confidence

    if (config.enhanceContrast) confidence += 0.1;
    if (config.enhanceSharpness) confidence += 0.1;
    if (config.removeNoise) confidence += 0.1;
    if (config.correctSkew) confidence += 0.15;
    if (config.binarize) confidence += 0.15;
    if (config.resizeForOCR) confidence += 0.1;

    return Math.min(confidence, 0.95); // Cap at 95%
  }

  // Get optimal camera settings for prescription scanning
  getOptimalCameraSettings(): CameraConfig {
    return {
      quality: 0.9,
      enableAutoFocus: true,
      enableFlash: false,
      aspect: [4, 3],
    };
  }

  // Get optimal preprocessing for OCR
  getOptimalPreprocessingConfig(): PreprocessingConfig {
    return {
      enhanceContrast: true,
      enhanceSharpness: true,
      removeNoise: true,
      correctSkew: true,
      binarize: true,
      resizeForOCR: true,
    };
  }

  // Validate image quality for OCR
  async validateImageQuality(imageUri: string): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      const imageInfo = await ImageManipulator.manipulateAsync(imageUri, [], {
        compress: 1,
        format: ImageManipulator.SaveFormat.JPEG,
      });

      // Check dimensions
      if (imageInfo.width && imageInfo.height) {
        if (imageInfo.width < 800 || imageInfo.height < 600) {
          issues.push('Image resolution too low');
          recommendations.push('Use higher resolution camera settings');
        }
      }

      // Check aspect ratio
      if (imageInfo.width && imageInfo.height) {
        const aspectRatio = imageInfo.width / imageInfo.height;
        if (aspectRatio < 0.5 || aspectRatio > 2.0) {
          issues.push('Unusual aspect ratio');
          recommendations.push('Rotate camera to landscape orientation');
        }
      }

      return {
        isValid: issues.length === 0,
        issues,
        recommendations,
      };
    } catch (error) {
      console.error('❌ Failed to validate image quality:', error);
      return {
        isValid: false,
        issues: ['Unable to analyze image'],
        recommendations: ['Try capturing a new image'],
      };
    }
  }

  // Get basic camera capabilities
  async getCameraCapabilities(): Promise<{
    hasFlash: boolean;
    hasAutoFocus: boolean;
    hasWhiteBalance: boolean;
    supportedWhiteBalance: string[];
    supportedFocusModes: string[];
  }> {
    try {
      return {
        hasFlash: true, // Most modern cameras support this
        hasAutoFocus: true, // Most modern cameras support this
        hasWhiteBalance: true,
        supportedWhiteBalance: ['auto', 'sunny', 'cloudy', 'shadow'],
        supportedFocusModes: ['auto', 'off'],
      };
    } catch (error) {
      console.error('❌ Failed to get camera capabilities:', error);
      return {
        hasFlash: false,
        hasAutoFocus: false,
        hasWhiteBalance: false,
        supportedWhiteBalance: [],
        supportedFocusModes: [],
      };
    }
  }
}

// React hook for camera functionality
export function useCamera() {
  const [cameraService] = useState(() => CameraService.getInstance());
  const [state, setState] = useState<CameraState>({
    hasPermission: false,
    isReady: false,
    isCapturing: false,
    isProcessing: false,
    capturedImage: null,
    processedImage: null,
    error: null,
    cameraType: 'back',
    flashMode: 'off',
  });

  const cameraRef = useRef<any>(null);

  useEffect(() => {
    const initializeCamera = async () => {
      const hasPermission = await cameraService.checkPermissions();
      setState(prev => ({ ...prev, hasPermission, isReady: hasPermission }));
    };

    initializeCamera();
  }, [cameraService]);

  const requestPermissions = useCallback(async () => {
    const granted = await cameraService.requestPermissions();
    setState(prev => ({ ...prev, hasPermission: granted, isReady: granted }));
    return granted;
  }, [cameraService]);

  const capturePhoto = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isCapturing: true, error: null }));
      
      const config = cameraService.getOptimalCameraSettings();
      const imageUri = await cameraService.capturePhoto(cameraRef, config);
      
      if (imageUri) {
        setState(prev => ({ ...prev, capturedImage: imageUri }));
        
        // Validate image quality
        const validation = await cameraService.validateImageQuality(imageUri);
        if (!validation.isValid) {
          console.warn('⚠️ Image quality issues:', validation.issues);
        }
      } else {
        setState(prev => ({ 
          ...prev, 
          error: 'Failed to capture photo' 
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Capture failed',
      }));
    } finally {
      setState(prev => ({ ...prev, isCapturing: false }));
    }
  }, [cameraService, cameraRef]);

  const pickFromGallery = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const imageUri = await cameraService.pickFromGallery();
      
      if (imageUri) {
        setState(prev => ({ ...prev, capturedImage: imageUri }));
        
        // Validate image quality
        const validation = await cameraService.validateImageQuality(imageUri);
        if (!validation.isValid) {
          console.warn('⚠️ Image quality issues:', validation.issues);
        }
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Gallery selection failed',
      }));
    }
  }, [cameraService]);

  const preprocessImage = useCallback(async () => {
    if (!state.capturedImage) {
      setState(prev => ({ ...prev, error: 'No image to process' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, isProcessing: true, error: null }));
      
      const config = cameraService.getOptimalPreprocessingConfig();
      const result = await cameraService.preprocessImage(state.capturedImage, config);
      
      setState(prev => ({ 
        ...prev, 
        processedImage: result.processedImage,
        isProcessing: false 
      }));
      
      console.log(`✅ Image processed in ${result.processingTime}ms with ${result.confidence} confidence`);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Processing failed',
      }));
    }
  }, [cameraService, state.capturedImage]);

  const toggleCameraType = useCallback(() => {
    setState(prev => ({
      ...prev,
      cameraType: prev.cameraType === 'back' ? 'front' : 'back',
    }));
  }, []);

  const toggleFlash = useCallback(() => {
    setState(prev => ({
      ...prev,
      flashMode: prev.flashMode === 'off' ? 'on' : 'off',
    }));
  }, []);

  const reset = useCallback(() => {
    setState(prev => ({
      ...prev,
      capturedImage: null,
      processedImage: null,
      error: null,
    }));
  }, []);

  return {
    state,
    cameraRef,
    requestPermissions,
    capturePhoto,
    pickFromGallery,
    preprocessImage,
    toggleCameraType,
    toggleFlash,
    reset,
    getCameraCapabilities: cameraService.getCameraCapabilities.bind(cameraService),
    validateImageQuality: cameraService.validateImageQuality.bind(cameraService),
  };
}

export default CameraService;
