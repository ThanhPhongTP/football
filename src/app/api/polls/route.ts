import { NextRequest, NextResponse } from 'next/server';
import { getPolls, savePoll } from '@/lib/server-db';
import { AttendancePoll } from '@/types/football';

export async function GET() {
  try {
    const polls = await getPolls();
    return NextResponse.json(polls);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch polls' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = body.id || `poll-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const newPoll: AttendancePoll = {
      id,
      title: body.title || 'Điểm danh đá bóng',
      date: body.date || new Date().toISOString().split('T')[0],
      time: body.time || '20:00 - 21:30',
      venue: body.venue || 'Sân bóng',
      format: body.format || '7v7',
      targetPlayers: Number(body.targetPlayers) || 14,
      notes: body.notes || '',
      status: 'OPEN',
      votes: body.votes || [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const saved = await savePoll(newPoll);
    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create poll' }, { status: 400 });
  }
}

