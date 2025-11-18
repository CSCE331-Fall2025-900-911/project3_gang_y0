'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';

type TextSize = 'small' | 'medium' | 'large';

interface TextSizeContextType {
  textSize: TextSize;
  setTextSize: (size: TextSize) => void;
  getTextSizeClass: (baseSize: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl') => string;
}

const TextSizeContext = createContext<TextSizeContextType | undefined>(undefined);

const sizeMap: Record<TextSize, Record<string, string>> = {
  small: {
    'xs': 'text-xs',
    'sm': 'text-xs',
    'base': 'text-sm',
    'lg': 'text-base',
    'xl': 'text-lg',
    '2xl': 'text-xl',
    '3xl': 'text-2xl',
    '4xl': 'text-3xl',
    '5xl': 'text-4xl',
    '6xl': 'text-5xl',
  },
  medium: {
    'xs': 'text-xs',
    'sm': 'text-sm',
    'base': 'text-base',
    'lg': 'text-lg',
    'xl': 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
    '4xl': 'text-4xl',
    '5xl': 'text-5xl',
    '6xl': 'text-6xl',
  },
  large: {
    'xs': 'text-sm',
    'sm': 'text-base',
    'base': 'text-lg',
    'lg': 'text-xl',
    'xl': 'text-2xl',
    '2xl': 'text-3xl',
    '3xl': 'text-4xl',
    '4xl': 'text-5xl',
    '5xl': 'text-6xl',
    '6xl': 'text-7xl',
  },
};

export function TextSizeProvider({ children }: { children: ReactNode }) {
  const [textSize, setTextSizeState] = useState<TextSize>('medium');

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('textSize') as TextSize;
    if (saved && ['small', 'medium', 'large'].includes(saved)) {
      setTextSizeState(saved);
    }
  }, []);

  // Save to localStorage when textSize changes
  const setTextSize = useCallback((size: TextSize) => {
    setTextSizeState(size);
    localStorage.setItem('textSize', size);
  }, []);

  // Helper function to get text size class - directly returns the class
  const getTextSizeClass = useCallback((baseSize: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'): string => {
    return sizeMap[textSize][baseSize] || `text-${baseSize}`;
  }, [textSize]);

  const contextValue = useMemo(
    () => ({ textSize, setTextSize, getTextSizeClass }),
    [textSize, setTextSize, getTextSizeClass]
  );

  return (
    <TextSizeContext.Provider value={contextValue}>
      {children}
    </TextSizeContext.Provider>
  );
}

export function useTextSize() {
  const context = useContext(TextSizeContext);
  if (context === undefined) {
    throw new Error('useTextSize must be used within a TextSizeProvider');
  }
  return context;
}

