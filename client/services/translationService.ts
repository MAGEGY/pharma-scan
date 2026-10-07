import React, { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Language configuration
export enum Language {
  ENGLISH = 'en',
  ARABIC = 'ar',
}

// Language metadata
export interface LanguageConfig {
  code: Language;
  name: string;
  nativeName: string;
  rtl: boolean;
  dateFormat: string;
  numberFormat: string;
}

// Translation keys
export interface TranslationKeys {
  // Common
  'common.ok': string;
  'common.cancel': string;
  'common.save': string;
  'common.delete': string;
  'common.edit': string;
  'common.search': string;
  'common.loading': string;
  'common.error': string;
  'common.success': string;
  'common.retry': string;
  
  // Navigation
  'nav.home': string;
  'nav.camera': string;
  'nav.history': string;
  'nav.library': string;
  'nav.profile': string;
  
  // Camera
  'camera.take_photo': string;
  'camera.gallery': string;
  'camera.flash_on': string;
  'camera.flash_off': string;
  'camera.switch_camera': string;
  'camera.processing': string;
  
  // Drug information
  'drug.name': string;
  'drug.name_arabic': string;
  'drug.active_ingredient': string;
  'drug.category': string;
  'drug.manufacturer': string;
  'drug.form': string;
  'drug.dosage': string;
  'drug.price': string;
  'drug.availability': string;
  
  // Price
  'price.current': string;
  'price.history': string;
  'price.statistics': string;
  'price.update': string;
  'price.alert': string;
  'price.drop': string;
  'price.increase': string;
  
  // Notifications
  'notification.medication_reminder': string;
  'notification.price_alert': string;
  'notification.time_to_take': string;
  'notification.price_dropped': string;
  
  // Voice search
  'voice.search': string;
  'voice.listening': string;
  'voice.processing': string;
  'voice.no_results': string;
  
  // Offline mode
  'offline.no_connection': string;
  'offline.sync_needed': string;
  'offline.last_sync': string;
  'offline.drugs_available': string;
  
  // Error messages
  'error.camera_permission': string;
  'error.network_error': string;
  'error.invalid_image': string;
  'error.ocr_failed': string;
  'error.something_went_wrong': string;
}

// Language configurations
export const LANGUAGE_CONFIGS: Record<Language, LanguageConfig> = {
  [Language.ENGLISH]: {
    code: Language.ENGLISH,
    name: 'English',
    nativeName: 'English',
    rtl: false,
    dateFormat: 'MM/DD/YYYY',
    numberFormat: 'en-US',
  },
  [Language.ARABIC]: {
    code: Language.ARABIC,
    name: 'Arabic',
    nativeName: 'العربية',
    rtl: true,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'ar-EG',
  },
};

// Translation service
class TranslationService {
  private static instance: TranslationService;
  private currentLanguage: Language = Language.ENGLISH;
  private isRTL = false;
  private translations: Record<Language, Record<string, string>> = {} as Record<Language, Record<string, string>>;
  private listeners: Set<() => void> = new Set();

  static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }

  // Initialize translation service
  async initialize(): Promise<void> {
    try {
      // Load saved language preference
      const savedLanguage = await AsyncStorage.getItem('@pharma_scan_language');
      const language = savedLanguage ? (savedLanguage as Language) : Language.ENGLISH;
      
      await this.setLanguage(language);
      
      // Load translations
      await this.loadTranslations();
      
      console.log(`🌐 Translation service initialized with language: ${language}`);
    } catch (error) {
      console.error('❌ Failed to initialize translation service:', error);
      throw error;
    }
  }

  // Set language
  async setLanguage(language: Language): Promise<void> {
    try {
      this.currentLanguage = language;
      this.isRTL = LANGUAGE_CONFIGS[language].rtl;
      
      // Save preference
      await AsyncStorage.setItem('@pharma_scan_language', language);
      
      // Notify listeners
      this.notifyListeners();
      
      console.log(`🌐 Language changed to: ${LANGUAGE_CONFIGS[language].name}`);
    } catch (error) {
      console.error('❌ Failed to set language:', error);
      throw error;
    }
  }

  // Get current language
  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  // Get current language config
  getCurrentLanguageConfig(): LanguageConfig {
    return LANGUAGE_CONFIGS[this.currentLanguage];
  }

  // Check if RTL
  isRTLDirection(): boolean {
    return this.isRTL;
  }

  // Load translations
  private async loadTranslations(): Promise<void> {
    try {
      // In a real app, you would load these from JSON files or API
      // For now, we'll use inline translations
      this.translations = {
        [Language.ENGLISH]: this.getEnglishTranslations(),
        [Language.ARABIC]: this.getArabicTranslations(),
      } as Record<Language, Record<string, string>>;
    } catch (error) {
      console.error('❌ Failed to load translations:', error);
      throw error;
    }
  }

  // Get English translations
  private getEnglishTranslations(): Record<string, string> {
    return {
      // Common
      'common.ok': 'OK',
      'common.cancel': 'Cancel',
      'common.save': 'Save',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.search': 'Search',
      'common.loading': 'Loading...',
      'common.error': 'Error',
      'common.success': 'Success',
      'common.retry': 'Retry',
      
      // Navigation
      'nav.home': 'Home',
      'nav.camera': 'Camera',
      'nav.history': 'History',
      'nav.library': 'Library',
      'nav.profile': 'Profile',
      
      // Camera
      'camera.take_photo': 'Take Photo',
      'camera.gallery': 'Gallery',
      'camera.flash_on': 'Flash On',
      'camera.flash_off': 'Flash Off',
      'camera.switch_camera': 'Switch Camera',
      'camera.processing': 'Processing...',
      
      // Drug information
      'drug.name': 'Name',
      'drug.name_arabic': 'Arabic Name',
      'drug.active_ingredient': 'Active Ingredient',
      'drug.category': 'Category',
      'drug.manufacturer': 'Manufacturer',
      'drug.form': 'Form',
      'drug.dosage': 'Dosage',
      'drug.price': 'Price',
      'drug.availability': 'Availability',
      
      // Price
      'price.current': 'Current Price',
      'price.history': 'Price History',
      'price.statistics': 'Price Statistics',
      'price.update': 'Update Price',
      'price.alert': 'Price Alert',
      'price.drop': 'Price Drop!',
      'price.increase': 'Price Increase',
      
      // Notifications
      'notification.medication_reminder': 'Medication Reminder',
      'notification.price_alert': 'Price Alert',
      'notification.time_to_take': 'Time to take',
      'notification.price_dropped': 'Price dropped!',
      
      // Voice search
      'voice.search': 'Voice Search',
      'voice.listening': 'Listening...',
      'voice.processing': 'Processing...',
      'voice.no_results': 'No results found',
      
      // Offline mode
      'offline.no_connection': 'No internet connection',
      'offline.sync_needed': 'Sync needed',
      'offline.last_sync': 'Last sync',
      'offline.drugs_available': 'Drugs available offline',
      
      // Error messages
      'error.camera_permission': 'Camera permission is required',
      'error.network_error': 'Network error',
      'error.invalid_image': 'Invalid image format',
      'error.ocr_failed': 'OCR failed',
      'error.something_went_wrong': 'Something went wrong',
    };
  }

  // Get Arabic translations
  private getArabicTranslations(): Record<string, string> {
    return {
      // Common
      'common.ok': 'موافق',
      'common.cancel': 'إلغاء',
      'common.save': 'حفظ',
      'common.delete': 'حذف',
      'common.edit': 'تعديل',
      'common.search': 'بحث',
      'common.loading': 'جاري التحميل...',
      'common.error': 'خطأ',
      'common.success': 'نجح',
      'common.retry': 'إعادة المحاولة',
      
      // Navigation
      'nav.home': 'الرئيسية',
      'nav.camera': 'الكاميرا',
      'nav.history': 'السجل',
      'nav.library': 'المكتبة',
      'nav.profile': 'الملف الشخصي',
      
      // Camera
      'camera.take_photo': 'التقاط صورة',
      'camera.gallery': 'المعرض',
      'camera.flash_on': 'تفعيل الفلاش',
      'camera.flash_off': 'إطفف الفلاش',
      'camera.switch_camera': 'تبديل الكاميرا',
      'camera.processing': 'جاري المعالجة...',
      
      // Drug information
      'drug.name': 'الاسم',
      'drug.name_arabic': 'الاسم بالعربية',
      'drug.active_ingredient': 'المادة الفعالة',
      'drug.category': 'الفئة',
      'drug.manufacturer': 'الشركة المصنعة',
      'drug.form': 'الشكل الدوائي',
      'drug.dosage': 'الجرعة',
      'drug.price': 'السعر',
      'drug.availability': 'التوفر',
      
      // Price
      'price.current': 'السعر الحالي',
      'price.history': 'سجل الأسعار',
      'price.statistics': 'إحصائنيات الأسعار',
      'price.update': 'تحديث السعر',
      'price.alert': 'تنبيه بالسعر',
      'price.drop': 'انخفاض السعر!',
      'price.increase': 'زيادة السعر',
      
      // Notifications
      'notification.medication_reminder': 'تذكير الدواء',
      'notification.price_alert': 'تنبيه بالسعر',
      'notification.time_to_take': 'وقت تناول الدواء',
      'notification.price_dropped': 'انخفاض السعر!',
      
      // Voice search
      'voice.search': 'البحث الصوتي',
      'voice.listening': 'جاري الاستماع...',
      'voice.processing': 'جاري المعالجة...',
      'voice.no_results': 'لا توجد نتائج',
      
      // Offline mode
      'offline.no_connection': 'لا يوجد اتصال بالإنترنت',
      'offline.sync_needed': 'مطلوب مزامنة',
      'offline.last_sync': 'آخر مزامنة',
      'offline.drugs_available': 'الأدوية المتاحة بدون إنترنت',
      
      // Error messages
      'error.camera_permission': 'إذن الوصول للكاميرا مطلوب',
      'error.network_error': 'خطأ في الشبكة',
      'error.invalid_image': 'تنسيق الصورة غير صالح',
      'error.ocr_failed': 'فشل في التعرف على النص',
      'error.something_went_wrong': 'حدث خطأ ما',
    };
  }

  // Translate a key
  translate(key: keyof TranslationKeys, params?: Record<string, any>): string {
    const translation = this.translations[this.currentLanguage]?.[key];
    
    if (!translation) {
      console.warn(`⚠️ Translation not found for key: ${key}`);
      return key; // Return key as fallback
    }
    
    // Simple parameter interpolation
    if (params) {
      return translation.replace(/\{\s*(\w+)\s*\}/g, (match, param) => {
        return params[param] || match;
      });
    }
    
    return translation;
  }

  // Translate with pluralization support
  translatePlural(key: keyof TranslationKeys, count: number, params?: Record<string, any>): string {
    const translation = this.translate(key, params);
    
    // Simple pluralization for English and Arabic
    if (this.currentLanguage === Language.ARABIC) {
      if (count === 0) return translation;
      if (count === 1) return translation;
      if (count === 2) return translation.replace(/(\w+)/, '$1$1'); // Simple duplication for dual form
      return translation.replace(/(\w+)/, '$1s'); // Add 's' for plural
    } else {
      if (count === 1) return translation;
      return `${translation}s`;
    }
  }

  // Format date according to language
  formatDate(date: Date): string {
    const config = LANGUAGE_CONFIGS[this.currentLanguage];
    
    if (Platform.OS === 'ios') {
      // Use native iOS formatting
      return date.toLocaleDateString(config.dateFormat);
    } else {
      // Simple formatting for Android
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear().toString();
      
      if (config.dateFormat === 'DD/MM/YYYY') {
        return `${day}/${month}/${year}`;
      } else {
        return `${month}/${day}/${year}`;
      }
    }
  }

  // Format number according to language
  formatNumber(num: number): string {
    const config = LANGUAGE_CONFIGS[this.currentLanguage];
    
    try {
      return num.toLocaleString(config.numberFormat);
    } catch (error) {
      return num.toString();
    }
  }

  // Format currency
  formatCurrency(amount: number, currency: string = 'EGP'): string {
    const config = LANGUAGE_CONFIGS[this.currentLanguage];
    
    try {
      return amount.toLocaleString(config.numberFormat, {
        style: 'currency',
        currency: currency,
      });
    } catch (error) {
      return `${amount} ${currency}`;
    }
  }

  // Add language change listener
  addListener(listener: () => void): void {
    this.listeners.add(listener);
  }

  // Remove language change listener
  removeListener(listener: () => void): void {
    this.listeners.delete(listener);
  }

  // Notify all listeners of language change
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('❌ Error notifying translation listener:', error);
      }
    });
  }

  // Get all available languages
  getAvailableLanguages(): LanguageConfig[] {
    return Object.values(LANGUAGE_CONFIGS);
  }

  // Get language by code
  getLanguageByCode(code: string): LanguageConfig | undefined {
    return Object.values(LANGUAGE_CONFIGS).find(config => config.code === code);
  }

  // Export current translations for debugging
  exportTranslations(): Record<Language, Record<string, string>> {
    return this.translations;
  }
}

