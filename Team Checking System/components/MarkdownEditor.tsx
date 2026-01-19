'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import MarkdownViewer from './MarkdownViewer';
import { Eye, Code, Columns } from 'lucide-react';
import styles from './MarkdownEditor.module.css';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface MarkdownEditorProps {
  value: string;
  onChange: (content: string) => void;
  readOnly?: boolean;
}

type ViewMode = 'edit' | 'preview' | 'split';

export default function MarkdownEditor({ value, onChange, readOnly = false }: MarkdownEditorProps) {
  const [content, setContent] = useState(value);
  const [viewMode, setViewMode] = useState<ViewMode>('split');

  const handleChange = useCallback((value: string | undefined) => {
    const newContent = value || '';
    setContent(newContent);
    onChange(newContent);
  }, [onChange]);

  return (
    <div className={styles.editor}>
      <div className={styles.toolbar}>
        <div className={styles.viewModes}>
          <button
            className={`${styles.modeBtn} ${viewMode === 'edit' ? styles.active : ''}`}
            onClick={() => setViewMode('edit')}
            title="Edit only"
          >
            <Code size={16} />
            <span>Edit</span>
          </button>
          <button
            className={`${styles.modeBtn} ${viewMode === 'split' ? styles.active : ''}`}
            onClick={() => setViewMode('split')}
            title="Split view"
          >
            <Columns size={16} />
            <span>Split</span>
          </button>
          <button
            className={`${styles.modeBtn} ${viewMode === 'preview' ? styles.active : ''}`}
            onClick={() => setViewMode('preview')}
            title="Preview only"
          >
            <Eye size={16} />
            <span>Preview</span>
          </button>
        </div>
      </div>

      <div className={`${styles.content} ${styles[viewMode]}`}>
        {(viewMode === 'edit' || viewMode === 'split') && (
          <div className={styles.editorPane}>
            <MonacoEditor
              height="100%"
              language="markdown"
              theme="vs-light"
              value={content}
              onChange={handleChange}
              options={{
                readOnly,
                minimap: { enabled: false },
                wordWrap: 'on',
                lineNumbers: 'on',
                fontSize: 14,
                scrollBeyondLastLine: false,
                padding: { top: 16 },
              }}
            />
          </div>
        )}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={styles.previewPane}>
            <MarkdownViewer content={content} />
          </div>
        )}
      </div>
    </div>
  );
}
