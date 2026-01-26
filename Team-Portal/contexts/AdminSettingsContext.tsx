'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdminSettings {
  formattedTextOutput: boolean;
}

interface AdminSettingsContextType {
  settings: AdminSettings;
  updateSetting: <K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) => void;
  isLoading: boolean;
}

const defaultSettings: AdminSettings = {
  formattedTextOutput: false, // Default: plain text (current behavior)
};

const AdminSettingsContext = createContext<AdminSettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'zc-admin-settings';

export function AdminSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AdminSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load admin settings:', error);
    }
    setIsLoading(false);
  }, []);

  // Save settings to localStorage when they change
  const updateSetting = <K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [key]: value };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      } catch (error) {
        console.error('Failed to save admin settings:', error);
      }
      return newSettings;
    });
  };

  return (
    <AdminSettingsContext.Provider value={{ settings, updateSetting, isLoading }}>
      {children}
    </AdminSettingsContext.Provider>
  );
}

export function useAdminSettings() {
  const context = useContext(AdminSettingsContext);
  if (context === undefined) {
    throw new Error('useAdminSettings must be used within an AdminSettingsProvider');
  }
  return context;
}
