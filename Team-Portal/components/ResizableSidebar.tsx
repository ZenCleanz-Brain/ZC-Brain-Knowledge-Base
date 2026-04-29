'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './ResizableSidebar.module.css';

interface ResizableSidebarProps {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  storageKey?: string;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function ResizableSidebar({
  children,
  defaultWidth = 320,
  minWidth = 240,
  maxWidth = 600,
  storageKey = 'sidebar-width',
  isMobileOpen = false,
  onMobileClose,
}: ResizableSidebarProps) {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Track mouse Y position for edge glow effect
  const handleSidebarMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    if (!sidebarRef.current) return;
    const rect = sidebarRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    sidebarRef.current.style.setProperty('--edge-glow-y', `${y}px`);
  }, []);

  const handleSidebarMouseLeave = useCallback(() => {
    if (!sidebarRef.current) return;
    sidebarRef.current.style.setProperty('--edge-glow-y', '50%');
  }, []);

  useEffect(() => {
    // Load saved width from localStorage
    const savedWidth = localStorage.getItem(storageKey);
    if (savedWidth) {
      setWidth(parseInt(savedWidth, 10));
    }
  }, [storageKey]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = e.clientX;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
        localStorage.setItem(storageKey, newWidth.toString());
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, minWidth, maxWidth, storageKey]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (!isMobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isMobileOpen]);

  // Close drawer on Escape
  useEffect(() => {
    if (!isMobileOpen || !onMobileClose) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onMobileClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isMobileOpen, onMobileClose]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  return (
    <>
      <div
        className={`${styles.overlay} ${isMobileOpen ? styles.overlayOpen : ''}`}
        onClick={onMobileClose}
        aria-hidden="true"
      />
      <aside
        ref={sidebarRef}
        className={`${styles.sidebar} ${isMobileOpen ? styles.mobileOpen : ''}`}
        style={{ width: `${width}px`, '--edge-glow-y': '50%' } as React.CSSProperties}
        onMouseMove={handleSidebarMouseMove}
        onMouseLeave={handleSidebarMouseLeave}
      >
        {children}
      </aside>
      <div
        className={`${styles.resizer} ${isResizing ? styles.resizing : ''}`}
        onMouseDown={handleMouseDown}
      />
    </>
  );
}
