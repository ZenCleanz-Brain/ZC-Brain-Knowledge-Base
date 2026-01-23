'use client';

import { useState, useCallback, useRef } from 'react';
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
  // Use ref to store editor instance - this prevents React re-renders from affecting Monaco
  const editorRef = useRef<any>(null);

  // Track content for preview pane only - NOT for controlling Monaco
  const [previewContent, setPreviewContent] = useState(value);
  const [viewMode, setViewMode] = useState<ViewMode>('split');

  // Debounce preview updates to prevent lag while typing
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = useCallback((newValue: string | undefined) => {
    const newContent = newValue || '';

    // Always notify parent immediately (for save functionality)
    onChange(newContent);

    // Debounce preview updates to prevent performance issues
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    updateTimeoutRef.current = setTimeout(() => {
      setPreviewContent(newContent);
    }, 150); // Update preview after 150ms of no typing
  }, [onChange]);

  // Handle editor mount to disable ALL code editor features
  // Goal: Make this behave like a simple text editor (Notepad-like)
  const handleEditorMount = useCallback((editor: any, monaco: any) => {
    // Store editor reference
    editorRef.current = editor;

    // Get all editor actions and disable most of them
    const actionsToKeep = [
      'editor.action.clipboardCopyAction',
      'editor.action.clipboardCutAction',
      'editor.action.clipboardPasteAction',
      'editor.action.selectAll',
      'undo',
      'redo',
    ];

    // Disable all actions except basic text editing
    const allActions = editor.getSupportedActions();
    allActions.forEach((action: any) => {
      if (!actionsToKeep.includes(action.id)) {
        // Override the action to do nothing
        editor.addCommand(0, () => {}, action.id);
      }
    });

    // Explicitly disable problematic keyboard shortcuts that cause jumping
    const { KeyMod, KeyCode } = monaco;

    // Navigation shortcuts that cause jumping
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyG, () => {}); // Go to line
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyP, () => {}); // Quick open
    editor.addCommand(KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyO, () => {}); // Go to symbol
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyD, () => {}); // Add selection to next find match
    editor.addCommand(KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyL, () => {}); // Select all occurrences
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyL, () => {}); // Select line
    editor.addCommand(KeyCode.F12, () => {}); // Go to definition
    editor.addCommand(KeyMod.Alt | KeyCode.F12, () => {}); // Peek definition
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.F12, () => {}); // Go to implementation
    editor.addCommand(KeyMod.Shift | KeyCode.F12, () => {}); // Go to references
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyK, () => {}); // Various K-combos
    editor.addCommand(KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyK, () => {}); // Delete line

    // Line manipulation shortcuts
    editor.addCommand(KeyMod.Alt | KeyCode.UpArrow, () => {}); // Move line up
    editor.addCommand(KeyMod.Alt | KeyCode.DownArrow, () => {}); // Move line down
    editor.addCommand(KeyMod.Shift | KeyMod.Alt | KeyCode.UpArrow, () => {}); // Copy line up
    editor.addCommand(KeyMod.Shift | KeyMod.Alt | KeyCode.DownArrow, () => {}); // Copy line down
    editor.addCommand(KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyD, () => {}); // Duplicate line
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.BracketRight, () => {}); // Indent
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.BracketLeft, () => {}); // Outdent
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.Enter, () => {}); // Insert line below
    editor.addCommand(KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.Enter, () => {}); // Insert line above

    // Multi-cursor shortcuts
    editor.addCommand(KeyMod.CtrlCmd | KeyMod.Alt | KeyCode.UpArrow, () => {}); // Add cursor above
    editor.addCommand(KeyMod.CtrlCmd | KeyMod.Alt | KeyCode.DownArrow, () => {}); // Add cursor below
    editor.addCommand(KeyMod.Alt | KeyCode.Click, () => {}); // Add cursor at click

    // Code folding shortcuts
    editor.addCommand(KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.BracketLeft, () => {}); // Fold
    editor.addCommand(KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.BracketRight, () => {}); // Unfold
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyK | KeyCode.Digit0, () => {}); // Fold all

    // Disable command palette
    editor.addCommand(KeyCode.F1, () => {}); // Command palette
    editor.addCommand(KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyP, () => {}); // Command palette

    // Disable find/replace (these can cause jumps)
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyF, () => {}); // Find
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyH, () => {}); // Replace
    editor.addCommand(KeyCode.F3, () => {}); // Find next
    editor.addCommand(KeyMod.Shift | KeyCode.F3, () => {}); // Find previous
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyG, () => {}); // Go to line

    // Disable suggestions/autocomplete triggers
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.Space, () => {}); // Trigger suggest
    editor.addCommand(KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.Space, () => {}); // Trigger parameter hints
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
              defaultValue={value}
              onChange={handleChange}
              onMount={handleEditorMount}
              options={{
                // ===== BASIC TEXT EDITOR SETTINGS =====
                readOnly,
                wordWrap: 'on',
                lineNumbers: 'on',
                fontSize: 14,
                scrollBeyondLastLine: false,
                padding: { top: 16 },

                // ===== DISABLE ALL UI PANELS =====
                minimap: { enabled: false },
                contextmenu: false, // Disable right-click context menu completely

                // ===== DISABLE FIND/SEARCH WIDGET =====
                find: {
                  addExtraSpaceOnTop: false,
                  autoFindInSelection: 'never',
                  seedSearchStringFromSelection: 'never',
                },

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
                  filterGraceful: false,
                  snippetsPreventQuickSuggestions: true,
                },
                inlineSuggest: { enabled: false },
                snippetSuggestions: 'none',

                // ===== DISABLE AUTO-CLOSING & AUTO-TYPING =====
                autoClosingBrackets: 'never',
                autoClosingQuotes: 'never',
                autoClosingDelete: 'never',
                autoClosingOvertype: 'never',
                autoSurround: 'never',
                autoIndent: 'none',
                formatOnPaste: false,
                formatOnType: false,

                // ===== DISABLE ALL CODE INTELLIGENCE =====
                matchBrackets: 'never',
                bracketPairColorization: { enabled: false },
                folding: false,
                showFoldingControls: 'never',
                codeLens: false,
                hover: { enabled: false },
                links: false, // Disable clickable links (can cause jumps)
                colorDecorators: false,
                semanticHighlighting: { enabled: false },
                'semanticHighlighting.enabled': false,

                // ===== DISABLE HIGHLIGHTING & DECORATIONS =====
                occurrencesHighlight: 'off',
                selectionHighlight: false,
                renderWhitespace: 'none',
                renderControlCharacters: false,
                renderLineHighlight: 'none',
                renderValidationDecorations: 'off',

                // ===== DISABLE MULTI-CURSOR =====
                multiCursorModifier: 'ctrlCmd', // Make it harder to trigger
                multiCursorMergeOverlapping: true,

                // ===== DISABLE DRAG AND DROP =====
                dragAndDrop: false,
                dropIntoEditor: { enabled: false },

                // ===== DISABLE STICKY SCROLL (code navigation feature) =====
                stickyScroll: { enabled: false },

                // ===== DISABLE INLAY HINTS =====
                inlayHints: { enabled: 'off' },

                // ===== VISUAL SIMPLIFICATION =====
                lineDecorationsWidth: 0,
                lineNumbersMinChars: 3,
                glyphMargin: false,
                overviewRulerBorder: false,
                overviewRulerLanes: 0,
                hideCursorInOverviewRuler: true,

                // ===== SIMPLE CURSOR BEHAVIOR =====
                cursorBlinking: 'solid',
                cursorSmoothCaretAnimation: 'off',
                smoothScrolling: false,
                mouseWheelScrollSensitivity: 1,
                fastScrollSensitivity: 1,

                // ===== DISABLE SCROLL BEYOND FEATURES =====
                scrollbar: {
                  vertical: 'auto',
                  horizontal: 'auto',
                  useShadows: false,
                  verticalScrollbarSize: 10,
                  horizontalScrollbarSize: 10,
                },

                // ===== DISABLE ACCESSIBILITY FEATURES THAT MIGHT INTERFERE =====
                accessibilitySupport: 'off',

                // ===== DISABLE EDITOR FEATURES THAT CAUSE JUMPING =====
                scrollBeyondLastColumn: 0,
                revealHorizontalRightPadding: 0,
                stopRenderingLineAfter: -1,

                // ===== ENSURE PLAIN TEXT MODE =====
                detectIndentation: false,
                insertSpaces: true,
                tabSize: 4,
              }}
            />
          </div>
        )}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={styles.previewPane}>
            <MarkdownViewer content={previewContent} />
          </div>
        )}
      </div>
    </div>
  );
}
