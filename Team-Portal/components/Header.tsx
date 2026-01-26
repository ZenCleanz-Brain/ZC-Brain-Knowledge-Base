'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { LogOut, User, FolderTree, ClipboardList, Settings, ToggleLeft, ToggleRight } from 'lucide-react';
import { useBackground } from '@/contexts/BackgroundContext';
import { useAdminSettings } from '@/contexts/AdminSettingsContext';
import styles from './Header.module.css';

export default function Header() {
  const { data: session } = useSession();
  const { isMotion, toggleBackground } = useBackground();
  const { settings, updateSetting } = useAdminSettings();
  const role = (session?.user as any)?.role || 'viewer';
  const isAdminUser = session?.user?.name === 'admin';

  // Settings dropdown state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        <button
          onClick={toggleBackground}
          className={styles.bgToggle}
          title={isMotion ? 'Switch to static background' : 'Switch to motion background'}
        >
          <span className={styles.bgToggleLabel}>{isMotion ? 'Motion' : 'Static'}</span>
          <div className={`${styles.bgToggleSwitch} ${isMotion ? styles.bgToggleSwitchActive : ''}`} />
        </button>

        {/* Admin Settings - only for admin user */}
        {isAdminUser && (
          <div className={styles.settingsContainer} ref={settingsRef}>
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`${styles.settingsButton} ${isSettingsOpen ? styles.settingsButtonActive : ''}`}
              title="Admin Settings"
            >
              <Settings size={16} />
            </button>

            {isSettingsOpen && (
              <div className={styles.settingsDropdown}>
                <div className={styles.settingsHeader}>
                  <Settings size={14} />
                  <span>Admin Settings</span>
                </div>
                <div className={styles.settingsList}>
                  <div className={styles.settingItem}>
                    <div className={styles.settingInfo}>
                      <span className={styles.settingLabel}>Formatted AI Output</span>
                      <span className={styles.settingDesc}>Enable markdown formatting</span>
                    </div>
                    <button
                      className={`${styles.settingToggle} ${settings.formattedTextOutput ? styles.settingToggleActive : ''}`}
                      onClick={() => updateSetting('formattedTextOutput', !settings.formattedTextOutput)}
                    >
                      {settings.formattedTextOutput ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <button onClick={() => signOut({ callbackUrl: '/' })} className={styles.signOut}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </header>
  );
}
