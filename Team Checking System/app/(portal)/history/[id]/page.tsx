'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, XCircle, Clock, AlertCircle, RotateCcw } from 'lucide-react';
import SimpleDiffViewer from '@/components/SimpleDiffViewer';
import styles from './page.module.css';

interface EditDetails {
  id: string;
  filePath: string;
  fileName: string;
  originalContent: string;
  newContent: string;
  submittedBy: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export default function HistoryDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();

  const [edit, setEdit] = useState<EditDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reverting, setReverting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const userRole = (session?.user as any)?.role || 'viewer';

  useEffect(() => {
    async function fetchEdit() {
      try {
        const res = await fetch(`/api/edits/${params.id}`);
        if (!res.ok) {
          throw new Error('Failed to fetch edit details');
        }
        const data = await res.json();
        setEdit(data.edit);
      } catch (err: any) {
        setError(err.message || 'Failed to load edit');
      } finally {
        setLoading(false);
      }
    }

    fetchEdit();
  }, [params.id]);

  const handleRevert = async () => {
    if (!edit || edit.status !== 'approved') return;

    const confirmed = confirm(
      `Are you sure you want to revert this change?\n\nThis will restore: ${edit.fileName}\n\nThe file will be reverted to its state before this edit was approved.`
    );

    if (!confirmed) return;

    setReverting(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/edits/${edit.id}/revert`, {
        method: 'POST',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to revert');
      }

      setMessage({ type: 'success', text: 'Change reverted successfully!' });

      // Refresh the edit details
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to revert change' });
    } finally {
      setReverting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading edit details...</div>
      </div>
    );
  }

  if (error || !edit) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <AlertCircle size={48} />
          <h2>Error</h2>
          <p>{error || 'Edit not found'}</p>
          <button className="btn btn-primary" onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className="btn btn-secondary" onClick={() => router.back()}>
          <ArrowLeft size={16} />
          Back
        </button>

        <div className={styles.headerInfo}>
          <h1>{edit.fileName}</h1>
          <div className={styles.metadata}>
            <span className={`badge badge-${edit.status}`}>
              {edit.status === 'pending' && <Clock size={14} />}
              {edit.status === 'approved' && <CheckCircle size={14} />}
              {edit.status === 'rejected' && <XCircle size={14} />}
              {edit.status}
            </span>
            <span className={styles.meta}>
              Submitted by {edit.submittedBy} on {new Date(edit.submittedAt).toLocaleString()}
            </span>
            {edit.reviewedBy && (
              <span className={styles.meta}>
                Reviewed by {edit.reviewedBy} on {new Date(edit.reviewedAt!).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {userRole === 'admin' && edit.status === 'approved' && (
          <button
            className="btn btn-danger"
            onClick={handleRevert}
            disabled={reverting}
          >
            <RotateCcw size={16} />
            {reverting ? 'Reverting...' : 'Revert Change'}
          </button>
        )}
      </div>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      {edit.reviewNote && (
        <div className={styles.reviewNote}>
          <strong>Review Note:</strong> {edit.reviewNote}
        </div>
      )}

      <div className={styles.diffContainer}>
        <SimpleDiffViewer
          original={edit.originalContent}
          modified={edit.newContent}
          fileName={edit.fileName}
        />
      </div>
    </div>
  );
}
