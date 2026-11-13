import { NextRequest, NextResponse } from 'next/server';
import { getMatches, saveMatch } from '@/lib/server-db';
import { Match } from '@/types/football';

export async function GET() {
  try {
    const matches = await getMatches();
    return NextResponse.json(matches);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: Match = await request.json();
    const id = data.id || `match_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    data.id = id;
    data.createdAt = data.createdAt || Date.now();
    data.updatedAt = Date.now();

    const saved = await saveMatch(data);
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create match' }, { status: 400 });
  }
}

