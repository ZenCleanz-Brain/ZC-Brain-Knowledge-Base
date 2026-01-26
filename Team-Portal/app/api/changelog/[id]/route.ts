import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCommit } from '@/lib/github';

// GET /api/changelog/[id] - Get a specific commit
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const commit = await getCommit(params.id);

    if (!commit) {
      return NextResponse.json({ error: 'Commit not found' }, { status: 404 });
    }

    return NextResponse.json({
      commit: {
        sha: commit.sha,
        shortSha: commit.sha.substring(0, 7),
        message: commit.message,
        author: commit.author,
        date: commit.date,
        url: commit.url,
      },
    });
  } catch (error) {
    console.error('[API] Error fetching commit:', error);
    return NextResponse.json({ error: 'Failed to fetch commit' }, { status: 500 });
  }
}