// React hook for translations
export function useTranslation() {
  const [translationService] = useState(() => TranslationService.getInstance());
  const [isRTL, setIsRTL] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>(Language.ENGLISH);

  useEffect(() => {
    const initializeTranslations = async () => {
      await translationService.initialize();
      setIsRTL(translationService.isRTLDirection());
      setCurrentLanguage(translationService.getCurrentLanguage());
    };

    initializeTranslations();
  }, [translationService]);

  const t = useCallback((key: keyof TranslationKeys, params?: Record<string, any>) => {
    return translationService.translate(key, params);
  }, [translationService]);

  const tPlural = useCallback((key: keyof TranslationKeys, count: number, params?: Record<string, any>) => {
    return translationService.translatePlural(key, count, params);
  }, [translationService]);

  const changeLanguage = useCallback(async (language: Language) => {
    await translationService.setLanguage(language);
    setIsRTL(translationService.isRTLDirection());
    setCurrentLanguage(language);
  }, [translationService]);

  const formatDate = useCallback((date: Date) => {
    return translationService.formatDate(date);
  }, [translationService]);

  const formatNumber = useCallback((num: number) => {
    return translationService.formatNumber(num);
  }, [translationService]);

  const formatCurrency = useCallback((amount: number, currency?: string) => {
    return translationService.formatCurrency(amount, currency);
  }, [translationService]);

  const getLanguageConfig = useCallback(() => {
    return translationService.getCurrentLanguageConfig();
  }, [translationService]);

  return {
    t,
    tPlural,
    changeLanguage,
    formatDate,
    formatNumber,
    formatCurrency,
    getLanguageConfig,
    isRTL,
    currentLanguage,
    availableLanguages: translationService.getAvailableLanguages(),
    addListener: translationService.addListener.bind(translationService),
    removeListener: translationService.removeListener.bind(translationService),
  };
}

