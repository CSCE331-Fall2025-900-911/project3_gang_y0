'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useTextSize } from '@/contexts/TextSizeContext';

export default function Manager() {
  const managerText = useTranslation('Manager');
  const { getTextSizeClass } = useTextSize();
  
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className={`text-black ${getTextSizeClass('xl')}`}>{managerText}</div>
    </div>
  );
}

