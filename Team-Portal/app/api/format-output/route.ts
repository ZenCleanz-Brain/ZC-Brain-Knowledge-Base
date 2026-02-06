import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/format-output - Format text using Claude Sonnet
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    console.error('Anthropic API key not configured');
    return NextResponse.json(
      { error: 'Anthropic API not configured' },
      { status: 500 }
    );
  }

  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid text parameter' },
        { status: 400 }
      );
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 4096,
        system: `You are a text formatter. Your job is to take unformatted text and restructure it into clean, well-organized markdown. Rules:
- Add appropriate headers (## or ###) to break the text into logical sections
- Bold key terms, product names, and important concepts
- ALWAYS add a blank line between the end of a section's body text and the next header
- Use natural paragraphs for flowing text - do NOT convert paragraphs into bullet points
- Only use bullet points when the original text genuinely lists multiple distinct items (e.g. ingredients, steps, features)
- For schedules or day-by-day plans, use headers for each day/period and plain paragraphs for the details underneath - NOT bullet points
- Use horizontal rules (---) to separate major topic changes if appropriate
- Do NOT add any new information - only restructure what is given
- Do NOT add introductions, summaries, or conclusions that weren't in the original
- Keep all original content intact, just improve the formatting
- Output clean markdown only, no code fences around the entire output`,
        messages: [
          {
            role: 'user',
            content: `Please format the following text with proper markdown structure:\n\n${text}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Failed to format text' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const formatted = data.content?.[0]?.text || '';

    return NextResponse.json({ formatted });
  } catch (error) {
    console.error('Error formatting text:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
