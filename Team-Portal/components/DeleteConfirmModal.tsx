'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import styles from './DeleteConfirmModal.module.css';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  fileName: string;
  filePath: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
}

export default function DeleteConfirmModal({
  isOpen,
  fileName,
  filePath,
  onConfirm,
  onCancel,
  isDeleting = false,
}: DeleteConfirmModalProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const expectedText = `DELETE ${fileName}`;
  const isConfirmValid = confirmationText === expectedText;

  // Reset confirmation text when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setConfirmationText('');
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isDeleting) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isDeleting, onCancel]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={!isDeleting ? onCancel : undefined}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header with warning icon */}
        <div className={styles.header}>
          <div className={styles.warningIcon}>
            <AlertTriangle size={32} />
          </div>
          <button
            className={styles.closeButton}
            onClick={onCancel}
            disabled={isDeleting}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Title */}
        <h2 className={styles.title}>Permanently Delete File?</h2>

        {/* Warning message */}
        <div className={styles.warningBox}>
          <p className={styles.warningTitle}>⚠️ This action cannot be undone</p>
          <ul className={styles.warningList}>
            <li>The file will be <strong>permanently removed</strong> from GitHub</li>
            <li>It will be removed from the ElevenLabs Knowledge Base</li>
            <li>All version history on GitHub will remain, but the file will be gone</li>
            <li>Any pending edits for this file will become orphaned</li>
          </ul>
        </div>

        {/* File info */}
        <div className={styles.fileInfo}>
          <span className={styles.fileLabel}>File to delete:</span>
          <code className={styles.fileName}>{filePath}</code>
        </div>

        {/* Confirmation input */}
        <div className={styles.confirmSection}>
          <label className={styles.confirmLabel}>
            To confirm deletion, please type: <code>{expectedText}</code>
          </label>
          <input
            type="text"
            className={styles.confirmInput}
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder="Type the confirmation text above"
            disabled={isDeleting}
            autoFocus
          />
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            className={styles.cancelButton}
            onClick={onCancel}
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            className={styles.deleteButton}
            onClick={onConfirm}
            disabled={!isConfirmValid || isDeleting}
          >
            <Trash2 size={16} />
            {isDeleting ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  );
}
