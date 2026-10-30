import { NextRequest, NextResponse } from 'next/server';
import { Match } from '@/types/football';

// In-memory store for server-side persistence during session
const matchStore = new Map<string, Match>();

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const match = matchStore.get(id);

  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }

  return NextResponse.json(match);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const data: Match = await request.json();
    data.id = id;
    data.updatedAt = Date.now();
    matchStore.set(id, data);
    return NextResponse.json({ success: true, match: data });
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}

