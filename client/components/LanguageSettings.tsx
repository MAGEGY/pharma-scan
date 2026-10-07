import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  I18nManager,
} from 'react-native';
import { useLocalization } from '../services/localizationService';

export default function LanguageSettings() {
  const { language, isRTL, changeLanguage, t, supportedLanguages } = useLocalization();

  const handleLanguageChange = async (newLanguage: 'ar' | 'en') => {
    try {
      await changeLanguage(newLanguage);
      
      // Force restart the app to apply RTL changes
      Alert.alert(
        t('success'),
        t('language_changed_success'),
        [
          {
            text: t('ok'),
            onPress: () => {
              // In a real app, you might want to restart the app or reload the root component
              // For now, the changes will take effect on next navigation
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(t('error'), t('language_change_failed'));
    }
  };

  return (
    <View style={[styles.container, { direction: isRTL ? 'rtl' : 'ltr' }]}>
      <Text style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
        {t('language')}
      </Text>
      
      <Text style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
        {t('select_language_description')}
      </Text>

      <View style={styles.languageOptions}>
        {supportedLanguages.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[
              styles.languageOption,
              language === lang.code && styles.selectedLanguage,
              isRTL && styles.languageOptionRTL,
            ]}
            onPress={() => handleLanguageChange(lang.code)}
          >
            <View style={styles.languageInfo}>
              <Text style={[
                styles.languageName,
                language === lang.code && styles.selectedLanguageName,
                { textAlign: isRTL ? 'right' : 'left' }
              ]}>
                {lang.nativeName}
              </Text>
              <Text style={[
                styles.languageEnglishName,
                { textAlign: isRTL ? 'right' : 'left' }
              ]}>
                {lang.name}
              </Text>
            </View>
            
            {language === lang.code && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoSection}>
        <Text style={[styles.infoTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('language_info_title')}
        </Text>
        <Text style={[styles.infoText, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('language_info_text')}
        </Text>
        <Text style={[styles.infoText, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('rtl_info_text')}
        </Text>
      </View>

      <View style={styles.currentSettings}>
        <Text style={[styles.currentTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
          {t('current_settings')}
        </Text>
        <View style={styles.settingItem}>
          <Text style={[styles.settingLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('current_language')}:
          </Text>
          <Text style={styles.settingValue}>
            {supportedLanguages.find(l => l.code === language)?.nativeName}
          </Text>
        </View>
        <View style={styles.settingItem}>
          <Text style={[styles.settingLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
            {t('text_direction')}:
          </Text>
          <Text style={styles.settingValue}>
            {isRTL ? t('rtl') : t('ltr')}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 24,
    lineHeight: 22,
  },
  languageOptions: {
    marginBottom: 32,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  languageOptionRTL: {
    flexDirection: 'row-reverse',
  },
  selectedLanguage: {
    backgroundColor: '#e8f4f8',
    borderColor: '#3498db',
    borderWidth: 2,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  selectedLanguageName: {
    color: '#3498db',
  },
  languageEnglishName: {
    fontSize: 14,
    color: '#6c757d',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkmarkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
    marginBottom: 4,
  },
  currentSettings: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  currentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
});
