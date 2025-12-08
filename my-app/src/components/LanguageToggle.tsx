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
      className="fixed top-4 left-4 z-50 px-4 py-2 bg-gradient-to-r from-pink-200 to-purple-300 text-gray-800 rounded-lg hover:from-pink-300 hover:to-purple-400 transition-all shadow-lg flex items-center gap-2"
      aria-label="Toggle language"
    >
      <span className="text-sm font-medium">
        {language === 'en' ? 'English' : 'Español'}
      </span>
      <span className="text-xs">→</span>
      <span className="text-sm font-medium">
        {language === 'en' ? 'Español' : 'English'}
      </span>
    </button>
  );
}

