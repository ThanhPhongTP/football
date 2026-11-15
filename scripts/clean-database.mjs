import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';

// 1. Read .env.local
const envPath = path.join(process.cwd(), '.env.local');
const envVars = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.substring(0, eqIdx).trim();
      const val = trimmed.substring(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      envVars[key] = val;
    }
  }
}

// 2. Clean local data/roster.json
const rosterPath = path.join(process.cwd(), 'data', 'roster.json');
let cleanedRoster = [];
if (fs.existsSync(rosterPath)) {
  const currentRoster = JSON.parse(fs.readFileSync(rosterPath, 'utf-8'));
  cleanedRoster = currentRoster.map((p) => ({
    ...p,
    matchesPlayed: 0,
    goals: 0,
    assists: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    mvpCount: 0,
    status: 'OUT',
  }));
  fs.writeFileSync(rosterPath, JSON.stringify(cleanedRoster, null, 2), 'utf-8');
  console.log(`✅ Cleaned data/roster.json (${cleanedRoster.length} players reset to 0 stats)`);
}

// 3. Clean local data/matches.json
const matchesPath = path.join(process.cwd(), 'data', 'matches.json');
fs.writeFileSync(matchesPath, JSON.stringify([], null, 2), 'utf-8');
console.log('✅ Cleaned data/matches.json to []');

// 4. Clean local data/polls.json
const pollsPath = path.join(process.cwd(), 'data', 'polls.json');
fs.writeFileSync(pollsPath, JSON.stringify([], null, 2), 'utf-8');
console.log('✅ Cleaned data/polls.json to []');

// 5. Clean Firebase Firestore (if configured)
const apiKey = envVars.NEXT_PUBLIC_FIREBASE_API_KEY || envVars.FIREBASE_API_KEY;
const projectId = envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID || envVars.FIREBASE_PROJECT_ID;

if (apiKey && projectId) {
  console.log(`📡 Connecting to Firebase Project: ${projectId}...`);
  try {
    const firebaseConfig = {
      apiKey,
      authDomain: envVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
      projectId,
      storageBucket: envVars.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
      messagingSenderId: envVars.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: envVars.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // 5a. Delete all matches in Firestore
    const matchSnap = await getDocs(collection(db, 'matches'));
    console.log(`Found ${matchSnap.size} matches in Firestore.`);
    for (const matchDoc of matchSnap.docs) {
      await deleteDoc(doc(db, 'matches', matchDoc.id));
    }
    console.log('✅ Deleted all matches in Firestore.');

    // 5b. Delete all polls in Firestore
    const pollSnap = await getDocs(collection(db, 'polls'));
    console.log(`Found ${pollSnap.size} polls in Firestore.`);
    for (const pollDoc of pollSnap.docs) {
      await deleteDoc(doc(db, 'polls', pollDoc.id));
    }
    console.log('✅ Deleted all polls in Firestore.');

    // 5c. Reset stats of all players in Firestore roster
    const rosterSnap = await getDocs(collection(db, 'roster'));
    console.log(`Found ${rosterSnap.size} players in Firestore roster.`);
    if (rosterSnap.empty && cleanedRoster.length > 0) {
      // If empty, upload the cleaned roster
      for (const p of cleanedRoster) {
        await setDoc(doc(db, 'roster', p.id), p);
      }
      console.log(`✅ Seeded ${cleanedRoster.length} clean players to Firestore roster.`);
    } else {
      for (const playerDoc of rosterSnap.docs) {
        const p = playerDoc.data();
        const updated = {
          ...p,
          matchesPlayed: 0,
          goals: 0,
          assists: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          mvpCount: 0,
          status: 'OUT',
        };
        await setDoc(doc(db, 'roster', playerDoc.id), updated);
      }
      console.log(`✅ Reset stats for ${rosterSnap.size} players in Firestore roster.`);
    }

    console.log('\n🎉 ALL DATABASE AND LOCAL DATA CLEANED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Firebase cleanup error:', err);
    process.exit(1);
  }
} else {
  console.log('⚠️ No Firebase credentials found in .env.local, skipped Cloud cleanup.');
}

