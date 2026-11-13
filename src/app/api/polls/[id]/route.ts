import { NextRequest, NextResponse } from 'next/server';
import { getPollById, savePoll, deletePoll } from '@/lib/server-db';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const poll = await getPollById(id);

  if (!poll) {
    return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
  }

  return NextResponse.json(poll);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const existing = await getPollById(id);

  if (!existing) {
    return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const updated = await savePoll({
      ...existing,
      ...body,
      id,
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const success = await deletePoll(id);

  if (!success) {
    return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

