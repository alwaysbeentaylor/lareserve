'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '@/lib/i18n';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en'); // Default to English

  // Detect browser language and load saved preference on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('kyv-language');

    if (savedLanguage && ['nl', 'en', 'fr'].includes(savedLanguage)) {
      // User has manually selected a language before
      setLanguage(savedLanguage);
    } else {
      // First visit - detect browser language
      const browserLang = navigator.language.toLowerCase();

      if (browserLang.startsWith('nl')) {
        setLanguage('nl');
      } else if (browserLang.startsWith('fr')) {
        setLanguage('fr');
      } else {
        // Default to English for all other languages
        setLanguage('en');
      }
    }
  }, []);

  // Save language to localStorage when it changes
  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('kyv-language', lang);
  };

  const t = translations[language] || translations.en;

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
