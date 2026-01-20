import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPendingEdit, updatePendingEdit } from '@/lib/store';
import { updateFile, getFileContent } from '@/lib/github';
import { triggerN8nWebhook } from '@/lib/n8n';

interface RouteParams {
  params: { id: string };
}

// POST /api/edits/[id]/approve - Approve a pending edit (admin only)
export async function POST(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any).role;

  if (userRole !== 'admin') {
    return NextResponse.json(
      { error: 'Only admins can approve edits' },
      { status: 403 }
    );
  }

  const edit = await getPendingEdit(params.id);

  if (!edit) {
    return NextResponse.json({ error: 'Edit not found' }, { status: 404 });
  }

  if (edit.status !== 'pending') {
    return NextResponse.json(
      { error: 'Edit has already been processed' },
      { status: 400 }
    );
  }

  try {
    // Get the current file to check if it's still valid
    const currentFile = await getFileContent(edit.filePath);

    if (!currentFile) {
      return NextResponse.json(
        { error: 'File no longer exists' },
        { status: 404 }
      );
    }

    // Check for conflicts: has the file changed since the edit was created?
    // This is important for the first edit in a chain (based on original GitHub content)
    const hasConflict = edit.originalSha !== currentFile.sha;
    const contentChanged = edit.originalContent !== currentFile.content;

    // Check if force=true was passed (admin chose to override conflict)
    const body = await request.json().catch(() => ({}));
    const forceApprove = body.force === true;

    // If there's a conflict and not forcing, return a warning
    if (hasConflict && contentChanged && !forceApprove) {
      return NextResponse.json(
        {
          error: 'Conflict detected',
          message: 'The file has been modified on GitHub since this edit was created. ' +
                   'The original content this edit was based on is now outdated. ' +
                   'You can force approve to overwrite the current GitHub content, ' +
                   'or reject and ask the editor to re-submit.',
          conflict: true,
          originalSha: edit.originalSha,
          currentSha: currentFile.sha,
        },
        { status: 409 }
      );
    }

    // Use the current SHA for the commit
    const result = await updateFile(
      edit.filePath,
      edit.newContent,
      `Update ${edit.fileName} (approved edit from ${edit.submittedBy})${hasConflict ? ' [conflict overridden]' : ''}`,
      currentFile.sha
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to commit changes to GitHub' },
        { status: 500 }
      );
    }

    // Update the edit status
    await updatePendingEdit(params.id, {
      status: 'approved',
      reviewedBy: session.user?.name || 'Admin',
      reviewedAt: new Date(),
    });

    // Trigger n8n webhook to update ElevenLabs
    await triggerN8nWebhook({
      action: 'update',
      files: [
        {
          path: edit.filePath,
          name: edit.fileName.replace(/\.md$/, ''),
        },
      ],
      content: edit.newContent,
      approvedBy: session.user?.name || 'Admin',
      approvedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      status: 'approved',
      message: 'Edit approved and committed',
      commitSha: result.sha,
    });
  } catch (error) {
    console.error('Error approving edit:', error);
    return NextResponse.json(
      { error: 'Failed to approve edit' },
      { status: 500 }
    );
  }
}
