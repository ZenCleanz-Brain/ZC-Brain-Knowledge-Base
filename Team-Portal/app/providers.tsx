'use client';

import { SessionProvider } from 'next-auth/react';
import { AdminSettingsProvider } from '@/contexts/AdminSettingsContext';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AdminSettingsProvider>
        {children}
      </AdminSettingsProvider>
    </SessionProvider>
  );
}
