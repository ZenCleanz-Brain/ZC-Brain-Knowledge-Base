'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface SearchMatch {
  lineNumber: number;
  lineContent: string;
  matchStart: number;
  matchEnd: number;
}

interface SearchResult {
  path: string;
  name: string;
  matches: SearchMatch[];
  totalMatches: number;
}

interface SearchTiming {
  fetchMs: number;
  searchMs: number;
  totalMs: number;
  cached: boolean;
}

interface SearchContextType {
  // Search mode
  searchMode: 'files' | 'content';
  setSearchMode: (mode: 'files' | 'content') => void;

  // File name search
  fileSearchTerm: string;
  setFileSearchTerm: (term: string) => void;

  // Content search
  contentSearchTerm: string;
  setContentSearchTerm: (term: string) => void;
  contentSearchResults: SearchResult[];
  setContentSearchResults: (results: SearchResult[]) => void;
  isSearching: boolean;
  searchError: string | null;
  searchTiming: SearchTiming | null;

  // Actions
  performContentSearch: (forceRefresh?: boolean) => Promise<void>;
  clearContentSearch: () => void;
}

const SearchContext = createContext<SearchContextType | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [searchMode, setSearchMode] = useState<'files' | 'content'>('files');
  const [fileSearchTerm, setFileSearchTerm] = useState('');
  const [contentSearchTerm, setContentSearchTerm] = useState('');
  const [contentSearchResults, setContentSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchTiming, setSearchTiming] = useState<SearchTiming | null>(null);

  const performContentSearch = useCallback(async (forceRefresh = false) => {
    if (!contentSearchTerm || contentSearchTerm.length < 2) {
      setSearchError('Please enter at least 2 characters');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchTiming(null);

    try {
      const url = `/api/search?q=${encodeURIComponent(contentSearchTerm)}${forceRefresh ? '&refresh=true' : ''}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setContentSearchResults(data.results);
      if (data.timing) {
        setSearchTiming(data.timing);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError(error instanceof Error ? error.message : 'Search failed');
      setContentSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [contentSearchTerm]);

  const clearContentSearch = useCallback(() => {
    setContentSearchTerm('');
    setContentSearchResults([]);
    setSearchError(null);
    setSearchTiming(null);
  }, []);

  return (
    <SearchContext.Provider
      value={{
        searchMode,
        setSearchMode,
        fileSearchTerm,
        setFileSearchTerm,
        contentSearchTerm,
        setContentSearchTerm,
        contentSearchResults,
        setContentSearchResults,
        isSearching,
        searchError,
        searchTiming,
        performContentSearch,
        clearContentSearch,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}
