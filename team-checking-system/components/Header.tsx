'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { LogOut, User, FolderTree, ClipboardList, LayoutDashboard } from 'lucide-react';
import styles from './Header.module.css';

export default function Header() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role || 'viewer';

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Link href="/dashboard" className={styles.logo}>
          <Image
            src="/zencleanz-logo.png"
            alt="ZenCleanz Logo"
            width={40}
            height={40}
            className={styles.logoImage}
          />
          <span className={styles.logoText}>ZenCleanz KB</span>
        </Link>

        <nav className={styles.nav}>
          <Link href="/dashboard" className={styles.navLink}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>
          <Link href="/browse" className={styles.navLink}>
            <FolderTree size={18} />
            <span>Browse</span>
          </Link>
          {role === 'admin' && (
            <Link href="/pending" className={styles.navLink}>
              <ClipboardList size={18} />
              <span>Pending Edits</span>
            </Link>
          )}
        </nav>
      </div>

      <div className={styles.right}>
        <div className={styles.user}>
          <User size={16} />
          <span>{session?.user?.name}</span>
          <span className={`badge badge-${role}`}>{role}</span>
        </div>
        <button onClick={() => signOut({ callbackUrl: '/' })} className={styles.signOut}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
}
