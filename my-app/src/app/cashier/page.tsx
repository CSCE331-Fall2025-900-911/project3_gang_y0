'use client';

import { useTextSize } from '@/contexts/TextSizeContext';

export default function Cashier() {
  const { getTextSizeClass } = useTextSize();
  
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className={`text-black ${getTextSizeClass('xl')}`}>Cashier</div>
    </div>
  );
}

