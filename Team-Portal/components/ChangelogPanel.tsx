'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { History, ChevronDown, ChevronUp, RotateCcw, ExternalLink } from 'lucide-react';
import styles from './ChangelogPanel.module.css';

interface CommitEntry {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export default function ChangelogPanel() {
  const { data: session } = useSession();
  const [commits, setCommits] = useState<CommitEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmRevertSha, setConfirmRevertSha] = useState<string | null>(null);
  const [revertingTo, setRevertingTo] = useState<string | null>(null);

  const isAdmin = session?.user?.name === 'admin';

  // Fetch commit history
  useEffect(() => {
    fetchCommits();
  }, []);

  const fetchCommits = async () => {
    try {
      const response = await fetch('/api/changelog?limit=15');
      if (response.ok) {
        const data = await response.json();
        setCommits(data.commits || []);
      }
    } catch (error) {
      console.error('Failed to fetch changelog:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevert = async (commit: CommitEntry) => {
    if (confirmRevertSha === commit.sha) {
      // Second click - perform the revert
      setRevertingTo(commit.sha);
      setConfirmRevertSha(null);

      // TODO: Implement actual revert logic
      // This would involve fetching file states at this commit and committing them
      console.log('Reverting to commit:', commit.sha);

      // For now, just show a message
      setTimeout(() => {
        setRevertingTo(null);
        alert(`Revert to ${commit.shortSha} functionality coming soon!`);
      }, 1000);
    } else {
      // First click - ask for confirmation
      setConfirmRevertSha(commit.sha);
      setTimeout(() => setConfirmRevertSha(null), 3000);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMins = Math.floor(diffMs / (1000 * 60));
        return diffMins <= 1 ? 'Just now' : `${diffMins}m ago`;
      }
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const formatMessage = (message: string) => {
    // Take only the first line and truncate if needed
    const firstLine = message.split('\n')[0];
    return firstLine.length > 50 ? firstLine.substring(0, 47) + '...' : firstLine;
  };

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
    <div className={styles.container}>
      <button
        className={styles.header}
        onClick={() => setIsExpanded(!isExpanded)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className={styles.headerLeft}>
          <History size={16} className={styles.headerIcon} />
          <span className={styles.headerTitle}>Recent Updates</span>
        </div>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isExpanded && (
        <div className={styles.content}>
          {isLoading ? (
            <div className={styles.loading}>Loading...</div>
          ) : commits.length === 0 ? (
            <div className={styles.empty}>No commits yet</div>
          ) : (
            <div className={styles.entries}>
              {commits.map((commit) => (
                <div
                  key={commit.sha}
                  className={styles.entry}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className={styles.entryContent}>
                    <span className={styles.entryTitle} title={commit.message}>
                      {formatMessage(commit.message)}
                    </span>
                    <span className={styles.entryDate}>{formatDate(commit.date)}</span>
                  </div>
                  <div className={styles.entryActions}>
                    <a
                      href={commit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.iconButton}
                      title="View on GitHub"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={12} />
                    </a>
                    {isAdmin && (
                      <button
                        onClick={() => handleRevert(commit)}
                        className={`${styles.iconButton} ${confirmRevertSha === commit.sha ? styles.confirming : ''} ${revertingTo === commit.sha ? styles.reverting : ''}`}
                        title={confirmRevertSha === commit.sha ? 'Click again to confirm revert' : 'Revert to this commit'}
                        disabled={revertingTo === commit.sha}
                      >
                        <RotateCcw size={12} className={revertingTo === commit.sha ? styles.spinning : ''} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
