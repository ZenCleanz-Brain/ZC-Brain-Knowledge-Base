'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  Search,
  Trash2,
  Copy,
  Check,
  WrapText,
  ChevronDown,
  ChevronRight,
  Loader2,
  Bookmark,
  Sparkles,
} from 'lucide-react';
import styles from './page.module.css';

/** Splits text around search matches and wraps them in highlighted spans */
function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className={styles.highlight}>{part}</mark>
        ) : (
          part
        )
      )}
    </>
  );
}

interface SavedAnswer {
  id: string;
  question: string;
  answer: string;
  savedBy: string;
  savedAt: string;
  sessionId: string;
}

export default function SavedAnswersPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role || 'viewer';
  const isAdmin = userRole === 'admin';

  const [savedAnswers, setSavedAnswers] = useState<SavedAnswer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedCells, setExpandedCells] = useState<Set<string>>(new Set());
  const [wrapText, setWrapText] = useState(false);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  // Fetch saved answers
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/saved-answers');
        if (res.ok) {
          const data = await res.json();
          setSavedAnswers(data.answers || []);
        }
      } catch (err) {
        console.error('Error fetching saved answers:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Auto-expand all sessions on first load
  useEffect(() => {
    if (savedAnswers.length > 0 && expandedSessions.size === 0) {
      const sessionIds = new Set(savedAnswers.map((a) => a.sessionId));
      setExpandedSessions(sessionIds);
    }
  }, [savedAnswers, expandedSessions.size]);

  // Client-side search filter
  const filteredAnswers = useMemo(() => {
    if (!searchQuery.trim()) return savedAnswers;
    const q = searchQuery.toLowerCase();
    return savedAnswers.filter(
      (a) =>
        a.question.toLowerCase().includes(q) ||
        a.answer.toLowerCase().includes(q)
    );
  }, [savedAnswers, searchQuery]);

  // Group by session, sorted by most recent
  const groupedBySession = useMemo(() => {
    const groups = new Map<string, SavedAnswer[]>();
    filteredAnswers.forEach((a) => {
      if (!groups.has(a.sessionId)) groups.set(a.sessionId, []);
      groups.get(a.sessionId)!.push(a);
    });
    return Array.from(groups.entries()).sort((a, b) => {
      const aMax = Math.max(...a[1].map((x) => new Date(x.savedAt).getTime()));
      const bMax = Math.max(...b[1].map((x) => new Date(x.savedAt).getTime()));
      return bMax - aMax;
    });
  }, [filteredAnswers]);

  const toggleSession = useCallback((id: string) => {
    setExpandedSessions((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleCell = useCallback((cellId: string) => {
    setExpandedCells((prev) => {
      const next = new Set(prev);
      next.has(cellId) ? next.delete(cellId) : next.add(cellId);
      return next;
    });
  }, []);

  const handleCopy = useCallback(async (e: React.MouseEvent, text: string, cellId: string) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(cellId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedId(cellId);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Delete this saved answer?')) return;
    try {
      const res = await fetch(`/api/saved-answers/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSavedAnswers((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }, []);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatSessionDate = (answers: SavedAnswer[]) => {
    const latest = answers.reduce((a, b) =>
      new Date(a.savedAt) > new Date(b.savedAt) ? a : b
    );
    return formatDate(latest.savedAt);
  };

  return (
    <div className={styles.content}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Review Saved Answers</h1>
          <p className={styles.subtitle}>Browse and manage saved Q&A from AI conversations</p>
        </div>
        <span className={`badge badge-${userRole}`}>{userRole}</span>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className={styles.loadingState}>
          <Loader2 size={32} className={styles.spinner} />
          <p>Loading saved answers...</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && savedAnswers.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Bookmark size={40} />
            <Sparkles size={18} className={styles.sparkle} />
          </div>
          <h2>No Saved Answers Yet</h2>
          <p>Start a text conversation and click the <strong>Save</strong> button to save Q&A pairs here.</p>
        </div>
      )}

      {/* Table view */}
      {!isLoading && savedAnswers.length > 0 && (
        <div className={styles.tableContainer}>
          {/* Controls */}
          <div className={styles.controls}>
            <div className={styles.searchBox}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search questions and answers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <button
              className={`${styles.wrapToggle} ${wrapText ? styles.wrapActive : ''}`}
              onClick={() => setWrapText(!wrapText)}
            >
              <WrapText size={16} />
              {wrapText ? 'Unwrap' : 'Wrap'}
            </button>
          </div>

          {/* No results */}
          {filteredAnswers.length === 0 && (
            <div className={styles.noResults}>
              <p>No matches for &ldquo;{searchQuery}&rdquo;</p>
            </div>
          )}

          {/* Session groups */}
          {groupedBySession.map(([sessionId, answers], idx) => (
            <div key={sessionId} className={styles.sessionGroup}>
              <button
                className={styles.sessionHeader}
                onClick={() => toggleSession(sessionId)}
              >
                {expandedSessions.has(sessionId) ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
                <span className={styles.sessionTitle}>Session {groupedBySession.length - idx}</span>
                <span className={styles.sessionMeta}>
                  {answers.length} Q&A{answers.length !== 1 ? 's' : ''} &middot; {formatSessionDate(answers)}
                </span>
              </button>

              {expandedSessions.has(sessionId) && (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.thQuestion}>Question</th>
                        <th className={styles.thAnswer}>Answer</th>
                        <th className={styles.thDate}>Saved</th>
                        {isAdmin && <th className={styles.thActions}></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {answers.map((a) => {
                        const qId = `q-${a.id}`;
                        const aId = `a-${a.id}`;
                        const qExpanded = expandedCells.has(qId) || wrapText;
                        const aExpanded = expandedCells.has(aId) || wrapText;

                        return (
                          <tr key={a.id}>
                            <td
                              className={`${styles.cell} ${qExpanded ? styles.cellExpanded : ''}`}
                              onClick={() => toggleCell(qId)}
                            >
                              <div className={styles.cellText}><HighlightText text={a.question} query={searchQuery} /></div>
                              <button
                                className={`${styles.copyBtn} ${copiedId === qId ? styles.copied : ''}`}
                                onClick={(e) => handleCopy(e, a.question, qId)}
                                title="Copy question"
                              >
                                {copiedId === qId ? <Check size={13} /> : <Copy size={13} />}
                              </button>
                            </td>
                            <td
                              className={`${styles.cell} ${aExpanded ? styles.cellExpanded : ''}`}
                              onClick={() => toggleCell(aId)}
                            >
                              <div className={styles.cellText}><HighlightText text={a.answer} query={searchQuery} /></div>
                              <button
                                className={`${styles.copyBtn} ${copiedId === aId ? styles.copied : ''}`}
                                onClick={(e) => handleCopy(e, a.answer, aId)}
                                title="Copy answer"
                              >
                                {copiedId === aId ? <Check size={13} /> : <Copy size={13} />}
                              </button>
                            </td>
                            <td className={styles.dateCell}>{formatDate(a.savedAt)}</td>
                            {isAdmin && (
                              <td className={styles.actionsCell}>
                                <button
                                  className={styles.deleteBtn}
                                  onClick={() => handleDelete(a.id)}
                                  title="Delete"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
