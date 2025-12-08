'use client';

import { useRouter } from 'next/navigation';
import { useTextSize } from '@/contexts/TextSizeContext';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PortalPage() {
  const router = useRouter();
  const { getTextSizeClass } = useTextSize();
  const { language } = useLanguage();

  const translations = {
    en: {
      title: "Welcome to Rigby's Boba Shop",
      cashier: {
        title: "Cashier",
        description: "Employee login for cashier access"
      },
      manager: {
        title: "Manager",
        description: "Employee login for manager access"
      },
      kiosk: {
        title: "Kiosk",
        description: "Self-service ordering kiosk"
      },
      menu: {
        title: "Menu",
        description: "View our menu and offerings"
      }
    },
    es: {
      title: "Bienvenido a la Tienda de Boba de Rigby",
      cashier: {
        title: "Cajero",
        description: "Inicio de sesión de empleado para acceso de cajero"
      },
      manager: {
        title: "Gerente",
        description: "Inicio de sesión de empleado para acceso de gerente"
      },
      kiosk: {
        title: "Kiosco",
        description: "Kiosco de pedidos autoservicio"
      },
      menu: {
        title: "Menú",
        description: "Ver nuestro menú y ofertas"
      }
    }
  };

  const t = translations[language];

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-orange-50 flex items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        <h1 className={`text-center font-bold text-gray-800 mb-12 ${getTextSizeClass('5xl')}`}>
          {t.title}
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cashier Button */}
          <button
            onClick={() => handleNavigation('/employee-login')}
            className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-transparent hover:border-purple-300"
          >
            <div className="text-center">
              <div className="mb-4">
                <svg className="w-16 h-16 mx-auto text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h2 className={`font-semibold text-gray-800 mb-2 ${getTextSizeClass('2xl')}`}>
                {t.cashier.title}
              </h2>
              <p className={`text-gray-600 ${getTextSizeClass('sm')}`}>
                {t.cashier.description}
              </p>
            </div>
          </button>

          {/* Manager Button */}
          <button
            onClick={() => handleNavigation('/employee-login')}
            className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-transparent hover:border-purple-300"
          >
            <div className="text-center">
              <div className="mb-4">
                <svg className="w-16 h-16 mx-auto text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className={`font-semibold text-gray-800 mb-2 ${getTextSizeClass('2xl')}`}>
                {t.manager.title}
              </h2>
              <p className={`text-gray-600 ${getTextSizeClass('sm')}`}>
                {t.manager.description}
              </p>
            </div>
          </button>

          {/* Kiosk Button */}
          <button
            onClick={() => handleNavigation('/kiosk')}
            className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-transparent hover:border-purple-300"
          >
            <div className="text-center">
              <div className="mb-4">
                <svg className="w-16 h-16 mx-auto text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className={`font-semibold text-gray-800 mb-2 ${getTextSizeClass('2xl')}`}>
                {t.kiosk.title}
              </h2>
              <p className={`text-gray-600 ${getTextSizeClass('sm')}`}>
                {t.kiosk.description}
              </p>
            </div>
          </button>

          {/* Menu Button */}
          <button
            onClick={() => handleNavigation('/menu')}
            className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-2 border-transparent hover:border-purple-300"
          >
            <div className="text-center">
              <div className="mb-4">
                <svg className="w-16 h-16 mx-auto text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className={`font-semibold text-gray-800 mb-2 ${getTextSizeClass('2xl')}`}>
                {t.menu.title}
              </h2>
              <p className={`text-gray-600 ${getTextSizeClass('sm')}`}>
                {t.menu.description}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

