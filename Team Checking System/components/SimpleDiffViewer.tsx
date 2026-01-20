'use client';

import { useMemo } from 'react';
import { diffWords } from 'diff';
import styles from './SimpleDiffViewer.module.css';

interface SimpleDiffViewerProps {
  original: string;
  modified: string;
  fileName: string;
}

export default function SimpleDiffViewer({ original, modified, fileName }: SimpleDiffViewerProps) {
  // Split into lines for line-by-line comparison
  const originalLines = original.split('\n');
  const modifiedLines = modified.split('\n');

  return (
    <div className={styles.diffContainer}>
      <div className={styles.diffHeader}>
        <h4>Reviewing changes for: {fileName}</h4>
      </div>

      <div className={styles.sideBySide}>
        {/* Original Version */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>Original Version</div>
          <div className={styles.panelContent}>
            <pre className={styles.pre}>
              {originalLines.map((line, idx) => {
                // Find corresponding line in modified
                const modLine = modifiedLines[idx];
                const hasChanges = modLine !== undefined && line !== modLine;

                if (hasChanges) {
                  // Show word-level diff for changed lines
                  const diff = diffWords(line, modLine);
                  return (
                    <div key={idx} className={styles.lineChanged}>
                      {diff.map((part, partIdx) => {
                        if (part.removed) {
                          return (
                            <span key={partIdx} className={styles.removed}>
                              {part.value}
                            </span>
                          );
                        }
                        if (!part.added) {
                          return <span key={partIdx}>{part.value}</span>;
                        }
                        return null;
                      })}
                      {'\n'}
                    </div>
                  );
                }

                return (
                  <div key={idx} className={styles.lineUnchanged}>
                    {line}
                    {'\n'}
                  </div>
                );
              })}
            </pre>
          </div>
        </div>

        {/* New Version */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>New Version (Suggested)</div>
          <div className={styles.panelContent}>
            <pre className={styles.pre}>
              {modifiedLines.map((line, idx) => {
                // Find corresponding line in original
                const origLine = originalLines[idx];
                const hasChanges = origLine !== undefined && line !== origLine;

                if (hasChanges) {
                  // Show word-level diff for changed lines
                  const diff = diffWords(origLine, line);
                  return (
                    <div key={idx} className={styles.lineChanged}>
                      {diff.map((part, partIdx) => {
                        if (part.added) {
                          return (
                            <span key={partIdx} className={styles.added}>
                              {part.value}
                            </span>
                          );
                        }
                        if (!part.removed) {
                          return <span key={partIdx}>{part.value}</span>;
                        }
                        return null;
                      })}
                      {'\n'}
                    </div>
                  );
                }

                return (
                  <div key={idx} className={styles.lineUnchanged}>
                    {line}
                    {'\n'}
                  </div>
                );
              })}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
