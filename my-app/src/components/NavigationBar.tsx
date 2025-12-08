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
      kiosk: 'Kiosk',
      portal: 'Portal'
    },
    es: {
      menuBoard: 'Tablero de Menú',
      kiosk: 'Kiosco',
      portal: 'Portal'
    }
  };

  const t = translations[language];

  const navItems = [
    { label: t.portal, path: '/portal' },
    { label: t.menuBoard, path: '/menu' },
    { label: t.kiosk, path: '/login' },
  ];

  return (
    <nav className="w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-end h-16">
          <div className="flex items-center gap-2">
            {navItems.map((item, index) => (
              <button
                key={`${item.path}-${index}`}
                onClick={() => router.push(item.path)}
                className={`px-4 py-2 rounded-lg transition-all duration-300 font-medium ${
                  pathname === item.path
                    ? 'bg-gradient-to-r from-pink-200 to-purple-300 text-gray-800 shadow-md'
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50'
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

