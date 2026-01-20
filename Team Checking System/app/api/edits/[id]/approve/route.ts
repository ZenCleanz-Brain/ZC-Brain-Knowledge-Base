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

    // Use the current SHA for the commit (in case file was updated since edit was submitted)
    const result = await updateFile(
      edit.filePath,
      edit.newContent,
      `Update ${edit.fileName} (approved edit from ${edit.submittedBy})`,
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
