'use client';

import { useTranslation } from '@/hooks/useTranslation';

export default function Manager() {
  const managerText = useTranslation('Manager');
  
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-black text-xl">{managerText}</div>
    </div>
  );
}

