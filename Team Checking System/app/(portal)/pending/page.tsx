'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock, CheckCircle, XCircle, Eye, RefreshCw, AlertCircle } from 'lucide-react';
import SimpleDiffViewer from '@/components/SimpleDiffViewer';
import styles from './page.module.css';

interface PendingEdit {
  id: string;
  filePath: string;
  fileName: string;
  submittedBy: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
}

interface EditDetails {
  id: string;
  filePath: string;
  fileName: string;
  originalContent: string;
  newContent: string;
  submittedBy: string;
  submittedAt: string;
  status: string;
}

export default function PendingPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [edits, setEdits] = useState<PendingEdit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEdit, setSelectedEdit] = useState<EditDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const userRole = (session?.user as any)?.role;

  useEffect(() => {
    if (session && userRole !== 'admin') {
      router.push('/dashboard');
    }
  }, [session, userRole, router]);

  const fetchEdits = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/edits');
      const data = await res.json();
      setEdits(data.edits || []);
    } catch (error) {
      console.error('Error fetching edits:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEdits();
  }, []);

  const fetchEditDetails = async (editId: string) => {
    setDetailsLoading(true);
    setSelectedEdit(null);
    try {
      const res = await fetch(`/api/edits/${editId}`);
      const data = await res.json();
      if (data.edit) {
        setSelectedEdit(data.edit);
      }
    } catch (error) {
      console.error('Error fetching edit details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedEdit) return;
    setProcessing(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/edits/${selectedEdit.id}/approve`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to approve');
      }

      setMessage({ type: 'success', text: 'Edit approved and committed!' });
      setSelectedEdit(null);
      fetchEdits();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to approve edit' });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedEdit) return;
    setProcessing(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/edits/${selectedEdit.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: '' }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reject');
      }

      setMessage({ type: 'success', text: 'Edit rejected.' });
      setSelectedEdit(null);
      fetchEdits();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to reject edit' });
    } finally {
      setProcessing(false);
    }
  };

  const pendingEdits = edits.filter((e) => e.status === 'pending');
  const processedEdits = edits.filter((e) => e.status !== 'pending');

  if (userRole !== 'admin') {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Pending Reviews</h1>
        <button className="btn btn-secondary" onClick={fetchEdits} disabled={loading}>
          <RefreshCw size={16} className={loading ? styles.spinning : ''} />
          Refresh
        </button>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.content}>
        <div className={styles.editsList}>
          <div className={styles.section}>
            <h2>
              <Clock size={18} /> Pending ({pendingEdits.length})
            </h2>
            {loading ? (
              <div className={styles.loading}>Loading...</div>
            ) : pendingEdits.length === 0 ? (
              <div className={styles.empty}>No pending edits</div>
            ) : (
              <div className={styles.list}>
                {pendingEdits.map((edit) => (
                  <button
                    key={edit.id}
                    className={`${styles.editItem} ${selectedEdit?.id === edit.id ? styles.selected : ''}`}
                    onClick={() => fetchEditDetails(edit.id)}
                  >
                    <div className={styles.editInfo}>
                      <span className={styles.fileName}>{edit.fileName}</span>
                      <span className={styles.meta}>
                        by {edit.submittedBy} • {new Date(edit.submittedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <Eye size={16} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.section}>
            <h2>
              <CheckCircle size={18} /> History ({processedEdits.length})
            </h2>
            {processedEdits.length === 0 ? (
              <div className={styles.empty}>No processed edits</div>
            ) : (
              <div className={styles.list}>
                {processedEdits.slice(0, 10).map((edit) => (
                  <Link
                    key={edit.id}
                    href={`/history/${edit.id}`}
                    className={`${styles.editItem} ${styles.clickable}`}
                  >
                    <div className={styles.editInfo}>
                      <span className={styles.fileName}>{edit.fileName}</span>
                      <span className={styles.meta}>
                        {edit.status} by {edit.reviewedBy} • {new Date(edit.reviewedAt!).toLocaleDateString()}
                      </span>
                    </div>
                    <span className={`badge badge-${edit.status}`}>{edit.status}</span>
                    <Eye size={16} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.preview}>
          {detailsLoading ? (
            <div className={styles.previewLoading}>Loading edit details...</div>
          ) : selectedEdit ? (
            <>
              <div className={styles.previewHeader}>
                <div>
                  <h3>{selectedEdit.fileName}</h3>
                  <span className={styles.previewMeta}>
                    Submitted by {selectedEdit.submittedBy} on{' '}
                    {new Date(selectedEdit.submittedAt).toLocaleString()}
                  </span>
                </div>
                <div className={styles.previewActions}>
                  <button
                    className="btn btn-danger"
                    onClick={handleReject}
                    disabled={processing}
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={handleApprove}
                    disabled={processing}
                  >
                    <CheckCircle size={16} />
                    {processing ? 'Processing...' : 'Approve & Commit'}
                  </button>
                </div>
              </div>

              <div className={styles.diffView}>
                <SimpleDiffViewer
                  original={selectedEdit.originalContent}
                  modified={selectedEdit.newContent}
                  fileName={selectedEdit.fileName}
                />
              </div>
            </>
          ) : (
            <div className={styles.previewEmpty}>
              <AlertCircle size={48} />
              <p>Select an edit to review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
