import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPendingEdit } from '@/lib/store';
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
    const result = await updateFile(
      edit.filePath,
      edit.originalContent,
      `Revert: ${edit.fileName} (reverted edit from ${edit.submittedBy} by ${session.user?.name})`,
      currentFile.sha
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to revert changes to GitHub' },
        { status: 500 }
      );
    }

    // Trigger n8n webhook to update ElevenLabs
    await triggerN8nWebhook({
      action: 'revert',
      files: [
        {
          path: edit.filePath,
          name: edit.fileName.replace(/\.md$/, ''),
        },
      ],
      content: edit.originalContent,
      revertedBy: session.user?.name || 'Admin',
      revertedAt: new Date().toISOString(),
      originalEditBy: edit.submittedBy,
    });

    return NextResponse.json({
      status: 'reverted',
      message: 'Edit reverted successfully',
      commitSha: result.sha,
    });
  } catch (error) {
    console.error('Error reverting edit:', error);
    return NextResponse.json(
      { error: 'Failed to revert edit' },
      { status: 500 }
    );
  }
}
