'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { FolderOpen, FileText, Clock, CheckCircle, XCircle, ChevronRight, BookOpen, Bookmark } from 'lucide-react';
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
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats>({
    totalFiles: 0,
    pendingEdits: 0,
    approvedEdits: 0,
    rejectedEdits: 0,
  });
  const [recentEdits, setRecentEdits] = useState<RecentEdit[]>([]);
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

        setRecentEdits(edits.slice(0, 5));
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
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Welcome back, {session?.user?.name?.split(' ')[0]}</h1>
          <p className={styles.subtitle}>Here&apos;s what&apos;s happening with your knowledge base</p>
        </div>
        <span className={`badge badge-${userRole}`}>{userRole}</span>
      </div>

      {/* Two Column Layout */}
      <div className={styles.twoColumnLayout}>
        {/* Left Column - Main Content */}
        <div className={styles.mainColumn}>
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
              <div
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
              </div>
            )}

            <div
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
            </div>

            <div
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
            </div>
          </div>

          {/* Quick Actions */}
          <div
            className={styles.quickActionsSection}
            onMouseMove={handleCardMouseMove}
            onMouseLeave={handleCardMouseLeave}
          >
            <h2>Quick Actions</h2>
            <div className={styles.actionGridCompact}>
              <Link
                href="/browse"
                className={styles.actionCard}
                onMouseMove={handleCardMouseMove}
                onMouseLeave={handleCardMouseLeave}
              >
                <div className={styles.actionIconWrapper}>
                  <FolderOpen size={24} />
                </div>
                <div className={styles.actionContent}>
                  <span className={styles.actionTitle}>Browse Files</span>
                  <span className={styles.actionDesc}>Explore knowledge base</span>
                </div>
                <ChevronRight size={18} className={styles.chevron} />
              </Link>

              <div
                className={`${styles.actionCard} ${styles.actionCardWip}`}
                onMouseMove={handleCardMouseMove}
                onMouseLeave={handleCardMouseLeave}
              >
                <div className={styles.actionIconWrapper}>
                  <Bookmark size={24} />
                </div>
                <div className={styles.actionContent}>
                  <span className={styles.actionTitle}>
                    Review Saved Answers
                    <span className={styles.wipBadge}>Coming Soon</span>
                  </span>
                  <span className={styles.actionDesc}>View your draft responses</span>
                </div>
                <ChevronRight size={18} className={styles.chevron} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Activity Sidebar */}
        <div className={styles.sidebarColumn}>
          <div
            className={styles.activityCard}
            onMouseMove={handleCardMouseMove}
            onMouseLeave={handleCardMouseLeave}
          >
            <div className={styles.sectionHeader}>
              <h2>Recent Activity</h2>
              {userRole === 'admin' && recentEdits.length > 0 && (
                <Link href="/pending" className={styles.viewAll}>
                  View all
                </Link>
              )}
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
              <div className={styles.activityList}>
                {recentEdits.map((edit) => (
                  <Link
                    key={edit.id}
                    href={`/history/${edit.id}`}
                    className={styles.activityItem}
                    onMouseMove={handleCardMouseMove}
                    onMouseLeave={handleCardMouseLeave}
                  >
                    <div className={`${styles.activityIcon} ${styles[`activityIcon${edit.status}`]}`}>
                      {edit.status === 'pending' ? (
                        <Clock size={14} />
                      ) : edit.status === 'approved' ? (
                        <CheckCircle size={14} />
                      ) : (
                        <XCircle size={14} />
                      )}
                    </div>
                    <div className={styles.activityInfo}>
                      <span className={styles.activityFile}>{edit.fileName}</span>
                      <span className={styles.activityMeta}>
                        {edit.submittedBy} • {new Date(edit.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
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
        </div>
      </div>
    </div>
  );
}
