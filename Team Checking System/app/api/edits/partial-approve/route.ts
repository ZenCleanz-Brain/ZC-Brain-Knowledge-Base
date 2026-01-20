import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPendingEditsForFile, updatePendingEdit } from '@/lib/store';
import { updateFile, getFileContent } from '@/lib/github';
import { triggerN8nWebhook } from '@/lib/n8n';

// POST /api/edits/partial-approve - Approve with modifications (admin only)
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any).role;

  if (userRole !== 'admin') {
    return NextResponse.json(
      { error: 'Only admins can perform partial approvals' },
      { status: 403 }
    );
  }

  try {
    const { filePath, modifiedContent, editIds } = await request.json();

    if (!filePath || !modifiedContent || !editIds || !Array.isArray(editIds)) {
      return NextResponse.json(
        { error: 'filePath, modifiedContent, and editIds are required' },
        { status: 400 }
      );
    }

    // Get the current file from GitHub
    const currentFile = await getFileContent(filePath);

    if (!currentFile) {
      return NextResponse.json(
        { error: 'File no longer exists on GitHub' },
        { status: 404 }
      );
    }

    // Commit the modified content to GitHub
    const result = await updateFile(
      filePath,
      modifiedContent,
      `Update ${filePath.split('/').pop()} (partial approval with modifications by ${session.user?.name || 'Admin'})`,
      currentFile.sha
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to commit changes to GitHub' },
        { status: 500 }
      );
    }

    // Mark all related pending edits as approved (with partial approval note)
    const adminName = session.user?.name || 'Admin';
    const approvalNote = 'Approved with modifications (partial approval)';

    for (const editId of editIds) {
      await updatePendingEdit(editId, {
        status: 'approved',
        reviewedBy: adminName,
        reviewedAt: new Date(),
        reviewNote: approvalNote,
      });
    }

    // Trigger n8n webhook to update ElevenLabs with the final content
    const fileName = filePath.split('/').pop() || filePath;
    await triggerN8nWebhook({
      action: 'update',
      files: [
        {
          path: filePath,
          name: fileName.replace(/\.md$/, ''),
        },
      ],
      content: modifiedContent,
      approvedBy: adminName,
      approvedAt: new Date().toISOString(),
      isPartialApproval: true,
    });

    return NextResponse.json({
      status: 'approved',
      message: `Partial approval completed - ${editIds.length} edit(s) approved with modifications`,
      commitSha: result.sha,
    });
  } catch (error) {
    console.error('Error processing partial approval:', error);
    return NextResponse.json(
      { error: 'Failed to process partial approval' },
      { status: 500 }
    );
  }
}
