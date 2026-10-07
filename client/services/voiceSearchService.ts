import React, { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Speech from 'expo-speech';
import * as Audio from 'expo-av';

// Language configurations
export enum VoiceLanguage {
  ENGLISH = 'en',
  ARABIC = 'ar',
  ENGLISH_US = 'en-US',
  ARABIC_EG = 'ar-EG',
}

// Voice search state
export interface VoiceSearchState {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
  language: VoiceLanguage;
}

// Voice search result
export interface VoiceSearchResult {
  transcript: string;
  confidence: number;
  language: VoiceLanguage;
  duration: number;
  timestamp: Date;
}

// Voice search configuration
interface VoiceSearchConfig {
  language: VoiceLanguage;
  maxRecordingDuration: number; // in seconds
  minConfidence: number; // 0-1
  enableAutoCorrection: boolean;
  enableArabicDiacritics: boolean;
}

class VoiceSearchService {
  private static instance: VoiceSearchService;
  private recording: Audio.Recording | null = null;
  private soundObject: Audio.Sound | null = null;
  private isInitialized = false;

  static getInstance(): VoiceSearchService {
    if (!VoiceSearchService.instance) {
      VoiceSearchService.instance = new VoiceSearchService();
    }
    return VoiceSearchService.instance;
  }

  // Initialize audio permissions and setup
  async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) {
        return true;
      }

      // Request audio recording permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('❌ Audio recording permissions denied');
        return false;
      }

      // Configure audio session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      this.isInitialized = true;
      console.log('✅ Voice search service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize voice search:', error);
      return false;
    }
  }

  // Start voice recording
  async startRecording(language: VoiceLanguage = VoiceLanguage.ENGLISH): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Stop any existing recording
      if (this.recording) {
        await this.stopRecording();
      }

      // Configure recording options based on language
      const recordingOptions: Audio.RecordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };

      // Start recording
      const { recording } = await Audio.Recording.createAsync(recordingOptions);
      this.recording = recording;

      console.log(`🎤 Started voice recording in ${language}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      return false;
    }
  }

  // Stop voice recording
  async stopRecording(): Promise<string | null> {
    try {
      if (!this.recording) {
        console.log('⚠️ No active recording to stop');
        return null;
      }

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;

      console.log(`🛑 Stopped recording: ${uri}`);
      return uri;
    } catch (error) {
      console.error('❌ Failed to stop recording:', error);
      return null;
    }
  }

  // Transcribe audio using speech recognition
  async transcribeAudio(
    audioUri: string,
    language: VoiceLanguage,
    config: Partial<VoiceSearchConfig> = {}
  ): Promise<VoiceSearchResult> {
    try {
      const startTime = Date.now();

      // For now, we'll simulate transcription since we don't have a built-in speech recognition API
      // In a real implementation, you would use:
      // - Google Speech-to-Text API
      // - Azure Speech Services
      // - AWS Transcribe
      // - Or a local speech recognition library

      const simulatedResult = await this.simulateTranscription(audioUri, language, config);

      const duration = Date.now() - startTime;
      
      return {
        ...simulatedResult,
        duration,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('❌ Failed to transcribe audio:', error);
      throw error;
    }
  }

  // Simulate transcription (replace with real speech recognition)
  private async simulateTranscription(
    audioUri: string,
    language: VoiceLanguage,
    config: Partial<VoiceSearchConfig>
  ): Promise<Omit<VoiceSearchResult, 'duration' | 'timestamp'>> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    // Simulated transcriptions based on language
    const simulatedTranscriptions: Record<string, string[]> = {
      [VoiceLanguage.ENGLISH]: [
        'Panadol',
        'Augmentin',
        'Aspirin',
        'Vitamin C',
        'Ibuprofen',
        'Antibiotic',
        'Pain reliever',
        'Cold medicine',
      ],
      [VoiceLanguage.ENGLISH_US]: [
        'Panadol',
        'Augmentin',
        'Aspirin',
        'Vitamin C',
        'Ibuprofen',
        'Antibiotic',
        'Pain reliever',
        'Cold medicine',
      ],
      [VoiceLanguage.ARABIC]: [
        'بانادول',
        'أوجمنتين',
        'أسبرين',
        'فيتامين سي',
        'ايبوبروفين',
        'مضاد حيوي',
        'مسكن ألم',
        'دواء نزلة برد',
      ],
      [VoiceLanguage.ARABIC_EG]: [
        'بانادول',
        'أوجمنتين',
        'أسبرين',
        'فيتامين سي',
        'ايبوبروفين',
        'مضاد حيوي',
        'مسكن ألم',
        'دواء نزلة برد',
      ],
    };

    const transcriptions = simulatedTranscriptions[language] || simulatedTranscriptions[VoiceLanguage.ENGLISH];
    const transcript = transcriptions[Math.floor(Math.random() * transcriptions.length)];
    const confidence = 0.7 + Math.random() * 0.3; // 70-100% confidence

    return {
      transcript,
      confidence,
      language,
    };
  }

  // Text-to-speech for voice feedback
  async speakText(
    text: string,
    language: VoiceLanguage = VoiceLanguage.ENGLISH,
    options: Partial<Speech.SpeechOptions> = {}
  ): Promise<void> {
    try {
      const speechOptions: Speech.SpeechOptions = {
        language: this.getSpeechLanguage(language),
        voice: this.getVoiceForLanguage(language),
        pitch: 1.0,
        rate: 0.9,
        volume: 1.0,
        ...options,
      };

      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) {
        await Speech.stop();
      }

      await Speech.speak(text, speechOptions);
      console.log(`🔊 Speaking: "${text}" in ${language}`);
    } catch (error) {
      console.error('❌ Failed to speak text:', error);
    }
  }

  // Get speech language code
  private getSpeechLanguage(language: VoiceLanguage): string {
    switch (language) {
      case VoiceLanguage.ARABIC:
      case VoiceLanguage.ARABIC_EG:
        return 'ar';
      case VoiceLanguage.ENGLISH_US:
        return 'en-US';
      default:
        return 'en';
    }
  }

  // Get voice for language
  private getVoiceForLanguage(language: VoiceLanguage): string {
    // These are example voice identifiers
    switch (language) {
      case VoiceLanguage.ARABIC_EG:
        return 'ar-EG-x-egm-local';
      case VoiceLanguage.ENGLISH_US:
        return 'en-US-x-loc-local';
      default:
        return 'en-x-loc-local';
    }
  }

  // Stop speech
  async stopSpeech(): Promise<void> {
    try {
      await Speech.stop();
      console.log('🔇 Speech stopped');
    } catch (error) {
      console.error('❌ Failed to stop speech:', error);
    }
  }

  // Check if speech is available
  async isSpeechAvailable(): Promise<boolean> {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      return voices.length > 0;
    } catch (error) {
      console.error('❌ Failed to check speech availability:', error);
      return false;
    }
  }

  // Get available voices
  async getAvailableVoices(): Promise<Speech.Voice[]> {
    try {
      return await Speech.getAvailableVoicesAsync();
    } catch (error) {
      console.error('❌ Failed to get available voices:', error);
      return [];
    }
  }

  // Clean up resources
  async cleanup(): Promise<void> {
    try {
      if (this.recording) {
        await this.stopRecording();
      }

      if (this.soundObject) {
        await this.soundObject.unloadAsync();
        this.soundObject = null;
      }

      console.log('🧹 Voice search service cleaned up');
    } catch (error) {
      console.error('❌ Failed to cleanup voice search:', error);
    }
  }

  // Process voice search query
  async processVoiceSearch(
    audioUri: string,
    language: VoiceLanguage,
    config: VoiceSearchConfig
  ): Promise<VoiceSearchResult> {
    const result = await this.transcribeAudio(audioUri, language, config);
    
    // Post-process transcript for better search results
    const processedTranscript = this.postProcessTranscript(result.transcript, language);
    
    return {
      ...result,
      transcript: processedTranscript,
    };
  }

  // Post-process transcript for better accuracy
  private postProcessTranscript(transcript: string, language: VoiceLanguage): string {
    let processed = transcript.trim();

    // Language-specific processing
    if (language === VoiceLanguage.ARABIC || language === VoiceLanguage.ARABIC_EG) {
      // Remove diacritics if not needed
      processed = this.removeArabicDiacritics(processed);
      
      // Normalize Arabic text
      processed = processed.replace(/[أإآ]/g, 'ا');
      processed = processed.replace(/[ة]/g, 'ه');
      processed = processed.replace(/[ى]/g, 'ي');
    } else {
      // English processing
      processed = processed.toLowerCase();
      processed = processed.replace(/[^\w\s]/g, ''); // Remove special characters
    }

    return processed;
  }

  // Remove Arabic diacritics
  private removeArabicDiacritics(text: string): string {
    // Arabic diacritics range
    const diacritics = /[\u064B-\u065F\u0670]/g;
    return text.replace(diacritics, '');
  }

  // Validate voice search result
  validateResult(result: VoiceSearchResult, config: VoiceSearchConfig): boolean {
    return (
      result.transcript.length > 0 &&
      result.confidence >= config.minConfidence &&
      result.duration > 0
    );
  }
}

// React hook for voice search
export function useVoiceSearch(config: Partial<VoiceSearchConfig> = {}) {
  const [voiceService] = useState(() => VoiceSearchService.getInstance());
  const [state, setState] = useState<VoiceSearchState>({
    isRecording: false,
    isProcessing: false,
    transcript: '',
    confidence: 0,
    error: null,
    language: VoiceLanguage.ENGLISH,
  });

  const defaultConfig: VoiceSearchConfig = {
    language: VoiceLanguage.ENGLISH,
    maxRecordingDuration: 30,
    minConfidence: 0.7,
    enableAutoCorrection: true,
    enableArabicDiacritics: false,
    ...config,
  };

  useEffect(() => {
    const initializeVoiceSearch = async () => {
      await voiceService.initialize();
    };

    initializeVoiceSearch();

    return () => {
      voiceService.cleanup();
    };
  }, [voiceService]);

  const startRecording = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isRecording: true, error: null }));
      
      const success = await voiceService.startRecording(state.language);
      if (!success) {
        setState(prev => ({
          ...prev,
          isRecording: false,
          error: 'Failed to start recording',
        }));
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        isRecording: false,
        error: error instanceof Error ? error.message : 'Recording failed',
      }));
    }
  }, [voiceService, state.language]);

  const stopRecording = useCallback(async (): Promise<VoiceSearchResult | null> => {
    try {
      setState(prev => ({ ...prev, isRecording: false, isProcessing: true }));

      const audioUri = await voiceService.stopRecording();
      if (!audioUri) {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          error: 'Failed to stop recording',
        }));
        return null;
      }

      const result = await voiceService.processVoiceSearch(audioUri, state.language, defaultConfig);
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        transcript: result.transcript,
        confidence: result.confidence,
        error: null,
      }));

      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Transcription failed',
      }));
      return null;
    }
  }, [voiceService, state.language, defaultConfig]);

  const speakText = useCallback(async (text: string) => {
    try {
      await voiceService.speakText(text, state.language);
    } catch (error) {
      console.error('Speech error:', error);
    }
  }, [voiceService, state.language]);

  const setLanguage = useCallback((language: VoiceLanguage) => {
    setState(prev => ({ ...prev, language }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    setState({
      isRecording: false,
      isProcessing: false,
      transcript: '',
      confidence: 0,
      error: null,
      language: state.language,
    });
  }, [state.language]);

  return {
    state,
    startRecording,
    stopRecording,
    speakText,
    setLanguage,
    clearError,
    reset,
    isSpeechAvailable: voiceService.isSpeechAvailable(),
    getAvailableVoices: voiceService.getAvailableVoices(),
    stopSpeech: voiceService.stopSpeech.bind(voiceService),
  };
}

export default VoiceSearchService;
