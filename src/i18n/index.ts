import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import id from './id';
import en from './en';
import { STORAGE_KEYS } from '../utils/constants';

const i18n = new I18n();

i18n.translations = { id, en };
i18n.defaultLocale = 'id';
i18n.enableFallback = true;

export async function setLanguage(language: string): Promise<void> {
  i18n.locale = language;
  await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
}

export async function initI18n(): Promise<void> {
  const savedLanguage = await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);

  if (savedLanguage) {
    i18n.locale = savedLanguage;
    return;
  }

  const deviceLocales = Localization.getLocales();
  const deviceLanguage = deviceLocales[0]?.languageCode || 'id';

  if (deviceLanguage === 'id' || deviceLanguage === 'en') {
    i18n.locale = deviceLanguage;
  } else {
    i18n.locale = 'id';
  }
}

export function getCurrentLanguage(): string {
  return i18n.locale;
}

export function t(key: string): string {
  return i18n.t(key);
}

export default i18n;
