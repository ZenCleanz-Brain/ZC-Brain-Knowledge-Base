'use client';

import { useState, createContext, useContext, useCallback } from 'react';
import styles from './Toast.module.css';

type ToastType = 'success' | 'warning' | 'error' | 'loading';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  persistent?: boolean;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, persistent?: boolean) => string;
  updateToast: (id: string, type: ToastType, message: string) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, message: string, persistent = false) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, type, message, persistent }]);

    if (!persistent && type !== 'loading') {
      setTimeout(() => dismissToast(id), 4000);
    }
    return id;
  }, [dismissToast]);

  const updateToast = useCallback((id: string, type: ToastType, message: string) => {
    setToasts(prev => prev.map(t =>
      t.id === id ? { ...t, type, message, persistent: false } : t
    ));
    // Auto-dismiss after update
    setTimeout(() => dismissToast(id), 4000);
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ showToast, updateToast, dismissToast }}>
      {children}
      <div className={styles.container}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`${styles.toast} ${styles[toast.type]}`}
            onClick={() => dismissToast(toast.id)}
          >
            {toast.type === 'loading' && <span className={styles.spinner} />}
            <span className={styles.message}>{toast.message}</span>
            {toast.type !== 'loading' && (
              <button className={styles.closeBtn} aria-label="Dismiss">
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
