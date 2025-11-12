'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'es' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="fixed top-4 left-4 z-50 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg flex items-center gap-2"
      aria-label="Toggle language"
    >
      <span className="text-sm font-medium">
        {language === 'en' ? 'ENGLISH' : 'SPANISH'}
      </span>
      <span className="text-xs">→</span>
      <span className="text-sm font-medium">
        {language === 'en' ? 'SPANISH' : 'ENGLISH'}
      </span>
    </button>
  );
}

