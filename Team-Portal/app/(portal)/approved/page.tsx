'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { CheckCircle, Eye, RefreshCw, AlertCircle, FileText, ArrowLeft, Zap } from 'lucide-react';
import SimpleDiffViewer from '@/components/SimpleDiffViewer';
import ResizableSidebar from '@/components/ResizableSidebar';
import styles from './page.module.css';

interface ApprovedEdit {
  id: string;
  filePath: string;
  fileName: string;
  submittedBy: string;
  submittedAt: string;
  status: 'approved';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

interface EditDetails {
  id: string;
  filePath: string;
  fileName: string;
  originalContent: string;
  newContent: string;
  submittedBy: string;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  status: string;
}

export default function ApprovedPage() {
  const { data: session } = useSession();

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

  const [edits, setEdits] = useState<ApprovedEdit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEdit, setSelectedEdit] = useState<ApprovedEdit | null>(null);
  const [editDetails, setEditDetails] = useState<EditDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchEdits = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/edits');
      const data = await res.json();
      // Filter only approved edits
      const approvedEdits = (data.edits || []).filter(
        (e: ApprovedEdit) => e.status === 'approved'
      );
      setEdits(approvedEdits);
    } catch (error) {
      console.error('Error fetching edits:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEdits();
  }, []);

  // Fetch individual edit details
  const fetchEditDetails = async (edit: ApprovedEdit) => {
    setDetailsLoading(true);
    setSelectedEdit(edit);
    setEditDetails(null);

    try {
      const res = await fetch(`/api/edits/${edit.id}`);
      const data = await res.json();
      if (data.edit) {
        setEditDetails(data.edit);
      }
    } catch (error) {
      console.error('Error fetching edit details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/dashboard" className={styles.backLink}>
            <ArrowLeft size={18} />
          </Link>
          <h1>
            <CheckCircle size={24} className={styles.headerIcon} />
            Approved Edits
          </h1>
        </div>
        <button className="btn btn-secondary" onClick={fetchEdits} disabled={loading}>
          <RefreshCw size={16} className={loading ? styles.spinning : ''} />
          Refresh
        </button>
      </div>

      <div className={styles.content}>
        <ResizableSidebar defaultWidth={320} minWidth={280} maxWidth={500}>
          <div className={styles.sidebarHeader}>
            <h2>
              <CheckCircle size={18} /> Approved ({edits.length})
            </h2>
          </div>
          <div className={styles.editsList}>
            {loading ? (
              <div className={styles.loading}>Loading...</div>
            ) : edits.length === 0 ? (
              <div className={styles.empty}>No approved edits yet</div>
            ) : (
              <div className={styles.list}>
                {edits.map((edit) => (
                  <button
                    key={edit.id}
                    className={`${styles.editItem} ${selectedEdit?.id === edit.id ? styles.selected : ''}`}
                    onClick={() => fetchEditDetails(edit)}
                    onMouseMove={handleCardMouseMove}
                    onMouseLeave={handleCardMouseLeave}
                  >
                    <div className={styles.editInfo}>
                      <div className={styles.fileNameRow}>
                        <span className={styles.fileName}>{edit.fileName}</span>
                        {edit.reviewNote === 'Auto-approved (admin direct commit)' && (
                          <span className={styles.directCommitBadge}>
                            <Zap size={10} />
                            Direct
                          </span>
                        )}
                      </div>
                      <span className={styles.meta}>
                        by {edit.submittedBy} • {new Date(edit.submittedAt).toLocaleDateString()}
                      </span>
                      {edit.reviewedBy && (
                        <span className={styles.reviewMeta}>
                          {edit.reviewNote === 'Auto-approved (admin direct commit)'
                            ? `Auto-approved by ${edit.reviewedBy}`
                            : `Approved by ${edit.reviewedBy}`} • {edit.reviewedAt && new Date(edit.reviewedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <Eye size={16} />
                  </button>
                ))}
              </div>
            )}
          </div>
        </ResizableSidebar>

        <main className={styles.preview}>
          {detailsLoading ? (
            <div className={styles.previewLoading}>Loading edit details...</div>
          ) : selectedEdit && editDetails ? (
            <>
              <div className={styles.previewHeader}>
                <div>
                  <h3>{editDetails.fileName}</h3>
                  <span className={styles.previewMeta}>
                    Submitted by {editDetails.submittedBy} • {new Date(editDetails.submittedAt).toLocaleDateString()}
                  </span>
                  {editDetails.reviewedBy && (
                    <span className={styles.previewMeta}>
                      Approved by {editDetails.reviewedBy} • {editDetails.reviewedAt && new Date(editDetails.reviewedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <Link href={`/history/${editDetails.id}`} className="btn btn-secondary">
                  <FileText size={16} />
                  View Full History
                </Link>
              </div>

              <SimpleDiffViewer
                original={editDetails.originalContent}
                modified={editDetails.newContent}
                fileName={editDetails.fileName}
              />
            </>
          ) : (
            <div className={styles.previewEmpty}>
              <AlertCircle size={48} />
              <p>Select an edit to view changes</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
