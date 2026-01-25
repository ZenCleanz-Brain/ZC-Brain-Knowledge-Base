import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasPermission } from '@/lib/auth';
import { getFileContent, updateFile } from '@/lib/github';

// POST /api/quick-add-faq - Add a new FAQ entry to a markdown file
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = (session.user as any).role;

  // Check if user has at least editor permissions
  if (!hasPermission(userRole, 'editor')) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    );
  }

  try {
    const { filePath, question, answer } = await request.json();

    if (!filePath || !question || !answer) {
      return NextResponse.json(
        { error: 'filePath, question, and answer are required' },
        { status: 400 }
      );
    }

    // Get current file content
    const file = await getFileContent(filePath);

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Format the new FAQ entry
    const newFaqEntry = `### ${question}\n\n${answer}\n\n---\n`;

    // Check if "## Recent FAQs" section exists
    const recentFaqsHeader = '## Recent FAQs';
    let updatedContent: string;

    if (file.content.includes(recentFaqsHeader)) {
      // Find the position right after the "## Recent FAQs" header
      const headerIndex = file.content.indexOf(recentFaqsHeader);
      const afterHeader = headerIndex + recentFaqsHeader.length;

      // Find where to insert (after the header and any existing newlines)
      let insertPosition = afterHeader;

      // Skip any whitespace/newlines after the header
      while (insertPosition < file.content.length &&
             (file.content[insertPosition] === '\n' || file.content[insertPosition] === '\r')) {
        insertPosition++;
      }

      // Insert the new FAQ right after the header (before any existing content under it)
      updatedContent =
        file.content.slice(0, afterHeader) +
        '\n\n' +
        newFaqEntry +
        file.content.slice(insertPosition);
    } else {
      // No "Recent FAQs" section exists - add it at the end (before footer if exists)
      const footerPattern = /\n\*For more information.*$/s;
      const footerMatch = file.content.match(footerPattern);

      if (footerMatch && footerMatch.index !== undefined) {
        // Insert before the footer
        updatedContent =
          file.content.slice(0, footerMatch.index) +
          '\n---\n\n' + recentFaqsHeader + '\n\n' + newFaqEntry +
          file.content.slice(footerMatch.index);
      } else {
        // No footer, append at the end
        updatedContent = file.content + '\n\n---\n\n' + recentFaqsHeader + '\n\n' + newFaqEntry;
      }
    }

    // Update the file
    const adminUsername = session.user?.name || 'User';
    const commitMessage = `Add FAQ: ${question.substring(0, 50)}${question.length > 50 ? '...' : ''}`;

    const result = await updateFile(
      filePath,
      updatedContent,
      commitMessage,
      file.sha
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to update file on GitHub' },
        { status: 500 }
      );
    }

    console.log(`[Quick Add FAQ] Added new FAQ to ${filePath} by ${adminUsername}`);

    return NextResponse.json({
      status: 'success',
      message: 'FAQ added successfully',
      question,
      sha: result.sha,
    });
  } catch (error) {
    console.error('Error adding FAQ:', error);
    return NextResponse.json(
      { error: 'Failed to add FAQ' },
      { status: 500 }
    );
  }
}
