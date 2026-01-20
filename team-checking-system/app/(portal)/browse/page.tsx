'use client';

import { useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import FileTree from '@/components/FileTree';
import ResizableSidebar from '@/components/ResizableSidebar';
import { useFileTree } from '@/contexts/FileTreeContext';
import styles from './page.module.css';

export default function BrowsePage() {
  const { tree, loading, refreshTree } = useFileTree();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter tree based on search term
  function filterTree(nodes: any[], term: string): any[] {
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
      .filter(Boolean) as any[];
  }

  const filteredTree = filterTree(tree, searchTerm);

  return (
    <div className={styles.container}>
      <ResizableSidebar>
        <div className={styles.sidebarHeader}>
          <h2>Knowledge Base</h2>
          <button
            className={styles.refreshBtn}
            onClick={refreshTree}
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

        {loading ? (
          <div className={styles.loading}>Loading files...</div>
        ) : filteredTree.length === 0 ? (
          <div className={styles.empty}>
            {searchTerm ? 'No files match your search' : 'No files found'}
          </div>
        ) : (
          <FileTree nodes={filteredTree} />
        )}
      </ResizableSidebar>

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
