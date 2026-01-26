import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCommitHistory } from '@/lib/github';

// GET /api/changelog - Get recent commit history from GitHub
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get limit from query params, default to 20
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const commits = await getCommitHistory(Math.min(limit, 100));

    return NextResponse.json({
      commits: commits.map((commit) => ({
        sha: commit.sha,
        shortSha: commit.sha.substring(0, 7),
        message: commit.message,
        author: commit.author,
        date: commit.date,
        url: commit.url,
      })),
    });
  } catch (error) {
    console.error('[API] Error fetching commit history:', error);
    return NextResponse.json({ error: 'Failed to fetch changelog' }, { status: 500 });
  }
}
