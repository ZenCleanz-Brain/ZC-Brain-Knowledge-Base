'use client';

import { useEffect, useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import FileTree, { TreeNode } from '@/components/FileTree';
import styles from './page.module.css';

export default function BrowsePage() {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function fetchFiles() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/files');
      if (!res.ok) throw new Error('Failed to fetch files');
      const data = await res.json();
      setTree(data.tree || []);
    } catch (err) {
      setError('Failed to load files. Please try again.');
      console.error('Error fetching files:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFiles();
  }, []);

  // Filter tree based on search term
  function filterTree(nodes: TreeNode[], term: string): TreeNode[] {
    if (!term) return nodes;

    const lowerTerm = term.toLowerCase();

    return nodes
      .map((node) => {
        if (node.type === 'file') {
          if (node.name.toLowerCase().includes(lowerTerm)) {
            return node;
          }
          return null;
        }

        // For directories, recursively filter children
        const filteredChildren = filterTree(node.children || [], term);
        if (filteredChildren.length > 0) {
          return { ...node, children: filteredChildren };
        }

        return null;
      })
      .filter(Boolean) as TreeNode[];
  }

  const filteredTree = filterTree(tree, searchTerm);

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h2>Knowledge Base</h2>
          <button
            className={styles.refreshBtn}
            onClick={fetchFiles}
            disabled={loading}
            title="Refresh files"
          >
            <RefreshCw size={16} className={loading ? styles.spinning : ''} />
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

        {error ? (
          <div className={styles.error}>{error}</div>
        ) : loading ? (
          <div className={styles.loading}>Loading files...</div>
        ) : filteredTree.length === 0 ? (
          <div className={styles.empty}>
            {searchTerm ? 'No files match your search' : 'No files found'}
          </div>
        ) : (
          <FileTree nodes={filteredTree} />
        )}
      </aside>

      <main className={styles.main}>
        <div className={styles.placeholder}>
          <div className={styles.placeholderContent}>
            <h2>Select a file to view</h2>
            <p>Choose a document from the sidebar to view or edit its contents.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
