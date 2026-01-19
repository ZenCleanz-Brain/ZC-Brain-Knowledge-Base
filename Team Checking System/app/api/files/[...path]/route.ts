import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasPermission } from '@/lib/auth';
import { getFileContent, updateFile } from '@/lib/github';
import { createPendingEdit, getPendingEditsForFile } from '@/lib/store';
import { triggerNotificationWebhook } from '@/lib/n8n';

interface RouteParams {
  params: { path: string[] };
}

// GET /api/files/[...path] - Get file content
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const filePath = params.path.join('/');
    const file = await getFileContent(filePath);

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Also get pending edits for this file
    const pendingEdits = getPendingEditsForFile(filePath);

    return NextResponse.json({
      ...file,
      pendingEdits: pendingEdits.map((e) => ({
        id: e.id,
        submittedBy: e.submittedBy,
        submittedAt: e.submittedAt,
      })),
    });
  } catch (error) {
    console.error('Error getting file:', error);
    return NextResponse.json(
      { error: 'Failed to get file' },
      { status: 500 }
    );
  }
}

// POST /api/files/[...path] - Submit an edit request
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any).role;

  // Check if user has editor permissions
  if (!hasPermission(userRole, 'editor')) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  try {
    const filePath = params.path.join('/');
    const { content, originalSha } = await request.json();

    if (!content || !originalSha) {
      return NextResponse.json(
        { error: 'Content and originalSha are required' },
        { status: 400 }
      );
    }

    // Get original content
    const original = await getFileContent(filePath);

    if (!original) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // If admin, directly commit the change
    if (userRole === 'admin') {
      const result = await updateFile(
        filePath,
        content,
        `Update ${filePath.split('/').pop()}`,
        originalSha
      );

      if (result) {
        return NextResponse.json({
          status: 'committed',
          message: 'Changes committed directly',
          sha: result.sha,
        });
      } else {
        return NextResponse.json(
          { error: 'Failed to commit changes' },
          { status: 500 }
        );
      }
    }

    // For editors, create a pending edit
    const pendingEdit = createPendingEdit({
      filePath,
      fileName: filePath.split('/').pop() || filePath,
      originalContent: original.content,
      newContent: content,
      originalSha,
      submittedBy: session.user?.name || 'Unknown',
    });

    // Trigger notification webhook
    await triggerNotificationWebhook({
      id: pendingEdit.id,
      filePath,
      submittedBy: pendingEdit.submittedBy,
    });

    return NextResponse.json({
      status: 'pending',
      message: 'Edit submitted for review',
      editId: pendingEdit.id,
    });
  } catch (error) {
    console.error('Error submitting edit:', error);
    return NextResponse.json(
      { error: 'Failed to submit edit' },
      { status: 500 }
    );
  }
}
