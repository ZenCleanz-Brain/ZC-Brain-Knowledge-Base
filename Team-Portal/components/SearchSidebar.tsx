'use client';

import { Search, RefreshCw, FileText, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import FileTree from './FileTree';
import ResizableSidebar from './ResizableSidebar';
import { useFileTree } from '@/contexts/FileTreeContext';
import { useSearch } from '@/contexts/SearchContext';
import styles from '@/app/(portal)/browse/page.module.css';

interface SearchSidebarProps {
  currentPath?: string;
}

export default function SearchSidebar({ currentPath }: SearchSidebarProps) {
  const { tree, loading, refreshTree } = useFileTree();
  const {
    searchMode,
    setSearchMode,
    fileSearchTerm,
    setFileSearchTerm,
    contentSearchTerm,
    setContentSearchTerm,
    contentSearchResults,
    isSearching,
    searchError,
    searchTiming,
    performContentSearch,
    clearContentSearch,
  } = useSearch();

  // Filter tree based on search term (file name search)
  function filterTree(nodes: any[], term: string): any[] {
    if (!term) return nodes;

    const lowerTerm = term.toLowerCase();

    return nodes
      .map((node) => {
        if (node.type === 'file') {
          if (node.name.toLowerCase().includes(lowerTerm)) {
            return node;
          }
          return null;
        }

        // For directories, recursively filter children
        const filteredChildren = filterTree(node.children || [], term);
        if (filteredChildren.length > 0) {
          return { ...node, children: filteredChildren };
        }

        return null;
      })
      .filter(Boolean) as any[];
  }

  // Handle Enter key for content search
  const handleContentSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performContentSearch();
    }
  };

  const filteredTree = filterTree(tree, fileSearchTerm);

  // Highlight matching text in search results
  const highlightMatch = (text: string, start: number, end: number) => {
    const before = text.substring(0, start);
    const match = text.substring(start, end);
    const after = text.substring(end);
    return (
      <>
        {before}
        <mark className={styles.highlight}>{match}</mark>
        {after}
      </>
    );
  };

  return (
    <ResizableSidebar>
      <div className={styles.sidebarHeader}>
        <h2>Knowledge Base</h2>
        <button
          className={styles.refreshBtn}
          onClick={refreshTree}
          disabled={loading}
          title="Refresh files"
        >
          <RefreshCw size={16} className={loading ? styles.spinning : ''} />
        </button>
      </div>

      {/* Search Mode Toggle */}
      <div className={styles.searchModeToggle}>
        <button
          className={`${styles.modeBtn} ${searchMode === 'files' ? styles.active : ''}`}
          onClick={() => setSearchMode('files')}
        >
          File Names
        </button>
        <button
          className={`${styles.modeBtn} ${searchMode === 'content' ? styles.active : ''}`}
          onClick={() => setSearchMode('content')}
        >
          Content Search
        </button>
      </div>

      {searchMode === 'files' ? (
        <>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search files..."
              className="input"
              value={fileSearchTerm}
              onChange={(e) => setFileSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className={styles.loading}>Loading files...</div>
          ) : filteredTree.length === 0 ? (
            <div className={styles.empty}>
              {fileSearchTerm ? 'No files match your search' : 'No files found'}
            </div>
          ) : (
            <FileTree nodes={filteredTree} currentPath={currentPath} />
          )}
        </>
      ) : (
        <>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search in all documents..."
              className="input"
              value={contentSearchTerm}
              onChange={(e) => setContentSearchTerm(e.target.value)}
              onKeyDown={handleContentSearchKeyDown}
            />
            {contentSearchTerm && (
              <button
                className={styles.clearBtn}
                onClick={clearContentSearch}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            className={styles.searchBtn}
            onClick={() => performContentSearch()}
            disabled={isSearching || contentSearchTerm.length < 2}
          >
            {isSearching ? (
              <>
                <Loader2 size={16} className={styles.spinning} />
                Searching...
              </>
            ) : (
              <>
                <Search size={16} />
                Search All Documents
              </>
            )}
          </button>

          {searchError && (
            <div className={styles.searchError}>{searchError}</div>
          )}

          {!isSearching && contentSearchResults.length > 0 && (
            <div className={styles.searchResults}>
              <div className={styles.resultsHeader}>
                <span>
                  Found in {contentSearchResults.length} document{contentSearchResults.length !== 1 ? 's' : ''}
                  {searchTiming && (
                    <span className={styles.timing}>
                      {' '}in {searchTiming.totalMs < 1000
                        ? `${searchTiming.totalMs}ms`
                        : `${(searchTiming.totalMs / 1000).toFixed(1)}s`}
                      {searchTiming.cached && ' (cached)'}
                    </span>
                  )}
                </span>
                {searchTiming?.cached && (
                  <button
                    className={styles.refreshCacheBtn}
                    onClick={() => performContentSearch(true)}
                    title="Refresh from source"
                  >
                    <RefreshCw size={12} />
                  </button>
                )}
              </div>
              {contentSearchResults.map((result) => (
                <Link
                  key={result.path}
                  href={`/browse/${encodeURIComponent(result.path)}?q=${encodeURIComponent(contentSearchTerm)}`}
                  className={`${styles.resultItem} ${currentPath === result.path ? styles.resultItemActive : ''}`}
                >
                  <div className={styles.resultHeader}>
                    <FileText size={14} />
                    <span className={styles.resultName}>{result.name}</span>
                    <span className={styles.matchCount}>
                      {result.totalMatches} match{result.totalMatches !== 1 ? 'es' : ''}
                    </span>
                  </div>
                  <div className={styles.resultPath}>{result.path}</div>
                  {result.matches.slice(0, 2).map((match, idx) => (
                    <div key={idx} className={styles.matchPreview}>
                      <span className={styles.lineNum}>Line {match.lineNumber}:</span>
                      <span className={styles.matchText}>
                        {highlightMatch(match.lineContent, match.matchStart, match.matchEnd)}
                      </span>
                    </div>
                  ))}
                </Link>
              ))}
            </div>
          )}

          {!isSearching && contentSearchTerm && contentSearchResults.length === 0 && !searchError && (
            <div className={styles.empty}>
              No documents contain &quot;{contentSearchTerm}&quot;
            </div>
          )}

          {!contentSearchTerm && !isSearching && (
            <div className={styles.searchHint}>
              Enter a search term and press Enter or click the button to search through all document content.
            </div>
          )}
        </>
      )}
    </ResizableSidebar>
  );
}
