import { I18nManager } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState, useEffect } from 'react';

export interface TranslationKeys {
  // Navigation
  home: string;
  search: string;
  notifications_nav: string;
  profile: string;
  settings: string;
  
  // Common
  ok: string;
  cancel: string;
  save: string;
  delete: string;
  edit: string;
  add: string;
  search_placeholder: string;
  loading: string;
  error: string;
  success: string;
  warning: string;
  
  // Drug Search
  search_drugs: string;
  drug_name: string;
  active_ingredient: string;
  dosage: string;
  form: string;
  price: string;
  availability: string;
  available: string;
  limited: string;
  out_of_stock: string;
  unknown: string;
  
  // Price Comparison
  compare_prices: string;
  best_price: string;
  average_price: string;
  price_range: string;
  pharmacy: string;
  region: string;
  last_updated: string;
  
  // Notifications
  notifications: string;
  medication_reminders: string;
  price_alerts: string;
  add_reminder: string;
  add_alert: string;
  reminder_time: string;
  reminder_days: string;
  alert_condition: string;
  target_price: string;
  enable_notifications: string;
  
  // Drug Interactions
  drug_interactions: string;
  check_interactions: string;
  selected_medications: string;
  add_medication: string;
  interaction_found: string;
  severity: string;
  major: string;
  moderate: string;
  minor: string;
  contraindicated: string;
  recommendations: string;
  monitoring: string;
  
  // Settings
  language: string;
  arabic: string;
  english: string;
  theme: string;
  light_theme: string;
  dark_theme: string;
  about: string;
  version: string;
  
  // Messages
  no_results_found: string;
  try_different_search: string;
  network_error: string;
  check_connection: string;
  permission_denied: string;
  grant_permission: string;
}

const arabicTranslations: TranslationKeys = {
  // Navigation
  home: 'الرئيسية',
  search: 'البحث',
  notifications_nav: 'الإشعارات',
  profile: 'الملف الشخصي',
  settings: 'الإعدادات',
  
  // Common
  ok: 'موافق',
  cancel: 'إلغاء',
  save: 'حفظ',
  delete: 'حذف',
  edit: 'تعديل',
  add: 'إضافة',
  search_placeholder: 'ابحث عن دواء أو مادة فعالة...',
  loading: 'جاري التحميل...',
  error: 'خطأ',
  success: 'نجح',
  warning: 'تحذير',
  
  // Drug Search
  search_drugs: 'البحث عن الأدوية',
  drug_name: 'اسم الدواء',
  active_ingredient: 'المادة الفعالة',
  dosage: 'الجرعة',
  form: 'الشكل الدوائي',
  price: 'السعر',
  availability: 'التوفر',
  available: 'متوفر',
  limited: 'محدود',
  out_of_stock: 'غير متوفر',
  unknown: 'غير معروف',
  
  // Price Comparison
  compare_prices: 'مقارنة الأسعار',
  best_price: 'أفضل سعر',
  average_price: 'متوسط السعر',
  price_range: 'نطاق السعر',
  pharmacy: 'الصيدلية',
  region: 'المنطقة',
  last_updated: 'آخر تحديث',
  
  // Notifications
  notifications: 'الإشعارات',
  medication_reminders: 'تذكيرات الدواء',
  price_alerts: 'تنبيهات الأسعار',
  add_reminder: 'إضافة تذكير',
  add_alert: 'إضافة تنبيه',
  reminder_time: 'وقت التذكير',
  reminder_days: 'أيام التذكير',
  alert_condition: 'شرط التنبيه',
  target_price: 'السعر المستهدف',
  enable_notifications: 'تفعيل الإشعارات',
  
  // Drug Interactions
  drug_interactions: 'تفاعلات الأدوية',
  check_interactions: 'فحص التفاعلات',
  selected_medications: 'الأدوية المختارة',
  add_medication: 'إضافة دواء',
  interaction_found: 'تم العثور على تفاعل',
  severity: 'الشدة',
  major: 'خطير',
  moderate: 'متوسط',
  minor: 'طفيف',
  contraindicated: 'مضاد استطباب',
  recommendations: 'التوصيات',
  monitoring: 'المراقبة',
  
  // Settings
  language: 'اللغة',
  arabic: 'العربية',
  english: 'English',
  theme: 'المظهر',
  light_theme: 'الوضع الفاتح',
  dark_theme: 'الوضع الداكن',
  about: 'حول التطبيق',
  version: 'الإصدار',
  
  // Messages
  no_results_found: 'لم يتم العثور على نتائج',
  try_different_search: 'جرب كلمات بحث مختلفة',
  network_error: 'خطأ في الشبكة',
  check_connection: 'تحقق من اتصال الإنترنت',
  permission_denied: 'تم رفض الإذن',
  grant_permission: 'منح الإذن',
};

