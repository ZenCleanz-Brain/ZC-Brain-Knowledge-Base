'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Edit3, Save, X, AlertCircle, Clock, Info, Trash2, Search } from 'lucide-react';
import MarkdownViewer from '@/components/MarkdownViewer';
import MarkdownEditor from '@/components/MarkdownEditor';
import SearchSidebar from '@/components/SearchSidebar';
import MatchNavigator from '@/components/MatchNavigator';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { useFileTree } from '@/contexts/FileTreeContext';
import { useToast } from '@/components/Toast';
import styles from '../page.module.css';
import viewStyles from './page.module.css';

interface FileData {
  path: string;
  name: string;
  content: string;
  sha: string;
  originalGitHubContent?: string; // Original content from GitHub
  isShowingPendingContent?: boolean; // True if content includes pending edits
  hasPendingEdits?: boolean;
  pendingEditCount?: number;
  pendingEdits: Array<{
    id: string;
    submittedBy: string;
    submittedAt: string;
    isFirst?: boolean;
    isLast?: boolean;
  }>;
}

export default function FileViewPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshTree } = useFileTree();
  const { showToast, updateToast } = useToast();

  const [file, setFile] = useState<FileData | null>(null);
  const [fileLoading, setFileLoading] = useState(true);
  const [fileError, setFileError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Get search query from URL for match navigation
  const searchQuery = searchParams.get('q') || '';
  const [showMatchNavigator, setShowMatchNavigator] = useState(!!searchQuery);
  const [showDocumentSearch, setShowDocumentSearch] = useState(false);

  const filePath = Array.isArray(params.path)
    ? params.path.map(decodeURIComponent).join('/')
    : decodeURIComponent(params.path as string);

  const userRole = (session?.user as any)?.role || 'viewer';
  const canEdit = userRole === 'admin' || userRole === 'editor';

  // Show match navigator when search query is present
  useEffect(() => {
    if (searchQuery) {
      setShowMatchNavigator(true);
    }
  }, [searchQuery]);

  // Close match navigator and clear URL param
  const handleCloseMatchNavigator = useCallback(() => {
    setShowMatchNavigator(false);
    // Remove the q param from URL without navigation
    const url = new URL(window.location.href);
    url.searchParams.delete('q');
    window.history.replaceState({}, '', url.toString());
  }, []);

  // Close document search
  const handleCloseDocumentSearch = useCallback(() => {
    setShowDocumentSearch(false);
  }, []);

  // Fetch file content
  const fetchFile = useCallback(async () => {
    setFileLoading(true);
    setFileError(null);
    try {
      const res = await fetch(`/api/files/${encodeURIComponent(filePath)}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('File not found');
        }
        throw new Error('Failed to fetch file');
      }
      const data = await res.json();
      setFile(data);
      setEditContent(data.content);
    } catch (err: any) {
      setFileError(err.message || 'Failed to load file');
    } finally {
      setFileLoading(false);
    }
  }, [filePath]);

  // Fetch file when path changes
  useEffect(() => {
    fetchFile();
    setIsEditing(false);
  }, [filePath, fetchFile]);

  // Handle save
  const handleSave = async () => {
    if (!file || editContent === file.content) {
      setIsEditing(false);
      return;
    }

    setSaving(true);

    // Show loading toast
    const toastId = showToast('loading', 'Saving changes...', true);

    try {
      const res = await fetch(`/api/files/${encodeURIComponent(filePath)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: editContent,
          originalSha: file.sha,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save');
      }

      if (data.status === 'committed') {
        // Check ElevenLabs sync result
        if (data.sync?.success) {
          updateToast(toastId, 'success', 'Changes saved & synced to ElevenLabs!');
        } else if (data.sync?.reason === 'not_found') {
          updateToast(toastId, 'warning', 'Saved to GitHub. Note: Document not yet in ElevenLabs KB.');
        } else if (data.sync?.reason === 'skipped') {
          updateToast(toastId, 'success', 'Changes committed to GitHub.');
        } else {
          updateToast(toastId, 'warning', 'Saved to GitHub. ElevenLabs sync issue - check console.');
        }
        fetchFile(); // Refresh to get new SHA
      } else if (data.status === 'pending') {
        updateToast(toastId, 'success', 'Edit submitted for admin review!');
      }

      setIsEditing(false);
    } catch (err: any) {
      updateToast(toastId, 'error', err.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(file?.content || '');
    setIsEditing(false);
  };

  // Handle file deletion (admin only)
  const handleDelete = async () => {
    if (!file) return;

    setIsDeleting(true);
    const toastId = showToast('loading', 'Deleting file...', true);

    try {
      const res = await fetch(`/api/files/${encodeURIComponent(filePath)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sha: file.sha,
          confirmationText: `DELETE ${file.name}`,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete file');
      }

      updateToast(toastId, 'success', `File "${file.name}" has been permanently deleted`);
      setShowDeleteModal(false);

      // Refresh the file tree and navigate to browse
      await refreshTree();
      router.push('/browse');
    } catch (err: any) {
      updateToast(toastId, 'error', err.message || 'Failed to delete file');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={styles.container}>
      <SearchSidebar currentPath={filePath} />

      <main className={styles.main}>
        {fileLoading ? (
          <div className={viewStyles.loading}>Loading file...</div>
        ) : fileError ? (
          <div className={viewStyles.error}>
            <AlertCircle size={48} />
            <h2>Error</h2>
            <p>{fileError}</p>
            <button className="btn btn-primary" onClick={() => router.push('/browse')}>
              Back to Browse
            </button>
          </div>
        ) : file ? (
          <div className={viewStyles.fileView}>
            {/* Pending edits warning banner for editors */}
            {file.isShowingPendingContent && file.hasPendingEdits && userRole !== 'admin' && (
              <div className={viewStyles.pendingBanner}>
                <div className={viewStyles.pendingBannerIcon}>
                  <Clock size={20} />
                </div>
                <div className={viewStyles.pendingBannerContent}>
                  <strong>You have {file.pendingEditCount} pending edit{file.pendingEditCount !== 1 ? 's' : ''} awaiting approval</strong>
                  <p>
                    You&apos;re viewing your latest submitted changes. Any new edits will build on top of these pending changes.
                    Once approved by an admin, all changes will be committed together.
                  </p>
                </div>
              </div>
            )}

            {/* Info banner for admins viewing file with pending edits */}
            {file.hasPendingEdits && userRole === 'admin' && (
              <div className={viewStyles.infoBanner}>
                <div className={viewStyles.infoBannerIcon}>
                  <Info size={20} />
                </div>
                <div className={viewStyles.infoBannerContent}>
                  <strong>This file has {file.pendingEditCount} pending edit{file.pendingEditCount !== 1 ? 's' : ''}</strong>
                  <p>
                    You&apos;re viewing the original GitHub content.
                    <a href="/pending" className={viewStyles.pendingLink}> Go to Pending Reviews</a> to approve or reject changes.
                  </p>
                </div>
              </div>
            )}

            <div className={viewStyles.fileHeader}>
              <div className={viewStyles.fileInfo}>
                <h1>{file.name.replace(/\.md$/, '')}</h1>
                <span className={viewStyles.filePath}>{file.path}</span>
              </div>

              <div className={viewStyles.actions}>
                {file.pendingEdits.length > 0 && (
                  <span className="badge badge-pending">
                    {file.pendingEdits.length} pending edit(s)
                  </span>
                )}

                {/* Search in document button */}
                {!isEditing && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowDocumentSearch(true)}
                    title="Search in this document (Ctrl+F)"
                  >
                    <Search size={16} />
                    Find
                  </button>
                )}

                {canEdit && !isEditing && (
                  <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                    <Edit3 size={16} />
                    Edit
                  </button>
                )}

                {isEditing && (
                  <>
                    {/* Delete button - admin only, subtle styling */}
                    {userRole === 'admin' && (
                      <button
                        className={viewStyles.deleteBtn}
                        onClick={() => setShowDeleteModal(true)}
                        disabled={saving}
                        title="Delete this file permanently"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <button
                      className="btn btn-secondary"
                      onClick={handleCancelEdit}
                      disabled={saving}
                    >
                      <X size={16} />
                      Cancel
                    </button>
                    <button
                      className="btn btn-success"
                      onClick={handleSave}
                      disabled={saving || editContent === file.content}
                    >
                      <Save size={16} />
                      {saving ? 'Saving...' : userRole === 'admin' ? 'Save & Commit' : 'Submit for Review'}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className={viewStyles.fileContent}>
              {isEditing ? (
                <div className={viewStyles.editorWrapper}>
                  <MarkdownEditor
                    value={editContent}
                    onChange={setEditContent}
                  />
                </div>
              ) : (
                <div>
                  <MarkdownViewer content={file.content} />
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>

      {/* Match Navigator for sidebar search results */}
      {showMatchNavigator && searchQuery && !isEditing && !showDocumentSearch && (
        <MatchNavigator
          searchQuery={searchQuery}
          onClose={handleCloseMatchNavigator}
        />
      )}

      {/* Match Navigator for in-document search */}
      {showDocumentSearch && !isEditing && (
        <MatchNavigator
          allowInput
          onClose={handleCloseDocumentSearch}
        />
      )}

      {/* Delete confirmation modal */}
      {file && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          fileName={file.name}
          filePath={file.path}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
