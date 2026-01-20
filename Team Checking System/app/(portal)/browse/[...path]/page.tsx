'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { Search, RefreshCw, Edit3, Save, X, AlertCircle } from 'lucide-react';
import FileTree from '@/components/FileTree';
import MarkdownViewer from '@/components/MarkdownViewer';
import MarkdownEditor from '@/components/MarkdownEditor';
import ResizableSidebar from '@/components/ResizableSidebar';
import { useFileTree } from '@/contexts/FileTreeContext';
import styles from '../page.module.css';
import viewStyles from './page.module.css';

interface FileData {
  path: string;
  name: string;
  content: string;
  sha: string;
  pendingEdits: Array<{
    id: string;
    submittedBy: string;
    submittedAt: string;
  }>;
}

export default function FileViewPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const { tree, loading: treeLoading, refreshTree } = useFileTree();

  const [searchTerm, setSearchTerm] = useState('');

  const [file, setFile] = useState<FileData | null>(null);
  const [fileLoading, setFileLoading] = useState(true);
  const [fileError, setFileError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const filePath = Array.isArray(params.path)
    ? params.path.map(decodeURIComponent).join('/')
    : decodeURIComponent(params.path as string);

  const userRole = (session?.user as any)?.role || 'viewer';
  const canEdit = userRole === 'admin' || userRole === 'editor';

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
    setSaveMessage(null);
  }, [filePath, fetchFile]);

  // Filter tree
  function filterTree(nodes: any[], term: string): any[] {
    if (!term) return nodes;
    const lowerTerm = term.toLowerCase();
    return nodes
      .map((node) => {
        if (node.type === 'file') {
          return node.name.toLowerCase().includes(lowerTerm) ? node : null;
        }
        const filteredChildren = filterTree(node.children || [], term);
        return filteredChildren.length > 0 ? { ...node, children: filteredChildren } : null;
      })
      .filter(Boolean) as any[];
  }

  const filteredTree = filterTree(tree, searchTerm);

  // Handle save
  const handleSave = async () => {
    if (!file || editContent === file.content) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    setSaveMessage(null);

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
        setSaveMessage({ type: 'success', text: data.message || 'Changes committed successfully!' });
        fetchFile(); // Refresh to get new SHA
      } else if (data.status === 'pending') {
        setSaveMessage({
          type: 'success',
          text: userRole === 'admin'
            ? 'Saved to pending review (GitHub write access not available)'
            : 'Edit submitted for admin review'
        });
      }

      setIsEditing(false);
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err.message || 'Failed to save changes' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(file?.content || '');
    setIsEditing(false);
    setSaveMessage(null);
  };

  return (
    <div className={styles.container}>
      <ResizableSidebar>
        <div className={styles.sidebarHeader}>
          <h2>Knowledge Base</h2>
          <button
            className={styles.refreshBtn}
            onClick={refreshTree}
            disabled={treeLoading}
            title="Refresh files"
          >
            <RefreshCw size={16} className={treeLoading ? styles.spinning : ''} />
          </button>
        </div>

        <div className={styles.searchBox}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search files..."
            className="input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {treeLoading ? (
          <div className={styles.loading}>Loading files...</div>
        ) : filteredTree.length === 0 ? (
          <div className={styles.empty}>
            {searchTerm ? 'No files match your search' : 'No files found'}
          </div>
        ) : (
          <FileTree nodes={filteredTree} currentPath={filePath} />
        )}
      </ResizableSidebar>

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
            <div className={viewStyles.fileHeader}>
              <div className={viewStyles.fileInfo}>
                <h1>{file.name.replace(/\.md$/, '')}</h1>
                <span className={viewStyles.filePath}>{file.path}</span>
              </div>

              <div className={viewStyles.actions}>
                {saveMessage && (
                  <div className={`${viewStyles.message} ${viewStyles[saveMessage.type]}`}>
                    {saveMessage.text}
                  </div>
                )}

                {file.pendingEdits.length > 0 && (
                  <span className="badge badge-pending">
                    {file.pendingEdits.length} pending edit(s)
                  </span>
                )}

                {canEdit && !isEditing && (
                  <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                    <Edit3 size={16} />
                    Edit
                  </button>
                )}

                {isEditing && (
                  <>
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
    </div>
  );
}
