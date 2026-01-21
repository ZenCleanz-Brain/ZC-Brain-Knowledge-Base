'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Clock, CheckCircle, XCircle, Eye, RefreshCw, AlertCircle, Layers, FileText, Edit3, Save, X } from 'lucide-react';
import SimpleDiffViewer from '@/components/SimpleDiffViewer';
import MarkdownEditor from '@/components/MarkdownEditor';
import { useToast } from '@/components/Toast';
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

// Group edits by file path
interface FileGroup {
  filePath: string;
  fileName: string;
  edits: PendingEdit[];
  firstEdit: PendingEdit;
  lastEdit: PendingEdit;
}

export default function PendingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { showToast, updateToast } = useToast();

  const [edits, setEdits] = useState<PendingEdit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<FileGroup | null>(null);
  const [selectedEditId, setSelectedEditId] = useState<string | null>(null);
  const [editDetails, setEditDetails] = useState<EditDetails | null>(null);
  const [combinedDiff, setCombinedDiff] = useState<{ original: string; final: string } | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [viewMode, setViewMode] = useState<'combined' | 'individual' | 'edit'>('combined');
  // For partial approval editing
  const [editableContent, setEditableContent] = useState('');
  const [originalContentForEdit, setOriginalContentForEdit] = useState('');

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

  // Group pending edits by file
  const groupEditsByFile = (editsList: PendingEdit[]): FileGroup[] => {
    const groups: Record<string, FileGroup> = {};

    // Sort by submittedAt ascending (oldest first)
    const sortedEdits = [...editsList].sort(
      (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
    );

    sortedEdits.forEach((edit) => {
      if (!groups[edit.filePath]) {
        groups[edit.filePath] = {
          filePath: edit.filePath,
          fileName: edit.fileName,
          edits: [],
          firstEdit: edit,
          lastEdit: edit,
        };
      }
      groups[edit.filePath].edits.push(edit);
      groups[edit.filePath].lastEdit = edit;
    });

    return Object.values(groups);
  };

  const pendingEdits = edits.filter((e) => e.status === 'pending');
  const processedEdits = edits.filter((e) => e.status !== 'pending');
  const fileGroups = groupEditsByFile(pendingEdits);

  // Fetch combined diff for a file group (original GitHub content -> final after all edits)
  const fetchCombinedDiff = async (group: FileGroup) => {
    setDetailsLoading(true);
    setSelectedGroup(group);
    setSelectedEditId(null);
    setEditDetails(null);
    setCombinedDiff(null);
    setViewMode('combined');

    try {
      // Get the first edit (has original GitHub content)
      const firstRes = await fetch(`/api/edits/${group.firstEdit.id}`);
      const firstData = await firstRes.json();

      // Get the last edit (has final content)
      const lastRes = await fetch(`/api/edits/${group.lastEdit.id}`);
      const lastData = await lastRes.json();

      if (firstData.edit && lastData.edit) {
        setCombinedDiff({
          original: firstData.edit.originalContent,
          final: lastData.edit.newContent,
        });
      }
    } catch (error) {
      console.error('Error fetching combined diff:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Fetch individual edit details
  const fetchEditDetails = async (editId: string) => {
    setDetailsLoading(true);
    setSelectedEditId(editId);
    setEditDetails(null);
    setViewMode('individual');

    try {
      const res = await fetch(`/api/edits/${editId}`);
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

  // Approve a single edit (with optional force for conflict override)
  const handleApprove = async (editId: string, force = false) => {
    setProcessing(true);
    setMessage(null);

    const toastId = showToast('loading', 'Approving edit...', true);

    try {
      const res = await fetch(`/api/edits/${editId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force }),
      });
      const data = await res.json();

      // Handle conflict detection
      if (res.status === 409 && data.conflict) {
        updateToast(toastId, 'warning', 'Conflict detected - please confirm');
        const confirmForce = window.confirm(
          `⚠️ CONFLICT DETECTED\n\n` +
          `The file on GitHub has been modified since this edit was created.\n\n` +
          `Original SHA: ${data.originalSha?.slice(0, 7) || 'unknown'}\n` +
          `Current SHA: ${data.currentSha?.slice(0, 7) || 'unknown'}\n\n` +
          `Do you want to FORCE APPROVE and overwrite the current GitHub content?\n\n` +
          `Click OK to force approve, or Cancel to review the changes first.`
        );

        if (confirmForce) {
          // Retry with force=true
          return handleApprove(editId, true);
        } else {
          setMessage({
            type: 'error',
            text: 'Approval cancelled due to conflict. Please review the changes.',
          });
          setProcessing(false);
          return;
        }
      }

      if (!res.ok) {
        throw new Error(data.error || 'Failed to approve');
      }

      // Show sync status in toast
      if (data.sync?.success) {
        updateToast(toastId, 'success', 'Edit approved & synced to ElevenLabs!');
      } else if (data.sync?.reason === 'not_found') {
        updateToast(toastId, 'warning', 'Approved! Note: Document not yet in ElevenLabs KB.');
      } else {
        updateToast(toastId, 'success', 'Edit approved and committed!');
      }

      setMessage({ type: 'success', text: 'Edit approved and committed!' });
      setSelectedGroup(null);
      setEditDetails(null);
      setCombinedDiff(null);
      fetchEdits();
    } catch (error: any) {
      updateToast(toastId, 'error', error.message || 'Failed to approve edit');
      setMessage({ type: 'error', text: error.message || 'Failed to approve edit' });
    } finally {
      setProcessing(false);
    }
  };

  // Approve all edits in a group (in order, with optional force)
  const handleApproveAll = async (force = false) => {
    if (!selectedGroup) return;

    setProcessing(true);
    setMessage(null);

    const toastId = showToast('loading', `Approving ${selectedGroup.edits.length} edits...`, true);

    try {
      let lastSyncResult = null;

      // Approve edits in order (oldest first)
      for (let i = 0; i < selectedGroup.edits.length; i++) {
        const edit = selectedGroup.edits[i];
        const res = await fetch(`/api/edits/${edit.id}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ force }),
        });
        const data = await res.json();

        // Handle conflict on first edit only (subsequent edits are chained)
        if (res.status === 409 && data.conflict && i === 0) {
          updateToast(toastId, 'warning', 'Conflict detected - please confirm');
          const confirmForce = window.confirm(
            `⚠️ CONFLICT DETECTED\n\n` +
            `The file on GitHub has been modified since the first edit was created.\n\n` +
            `This will overwrite the current GitHub content with all ${selectedGroup.edits.length} pending edits.\n\n` +
            `Do you want to FORCE APPROVE ALL?`
          );

          if (confirmForce) {
            // Retry all with force=true
            setProcessing(false);
            return handleApproveAll(true);
          } else {
            setMessage({
              type: 'error',
              text: 'Approval cancelled due to conflict. Please review the changes.',
            });
            setProcessing(false);
            return;
          }
        }

        if (!res.ok) {
          throw new Error(data.error || `Failed to approve edit ${edit.id}`);
        }

        // Keep track of the last sync result
        lastSyncResult = data.sync;
      }

      // Show final sync status in toast
      if (lastSyncResult?.success) {
        updateToast(toastId, 'success', `All ${selectedGroup.edits.length} edits approved & synced to ElevenLabs!`);
      } else if (lastSyncResult?.reason === 'not_found') {
        updateToast(toastId, 'warning', `All edits approved! Note: Document not yet in ElevenLabs KB.`);
      } else {
        updateToast(toastId, 'success', `All ${selectedGroup.edits.length} edit(s) approved and committed!`);
      }

      setMessage({
        type: 'success',
        text: `All ${selectedGroup.edits.length} edit(s) approved and committed!`,
      });
      setSelectedGroup(null);
      setEditDetails(null);
      setCombinedDiff(null);
      fetchEdits();
    } catch (error: any) {
      updateToast(toastId, 'error', error.message || 'Failed to approve edits');
      setMessage({ type: 'error', text: error.message || 'Failed to approve edits' });
      fetchEdits(); // Refresh to see which ones were approved
    } finally {
      setProcessing(false);
    }
  };

  // Reject a single edit
  const handleReject = async (editId: string) => {
    setProcessing(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/edits/${editId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: '' }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reject');
      }

      setMessage({ type: 'success', text: 'Edit rejected.' });
      setSelectedGroup(null);
      setEditDetails(null);
      setCombinedDiff(null);
      fetchEdits();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to reject edit' });
    } finally {
      setProcessing(false);
    }
  };

  // Reject all edits in a group
  const handleRejectAll = async () => {
    if (!selectedGroup) return;

    setProcessing(true);
    setMessage(null);

    try {
      for (const edit of selectedGroup.edits) {
        const res = await fetch(`/api/edits/${edit.id}/reject`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ note: 'Rejected as part of batch rejection' }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `Failed to reject edit ${edit.id}`);
        }
      }

      setMessage({
        type: 'success',
        text: `All ${selectedGroup.edits.length} edit(s) rejected.`,
      });
      setSelectedGroup(null);
      setEditDetails(null);
      setCombinedDiff(null);
      fetchEdits();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to reject edits' });
      fetchEdits();
    } finally {
      setProcessing(false);
    }
  };

  // Enter edit mode for partial approval
  const handleEnterEditMode = async () => {
    if (!selectedGroup || !combinedDiff) return;

    // Use the final content from combined diff as starting point
    setEditableContent(combinedDiff.final);
    setOriginalContentForEdit(combinedDiff.original);
    setViewMode('edit');
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setViewMode('combined');
    setEditableContent('');
  };

  // Save partial approval - commit directly with modified content
  const handleSavePartialApproval = async () => {
    if (!selectedGroup || !editableContent) return;

    setProcessing(true);
    setMessage(null);

    const toastId = showToast('loading', 'Saving with modifications...', true);

    try {
      // Use the dedicated partial-approve endpoint
      const res = await fetch('/api/edits/partial-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: selectedGroup.filePath,
          modifiedContent: editableContent,
          editIds: selectedGroup.edits.map((e) => e.id),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save changes');
      }

      // Show sync status in toast
      if (data.sync?.success) {
        updateToast(toastId, 'success', 'Approved with edits & synced to ElevenLabs!');
      } else if (data.sync?.reason === 'not_found') {
        updateToast(toastId, 'warning', 'Approved! Note: Document not yet in ElevenLabs KB.');
      } else {
        updateToast(toastId, 'success', 'Changes committed with your modifications!');
      }

      setMessage({
        type: 'success',
        text: data.message || 'Changes committed with your modifications!',
      });
      setSelectedGroup(null);
      setEditDetails(null);
      setCombinedDiff(null);
      setEditableContent('');
      setViewMode('combined');
      fetchEdits();
    } catch (error: any) {
      updateToast(toastId, 'error', error.message || 'Failed to save changes');
      setMessage({ type: 'error', text: error.message || 'Failed to save changes' });
    } finally {
      setProcessing(false);
    }
  };

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
              <Clock size={18} /> Pending ({pendingEdits.length} edits in {fileGroups.length} files)
            </h2>
            {loading ? (
              <div className={styles.loading}>Loading...</div>
            ) : fileGroups.length === 0 ? (
              <div className={styles.empty}>No pending edits</div>
            ) : (
              <div className={styles.list}>
                {fileGroups.map((group) => (
                  <button
                    key={group.filePath}
                    className={`${styles.editItem} ${selectedGroup?.filePath === group.filePath ? styles.selected : ''}`}
                    onClick={() => fetchCombinedDiff(group)}
                  >
                    <div className={styles.editInfo}>
                      <span className={styles.fileName}>
                        {group.edits.length > 1 && (
                          <span className={styles.editCount}>
                            <Layers size={14} />
                            {group.edits.length}
                          </span>
                        )}
                        {group.fileName}
                      </span>
                      <span className={styles.meta}>
                        by {group.edits.map((e) => e.submittedBy).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
                        {' • '}
                        {new Date(group.firstEdit.submittedAt).toLocaleDateString()}
                        {group.edits.length > 1 && ` - ${new Date(group.lastEdit.submittedAt).toLocaleDateString()}`}
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
          ) : selectedGroup ? (
            <>
              <div className={styles.previewHeader}>
                <div>
                  <h3>{selectedGroup.fileName}</h3>
                  <span className={styles.previewMeta}>
                    {viewMode === 'edit' ? (
                      'Editing - Make your changes and save'
                    ) : (
                      <>
                        {selectedGroup.edits.length} pending edit{selectedGroup.edits.length !== 1 ? 's' : ''}
                        {' • '}
                        {selectedGroup.edits.map((e) => e.submittedBy).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
                      </>
                    )}
                  </span>
                </div>
                <div className={styles.previewActions}>
                  {viewMode === 'edit' ? (
                    // Edit mode actions
                    <>
                      <button
                        className="btn btn-secondary"
                        onClick={handleCancelEdit}
                        disabled={processing}
                      >
                        <X size={16} />
                        Cancel
                      </button>
                      <button
                        className="btn btn-success"
                        onClick={handleSavePartialApproval}
                        disabled={processing}
                      >
                        <Save size={16} />
                        {processing ? 'Saving...' : 'Save & Commit'}
                      </button>
                    </>
                  ) : selectedGroup.edits.length > 1 ? (
                    // Multiple edits actions
                    <>
                      <button
                        className="btn btn-danger"
                        onClick={handleRejectAll}
                        disabled={processing}
                      >
                        <XCircle size={16} />
                        Reject All
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={handleEnterEditMode}
                        disabled={processing || !combinedDiff}
                        title="Edit the suggested changes before approving"
                      >
                        <Edit3 size={16} />
                        Edit & Approve
                      </button>
                      <button
                        className="btn btn-success"
                        onClick={() => handleApproveAll()}
                        disabled={processing}
                      >
                        <CheckCircle size={16} />
                        {processing ? 'Processing...' : 'Approve All'}
                      </button>
                    </>
                  ) : (
                    // Single edit actions
                    <>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleReject(selectedGroup.edits[0].id)}
                        disabled={processing}
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={handleEnterEditMode}
                        disabled={processing || !combinedDiff}
                        title="Edit the suggested changes before approving"
                      >
                        <Edit3 size={16} />
                        Edit & Approve
                      </button>
                      <button
                        className="btn btn-success"
                        onClick={() => handleApprove(selectedGroup.edits[0].id)}
                        disabled={processing}
                      >
                        <CheckCircle size={16} />
                        {processing ? 'Processing...' : 'Approve & Commit'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* View mode tabs - hide when editing */}
              {viewMode !== 'edit' && selectedGroup.edits.length > 1 && (
                <div className={styles.viewTabs}>
                  <button
                    className={`${styles.viewTab} ${viewMode === 'combined' ? styles.active : ''}`}
                    onClick={() => {
                      setViewMode('combined');
                      fetchCombinedDiff(selectedGroup);
                    }}
                  >
                    <Layers size={14} />
                    Combined View
                  </button>
                  <button
                    className={`${styles.viewTab} ${viewMode === 'individual' ? styles.active : ''}`}
                    onClick={() => setViewMode('individual')}
                  >
                    <FileText size={14} />
                    Individual Edits ({selectedGroup.edits.length})
                  </button>
                </div>
              )}

              {/* Individual edit selector */}
              {viewMode === 'individual' && selectedGroup.edits.length > 1 && (
                <div className={styles.editSelector}>
                  {selectedGroup.edits.map((edit, index) => (
                    <button
                      key={edit.id}
                      className={`${styles.editSelectorItem} ${selectedEditId === edit.id ? styles.active : ''}`}
                      onClick={() => fetchEditDetails(edit.id)}
                    >
                      Edit {index + 1}
                      <span className={styles.editSelectorMeta}>
                        {edit.submittedBy} • {new Date(edit.submittedAt).toLocaleTimeString()}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Edit mode - inline editor */}
              {viewMode === 'edit' && (
                <div className={styles.editMode}>
                  <MarkdownEditor
                    value={editableContent}
                    onChange={setEditableContent}
                  />
                </div>
              )}

              {/* Diff viewer */}
              {viewMode === 'combined' && combinedDiff ? (
                <SimpleDiffViewer
                  original={combinedDiff.original}
                  modified={combinedDiff.final}
                  fileName={`${selectedGroup.fileName} (Combined: ${selectedGroup.edits.length} edits)`}
                />
              ) : viewMode === 'individual' && editDetails ? (
                <SimpleDiffViewer
                  original={editDetails.originalContent}
                  modified={editDetails.newContent}
                  fileName={editDetails.fileName}
                />
              ) : viewMode === 'individual' && !editDetails ? (
                <div className={styles.previewEmpty}>
                  <FileText size={48} />
                  <p>Select an individual edit to view</p>
                </div>
              ) : null}
            </>
          ) : (
            <div className={styles.previewEmpty}>
              <AlertCircle size={48} />
              <p>Select a file to review pending edits</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