const englishTranslations: TranslationKeys = {
  // Navigation
  home: 'Home',
  search: 'Search',
  notifications_nav: 'Notifications',
  profile: 'Profile',
  settings: 'Settings',
  
  // Common
  ok: 'OK',
  cancel: 'Cancel',
  save: 'Save',
  delete: 'Delete',
  edit: 'Edit',
  add: 'Add',
  search_placeholder: 'Search for a drug or active ingredient...',
  loading: 'Loading...',
  error: 'Error',
  success: 'Success',
  warning: 'Warning',
  
  // Drug Search
  search_drugs: 'Search Drugs',
  drug_name: 'Drug Name',
  active_ingredient: 'Active Ingredient',
  dosage: 'Dosage',
  form: 'Form',
  price: 'Price',
  availability: 'Availability',
  available: 'Available',
  limited: 'Limited',
  out_of_stock: 'Out of Stock',
  unknown: 'Unknown',
  
  // Price Comparison
  compare_prices: 'Compare Prices',
  best_price: 'Best Price',
  average_price: 'Average Price',
  price_range: 'Price Range',
  pharmacy: 'Pharmacy',
  region: 'Region',
  last_updated: 'Last Updated',
  
  // Notifications
  notifications: 'Notifications',
  medication_reminders: 'Medication Reminders',
  price_alerts: 'Price Alerts',
  add_reminder: 'Add Reminder',
  add_alert: 'Add Alert',
  reminder_time: 'Reminder Time',
  reminder_days: 'Reminder Days',
  alert_condition: 'Alert Condition',
  target_price: 'Target Price',
  enable_notifications: 'Enable Notifications',
  
  // Drug Interactions
  drug_interactions: 'Drug Interactions',
  check_interactions: 'Check Interactions',
  selected_medications: 'Selected Medications',
  add_medication: 'Add Medication',
  interaction_found: 'Interaction Found',
  severity: 'Severity',
  major: 'Major',
  moderate: 'Moderate',
  minor: 'Minor',
  contraindicated: 'Contraindicated',
  recommendations: 'Recommendations',
  monitoring: 'Monitoring',
  
  // Settings
  language: 'Language',
  arabic: 'العربية',
  english: 'English',
  theme: 'Theme',
  light_theme: 'Light Theme',
  dark_theme: 'Dark Theme',
  about: 'About',
  version: 'Version',
  
  // Messages
  no_results_found: 'No results found',
  try_different_search: 'Try different search terms',
  network_error: 'Network Error',
  check_connection: 'Check your internet connection',
  permission_denied: 'Permission Denied',
  grant_permission: 'Grant Permission',
};

export type SupportedLanguage = 'ar' | 'en';

export class LocalizationService {
  private static instance: LocalizationService;
  private currentLanguage: SupportedLanguage = 'en';
  private translations: TranslationKeys = englishTranslations;
  private listeners: Array<(language: SupportedLanguage) => void> = [];

  static getInstance(): LocalizationService {
    if (!LocalizationService.instance) {
      LocalizationService.instance = new LocalizationService();
    }
    return LocalizationService.instance;
  }

  constructor() {
    this.initializeLanguage();
  }

  private async initializeLanguage(): Promise<void> {
    try {
      // Load saved language preference
      const savedLanguage = await AsyncStorage.getItem('app_language');
      
      if (savedLanguage === 'ar' || savedLanguage === 'en') {
        await this.setLanguage(savedLanguage);
      } else {
        // Detect device language
        const deviceLanguage = this.detectDeviceLanguage();
        await this.setLanguage(deviceLanguage);
      }
    } catch (error) {
      console.error('Failed to initialize language:', error);
      // Default to English
      await this.setLanguage('en');
    }
  }

  private detectDeviceLanguage(): SupportedLanguage {
    // In a real app, you'd use react-native-localize or similar
    // For now, default to English
    return 'en';
  }

  async setLanguage(language: SupportedLanguage): Promise<void> {
    try {
      this.currentLanguage = language;
      this.translations = language === 'ar' ? arabicTranslations : englishTranslations;

      // Save preference
      await AsyncStorage.setItem('app_language', language);

      // Configure RTL for Arabic
      const isRTL = language === 'ar';
      I18nManager.forceRTL(isRTL);

      // Notify listeners
      this.listeners.forEach(listener => listener(language));

      console.log(`Language set to: ${language}, RTL: ${isRTL}`);
    } catch (error) {
      console.error('Failed to set language:', error);
    }
  }

  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  isRTL(): boolean {
    return this.currentLanguage === 'ar';
  }

  translate(key: keyof TranslationKeys): string {
    return this.translations[key] || key;
  }

  // Convenience method for direct translation calls
  t(key: keyof TranslationKeys): string {
    return this.translate(key);
  }

  // Get all translations for the current language
  getAllTranslations(): TranslationKeys {
    return { ...this.translations };
  }

