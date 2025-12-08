'use client';

import { useTextSize } from '@/contexts/TextSizeContext';

export default function TextSizeSelector() {
  const { textSize, setTextSize } = useTextSize();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-end gap-2">
      <button
        onClick={() => setTextSize('small')}
        className={`w-8 h-8 rounded-full font-bold transition-all text-xs flex items-center justify-center shadow-md ${
          textSize === 'small'
            ? 'bg-gradient-to-r from-pink-200 to-purple-300 text-gray-800 ring-2 ring-purple-300'
            : 'bg-white text-gray-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 border border-gray-300'
        }`}
        aria-label="Small text size"
      >
        T
      </button>
      <button
        onClick={() => setTextSize('medium')}
        className={`w-10 h-10 rounded-full font-bold transition-all text-base flex items-center justify-center shadow-md ${
          textSize === 'medium'
            ? 'bg-gradient-to-r from-pink-200 to-purple-300 text-gray-800 ring-2 ring-purple-300'
            : 'bg-white text-gray-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 border border-gray-300'
        }`}
        aria-label="Medium text size"
      >
        T
      </button>
      <button
        onClick={() => setTextSize('large')}
        className={`w-12 h-12 rounded-full font-bold transition-all text-lg flex items-center justify-center shadow-md ${
          textSize === 'large'
            ? 'bg-gradient-to-r from-pink-200 to-purple-300 text-gray-800 ring-2 ring-purple-300'
            : 'bg-white text-gray-700 hover:bg-gradient-to-r hover:from-pink-50 hover:to-purple-50 border border-gray-300'
        }`}
        aria-label="Large text size"
      >
        T
      </button>
    </div>
  );
}

