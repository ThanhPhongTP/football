import { NextResponse } from 'next/server';
import { getServerDb } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { getRoster, saveRoster } from '@/lib/server-db';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    // Simple protection check (optional)
    
    // 1. Reset Firestore if connected
    const db = getServerDb();
    if (db) {
      // Delete all matches
      const matchSnap = await getDocs(collection(db, 'matches'));
      for (const mDoc of matchSnap.docs) {
        await deleteDoc(doc(db, 'matches', mDoc.id));
      }

      // Delete all polls
      const pollSnap = await getDocs(collection(db, 'polls'));
      for (const pDoc of pollSnap.docs) {
        await deleteDoc(doc(db, 'polls', pDoc.id));
      }

      // Reset all players stats
      const rosterSnap = await getDocs(collection(db, 'roster'));
      for (const pDoc of rosterSnap.docs) {
        const p = pDoc.data();
        await setDoc(doc(db, 'roster', pDoc.id), {
          ...p,
          matchesPlayed: 0,
          goals: 0,
          assists: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          mvpCount: 0,
          status: 'OUT',
        });
      }
    }

    // 2. Reset local files
    const DATA_DIR = path.join(process.cwd(), 'data');
    try {
      await fs.writeFile(path.join(DATA_DIR, 'matches.json'), '[]', 'utf-8');
      await fs.writeFile(path.join(DATA_DIR, 'polls.json'), '[]', 'utf-8');
      const currentRoster = await getRoster();
      const cleanRoster = currentRoster.map((p) => ({
        ...p,
        matchesPlayed: 0,
        goals: 0,
        assists: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        mvpCount: 0,
        status: 'OUT' as const,
      }));
      await saveRoster(cleanRoster);
    } catch {
      // ignore local file errors on serverless
    }

    return NextResponse.json({ success: true, message: 'Database reset successfully' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
