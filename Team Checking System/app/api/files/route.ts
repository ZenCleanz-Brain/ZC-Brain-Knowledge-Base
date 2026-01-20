import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { listFiles, getFileTree } from '@/lib/github';

// GET /api/files - List all files in the knowledge base
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'tree';

    console.log('[API /api/files] Fetching files, format:', format);

    if (format === 'list') {
      const files = await listFiles();
      console.log('[API /api/files] Found', files.length, 'files');
      return NextResponse.json({ files });
    }

    const tree = await getFileTree();
    console.log('[API /api/files] Built tree with', tree.length, 'root nodes');

    // Debug: count all nodes recursively
    function countNodes(nodes: any[]): number {
      let count = nodes.length;
      for (const node of nodes) {
        if (node.children) {
          count += countNodes(node.children);
        }
      }
      return count;
    }

    console.log('[API /api/files] Total nodes in tree:', countNodes(tree));

    return NextResponse.json({ tree });
  } catch (error) {
    console.error('Error listing files:', error);
    return NextResponse.json(
      { error: 'Failed to list files' },
      { status: 500 }
    );
  }
}