  // Add language change listener
  addLanguageChangeListener(listener: (language: SupportedLanguage) => void): void {
    this.listeners.push(listener);
  }

  // Remove language change listener
  removeLanguageChangeListener(listener: (language: SupportedLanguage) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  // Format numbers according to locale
  formatNumber(number: number): string {
    try {
      if (this.currentLanguage === 'ar') {
        return number.toLocaleString('ar-EG');
      }
      return number.toLocaleString('en-US');
    } catch (error) {
      return number.toString();
    }
  }

  // Format currency according to locale
  formatCurrency(amount: number, currency: string = 'EGP'): string {
    try {
      if (this.currentLanguage === 'ar') {
        return new Intl.NumberFormat('ar-EG', {
          style: 'currency',
          currency,
        }).format(amount);
      }
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
      }).format(amount);
    } catch (error) {
      return `${currency} ${amount}`;
    }
  }

  // Format date according to locale
  formatDate(date: Date): string {
    try {
      if (this.currentLanguage === 'ar') {
        return date.toLocaleDateString('ar-EG');
      }
      return date.toLocaleDateString('en-US');
    } catch (error) {
      return date.toDateString();
    }
  }

  // Format time according to locale
  formatTime(date: Date): string {
    try {
      if (this.currentLanguage === 'ar') {
        return date.toLocaleTimeString('ar-EG');
      }
      return date.toLocaleTimeString('en-US');
    } catch (error) {
      return date.toTimeString();
    }
  }

  // Get text direction for styling
  getTextDirection(): 'ltr' | 'rtl' {
    return this.isRTL() ? 'rtl' : 'ltr';
  }

  // Get alignment for styling
  getTextAlign(): 'left' | 'right' {
    return this.isRTL() ? 'right' : 'left';
  }

  // Get opposite alignment for styling
  getOppositeTextAlign(): 'left' | 'right' {
    return this.isRTL() ? 'left' : 'right';
  }

  // Check if current language is Arabic
  isArabic(): boolean {
    return this.currentLanguage === 'ar';
  }

  // Check if current language is English
  isEnglish(): boolean {
    return this.currentLanguage === 'en';
  }

  // Get supported languages
  getSupportedLanguages(): Array<{ code: SupportedLanguage; name: string; nativeName: string }> {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
    ];
  }

  // Validate translation key
  isValidKey(key: string): key is keyof TranslationKeys {
    return key in this.translations;
  }

  // Get missing keys (for development)
  getMissingKeys(): string[] {
    const allKeys = Object.keys(englishTranslations) as (keyof TranslationKeys)[];
    return allKeys.filter(key => !this.translations[key]);
  }

  // Add or update translation at runtime
  addTranslation(key: keyof TranslationKeys, value: string): void {
    this.translations[key] = value;
  }

  // Reset to default translations
  resetTranslations(): void {
    this.translations = this.currentLanguage === 'ar' ? arabicTranslations : englishTranslations;
  }
}

export const localizationService = LocalizationService.getInstance();

// React hook for using localization
export function useLocalization() {
  const [language, setLanguage] = useState<SupportedLanguage>(localizationService.getCurrentLanguage());
  const [isRTL, setIsRTL] = useState(localizationService.isRTL());

  useEffect(() => {
    const handleLanguageChange = (newLanguage: SupportedLanguage) => {
      setLanguage(newLanguage);
      setIsRTL(localizationService.isRTL());
    };

    localizationService.addLanguageChangeListener(handleLanguageChange);

    return () => {
      localizationService.removeLanguageChangeListener(handleLanguageChange);
    };
  }, []);

  const changeLanguage = async (newLanguage: SupportedLanguage) => {
    await localizationService.setLanguage(newLanguage);
  };

  const t = (key: keyof TranslationKeys): string => {
    return localizationService.translate(key);
  };

  const formatNumber = (number: number): string => {
    return localizationService.formatNumber(number);
  };

  const formatCurrency = (amount: number, currency?: string): string => {
    return localizationService.formatCurrency(amount, currency);
  };

  const formatDate = (date: Date): string => {
    return localizationService.formatDate(date);
  };

  const formatTime = (date: Date): string => {
    return localizationService.formatTime(date);
  };

  const getTextDirection = (): 'ltr' | 'rtl' => {
    return localizationService.getTextDirection();
  };

  const getTextAlign = (): 'left' | 'right' => {
    return localizationService.getTextAlign();
  };

  return {
    language,
    isRTL,
    changeLanguage,
    t,
    formatNumber,
    formatCurrency,
    formatDate,
    formatTime,
    getTextDirection,
    getTextAlign,
    isArabic: localizationService.isArabic(),
    isEnglish: localizationService.isEnglish(),
    supportedLanguages: localizationService.getSupportedLanguages(),
  };
}

export default localizationService;