// RTL utilities
export class RTLUtils {
  // Check if text is RTL
  static isRTL(text: string): boolean {
    // Simple RTL detection - checks for Arabic characters
    const rtlChars = /[\u0609-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
    return rtlChars.test(text);
  }

  // Force RTL layout
  static forceRTL(element: any): void {
    if (element && element.setNativeProps) {
      element.setNativeProps({
        writingDirection: 'rtl',
      });
    }
  }

  // Force LTR layout
  static forceLTR(element: any): void {
    if (element && element.setNativeProps) {
      element.setNativeProps({
        writingDirection: 'ltr',
      });
    }
  }

  // Get text direction based on language
  static getTextDirection(language: Language): 'rtl' | 'ltr' {
    return LANGUAGE_CONFIGS[language].rtl ? 'rtl' : 'ltr';
  }

  // Get text alignment based on language
  static getTextAlign(language: Language): 'left' | 'right' | 'center' {
    const config = LANGUAGE_CONFIGS[language];
    return config.rtl ? 'right' : 'left';
  }

  // Get flex direction based on language
  static getFlexDirection(language: Language): 'row' | 'row-reverse' {
    return LANGUAGE_CONFIGS[language].rtl ? 'row-reverse' : 'row';
  }
}

// React hook for RTL utilities
export function useRTL() {
  const { isRTL, currentLanguage } = useTranslation();
  
  const getTextDirection = useCallback(() => {
    return RTLUtils.getTextDirection(currentLanguage);
  }, [currentLanguage]);

  const getTextAlign = useCallback(() => {
    return RTLUtils.getTextAlign(currentLanguage);
  }, [currentLanguage]);

  const getFlexDirection = useCallback(() => {
    return RTLUtils.getFlexDirection(currentLanguage);
  }, [currentLanguage]);

  const forceRTL = useCallback((element: any) => {
    RTLUtils.forceRTL(element);
  }, []);

  const forceLTR = useCallback((element: any) => {
    RTLUtils.forceLTR(element);
  }, []);

  return {
    isRTL,
    getTextDirection,
    getTextAlign,
    getFlexDirection,
    forceRTL,
    forceLTR,
  };
}

// Localized number formatting
export function useLocalizedNumber() {
  const { formatNumber, formatCurrency, currentLanguage } = useTranslation();

  const formatLocalizedNumber = useCallback((num: number) => {
    return formatNumber(num);
  }, [formatNumber, currentLanguage]);

  const formatLocalizedCurrency = useCallback((amount: number, currency?: string) => {
    return formatCurrency(amount, currency);
  }, [formatCurrency, currentLanguage]);

  return {
    formatLocalizedNumber,
    formatLocalizedCurrency,
    currentLanguage,
  };
}

// Date formatting with localization
export function useLocalizedDate() {
  const { formatDate, currentLanguage } = useTranslation();

  const formatLocalizedDate = useCallback((date: Date) => {
    return formatDate(date);
  }, [formatDate, currentLanguage]);

  return {
    formatLocalizedDate,
    currentLanguage,
  };
}

export default TranslationService;
