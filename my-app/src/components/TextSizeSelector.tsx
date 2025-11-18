'use client';

import { useTextSize } from '@/contexts/TextSizeContext';

export default function TextSizeSelector() {
  const { textSize, setTextSize } = useTextSize();

  return (
    <div className="fixed top-4 left-4 z-50 flex items-center gap-2 rounded-lg bg-white p-2 shadow-lg border border-gray-200">
      <span className="text-sm font-medium text-gray-700 px-2">Text Size:</span>
      <div className="flex gap-1 items-center">
        <button
          onClick={() => setTextSize('small')}
          className={`px-3 py-2 rounded font-bold transition-colors text-sm ${
            textSize === 'small'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          aria-label="Small text size"
        >
          T
        </button>
        <button
          onClick={() => setTextSize('medium')}
          className={`px-3 py-2 rounded font-bold transition-colors text-base ${
            textSize === 'medium'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          aria-label="Medium text size"
        >
          T
        </button>
        <button
          onClick={() => setTextSize('large')}
          className={`px-3 py-2 rounded font-bold transition-colors text-lg ${
            textSize === 'large'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          aria-label="Large text size"
        >
          T
        </button>
      </div>
    </div>
  );
}

