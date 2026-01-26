import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPendingEdit, createRevertRecord } from '@/lib/store';
import { updateFile, getFileContent } from '@/lib/github';
import { triggerN8nWebhook } from '@/lib/n8n';

interface RouteParams {
  params: { id: string };
}

// POST /api/edits/[id]/revert - Revert an approved edit (admin only)
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any).role;

  if (userRole !== 'admin') {
    return NextResponse.json(
      { error: 'Only admins can revert edits' },
      { status: 403 }
    );
  }

  const edit = await getPendingEdit(params.id);

  if (!edit) {
    return NextResponse.json({ error: 'Edit not found' }, { status: 404 });
  }

  if (edit.status !== 'approved') {
    return NextResponse.json(
      { error: 'Only approved edits can be reverted' },
      { status: 400 }
    );
  }

  try {
    // Get the current file to get its SHA
    const currentFile = await getFileContent(edit.filePath);

    if (!currentFile) {
      return NextResponse.json(
        { error: 'File no longer exists' },
        { status: 404 }
      );
    }

    // Revert by committing the original content
    const revertedBy = session.user?.name || 'Admin';
    const result = await updateFile(
      edit.filePath,
      edit.originalContent,
      `Revert: ${edit.fileName} (reverted edit from ${edit.submittedBy} by ${revertedBy})`,
      currentFile.sha
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to revert changes to GitHub' },
        { status: 500 }
      );
    }

    // Create revert record for activity tracking
    const now = new Date();
    try {
      await createRevertRecord({
        filePath: edit.filePath,
        fileName: edit.fileName,
        originalContent: edit.newContent,  // The approved content (before revert)
        newContent: edit.originalContent,  // The original content (after revert)
        originalSha: currentFile.sha,
        originalEditBy: edit.submittedBy,
        revertedBy,
        revertedAt: now,
      });
      console.log('[Revert] Created activity record for revert:', edit.filePath);
    } catch (storeError) {
      // Log but don't fail - GitHub revert already succeeded
      console.error('[Revert] Failed to create activity record:', storeError);
    }

    // Trigger n8n webhook to update ElevenLabs
    const syncResult = await triggerN8nWebhook({
      action: 'revert',
      files: [
        {
          path: edit.filePath,
          name: edit.fileName.replace(/\.md$/, ''),
        },
      ],
      content: edit.originalContent,
      revertedBy,
      revertedAt: now.toISOString(),
      originalEditBy: edit.submittedBy,
    });

    return NextResponse.json({
      status: 'reverted',
      message: 'Edit reverted successfully',
      commitSha: result.sha,
      sync: syncResult, // Include ElevenLabs sync result for UI feedback
    });
  } catch (error) {
    console.error('Error reverting edit:', error);
    return NextResponse.json(
      { error: 'Failed to revert edit' },
      { status: 500 }
    );
  }
}
