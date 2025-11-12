'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translateText, translateBatch } from '@/lib/translate';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  translate: (text: string) => Promise<string>;
  translateMultiple: (texts: string[]) => Promise<string[]>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(false);

  // Load saved language preference from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage === 'en' || savedLanguage === 'es') {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const translate = async (text: string): Promise<string> => {
    if (language === 'en') {
      return text; // Assume original text is in English
    }
    
    setIsLoading(true);
    try {
      const translated = await translateText(text, language, 'en');
      return translated;
    } finally {
      setIsLoading(false);
    }
  };

  const translateMultiple = async (texts: string[]): Promise<string[]> => {
    if (language === 'en') {
      return texts;
    }
    
    setIsLoading(true);
    try {
      const translated = await translateBatch(texts, language, 'en');
      return translated;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        translate,
        translateMultiple,
        isLoading,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

