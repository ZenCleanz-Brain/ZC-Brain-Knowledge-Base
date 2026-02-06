import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { saveAnswers, getSavedAnswers } from '@/lib/store';

// GET /api/saved-answers - Retrieve all saved answers
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const answers = await getSavedAnswers();
    return NextResponse.json({ answers });
  } catch (error) {
    console.error('Error fetching saved answers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved answers' },
      { status: 500 }
    );
  }
}

// POST /api/saved-answers - Save Q&A pairs from a conversation
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { answers, sessionId } = await request.json();

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { error: 'Missing or invalid answers array' },
        { status: 400 }
      );
    }

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid sessionId' },
        { status: 400 }
      );
    }

    const savedBy = session.user?.name || session.user?.email || 'unknown';
    const saved = await saveAnswers(answers, savedBy, sessionId);

    return NextResponse.json({ saved: saved.length });
  } catch (error) {
    console.error('Error saving answers:', error);
    return NextResponse.json(
      { error: 'Failed to save answers' },
      { status: 500 }
    );
  }
}
