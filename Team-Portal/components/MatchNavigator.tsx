'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronUp, ChevronDown, X, Search, Loader2 } from 'lucide-react';
import styles from './MatchNavigator.module.css';

interface MatchNavigatorProps {
  searchQuery?: string; // Preset search query (from sidebar)
  allowInput?: boolean; // Show input field for in-document search
  onClose: () => void;
}

export default function MatchNavigator({ searchQuery: initialQuery = '', allowInput = false, onClose }: MatchNavigatorProps) {
  const [inputValue, setInputValue] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [currentMatch, setCurrentMatch] = useState(1);
  const [totalMatches, setTotalMatches] = useState(0);
  const [matchElements, setMatchElements] = useState<Element[]>([]);
  const [isSearching, setIsSearching] = useState(!!initialQuery);
  const retryCountRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const maxRetries = 10;

  // Focus input when in input mode
  useEffect(() => {
    if (allowInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [allowInput]);

  // Find and highlight all matches in the document
  const findAndHighlightMatches = useCallback(() => {
    if (!activeQuery || activeQuery.length < 2) {
      setIsSearching(false);
      return false;
    }

    // Get the markdown content container
    const contentContainer = document.querySelector('[data-markdown-content]');
    if (!contentContainer) {
      return false; // Content not ready yet
    }

    // Check if content has actual text (not just loading state)
    const textContent = contentContainer.textContent || '';
    if (textContent.length < 50) {
      return false; // Content likely still loading
    }

    // Remove previous highlights
    const existingHighlights = contentContainer.querySelectorAll('.search-highlight');
    existingHighlights.forEach((el) => {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent || ''), el);
        parent.normalize();
      }
    });

    // Find all text nodes
    const walker = document.createTreeWalker(
      contentContainer,
      NodeFilter.SHOW_TEXT,
      null
    );

    const textNodes: Text[] = [];
    let node;
    while ((node = walker.nextNode())) {
      textNodes.push(node as Text);
    }

    // Highlight matches (case-insensitive)
    const searchLower = activeQuery.toLowerCase();
    const newMatchElements: Element[] = [];

    textNodes.forEach((textNode) => {
      const text = textNode.textContent || '';
      const textLower = text.toLowerCase();

      if (textLower.includes(searchLower)) {
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        let matchIndex;
        let searchPos = 0;

        while ((matchIndex = textLower.indexOf(searchLower, searchPos)) !== -1) {
          // Add text before match
          if (matchIndex > lastIndex) {
            fragment.appendChild(document.createTextNode(text.substring(lastIndex, matchIndex)));
          }

          // Add highlighted match (preserve original case from document)
          const mark = document.createElement('mark');
          mark.className = 'search-highlight';
          mark.textContent = text.substring(matchIndex, matchIndex + activeQuery.length);
          fragment.appendChild(mark);
          newMatchElements.push(mark);

          lastIndex = matchIndex + activeQuery.length;
          searchPos = matchIndex + 1;
        }

        // Add remaining text
        if (lastIndex < text.length) {
          fragment.appendChild(document.createTextNode(text.substring(lastIndex)));
        }

        // Replace original text node
        textNode.parentNode?.replaceChild(fragment, textNode);
      }
    });

    setMatchElements(newMatchElements);
    setTotalMatches(newMatchElements.length);
    setIsSearching(false);

    // Scroll to first match
    if (newMatchElements.length > 0) {
      setCurrentMatch(1);
      scrollToMatch(newMatchElements[0]);
    }

    return true; // Successfully searched
  }, [activeQuery]);

  // Scroll to a specific match element
  const scrollToMatch = (element: Element) => {
    // Remove active class from all
    matchElements.forEach((el) => el.classList.remove('search-highlight-active'));

    // Add active class to current
    element.classList.add('search-highlight-active');

    // Scroll into view
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  // Navigate to next match
  const goToNextMatch = useCallback(() => {
    if (matchElements.length === 0) return;

    const nextIndex = currentMatch >= totalMatches ? 1 : currentMatch + 1;
    setCurrentMatch(nextIndex);
    scrollToMatch(matchElements[nextIndex - 1]);
  }, [currentMatch, totalMatches, matchElements]);

  // Navigate to previous match
  const goToPrevMatch = useCallback(() => {
    if (matchElements.length === 0) return;

    const prevIndex = currentMatch <= 1 ? totalMatches : currentMatch - 1;
    setCurrentMatch(prevIndex);
    scrollToMatch(matchElements[prevIndex - 1]);
  }, [currentMatch, totalMatches, matchElements]);

  // Handle input submission
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey && totalMatches > 0) {
        goToPrevMatch();
      } else if (inputValue.length >= 2) {
        if (inputValue === activeQuery && totalMatches > 0) {
          // Same query, go to next match
          goToNextMatch();
        } else {
          // New query, trigger search
          setActiveQuery(inputValue);
          setIsSearching(true);
          retryCountRef.current = 0;
        }
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Handle keyboard shortcuts (for non-input mode)
  useEffect(() => {
    if (allowInput) return; // Input handles its own keyboard events

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Enter' || e.key === 'F3') {
        e.preventDefault();
        if (e.shiftKey) {
          goToPrevMatch();
        } else {
          goToNextMatch();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goToNextMatch, goToPrevMatch, allowInput]);

  // Find matches when component mounts or search query changes
  // Uses retry mechanism to wait for content to be fully rendered
  useEffect(() => {
    setIsSearching(true);
    retryCountRef.current = 0;

    const attemptSearch = () => {
      const success = findAndHighlightMatches();

      if (!success && retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        // Exponential backoff: 200ms, 400ms, 600ms, 800ms, 1000ms...
        const delay = Math.min(200 * retryCountRef.current, 1000);
        setTimeout(attemptSearch, delay);
      } else if (!success) {
        setIsSearching(false);
      }
    };

    // Initial delay before first attempt
    const timer = setTimeout(attemptSearch, 300);
    return () => clearTimeout(timer);
  }, [findAndHighlightMatches]);

  // Cleanup highlights when closing
  useEffect(() => {
    return () => {
      const contentContainer = document.querySelector('[data-markdown-content]');
      if (contentContainer) {
        const highlights = contentContainer.querySelectorAll('.search-highlight');
        highlights.forEach((el) => {
          const parent = el.parentNode;
          if (parent) {
            parent.replaceChild(document.createTextNode(el.textContent || ''), el);
            parent.normalize();
          }
        });
      }
    };
  }, []);

  // Don't render if no query and not in input mode
  if (!activeQuery && !allowInput) return null;

  return (
    <div className={styles.navigator}>
      <div className={styles.searchInfo}>
        <Search size={14} />
        {allowInput ? (
          <input
            ref={inputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Search in document..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
          />
        ) : (
          <span className={styles.searchTerm}>&quot;{activeQuery}&quot;</span>
        )}
      </div>

      <div className={styles.matchInfo}>
        {isSearching ? (
          <span className={styles.searching}>
            <Loader2 size={14} className={styles.spinIcon} />
            Searching...
          </span>
        ) : totalMatches > 0 ? (
          <span>{currentMatch} of {totalMatches}</span>
        ) : activeQuery ? (
          <span className={styles.noMatches}>No matches</span>
        ) : allowInput ? (
          <span className={styles.noMatches}>Press Enter</span>
        ) : null}
      </div>

      <div className={styles.controls}>
        <button
          className={styles.navBtn}
          onClick={goToPrevMatch}
          disabled={totalMatches === 0}
          title="Previous match (Shift+Enter)"
        >
          <ChevronUp size={18} />
        </button>
        <button
          className={styles.navBtn}
          onClick={goToNextMatch}
          disabled={totalMatches === 0}
          title="Next match (Enter)"
        >
          <ChevronDown size={18} />
        </button>
        <button
          className={styles.closeBtn}
          onClick={onClose}
          title="Close (Esc)"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
