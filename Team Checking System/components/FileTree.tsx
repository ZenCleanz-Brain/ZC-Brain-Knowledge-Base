'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ChevronDown, Folder, FolderOpen, FileText } from 'lucide-react';
import styles from './FileTree.module.css';

export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'dir';
  children?: TreeNode[];
}

interface FileTreeProps {
  nodes: TreeNode[];
  currentPath?: string;
}

interface TreeItemProps {
  node: TreeNode;
  level: number;
  currentPath?: string;
}

function TreeItem({ node, level, currentPath }: TreeItemProps) {
  const storageKey = `folder-state-${node.path}`;

  // Initialize state from localStorage, default to false (collapsed)
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem(storageKey);
    return saved === 'true';
  });

  const isActive = currentPath === node.path;
  const hasChildren = node.children && node.children.length > 0;

  const toggleOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newState = !isOpen;
    setIsOpen(newState);
    // Persist the state to localStorage
    localStorage.setItem(storageKey, String(newState));
  };

  if (node.type === 'dir') {
    return (
      <div className={styles.treeItem}>
        <div
          className={`${styles.itemRow} ${styles.folder}`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={toggleOpen}
        >
          <span className={styles.toggle}>
            {hasChildren ? (
              isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
            ) : (
              <span style={{ width: 16 }} />
            )}
          </span>
          {isOpen ? <FolderOpen size={16} className={styles.icon} /> : <Folder size={16} className={styles.icon} />}
          <span className={styles.name}>{node.name}</span>
          {hasChildren && <span className={styles.count}>{node.children!.length}</span>}
        </div>
        {isOpen && hasChildren && (
          <div className={styles.children}>
            {node.children!.map((child) => (
              <TreeItem key={child.path} node={child} level={level + 1} currentPath={currentPath} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={`/browse/${encodeURIComponent(node.path)}`}
      className={`${styles.itemRow} ${styles.file} ${isActive ? styles.active : ''}`}
      style={{ paddingLeft: `${level * 16 + 8}px` }}
    >
      <span className={styles.toggle} style={{ width: 16 }} />
      <FileText size={16} className={styles.icon} />
      <span className={styles.name}>{node.name.replace(/\.md$/, '')}</span>
    </Link>
  );
}

export default function FileTree({ nodes, currentPath }: FileTreeProps) {
  return (
    <nav className={styles.tree}>
      {nodes.map((node) => (
        <TreeItem key={node.path} node={node} level={0} currentPath={currentPath} />
      ))}
    </nav>
  );
}
