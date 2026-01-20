'use client';

import { useMemo, useRef, useState } from 'react';
import { diffLines, diffWords } from 'diff';
import { ChevronDown } from 'lucide-react';
import styles from './SimpleDiffViewer.module.css';

interface SimpleDiffViewerProps {
  original: string;
  modified: string;
  fileName: string;
}

interface ProcessedLine {
  content: string;
  type: 'unchanged' | 'removed' | 'added' | 'changed';
  lineNum: number;
  changeIndex?: number;
}

export default function SimpleDiffViewer({ original, modified, fileName }: SimpleDiffViewerProps) {
  const [currentChangeIndex, setCurrentChangeIndex] = useState(0);
  const originalPanelRef = useRef<HTMLDivElement>(null);
  const modifiedPanelRef = useRef<HTMLDivElement>(null);
  const originalLineRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const modifiedLineRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Get line-by-line diff to detect added/removed/changed lines
  const lineDiff = useMemo(() => diffLines(original, modified), [original, modified]);

  // Process diff to create side-by-side aligned view
  const { alignedLines, changePositions } = useMemo(() => {
    const aligned: Array<{ orig: ProcessedLine | null; mod: ProcessedLine | null; changeIndex?: number }> = [];
    const changes: Array<{ index: number; alignedIndex: number }> = [];

    let origLineNum = 1;
    let modLineNum = 1;
    let changeIdx = 0;

    lineDiff.forEach((part) => {
      const lines = part.value.split('\n').filter((l, i, arr) => i < arr.length - 1 || l !== '');

      if (!part.added && !part.removed) {
        // Unchanged lines - add to both sides
        lines.forEach((line) => {
          aligned.push({
            orig: { content: line, type: 'unchanged', lineNum: origLineNum++ },
            mod: { content: line, type: 'unchanged', lineNum: modLineNum++ },
          });
        });
      } else if (part.removed) {
        // Removed lines - only in original, null in modified
        const startAlignedIdx = aligned.length;
        lines.forEach((line, i) => {
          aligned.push({
            orig: { content: line, type: 'removed', lineNum: origLineNum++, changeIndex: changeIdx },
            mod: null, // Empty placeholder on modified side
            changeIndex: changeIdx,
          });
        });
        changes.push({ index: changeIdx, alignedIndex: startAlignedIdx });
        changeIdx++;
      } else if (part.added) {
        // Added lines - only in modified, null in original
        const startAlignedIdx = aligned.length;
        lines.forEach((line, i) => {
          aligned.push({
            orig: null, // Empty placeholder on original side
            mod: { content: line, type: 'added', lineNum: modLineNum++, changeIndex: changeIdx },
            changeIndex: changeIdx,
          });
        });
        changes.push({ index: changeIdx, alignedIndex: startAlignedIdx });
        changeIdx++;
      }
    });

    return {
      alignedLines: aligned,
      changePositions: changes,
    };
  }, [lineDiff]);

  const scrollToChange = (changeIndex: number) => {
    if (changeIndex < 0 || changeIndex >= changePositions.length) return;

    const change = changePositions[changeIndex];
    const alignedIdx = change.alignedIndex;

    // Get refs for this aligned line in both panels
    const origLineEl = originalLineRefs.current.get(alignedIdx);
    const modLineEl = modifiedLineRefs.current.get(alignedIdx);

    // Scroll both panels simultaneously
    if (origLineEl && originalPanelRef.current) {
      origLineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (modLineEl && modifiedPanelRef.current) {
      modLineEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    setCurrentChangeIndex(changeIndex);
  };

  const nextChange = () => {
    if (changePositions.length === 0) return;
    const nextIdx = (currentChangeIndex + 1) % changePositions.length;
    scrollToChange(nextIdx);
  };

  const prevChange = () => {
    if (changePositions.length === 0) return;
    const prevIdx = (currentChangeIndex - 1 + changePositions.length) % changePositions.length;
    scrollToChange(prevIdx);
  };

  // Store ref for a line
  const setOriginalRef = (alignedIdx: number, el: HTMLDivElement | null) => {
    if (el) {
      originalLineRefs.current.set(alignedIdx, el);
    }
  };

  const setModifiedRef = (alignedIdx: number, el: HTMLDivElement | null) => {
    if (el) {
      modifiedLineRefs.current.set(alignedIdx, el);
    }
  };

  return (
    <div className={styles.diffContainer}>
      <div className={styles.diffHeader}>
        <h4>Reviewing changes for: {fileName}</h4>
        {changePositions.length > 0 && (
          <div className={styles.changeNav}>
            <button className="btn btn-sm btn-secondary" onClick={prevChange}>
              ← Previous
            </button>
            <span className={styles.changeCounter}>
              Change {currentChangeIndex + 1} of {changePositions.length}
            </span>
            <button className="btn btn-sm btn-secondary" onClick={nextChange}>
              Next →
            </button>
            <button className="btn btn-sm btn-primary" onClick={() => scrollToChange(currentChangeIndex)}>
              <ChevronDown size={14} />
              Jump to Change
            </button>
          </div>
        )}
      </div>

      <div className={styles.sideBySide}>
        {/* Original Version */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>Original Version</div>
          <div className={styles.panelContent} ref={originalPanelRef}>
            <pre className={styles.pre}>
              {alignedLines.map((aligned, idx) => {
                const line = aligned.orig;
                const isChange = aligned.changeIndex !== undefined;

                if (!line) {
                  // Empty placeholder for added lines (they only exist in modified)
                  return (
                    <div
                      key={idx}
                      className={styles.lineEmpty}
                      ref={(el) => setOriginalRef(idx, el)}
                    >
                      {'\u00A0\n'}
                    </div>
                  );
                }

                return (
                  <div
                    key={idx}
                    className={
                      line.type === 'removed' ? styles.lineRemoved :
                      line.type === 'changed' ? styles.lineChanged :
                      styles.lineUnchanged
                    }
                    ref={(el) => setOriginalRef(idx, el)}
                  >
                    {line.content || '\u00A0'}
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
          <div className={styles.panelContent} ref={modifiedPanelRef}>
            <pre className={styles.pre}>
              {alignedLines.map((aligned, idx) => {
                const line = aligned.mod;
                const isChange = aligned.changeIndex !== undefined;

                if (!line) {
                  // Empty placeholder for removed lines (they only exist in original)
                  return (
                    <div
                      key={idx}
                      className={styles.lineEmpty}
                      ref={(el) => setModifiedRef(idx, el)}
                    >
                      {'\u00A0\n'}
                    </div>
                  );
                }

                return (
                  <div
                    key={idx}
                    className={
                      line.type === 'added' ? styles.lineAdded :
                      line.type === 'changed' ? styles.lineChanged :
                      styles.lineUnchanged
                    }
                    ref={(el) => setModifiedRef(idx, el)}
                  >
                    {line.content || '\u00A0'}
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
