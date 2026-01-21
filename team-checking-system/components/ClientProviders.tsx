'use client';

import { ToastProvider } from './Toast';

/**
 * Client-side providers wrapper for the app
 * Used to wrap client-side context providers (like Toast) in Server Components
 */
export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}
