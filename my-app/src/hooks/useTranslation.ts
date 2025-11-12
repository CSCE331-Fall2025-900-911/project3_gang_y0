'use client';

import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';


export function useTranslation(text: string): string {
  const { language, translate } = useLanguage();
  const [translatedText, setTranslatedText] = useState(text);
  const originalTextRef = useRef(text);

  // Update original text ref when text prop changes
  useEffect(() => {
    originalTextRef.current = text;
  }, [text]);

  useEffect(() => {
    if (language === 'en') {
      // When switching to English, immediately show original text
      setTranslatedText(originalTextRef.current);
    } else {
      // When switching to Spanish, translate the original English text
      translate(originalTextRef.current, language).then(setTranslatedText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]); // Only depend on language, not translate function

  return translatedText;
}


export function useTranslations(texts: string[]): string[] {
  const { language, translateMultiple } = useLanguage();
  const [translatedTexts, setTranslatedTexts] = useState(texts);
  const originalTextsRef = useRef(texts);

  // Update original texts ref when texts prop changes
  useEffect(() => {
    originalTextsRef.current = texts;
  }, [texts]);

  useEffect(() => {
    if (language === 'en') {
      // When switching to English, immediately show original texts
      setTranslatedTexts([...originalTextsRef.current]);
    } else {
      // When switching to Spanish, translate the original English texts
      translateMultiple([...originalTextsRef.current], language).then(setTranslatedTexts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]); // Only depend on language, not translateMultiple function

  return translatedTexts;
}

