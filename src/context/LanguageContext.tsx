import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../types';
import { translations } from '../locales/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, paramsOrFallback?: Record<string, string | number> | string, fallbackStr?: string) => string;
  getLocalizedField: <T extends Record<string, any>>(obj: T | undefined | null, fieldBase: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('yma_language');
    return (saved === 'sw' || saved === 'en') ? saved : 'en'; // Default to English
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('yma_language', lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'sw' : 'en');
  };

  /**
   * Strictly resolves translation key with parameter substitution.
   * e.g., t('welcomeUser', { name: 'John' })
   */
  const t = (
    key: string,
    paramsOrFallback?: Record<string, string | number> | string,
    fallbackStr?: string
  ): string => {
    let params: Record<string, string | number> = {};
    let fallback = fallbackStr || key;

    if (typeof paramsOrFallback === 'string') {
      fallback = paramsOrFallback;
    } else if (paramsOrFallback && typeof paramsOrFallback === 'object') {
      params = paramsOrFallback;
    }

    const langDict = translations[language];
    let template = langDict ? langDict[key] : undefined;

    // Fallback logic
    if (!template) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[i18n Warning] Missing translation key '${key}' in locale '${language}'`);
      }
      const enDict = translations['en'];
      template = enDict ? enDict[key] : undefined;
    }

    if (!template) {
      template = fallback;
    }

    // Parameter interpolation: Replace {paramName} with value
    if (params && template) {
      return Object.entries(params).reduce((acc, [paramKey, paramVal]) => {
        return acc.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
      }, template);
    }

    return template;
  };

  /**
   * Safely retrieves localized field from data objects (e.g., nameSw vs nameEn vs name)
   */
  const getLocalizedField = <T extends Record<string, any>>(
    obj: T | undefined | null,
    fieldBase: string
  ): string => {
    if (!obj) return '';
    if (language === 'sw') {
      const swKey = `${fieldBase}Sw`;
      return obj[swKey] || obj[fieldBase] || '';
    } else {
      const enKey = `${fieldBase}En`;
      return obj[enKey] || obj[fieldBase] || '';
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, getLocalizedField }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

