'use client';

import { useSession } from 'next-auth/react';
import { Bookmark, Sparkles } from 'lucide-react';
import styles from './page.module.css';

export default function SavedAnswersPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || 'viewer';

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
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Review Saved Answers</h1>
          <p className={styles.subtitle}>Manage and review your draft responses</p>
        </div>
        <span className={`badge badge-${userRole}`}>{userRole}</span>
      </div>

      {/* Coming Soon Card */}
      <div
        className={styles.comingSoonCard}
        onMouseMove={handleCardMouseMove}
        onMouseLeave={handleCardMouseLeave}
      >
        <div className={styles.iconWrapper}>
          <Bookmark size={48} />
          <Sparkles size={24} className={styles.sparkle} />
        </div>
        <h2>Coming Soon</h2>
        <p>
          This feature will allow you to save, review, and manage draft answers
          before committing them to the knowledge base.
        </p>
        <div className={styles.featureList}>
          <div className={styles.feature}>
            <span className={styles.bullet} />
            Save answers while working
          </div>
          <div className={styles.feature}>
            <span className={styles.bullet} />
            Review and edit before publishing
          </div>
          <div className={styles.feature}>
            <span className={styles.bullet} />
            Collaborate with team members
          </div>
        </div>
      </div>
    </div>
  );
}
