'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Copy, Check, Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import styles from './FormatOutputModal.module.css';

interface FormatOutputModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawText: string;
}

export default function FormatOutputModal({ isOpen, onClose, rawText }: FormatOutputModalProps) {
  const [formatted, setFormatted] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch formatted text when modal opens
  useEffect(() => {
    if (!isOpen || !rawText) return;

    setIsLoading(true);
    setError(null);
    setFormatted('');
    setCopied(false);

    fetch('/api/format-output', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: rawText }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to format text');
        }
        return res.json();
      })
      .then((data) => {
        setFormatted(data.formatted);
      })
      .catch((err) => {
        setError(err.message || 'Something went wrong');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen, rawText]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleCopy = useCallback(async () => {
    if (!formatted) return;

    try {
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      setTimeout(() => {
        onClose();
      }, 800);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = formatted;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => {
        onClose();
      }, 800);
    }
  }, [formatted, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleRow}>
            <Sparkles size={18} className={styles.titleIcon} />
            <h2 className={styles.title}>Formatted Output</h2>
          </div>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {isLoading && (
            <div className={styles.loadingState}>
              <Loader2 size={32} className={styles.spinner} />
              <p className={styles.loadingText}>Formatting...</p>
            </div>
          )}

          {error && (
            <div className={styles.errorState}>
              <p className={styles.errorText}>{error}</p>
            </div>
          )}

          {!isLoading && !error && formatted && (
            <div className={styles.markdown}>
              <ReactMarkdown>{formatted}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && !error && formatted && (
          <div className={styles.footer}>
            <button
              className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check size={16} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={16} />
                  Copy to Clipboard
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
