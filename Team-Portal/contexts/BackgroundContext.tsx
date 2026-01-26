'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type BackgroundMode = 'static' | 'motion';

interface BackgroundContextType {
  backgroundMode: BackgroundMode;
  toggleBackground: () => void;
  isMotion: boolean;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

const STORAGE_KEY = 'zc-background-mode';

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>('motion');
  const [mounted, setMounted] = useState(false);

  // Load saved preference from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY) as BackgroundMode | null;
    if (saved === 'motion' || saved === 'static') {
      setBackgroundMode(saved);
    }
  }, []);

  // Save preference to localStorage when it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, backgroundMode);
    }
  }, [backgroundMode, mounted]);

  // Toggle body class to show/hide static background
  useEffect(() => {
    if (mounted) {
      if (backgroundMode === 'motion') {
        document.body.classList.add('motion-bg-active');
      } else {
        document.body.classList.remove('motion-bg-active');
      }
    }
  }, [backgroundMode, mounted]);

  const toggleBackground = () => {
    setBackgroundMode((prev) => (prev === 'static' ? 'motion' : 'static'));
  };

  const isMotion = backgroundMode === 'motion';

  return (
    <BackgroundContext.Provider value={{ backgroundMode, toggleBackground, isMotion }}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error('useBackground must be used within a BackgroundProvider');
  }
  return context;
}
