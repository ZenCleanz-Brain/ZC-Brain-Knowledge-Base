'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Database, Bookmark } from 'lucide-react';
import ResizableSidebar from './ResizableSidebar';
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
    icon: Bookmark,
    badge: 'Coming Soon'
  },
];

export default function DashboardNavSidebar() {
  const pathname = usePathname();

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
    <ResizableSidebar
      defaultWidth={240}
      minWidth={180}
      maxWidth={320}
      storageKey="dashboard-sidebar-width"
    >
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
            >
              <Icon size={18} className={styles.navIcon} />
              <span className={styles.navLabel}>{item.label}</span>
              {item.badge && <span className={styles.badge}>{item.badge}</span>}
            </Link>
          );
        })}
      </nav>
    </ResizableSidebar>
  );
}
