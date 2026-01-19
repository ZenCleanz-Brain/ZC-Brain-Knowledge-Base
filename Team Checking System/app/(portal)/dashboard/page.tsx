'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { FolderOpen, FileText, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Welcome, {session?.user?.name}</h1>
        <span className={`badge badge-${userRole}`}>{userRole}</span>
      </div>

      <div className={styles.statsGrid}>
        <Link href="/browse" className={`${styles.statCard} card`}>
          <div className={styles.statIcon} style={{ background: '#e0f2fe' }}>
            <FileText size={24} color="#0284c7" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{loading ? '...' : stats.totalFiles}</span>
            <span className={styles.statLabel}>Knowledge Base Files</span>
          </div>
          <ChevronRight size={20} className={styles.chevron} />
        </Link>

        {userRole === 'admin' && (
          <Link href="/pending" className={`${styles.statCard} card`}>
            <div className={styles.statIcon} style={{ background: '#fef3c7' }}>
              <Clock size={24} color="#d97706" />
            </div>
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{loading ? '...' : stats.pendingEdits}</span>
              <span className={styles.statLabel}>Pending Reviews</span>
            </div>
            <ChevronRight size={20} className={styles.chevron} />
          </Link>
        )}

        <div className={`${styles.statCard} card`}>
          <div className={styles.statIcon} style={{ background: '#d1fae5' }}>
            <CheckCircle size={24} color="#059669" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{loading ? '...' : stats.approvedEdits}</span>
            <span className={styles.statLabel}>Approved Edits</span>
          </div>
        </div>

        <div className={`${styles.statCard} card`}>
          <div className={styles.statIcon} style={{ background: '#fee2e2' }}>
            <XCircle size={24} color="#dc2626" />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{loading ? '...' : stats.rejectedEdits}</span>
            <span className={styles.statLabel}>Rejected Edits</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Recent Activity</h2>
          {userRole === 'admin' && recentEdits.length > 0 && (
            <Link href="/pending" className={styles.viewAll}>
              View all <ChevronRight size={16} />
            </Link>
          )}
        </div>

        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : recentEdits.length === 0 ? (
          <div className={styles.empty}>
            <FolderOpen size={48} />
            <p>No recent activity</p>
            <Link href="/browse" className="btn btn-primary">
              Browse Knowledge Base
            </Link>
          </div>
        ) : (
          <div className={styles.activityList}>
            {recentEdits.map((edit) => (
              <div key={edit.id} className={styles.activityItem}>
                <div className={styles.activityIcon}>
                  {edit.status === 'pending' ? (
                    <Clock size={16} color="#d97706" />
                  ) : edit.status === 'approved' ? (
                    <CheckCircle size={16} color="#059669" />
                  ) : (
                    <XCircle size={16} color="#dc2626" />
                  )}
                </div>
                <div className={styles.activityInfo}>
                  <span className={styles.activityFile}>{edit.fileName}</span>
                  <span className={styles.activityMeta}>
                    by {edit.submittedBy} • {new Date(edit.submittedAt).toLocaleDateString()}
                  </span>
                </div>
                <span className={`badge badge-${edit.status}`}>{edit.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.quickActions}>
        <h2>Quick Actions</h2>
        <div className={styles.actionGrid}>
          <Link href="/browse" className={`${styles.actionCard} card`}>
            <FolderOpen size={32} />
            <span>Browse Files</span>
          </Link>
          {userRole === 'admin' && (
            <Link href="/pending" className={`${styles.actionCard} card`}>
              <Clock size={32} />
              <span>Review Edits</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
