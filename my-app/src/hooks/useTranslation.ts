'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';


export function useTranslation(text: string): string {
  const { language, translate } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);

  useEffect(() => {
    if (language === 'en') {
      setTranslatedText(text);
    } else {
      translate(text).then(setTranslatedText);
    }
  }, [text, language, translate]);

  return translatedText;
}


export function useTranslations(texts: string[]): string[] {
  const { language, translateMultiple } = useLanguage();
  const [translatedTexts, setTranslatedTexts] = useState(texts);

  useEffect(() => {
    if (language === 'en') {
      setTranslatedTexts(texts);
    } else {
      translateMultiple(texts).then(setTranslatedTexts);
    }
  }, [texts, language, translateMultiple]);

  return translatedTexts;
}

