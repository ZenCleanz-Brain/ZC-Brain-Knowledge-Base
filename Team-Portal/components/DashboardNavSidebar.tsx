'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Database, Bookmark, Menu, X } from 'lucide-react';
import ResizableSidebar from './ResizableSidebar';
import ChangelogPanel from './ChangelogPanel';
import styles from './DashboardNavSidebar.module.css';

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: typeof Database;
  badge?: string;
}

const navItems: NavItem[] = [
  {
    id: 'home',
    label: 'Home',
    href: '/dashboard',
    icon: Home
  },
  {
    id: 'knowledge-base',
    label: 'Knowledge Base',
    href: '/dashboard/knowledge-base',
    icon: Database
  },
  {
    id: 'saved-answers',
    label: 'Review Saved Answers',
    href: '/dashboard/saved-answers',
    icon: Bookmark
  },
];

export default function DashboardNavSidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Auto-close drawer when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const item = e.currentTarget;
    const rect = item.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    item.style.setProperty('--mouse-x', `${x}px`);
    item.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    const item = e.currentTarget;
    item.style.setProperty('--mouse-x', '50%');
    item.style.setProperty('--mouse-y', '50%');
  };

  return (
    <>
      {!isMobileOpen && (
        <button
          type="button"
          className={styles.menuButton}
          onClick={() => setIsMobileOpen(true)}
          aria-label="Open navigation"
          aria-expanded={isMobileOpen}
          aria-controls="dashboard-nav-drawer"
        >
          <Menu size={20} />
        </button>
      )}

      <ResizableSidebar
        defaultWidth={240}
        minWidth={180}
        maxWidth={320}
        storageKey="dashboard-sidebar-width"
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      >
        <div className={styles.sidebarContent}>
          <button
            type="button"
            className={styles.closeButton}
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
          <nav className={styles.nav}>
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <Icon size={18} className={styles.navIcon} />
                  <span className={styles.navLabel}>{item.label}</span>
                  {item.badge && <span className={styles.badge}>{item.badge}</span>}
                </Link>
              );
            })}
          </nav>
          <ChangelogPanel />
        </div>
      </ResizableSidebar>
    </>
  );
}
