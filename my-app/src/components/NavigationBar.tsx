'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useTextSize } from '@/contexts/TextSizeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';

export default function NavigationBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { getTextSizeClass } = useTextSize();
  const { language } = useLanguage();
  const [employeePosition, setEmployeePosition] = useState<string>('');

  const translations = {
    en: {
      menuBoard: 'Menu Board',
      kiosk: 'Kiosk',
      portal: 'Portal',
      logout: 'Logout',
      cashier: 'Cashier',
      manager: 'Manager'
    },
    es: {
      menuBoard: 'Tablero de Menú',
      kiosk: 'Kiosco',
      portal: 'Portal',
      logout: 'Cerrar Sesión',
      cashier: 'Cajero',
      manager: 'Gerente'
    }
  };

  const t = translations[language];

  // Check if we're on an employee page
  const isEmployeePage = pathname === '/cashier' || pathname === '/manager' || pathname === '/manager-dashboard';

  // Check employee authentication and position
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check');
        if (response.ok) {
          const data = await response.json();
          setEmployeePosition(data.employee.position);
        }
      } catch (error) {
        // Not authenticated or error, no employee position
        setEmployeePosition('');
      }
    };

    if (isEmployeePage) {
      checkAuth();
    }
  }, [isEmployeePage]);

  const navItems = [
    { label: t.portal, path: '/portal' },
    { label: t.menuBoard, path: '/menu' },
    { label: t.kiosk, path: '/login' },
  ];

  const handleLogout = async () => {
    try {
      // Clear cookie-based session
      await fetch('/api/auth/logout', { method: 'POST' });
      
      // Sign out from OAuth session
      await signOut({ redirect: false });
      
      // Redirect to portal
      router.push('/portal');
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even if there's an error
      router.push('/portal');
    }
  };

  return (
    <nav className="w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-end h-16 gap-4">
          <div className="flex items-center gap-2">
            {/* Employee role buttons - show on employee pages */}
            {isEmployeePage && (
              <>
                {/* Show Manager button on cashier page if user is a manager */}
                {pathname === '/cashier' && employeePosition === 'manager' && (
                  <button
                    onClick={() => router.push('/manager')}
                    className={`px-4 py-2 rounded-lg transition-all duration-300 font-medium text-gray-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 ${getTextSizeClass('sm')}`}
                  >
                    {t.manager}
                  </button>
                )}
                
                {/* Show Cashier button on manager pages */}
                {(pathname === '/manager' || pathname === '/manager-dashboard') && (
                  <button
                    onClick={() => router.push('/cashier')}
                    className={`px-4 py-2 rounded-lg transition-all duration-300 font-medium text-gray-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 ${getTextSizeClass('sm')}`}
                  >
                    {t.cashier}
                  </button>
                )}
              </>
            )}
            
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
          
          {isEmployeePage && (
            <button
              onClick={handleLogout}
              className={`px-4 py-2 rounded-lg bg-gradient-to-r from-pink-200 to-purple-300 text-gray-800 hover:from-pink-300 hover:to-purple-400 transition-all duration-300 font-medium shadow-md ${getTextSizeClass('sm')}`}
            >
              {t.logout}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}