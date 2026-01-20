'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './ResizableSidebar.module.css';

interface ResizableSidebarProps {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
}

export default function ResizableSidebar({
  children,
  defaultWidth = 320,
  minWidth = 240,
  maxWidth = 600,
}: ResizableSidebarProps) {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load saved width from localStorage
    const savedWidth = localStorage.getItem('sidebar-width');
    if (savedWidth) {
      setWidth(parseInt(savedWidth, 10));
    }
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = e.clientX;
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setWidth(newWidth);
        localStorage.setItem('sidebar-width', newWidth.toString());
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
  }, [isResizing, minWidth, maxWidth]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  return (
    <>
      <aside
        ref={sidebarRef}
        className={styles.sidebar}
        style={{ width: `${width}px` }}
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
