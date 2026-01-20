'use client';

import { useState, useMemo } from 'react';
import { diffLines, Change } from 'diff';
import { ChevronDown, ChevronUp } from 'lucide-react';
import styles from './DiffViewer.module.css';

interface DiffViewerProps {
  original: string;
  modified: string;
  fileName: string;
}

interface DiffBlock {
  type: 'unchanged' | 'changed';
  changes: Change[];
  startLine: number;
  endLine: number;
}

export default function DiffViewer({ original, modified, fileName }: DiffViewerProps) {
  const [expandedBlocks, setExpandedBlocks] = useState<Set<number>>(new Set());
  const [showFullDocument, setShowFullDocument] = useState(false);

  const diff = useMemo(() => diffLines(original, modified), [original, modified]);

  // Group changes into blocks (changed sections with context)
  const blocks = useMemo(() => {
    const blocks: DiffBlock[] = [];
    let currentBlock: DiffBlock | null = null;
    let lineNumber = 0;

    diff.forEach((change, idx) => {
      const lineCount = change.count || 0;

      if (change.added || change.removed) {
        // Start a new changed block
        if (!currentBlock || currentBlock.type === 'unchanged') {
          currentBlock = {
            type: 'changed',
            changes: [],
            startLine: lineNumber,
            endLine: lineNumber + lineCount,
          };
          blocks.push(currentBlock);
        }
        currentBlock.changes.push(change);
        currentBlock.endLine = lineNumber + lineCount;
      } else {
        // Unchanged section
        if (currentBlock && currentBlock.type === 'changed') {
          // Add a bit of context (3 lines) after a change
          const contextLines = Math.min(3, lineCount);
          currentBlock.changes.push({
            ...change,
            count: contextLines,
            value: change.value.split('\n').slice(0, contextLines + 1).join('\n'),
          });
          currentBlock.endLine += contextLines;
        }

        // Create unchanged block for potential expansion
        if (lineCount > 6 && blocks.length > 0) {
          // Skip middle content, only show context around changes
          const startContext = change.value.split('\n').slice(0, 4).join('\n');
          const endContext = change.value.split('\n').slice(-4).join('\n');

          blocks.push({
            type: 'unchanged',
            changes: [{ ...change, value: startContext, count: 3 }],
            startLine: lineNumber,
            endLine: lineNumber + 3,
          });

          blocks.push({
            type: 'unchanged',
            changes: [{ ...change, value: endContext, count: 3 }],
            startLine: lineNumber + lineCount - 3,
            endLine: lineNumber + lineCount,
          });
        }

        currentBlock = null;
      }

      if (!change.added) {
        lineNumber += lineCount;
      }
    });

    return blocks;
  }, [diff]);

  const toggleBlock = (index: number) => {
    setExpandedBlocks((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  if (showFullDocument) {
    return (
      <div className={styles.fullView}>
        <div className={styles.fullViewHeader}>
          <button className="btn btn-secondary" onClick={() => setShowFullDocument(false)}>
            <ChevronUp size={16} />
            Show Changes Only
          </button>
        </div>
        <div className={styles.fullViewContent}>
          <div className={styles.fullPanel}>
            <h4>Original</h4>
            <pre>{original}</pre>
          </div>
          <div className={styles.fullPanel}>
            <h4>New Version</h4>
            <pre>{modified}</pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.diffContainer}>
      <div className={styles.diffHeader}>
        <h4>Changes in {fileName}</h4>
        <button className="btn btn-secondary btn-sm" onClick={() => setShowFullDocument(true)}>
          <ChevronDown size={16} />
          Show Full Document
        </button>
      </div>

      <div className={styles.diffContent}>
        {blocks.map((block, blockIdx) => (
          <div key={blockIdx} className={styles.diffBlock}>
            {block.type === 'changed' ? (
              <div className={styles.changeBlock}>
                {block.changes.map((change, idx) => {
                  if (change.removed) {
                    return (
                      <div key={idx} className={styles.removed}>
                        {change.value.split('\n').map((line, lineIdx) =>
                          line ? <div key={lineIdx} className={styles.line}>- {line}</div> : null
                        )}
                      </div>
                    );
                  }
                  if (change.added) {
                    return (
                      <div key={idx} className={styles.added}>
                        {change.value.split('\n').map((line, lineIdx) =>
                          line ? <div key={lineIdx} className={styles.line}>+ {line}</div> : null
                        )}
                      </div>
                    );
                  }
                  // Context lines
                  return (
                    <div key={idx} className={styles.context}>
                      {change.value.split('\n').map((line, lineIdx) =>
                        line ? <div key={lineIdx} className={styles.line}>&nbsp; {line}</div> : null
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <button
                className={styles.expandButton}
                onClick={() => toggleBlock(blockIdx)}
              >
                {expandedBlocks.has(blockIdx) ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown size={14} />
                )}
                <span>
                  {expandedBlocks.has(blockIdx)
                    ? 'Hide unchanged lines'
                    : `Show ${block.endLine - block.startLine} unchanged lines`}
                </span>
              </button>
            )}
          </div>
        ))}

        {blocks.length === 0 && (
          <div className={styles.noChanges}>No changes detected</div>
        )}
      </div>
    </div>
  );
}
