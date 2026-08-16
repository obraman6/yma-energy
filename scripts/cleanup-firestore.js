/*
Firestore cleanup script for demo/sample documents.
USAGE:
  1. Place your Firebase service account JSON at `./serviceAccountKey.json` (or set GOOGLE_APPLICATION_CREDENTIALS env var).
  2. Install admin SDK: `npm install firebase-admin` in project root.
  3. Run dry-run first to see what would be deleted:
     node scripts/cleanup-firestore.js --dry
  4. To actually delete, run:
     node scripts/cleanup-firestore.js

This script deletes a conservative list of demo document IDs used during development.
Review the `targets` array below and edit if needed before running.
*/

import admin from 'firebase-admin';
import fs from 'fs';

const KEY_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || './serviceAccountKey.json';
const DRY = process.argv.includes('--dry') || process.argv.includes('--dry-run');

if (!fs.existsSync(KEY_PATH)) {
  console.error('Service account key not found at', KEY_PATH);
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS or place key at ./serviceAccountKey.json');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'))),
});

const db = admin.firestore();

// Conservative list of demo IDs used by the project. Edit before running.
const targets = [
  { collection: 'products', ids: ['prod-01','prod-02','prod-03','prod-04','prod-05','prod-06','prod-07'] },
  { collection: 'services', ids: ['srv-01','srv-02','srv-03'] },
  { collection: 'branches', ids: ['br-dar','br-arusha','br-mwanza','br-dodoma'] },
  { collection: 'paymentGateways', ids: ['gw-mpesa','gw-tigopesa','gw-airtel','gw-crdb','gw-card','gw-cod'] },
  { collection: 'users', ids: ['user-admin'] },
  // If you had seeded demo orders/reviews/repairs, add them here
];

(async () => {
  for (const t of targets) {
    console.log(`\nCollection: ${t.collection}`);
    for (const id of t.ids) {
      const docRef = db.collection(t.collection).doc(id);
      const snap = await docRef.get();
      if (!snap.exists) {
        console.log(`  - [not found] ${id}`);
        continue;
      }
      console.log(`  - [found] ${id}`);
      if (!DRY) {
        try {
          await docRef.delete();
          console.log(`    -> deleted ${id}`);
        } catch (err) {
          console.error(`    -> failed to delete ${id}:`, err.message || err);
        }
      }
    }
  }

  if (DRY) console.log('\nDry run finished. No documents were deleted. Run without --dry to delete.');
  else console.log('\nDeletion run complete.');
  process.exit(0);
})();
