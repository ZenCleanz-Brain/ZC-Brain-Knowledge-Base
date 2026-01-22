import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listFiles, getFileContent, FileInfo } from '@/lib/github';

export interface SearchResult {
  path: string;
  name: string;
  matches: {
    lineNumber: number;
    lineContent: string;
    matchStart: number;
    matchEnd: number;
  }[];
  totalMatches: number;
}

// ===== IN-MEMORY CACHE FOR FAST SEARCHES =====
interface CachedFile {
  path: string;
  name: string;
  content: string;
  cachedAt: number;
}

let contentCache: CachedFile[] = [];
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

// Fetch file content with parallel batching
async function fetchAllFileContents(files: FileInfo[]): Promise<CachedFile[]> {
  const BATCH_SIZE = 25; // Fetch 25 files in parallel for faster initial load
  const results: CachedFile[] = [];

  console.log(`[API /api/search] Fetching ${files.length} files in batches of ${BATCH_SIZE}`);

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(files.length / BATCH_SIZE);

    console.log(`[API /api/search] Fetching batch ${batchNum}/${totalBatches}`);

    // Fetch all files in this batch in parallel
    const batchResults = await Promise.allSettled(
      batch.map(async (file) => {
        const content = await getFileContent(file.path);
        if (content) {
          return {
            path: file.path,
            name: file.name,
            content: content.content,
            cachedAt: Date.now(),
          };
        }
        return null;
      })
    );

    // Collect successful results
    for (const result of batchResults) {
      if (result.status === 'fulfilled' && result.value) {
        results.push(result.value);
      }
    }
  }

  return results;
}

// Get cached content or fetch fresh
async function getSearchableContent(): Promise<CachedFile[]> {
  const now = Date.now();

  // Check if cache is valid
  if (contentCache.length > 0 && (now - cacheTimestamp) < CACHE_TTL) {
    console.log('[API /api/search] Using cached content');
    return contentCache;
  }

  // Fetch fresh content
  console.log('[API /api/search] Cache expired or empty, fetching fresh content...');
  const files = await listFiles();
  contentCache = await fetchAllFileContents(files);
  cacheTimestamp = now;

  console.log(`[API /api/search] Cached ${contentCache.length} files`);
  return contentCache;
}

// Search through content
function searchContent(files: CachedFile[], query: string): SearchResult[] {
  const results: SearchResult[] = [];
  const searchLower = query.toLowerCase();

  for (const file of files) {
    const lines = file.content.split('\n');
    const matches: SearchResult['matches'] = [];

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      const lineLower = line.toLowerCase();
      let searchPos = 0;
      let matchIndex;

      // Find all matches in this line
      while ((matchIndex = lineLower.indexOf(searchLower, searchPos)) !== -1) {
        matches.push({
          lineNumber: index + 1,
          lineContent: line.substring(
            Math.max(0, matchIndex - 50),
            Math.min(line.length, matchIndex + query.length + 50)
          ),
          matchStart: matchIndex - Math.max(0, matchIndex - 50),
          matchEnd: matchIndex - Math.max(0, matchIndex - 50) + query.length,
        });
        searchPos = matchIndex + 1;

        // Limit matches per file to prevent huge responses
        if (matches.length >= 10) break;
      }

      if (matches.length >= 10) break;
    }

    if (matches.length > 0) {
      results.push({
        path: file.path,
        name: file.name,
        matches: matches.slice(0, 5), // Return max 5 matches per file for preview
        totalMatches: matches.length,
      });
    }
  }

  // Sort by number of matches (most relevant first)
  results.sort((a, b) => b.totalMatches - a.totalMatches);

  return results;
}

// GET /api/search?q=search+term - Search all documents for content
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const refreshCache = searchParams.get('refresh') === 'true';

    if (!query || query.length < 2) {
      return NextResponse.json(
        { error: 'Search query must be at least 2 characters' },
        { status: 400 }
      );
    }

    // Force cache refresh if requested
    if (refreshCache) {
      console.log('[API /api/search] Force refreshing cache');
      contentCache = [];
      cacheTimestamp = 0;
    }

    const startTime = Date.now();
    console.log('[API /api/search] Searching for:', query);

    // Get searchable content (from cache or fresh fetch)
    const files = await getSearchableContent();
    const fetchTime = Date.now() - startTime;
    console.log(`[API /api/search] Got ${files.length} files in ${fetchTime}ms`);

    // Perform the search
    const searchStartTime = Date.now();
    const results = searchContent(files, query);
    const searchTime = Date.now() - searchStartTime;

    const totalTime = Date.now() - startTime;
    console.log(`[API /api/search] Found ${results.length} files with matches in ${searchTime}ms (total: ${totalTime}ms)`);

    return NextResponse.json({
      query,
      results,
      totalFiles: results.length,
      timing: {
        fetchMs: fetchTime,
        searchMs: searchTime,
        totalMs: totalTime,
        cached: fetchTime < 100, // If fetch was fast, it was cached
      },
    });
  } catch (error) {
    console.error('Error searching files:', error);
    return NextResponse.json(
      { error: 'Failed to search files' },
      { status: 500 }
    );
  }
}
