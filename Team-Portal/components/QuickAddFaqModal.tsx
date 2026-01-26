'use client';

import { useState, useEffect } from 'react';
import { HelpCircle, X, Send } from 'lucide-react';
import styles from './QuickAddFaqModal.module.css';

interface QuickAddFaqModalProps {
  isOpen: boolean;
  filePath: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function QuickAddFaqModal({
  isOpen,
  filePath,
  onClose,
  onSuccess,
}: QuickAddFaqModalProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setQuestion('');
      setAnswer('');
      setError(null);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isSubmitting, onClose]);

  const handleSubmit = async () => {
    if (!question.trim() || !answer.trim()) {
      setError('Please fill in both the question and answer fields.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/quick-add-faq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath,
          question: question.trim(),
          answer: answer.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add FAQ');
      }

      // Success - close modal and trigger refresh
      onClose();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to add FAQ');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Ctrl+Enter to submit
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !isSubmitting) {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={!isSubmitting ? onClose : undefined}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerIcon}>
            <HelpCircle size={28} />
          </div>
          <div className={styles.headerText}>
            <h2 className={styles.title}>Quick Add FAQ</h2>
            <p className={styles.subtitle}>Add a new question and answer to this FAQ file</p>
          </div>
          <button
            className={styles.closeButton}
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className={styles.errorBox}>
            {error}
          </div>
        )}

        {/* Question input */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Question</label>
          <input
            type="text"
            className={styles.input}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g., What are the benefits of enzyme supplements?"
            disabled={isSubmitting}
            autoFocus
          />
        </div>

        {/* Answer input */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>Answer</label>
          <textarea
            className={styles.textarea}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter the answer to this question..."
            disabled={isSubmitting}
            rows={5}
          />
        </div>

        {/* Hint */}
        <p className={styles.hint}>
          Press <kbd>Ctrl</kbd>+<kbd>Enter</kbd> to submit quickly
        </p>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={styles.cancelButton}
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={isSubmitting || !question.trim() || !answer.trim()}
          >
            <Send size={16} />
            {isSubmitting ? 'Adding...' : 'Add FAQ'}
          </button>
        </div>
      </div>
    </div>
  );
}
