import { NextRequest, NextResponse } from 'next/server';
import { getMatchById, saveMatch } from '@/lib/server-db';
import { Match } from '@/types/football';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const match = await getMatchById(id);

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
    const saved = await saveMatch(data);
    return NextResponse.json({ success: true, match: saved });
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const data: Match = await request.json();
    data.id = id;
    data.updatedAt = Date.now();
    const saved = await saveMatch(data);
    return NextResponse.json({ success: true, match: saved });
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}
