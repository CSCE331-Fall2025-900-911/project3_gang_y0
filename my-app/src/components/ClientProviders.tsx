'use client';

import { LanguageProvider } from '@/contexts/LanguageContext';
import { TextSizeProvider } from '@/contexts/TextSizeContext';
import LanguageToggle from './LanguageToggle';
import TextSizeSelector from './TextSizeSelector';
import NavigationBar from './NavigationBar';
import { SessionProvider } from 'next-auth/react';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <TextSizeProvider>
          <NavigationBar />
          <LanguageToggle />
          <TextSizeSelector />
          {children}
        </TextSizeProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}

