'use client';

import { useSession } from 'next-auth/react';
import AIChatCard from '@/components/AIChatCard';
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

        {/* AI Chat Card */}
        <AIChatCard
          onMouseMove={handleCardMouseMove}
          onMouseLeave={handleCardMouseLeave}
        />
      </div>
    </div>
  );
}
