import { NextRequest, NextResponse } from 'next/server';
import { castPollVote, getPollById } from '@/lib/server-db';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  try {
    const body = await request.json();
    const { playerName, status, playerId, position, rating } = body;

    if (!playerName || !status) {
      return NextResponse.json(
        { error: 'playerName and status are required' },
        { status: 400 }
      );
    }

    const updatedPoll = await castPollVote(id, {
      playerName,
      status,
      playerId,
      position,
      rating,
    });

    if (!updatedPoll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    return NextResponse.json(updatedPoll);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to record vote' }, { status: 500 });
  }
}

