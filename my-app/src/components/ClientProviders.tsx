'use client';

import { LanguageProvider } from '@/contexts/LanguageContext';
import LanguageToggle from './LanguageToggle';
import { SessionProvider } from 'next-auth/react';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <LanguageToggle />
        {children}
      </LanguageProvider>
    </SessionProvider>
  );
}

