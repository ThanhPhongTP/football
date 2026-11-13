import { NextRequest, NextResponse } from 'next/server';
import { getRoster, saveRoster } from '@/lib/server-db';
import { Player } from '@/types/football';

export async function GET() {
  try {
    const roster = await getRoster();
    return NextResponse.json(roster);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch roster' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const players: Player[] = await request.json();
    if (!Array.isArray(players)) {
      return NextResponse.json({ error: 'Expected an array of players' }, { status: 400 });
    }
    const saved = await saveRoster(players);
    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save roster' }, { status: 400 });
  }
}

