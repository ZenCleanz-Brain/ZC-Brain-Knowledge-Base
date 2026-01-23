'use client';

import { useSession } from 'next-auth/react';
import { Brain, MessageSquare, Sparkles } from 'lucide-react';
import styles from './page.module.css';

export default function DashboardHomePage() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(' ')[0] || 'there';

  // Mouse tracking for glow effect
  const handleCardMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleCardMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    const card = e.currentTarget;
    card.style.setProperty('--mouse-x', '50%');
    card.style.setProperty('--mouse-y', '50%');
  };

  return (
    <div className={styles.content}>
      <div className={styles.welcomeContainer}>
        {/* Welcome Message */}
        <p className={styles.welcomeText}>Welcome back, {firstName}</p>

        {/* Main Card */}
        <div
          className={styles.mainCard}
          onMouseMove={handleCardMouseMove}
          onMouseLeave={handleCardMouseLeave}
        >
          <div className={styles.iconWrapper}>
            <Brain size={48} />
            <Sparkles size={20} className={styles.sparkle} />
          </div>

          <h1 className={styles.title}>ZenCleanz Brain</h1>
          <p className={styles.subtitle}>Coming Soon</p>

          <p className={styles.description}>
            Your intelligent AI assistant for ZenCleanz knowledge is being prepared.
          </p>

          <button
            className={styles.chatButton}
            disabled
          >
            <MessageSquare size={18} />
            Quick Chat
          </button>

          <p className={styles.comingSoonNote}>
            AI-powered assistance will be available soon
          </p>
        </div>
      </div>
    </div>
  );
}
