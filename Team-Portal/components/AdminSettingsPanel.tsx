'use client';

import { useSession } from 'next-auth/react';
import { Settings, ToggleLeft, ToggleRight } from 'lucide-react';
import { useAdminSettings } from '@/contexts/AdminSettingsContext';
import styles from './AdminSettingsPanel.module.css';

export default function AdminSettingsPanel() {
  const { data: session } = useSession();
  const { settings, updateSetting, isLoading } = useAdminSettings();

  // Only show for the specific "admin" user
  const isAdminUser = session?.user?.name === 'admin';

  if (!isAdminUser || isLoading) {
    return null;
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <Settings size={16} />
        <span>Admin Settings</span>
      </div>

      <div className={styles.settings}>
        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <span className={styles.settingLabel}>Formatted AI Output</span>
            <span className={styles.settingDescription}>
              Enable markdown formatting for AI chat responses (headings, bullets, bold)
            </span>
          </div>
          <button
            className={`${styles.toggle} ${settings.formattedTextOutput ? styles.active : ''}`}
            onClick={() => updateSetting('formattedTextOutput', !settings.formattedTextOutput)}
            aria-label={settings.formattedTextOutput ? 'Disable formatted output' : 'Enable formatted output'}
          >
            {settings.formattedTextOutput ? (
              <ToggleRight size={28} />
            ) : (
              <ToggleLeft size={28} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
