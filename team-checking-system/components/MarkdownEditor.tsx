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

  // Handle editor mount to disable keyboard shortcuts
  const handleEditorMount = useCallback((editor: any, monaco: any) => {
    // Disable many code-related keyboard shortcuts
    // These are the shortcuts that cause text to "jump around"

    // Disable Ctrl+D (add selection to next find match)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyD, () => {});

    // Disable Ctrl+Shift+K (delete line)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyK, () => {});

    // Disable Alt+Up/Down (move line up/down)
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.UpArrow, () => {});
    editor.addCommand(monaco.KeyMod.Alt | monaco.KeyCode.DownArrow, () => {});

    // Disable Shift+Alt+Up/Down (copy line up/down)
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.UpArrow, () => {});
    editor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.DownArrow, () => {});

    // Disable Ctrl+Shift+L (select all occurrences)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyL, () => {});

    // Disable Ctrl+L (select line)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyL, () => {});

    // Disable Ctrl+Shift+D (duplicate line)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyD, () => {});

    // Disable Ctrl+] and Ctrl+[ (indent/outdent)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.BracketRight, () => {});
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.BracketLeft, () => {});

    // Disable Ctrl+Enter (insert line below)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {});

    // Disable Ctrl+Shift+Enter (insert line above)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => {});
  }, []);

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
              language="plaintext"
              theme="vs-light"
              value={content}
              onChange={handleChange}
              onMount={handleEditorMount}
              options={{
                readOnly,
                minimap: { enabled: false },
                wordWrap: 'on',
                lineNumbers: 'on',
                fontSize: 14,
                scrollBeyondLastLine: false,
                padding: { top: 16 },

                // ===== DISABLE ALL AUTOCOMPLETE & SUGGESTIONS =====
                quickSuggestions: false,
                suggestOnTriggerCharacters: false,
                acceptSuggestionOnEnter: 'off',
                tabCompletion: 'off',
                wordBasedSuggestions: 'off',
                parameterHints: { enabled: false },
                suggest: {
                  showWords: false,
                  showSnippets: false,
                  showUsers: false,
                  showIssues: false,
                  showFunctions: false,
                  showClasses: false,
                  showModules: false,
                  showProperties: false,
                  showKeywords: false,
                  showVariables: false,
                  showValues: false,
                  showConstants: false,
                  showEnums: false,
                  showEnumMembers: false,
                  showOperators: false,
                  showReferences: false,
                },
                inlineSuggest: { enabled: false },

                // ===== DISABLE AUTO-CLOSING BRACKETS/QUOTES =====
                autoClosingBrackets: 'never',
                autoClosingQuotes: 'never',
                autoClosingDelete: 'never',
                autoClosingOvertype: 'never',
                autoSurround: 'never',

                // ===== DISABLE AUTO-INDENTATION =====
                autoIndent: 'none',
                formatOnPaste: false,
                formatOnType: false,

                // ===== DISABLE BRACKET MATCHING & HIGHLIGHTING =====
                matchBrackets: 'never',
                bracketPairColorization: { enabled: false },

                // ===== DISABLE CODE FOLDING =====
                folding: false,
                foldingStrategy: 'indentation',
                showFoldingControls: 'never',

                // ===== DISABLE MULTI-CURSOR FEATURES =====
                multiCursorModifier: 'alt',
                occurrencesHighlight: 'off',
                selectionHighlight: false,

                // ===== DISABLE OTHER CODE-RELATED FEATURES =====
                renderWhitespace: 'none',
                renderControlCharacters: false,
                renderLineHighlight: 'none',
                renderValidationDecorations: 'off',
                codeLens: false,
                lightbulb: { enabled: 'off' as const },
                hover: { enabled: false },
                links: true, // Keep links clickable
                colorDecorators: false,

                // ===== VISUAL SETTINGS FOR TEXT EDITOR FEEL =====
                lineDecorationsWidth: 0,
                lineNumbersMinChars: 3,
                glyphMargin: false,

                // ===== DISABLE SNIPPETS =====
                snippetSuggestions: 'none',

                // ===== DISABLE DRAG AND DROP =====
                dragAndDrop: false,

                // ===== SIMPLE CURSOR BEHAVIOR =====
                cursorBlinking: 'solid',
                cursorSmoothCaretAnimation: 'off',
                smoothScrolling: false,
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
