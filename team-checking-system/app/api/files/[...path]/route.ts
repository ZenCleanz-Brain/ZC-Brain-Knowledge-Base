import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasPermission } from '@/lib/auth';
import { getFileContent, updateFile } from '@/lib/github';
import { createPendingEdit, getPendingEditsForFile, getLatestPendingEditForFile, getFirstPendingEditForFile } from '@/lib/store';
import { triggerNotificationWebhook, triggerN8nWebhook } from '@/lib/n8n';

interface RouteParams {
  params: { path: string[] };
}

// GET /api/files/[...path] - Get file content
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any).role;

  try {
    const filePath = params.path.join('/');
    const file = await getFileContent(filePath);

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Get pending edits for this file (ordered by submission time, oldest first)
    const pendingEdits = await getPendingEditsForFile(filePath);
    const hasPendingEdits = pendingEdits.length > 0;

    // For editors, return the latest pending content so they build on top of their changes
    // For admins, return original GitHub content (they review the original)
    let contentToReturn = file.content;
    let isShowingPendingContent = false;

    if (hasPendingEdits && userRole !== 'admin') {
      // Get the latest pending edit (most recent changes) - last in the ordered array
      const latestPending = pendingEdits[pendingEdits.length - 1];
      if (latestPending) {
        contentToReturn = latestPending.newContent;
        isShowingPendingContent = true;
      }
    }

    return NextResponse.json({
      ...file,
      content: contentToReturn,
      originalGitHubContent: file.content, // Always include the original for reference
      isShowingPendingContent,
      hasPendingEdits,
      pendingEdits: pendingEdits.map((e, index) => ({
        id: e.id,
        submittedBy: e.submittedBy,
        submittedAt: e.submittedAt,
        isFirst: index === 0,
        isLast: index === pendingEdits.length - 1,
      })),
      pendingEditCount: pendingEdits.length,
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

    // Get original content from GitHub
    const githubFile = await getFileContent(filePath);

    if (!githubFile) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // If admin, try to directly commit the change
    // If it fails (e.g., token permissions), fall back to pending review
    if (userRole === 'admin') {
      const result = await updateFile(
        filePath,
        content,
        `Update ${filePath.split('/').pop()}`,
        originalSha
      );

      if (result) {
        // Trigger n8n webhook to sync to ElevenLabs KB
        const fileName = filePath.split('/').pop() || filePath;
        await triggerN8nWebhook({
          action: 'update',
          files: [
            {
              path: filePath,
              name: fileName.replace(/\.md$/, ''),
            },
          ],
          content: content,
          approvedBy: session.user?.name || 'Admin',
          approvedAt: new Date().toISOString(),
        });

        return NextResponse.json({
          status: 'committed',
          message: 'Changes committed directly to GitHub',
          sha: result.sha,
        });
      }

      // If direct commit failed, log the issue and fall through to pending review
      console.warn('[Admin] Direct GitHub commit failed, creating pending edit instead');
    }

    // For editors (or admins when direct commit fails), create a pending edit
    // Check if there are existing pending edits for this file
    const existingPendingEdits = await getPendingEditsForFile(filePath);

    // Determine the "original content" for this edit:
    // - If there are existing pending edits, use the latest pending edit's newContent
    //   This creates a proper chain where each edit builds on the previous
    // - If no pending edits, use the GitHub content
    let originalContentForEdit = githubFile.content;
    let isChainedEdit = false;

    if (existingPendingEdits.length > 0) {
      // Use the latest pending edit's content as the base
      const latestPending = existingPendingEdits[existingPendingEdits.length - 1];
      originalContentForEdit = latestPending.newContent;
      isChainedEdit = true;
      console.log(`[Edit Chain] New edit builds on pending edit ${latestPending.id}`);
    }

    const pendingEdit = await createPendingEdit({
      filePath,
      fileName: filePath.split('/').pop() || filePath,
      originalContent: originalContentForEdit,
      newContent: content,
      originalSha: githubFile.sha, // Always use current GitHub SHA for conflict detection
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
      message: isChainedEdit
        ? `Edit submitted for review (builds on ${existingPendingEdits.length} previous pending edit(s))`
        : 'Edit submitted for review',
      editId: pendingEdit.id,
      isChainedEdit,
      totalPendingEdits: existingPendingEdits.length + 1,
    });
  } catch (error) {
    console.error('Error submitting edit:', error);
    return NextResponse.json(
      { error: 'Failed to submit edit' },
      { status: 500 }
    );
  }
}
