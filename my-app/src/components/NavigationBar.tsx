'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useTextSize } from '@/contexts/TextSizeContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NavigationBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { getTextSizeClass } = useTextSize();
  const { language } = useLanguage();

  const translations = {
    en: {
      menuBoard: 'Menu Board',
      kiosk: 'Kiosk'
    },
    es: {
      menuBoard: 'Tablero de Menú',
      kiosk: 'Kiosco'
    }
  };

  const t = translations[language];

  const navItems = [
    { label: t.menuBoard, path: '/menu' },
    { label: t.kiosk, path: '/login' },
  
  ];

  return (
    <nav className="w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-end h-16">
          <div className="flex items-center gap-1">
            {navItems.map((item, index) => (
              <button
                key={`${item.path}-${index}`}
                onClick={() => router.push(item.path)}
                className={`px-4 py-2 rounded-md transition-colors font-medium ${
                  pathname === item.path
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                } ${getTextSizeClass('sm')}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}

