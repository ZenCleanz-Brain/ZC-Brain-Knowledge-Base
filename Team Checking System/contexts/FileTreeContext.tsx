'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: TreeNode[];
}

interface FileTreeContextType {
  tree: TreeNode[];
  loading: boolean;
  fetchTree: () => Promise<void>;
  refreshTree: () => Promise<void>;
}

const FileTreeContext = createContext<FileTreeContextType | undefined>(undefined);

export function FileTreeProvider({ children }: { children: ReactNode }) {
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchTree = async () => {
    // Only fetch if we haven't loaded yet
    if (hasLoaded) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/files');
      if (!res.ok) throw new Error('Failed to fetch files');
      const data = await res.json();
      setTree(data.tree || []);
      setHasLoaded(true);
    } catch (err) {
      console.error('Error fetching files:', err);
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh function (for refresh button)
  const refreshTree = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/files');
      if (!res.ok) throw new Error('Failed to fetch files');
      const data = await res.json();
      setTree(data.tree || []);
    } catch (err) {
      console.error('Error fetching files:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load tree once on mount
  useEffect(() => {
    fetchTree();
  }, []); // Only run once

  return (
    <FileTreeContext.Provider value={{ tree, loading, fetchTree, refreshTree }}>
      {children}
    </FileTreeContext.Provider>
  );
}

export function useFileTree() {
  const context = useContext(FileTreeContext);
  if (context === undefined) {
    throw new Error('useFileTree must be used within a FileTreeProvider');
  }
  return context;
}
