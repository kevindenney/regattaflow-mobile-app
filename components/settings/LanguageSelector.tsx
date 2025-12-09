/**
 * Language Selector Component
 *
 * A modal for selecting the app language with native name display and flags.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  supportedLocales,
  localeConfig,
  changeLanguage,
  SupportedLocale,
} from '@/lib/i18n';

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
}

export function LanguageSelector({ visible, onClose }: LanguageSelectorProps) {
  const { i18n, t } = useTranslation('settings');
  const [loading, setLoading] = useState(false);

  const handleSelectLanguage = async (locale: SupportedLocale) => {
    if (locale === i18n.language) {
      onClose();
      return;
    }

    setLoading(true);
    try {
      await changeLanguage(locale);
      onClose();
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentLocale = i18n.language as SupportedLocale;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{t('preferences.language')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Language List */}
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {supportedLocales.map((locale) => {
              const config = localeConfig[locale];
              const isSelected = locale === currentLocale;
                const isAvailable = true; // All European languages now have translations

              return (
                <TouchableOpacity
                  key={locale}
                  style={[
                    styles.languageItem,
                    isSelected && styles.languageItemSelected,
                    !isAvailable && styles.languageItemDisabled,
                  ]}
                  onPress={() => isAvailable && handleSelectLanguage(locale)}
                  disabled={loading || !isAvailable}
                >
                  <View style={styles.languageLeft}>
                    <Text style={styles.flag}>{config.flag}</Text>
                    <View style={styles.languageText}>
                      <Text
                        style={[
                          styles.languageName,
                          isSelected && styles.languageNameSelected,
                          !isAvailable && styles.languageNameDisabled,
                        ]}
                      >
                        {config.nativeName}
                      </Text>
                      <Text
                        style={[
                          styles.languageEnglish,
                          !isAvailable && styles.languageNameDisabled,
                        ]}
                      >
                        {config.name}
                        {!isAvailable && ' (Coming Soon)'}
                      </Text>
                    </View>
                  </View>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Info */}
          <View style={styles.infoBox}>
            <Ionicons name="globe-outline" size={18} color="#059669" />
            <Text style={styles.infoText}>
              RegattaFlow is available in 12 languages across Europe. Help us add more!
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  closeButton: {
    padding: 4,
  },
  list: {
    padding: 8,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#F8F9FA',
  },
  languageItemSelected: {
    backgroundColor: '#E8F4FD',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  languageItemDisabled: {
    opacity: 0.5,
  },
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flag: {
    fontSize: 28,
  },
  languageText: {
    gap: 2,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  languageNameSelected: {
    color: '#007AFF',
  },
  languageNameDisabled: {
    color: '#8E8E93',
  },
  languageEnglish: {
    fontSize: 13,
    color: '#8E8E93',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 32,
    gap: 10,
    backgroundColor: '#ECFDF5',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#059669',
    lineHeight: 18,
  },
});

export default LanguageSelector;

