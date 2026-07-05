import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8').split('\n')
    .filter(l => l.includes('='))
    .map(l => l.split('='))
);

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
});

const db = getFirestore(app);
const snap = await getDocs(collection(db, 'events'));
for (const doc of snap.docs) {
  await deleteDoc(doc.ref);
  console.log('Deleted:', doc.id);
}
console.log('Done —', snap.size, 'events deleted');
process.exit(0);
