'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { FolderOpen, FileText, Clock, CheckCircle, XCircle, ChevronRight, BookOpen, Zap, RotateCcw, Trash2 } from 'lucide-react';
import styles from './page.module.css';

interface Stats {
  totalFiles: number;
  pendingEdits: number;
  approvedEdits: number;
  rejectedEdits: number;
}

interface RecentEdit {
  id: string;
  fileName: string;
  filePath: string;
  submittedBy: string;
  submittedAt: string;
  status: string;
  reviewNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

export default function KnowledgeBasePage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats>({
    totalFiles: 0,
    pendingEdits: 0,
    approvedEdits: 0,
    rejectedEdits: 0,
  });
  const [recentEdits, setRecentEdits] = useState<RecentEdit[]>([]);
  const [totalEdits, setTotalEdits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch files count
        const filesRes = await fetch('/api/files?format=list');
        const filesData = await filesRes.json();

        // Fetch edits
        const editsRes = await fetch('/api/edits');
        const editsData = await editsRes.json();

        const edits = editsData.edits || [];

        setStats({
          totalFiles: filesData.files?.length || 0,
          pendingEdits: edits.filter((e: any) => e.status === 'pending').length,
          approvedEdits: edits.filter((e: any) => e.status === 'approved').length,
          rejectedEdits: edits.filter((e: any) => e.status === 'rejected').length,
        });

        setTotalEdits(edits.length);
        setRecentEdits(edits.slice(0, 10));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const userRole = (session?.user as any)?.role || 'viewer';

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
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Knowledge Base</h1>
          <p className={styles.subtitle}>Here&apos;s what&apos;s happening with your knowledge base</p>
        </div>
        <span className={`badge badge-${userRole}`}>{userRole}</span>
      </div>

      {/* Stats Grid - 2x2 */}
      <div className={styles.statsGrid}>
        <Link
          href="/browse"
          className={`${styles.statCard} ${styles.statCardPrimary}`}
          onMouseMove={handleCardMouseMove}
          onMouseLeave={handleCardMouseLeave}
        >
          <div className={styles.statIcon}>
            <FileText size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{loading ? <span className={styles.statSpinner} /> : stats.totalFiles}</span>
            <span className={styles.statLabel}>Knowledge Files</span>
          </div>
          <ChevronRight size={18} className={styles.chevron} />
        </Link>

        {userRole === 'admin' ? (
          <Link
            href="/pending"
            className={`${styles.statCard} ${styles.statCardWarning}`}
            onMouseMove={handleCardMouseMove}
            onMouseLeave={handleCardMouseLeave}
          >
            <div className={styles.statIcon}>
              <Clock size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{loading ? <span className={styles.statSpinner} /> : stats.pendingEdits}</span>
              <span className={styles.statLabel}>Pending Reviews</span>
            </div>
            <ChevronRight size={18} className={styles.chevron} />
          </Link>
        ) : (
          <Link
            href="/approved"
            className={`${styles.statCard} ${styles.statCardSuccess}`}
            onMouseMove={handleCardMouseMove}
            onMouseLeave={handleCardMouseLeave}
          >
            <div className={styles.statIcon}>
              <CheckCircle size={22} />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{loading ? <span className={styles.statSpinner} /> : stats.approvedEdits}</span>
              <span className={styles.statLabel}>Approved Edits</span>
            </div>
            <ChevronRight size={18} className={styles.chevron} />
          </Link>
        )}

        <Link
          href="/approved"
          className={`${styles.statCard} ${styles.statCardSuccess}`}
          onMouseMove={handleCardMouseMove}
          onMouseLeave={handleCardMouseLeave}
        >
          <div className={styles.statIcon}>
            <CheckCircle size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{loading ? <span className={styles.statSpinner} /> : stats.approvedEdits}</span>
            <span className={styles.statLabel}>Approved</span>
          </div>
          <ChevronRight size={18} className={styles.chevron} />
        </Link>

        <Link
          href="/rejected"
          className={`${styles.statCard} ${styles.statCardDanger}`}
          onMouseMove={handleCardMouseMove}
          onMouseLeave={handleCardMouseLeave}
        >
          <div className={styles.statIcon}>
            <XCircle size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{loading ? <span className={styles.statSpinner} /> : stats.rejectedEdits}</span>
            <span className={styles.statLabel}>Rejected</span>
          </div>
          <ChevronRight size={18} className={styles.chevron} />
        </Link>
      </div>

      {/* Documentation Card */}
      <Link
        href="/docs"
        className={styles.docsCard}
        onMouseMove={handleCardMouseMove}
        onMouseLeave={handleCardMouseLeave}
      >
        <div className={styles.docsHeader}>
          <BookOpen size={20} />
          <h3>Documentation</h3>
        </div>
        <p>Learn how to use the Knowledge Base system effectively.</p>
        <div className={styles.docsLink}>
          Read the guide <ChevronRight size={14} />
        </div>
      </Link>

      {/* Recent Activity Section */}
      <div
        className={styles.activityCard}
        onMouseMove={handleCardMouseMove}
        onMouseLeave={handleCardMouseLeave}
      >
        <div className={styles.sectionHeader}>
          <h2>Recent Activity</h2>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.loadingSpinner}></div>
            <span>Loading...</span>
          </div>
        ) : recentEdits.length === 0 ? (
          <div className={styles.empty}>
            <FolderOpen size={40} />
            <p>No recent activity</p>
            <Link href="/browse" className={styles.emptyButton}>
              Browse Files
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.activityList}>
              {recentEdits.map((edit) => {
                const isDirectCommit = edit.reviewNote === 'Auto-approved (admin direct commit)';
                const isRevert = edit.reviewNote?.startsWith('Reverted');
                const isDeleted = edit.reviewNote === 'File permanently deleted';

                // Determine the icon style class
                const iconClass = isDeleted
                  ? styles.activityIcondeleted
                  : isRevert
                    ? styles.activityIconrevert
                    : styles[`activityIcon${edit.status}`];

                // Determine the status class
                const statusClass = isDeleted
                  ? styles.statusdeleted
                  : isRevert
                    ? styles.statusrevert
                    : styles[`status${edit.status}`];

                return (
                  <Link
                    key={edit.id}
                    href={isDeleted ? '#' : `/history/${edit.id}`}
                    className={styles.activityItem}
                    onMouseMove={handleCardMouseMove}
                    onMouseLeave={handleCardMouseLeave}
                    onClick={isDeleted ? (e) => e.preventDefault() : undefined}
                  >
                    <div className={`${styles.activityIcon} ${iconClass}`}>
                      {edit.status === 'pending' ? (
                        <Clock size={14} />
                      ) : edit.status === 'approved' ? (
                        isDeleted ? <Trash2 size={14} /> : isRevert ? <RotateCcw size={14} /> : isDirectCommit ? <Zap size={14} /> : <CheckCircle size={14} />
                      ) : (
                        <XCircle size={14} />
                      )}
                    </div>
                    <div className={styles.activityInfo}>
                      <div className={styles.activityFileRow}>
                        <span className={styles.activityFile}>{edit.fileName}</span>
                        {isDeleted && (
                          <span className={styles.deletedBadge}>Deleted</span>
                        )}
                        {isDirectCommit && !isDeleted && (
                          <span className={styles.directBadge}>Direct</span>
                        )}
                        {isRevert && (
                          <span className={styles.revertBadge}>Revert</span>
                        )}
                      </div>
                      <span className={styles.activityMeta}>
                        by {edit.submittedBy} • {new Date(edit.submittedAt).toLocaleDateString()}
                      </span>
                      <span className={`${styles.activityStatus} ${statusClass}`}>
                        {edit.status === 'pending' && 'Pending Review'}
                        {edit.status === 'approved' && (
                          isDeleted
                            ? `Permanently deleted by ${edit.reviewedBy || edit.submittedBy}`
                            : isRevert
                              ? `${edit.reviewNote}`
                              : isDirectCommit
                                ? `Auto-approved by ${edit.reviewedBy || edit.submittedBy}`
                                : `Approved by ${edit.reviewedBy || 'Admin'}`
                        )}
                        {edit.status === 'rejected' && `Rejected by ${edit.reviewedBy || 'Admin'}`}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
            {totalEdits > 10 && (
              <Link href="/approved" className={styles.showMoreButton}>
                Show More
                <ChevronRight size={16} />
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}
