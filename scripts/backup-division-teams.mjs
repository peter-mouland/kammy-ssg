/**
 * Back up, compare and restore the `division-teams` Firestore collection.
 *
 * This exists because regenerating points is destructive and irreversible. The admin
 * "Regenerate points" job with jobType 'all' rewrites every `${divisionId}_gw${n}`
 * document from FPL data. Reverting a code change restores the rules; it does not
 * restore the documents. So: take a backup first, regenerate, compare, and restore if
 * the result is wrong.
 *
 * Usage:
 *   # 1. Before regenerating -- dump the live collection
 *   node --env-file=.env.local scripts/backup-division-teams.mjs
 *
 *   # 2. After regenerating -- see exactly what moved
 *   node --env-file=.env.local scripts/backup-division-teams.mjs --compare backups/<file>.json
 *
 *   # 3. Only if it went wrong -- put it back (dry run first, always)
 *   node --env-file=.env.local scripts/backup-division-teams.mjs --restore backups/<file>.json
 *   node --env-file=.env.local scripts/backup-division-teams.mjs --restore backups/<file>.json --yes
 *
 * Flags:
 *   --compare <file>   Diff the live collection against a backup. Read-only.
 *   --restore <file>   Write a backup back. Dry run unless --yes is also passed.
 *   --yes              Actually perform the restore.
 *   --prune            With --restore, also delete live documents absent from the backup.
 *   --verbose          With --compare, print every changed manager, not just the latest
 *                      gameweek of each division.
 *
 * Required env vars (in .env.local, the same ones the app uses):
 *   MY_FIREBASE_SERVICE_ACCOUNT_KEY   Base64-encoded service account JSON
 *   FIRESTORE_DATABASE_ID             Optional. Defaults to 'draft', as the app does.
 *
 * Backups are written to `backups/`, which is gitignored. They contain live league data
 * and must never be committed.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const BACKUP_DIR = join(REPO_ROOT, 'backups');

const COLLECTION = 'division-teams';
// Firestore caps a batch at 500 writes. 400 leaves headroom and the collection is ~117
// documents anyway, so this only ever matters if the league grows a lot.
const BATCH_SIZE = 400;

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------

const argv = process.argv.slice(2);
const flagValue = (name) => {
    const i = argv.indexOf(name);
    return i === -1 ? null : argv[i + 1];
};

const compareFile = flagValue('--compare');
const restoreFile = flagValue('--restore');
const confirmed = argv.includes('--yes');
const prune = argv.includes('--prune');
const verbose = argv.includes('--verbose');

if (compareFile && restoreFile) {
    console.error('Pass --compare or --restore, not both.');
    process.exit(1);
}
if ((argv.includes('--compare') && !compareFile) || (argv.includes('--restore') && !restoreFile)) {
    console.error('--compare and --restore each need a backup file path.');
    process.exit(1);
}

// ---------------------------------------------------------------------------
// Firestore
// ---------------------------------------------------------------------------

/**
 * Same credentials and database the app uses -- see
 * draft/app/_shared/lib/firestore-cache/firebase.admin.ts. Deliberately a separate app
 * name so this script can never collide with a running dev server's instance.
 */
function connect() {
    const encoded = process.env.MY_FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!encoded) {
        console.error('MY_FIREBASE_SERVICE_ACCOUNT_KEY is not set.');
        console.error('Run with: node --env-file=.env.local scripts/backup-division-teams.mjs');
        process.exit(1);
    }

    let serviceAccount;
    try {
        serviceAccount = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
    } catch (error) {
        console.error('Could not parse MY_FIREBASE_SERVICE_ACCOUNT_KEY:', error.message);
        process.exit(1);
    }

    const databaseId = process.env.FIRESTORE_DATABASE_ID || 'draft';
    const app = initializeApp({ credential: cert(serviceAccount) }, 'division-teams-backup');

    // Printed on every run, including dry runs. Hitting the wrong project is the one
    // mistake this script must not let you make quietly.
    console.log(`🔥 project: ${serviceAccount.project_id}`);
    console.log(`🔥 database: ${databaseId}`);
    console.log(`🔥 collection: ${COLLECTION}`);
    console.log('');

    return { db: getFirestore(app, databaseId), projectId: serviceAccount.project_id, databaseId };
}

// ---------------------------------------------------------------------------
// Serialisation
// ---------------------------------------------------------------------------

/**
 * `DivisionTeamsDocument` stores its dates as ISO strings, so in practice everything here
 * is already JSON. Timestamps are handled anyway: a Firestore Timestamp would otherwise
 * serialise to `{_seconds, _nanoseconds}` and restore as a plain object, silently
 * changing the document's type. Tagging them keeps a restore byte-for-byte honest.
 */
const encode = (value) => {
    if (value instanceof Timestamp) return { __timestamp: value.toDate().toISOString() };
    if (Array.isArray(value)) return value.map(encode);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, encode(v)]));
    }
    return value;
};

const decode = (value) => {
    if (value && typeof value === 'object' && typeof value.__timestamp === 'string') {
        return Timestamp.fromDate(new Date(value.__timestamp));
    }
    if (Array.isArray(value)) return value.map(decode);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, decode(v)]));
    }
    return value;
};

async function readLive(db) {
    const snapshot = await db.collection(COLLECTION).get();
    const documents = {};
    snapshot.forEach((doc) => {
        documents[doc.id] = encode(doc.data());
    });
    return documents;
}

async function readBackup(path) {
    let parsed;
    try {
        parsed = JSON.parse(await readFile(path, 'utf8'));
    } catch (error) {
        console.error(`Could not read backup file ${path}: ${error.message}`);
        process.exit(1);
    }
    if (!parsed?.documents || typeof parsed.documents !== 'object') {
        console.error(`${path} does not look like a backup from this script (no "documents" key).`);
        process.exit(1);
    }
    return parsed;
}

// ---------------------------------------------------------------------------
// Points summary, for --compare
// ---------------------------------------------------------------------------

/** Season points per manager: the sum of `season.points.total` across their roster. */
function seasonTotalsByManager(doc) {
    const totals = {};
    for (const [managerId, team] of Object.entries(doc?.teams ?? {})) {
        let total = 0;
        for (const slot of Object.values(team?.roster ?? {})) {
            total += slot?.season?.points?.total ?? 0;
        }
        totals[managerId] = total;
    }
    return totals;
}

/** `premierLeague_gw38` -> `{ division: 'premierLeague', gameweek: 38 }`. */
function parseDocId(docId) {
    const match = /^(.*)_gw(\d+)$/.exec(docId);
    return match ? { division: match[1], gameweek: Number(match[2]) } : { division: docId, gameweek: 0 };
}

// ---------------------------------------------------------------------------
// Modes
// ---------------------------------------------------------------------------

async function backup(db, { projectId, databaseId }) {
    const documents = await readLive(db);
    const ids = Object.keys(documents);
    if (ids.length === 0) {
        console.error('The collection is empty. Refusing to write an empty backup.');
        process.exit(1);
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, '-').replace(/-\d{3}Z$/, 'Z');
    const path = join(BACKUP_DIR, `division-teams-${stamp}.json`);

    await mkdir(BACKUP_DIR, { recursive: true });
    await writeFile(
        path,
        `${JSON.stringify(
            {
                exportedAt: new Date().toISOString(),
                projectId,
                databaseId,
                collection: COLLECTION,
                documentCount: ids.length,
                documents,
            },
            null,
            2,
        )}\n`,
    );

    console.log(`✅ backed up ${ids.length} documents`);
    console.log(`   ${path}`);
    console.log('');
    console.log('Restore with:');
    console.log(`   node --env-file=.env.local scripts/backup-division-teams.mjs --restore ${path}`);
}

async function compare(db, path) {
    const saved = await readBackup(path);
    const live = await readLive(db);

    const allIds = [...new Set([...Object.keys(saved.documents), ...Object.keys(live)])].sort();
    const added = allIds.filter((id) => !saved.documents[id]);
    const removed = allIds.filter((id) => !live[id]);
    const changed = allIds.filter(
        (id) => saved.documents[id] && live[id] && JSON.stringify(saved.documents[id]) !== JSON.stringify(live[id]),
    );

    console.log(`backup:  ${saved.documentCount} documents, taken ${saved.exportedAt}`);
    console.log(`live:    ${Object.keys(live).length} documents`);
    console.log('');
    console.log(`unchanged: ${allIds.length - added.length - removed.length - changed.length}`);
    console.log(`changed:   ${changed.length}`);
    console.log(`added:     ${added.length}${added.length ? ` (${added.join(', ')})` : ''}`);
    console.log(`removed:   ${removed.length}${removed.length ? ` (${removed.join(', ')})` : ''}`);

    if (changed.length === 0) {
        console.log('');
        console.log('No document content differs.');
        return;
    }

    // The season totals in the highest gameweek of each division are the league table, so
    // those are the numbers worth showing. --verbose prints every gameweek instead.
    const latestPerDivision = {};
    for (const id of changed) {
        const { division, gameweek } = parseDocId(id);
        if (!latestPerDivision[division] || gameweek > latestPerDivision[division].gameweek) {
            latestPerDivision[division] = { gameweek, id };
        }
    }
    const toShow = verbose ? changed : Object.values(latestPerDivision).map((d) => d.id);

    console.log('');
    console.log(verbose ? 'Season points, every changed document:' : 'Season points, latest changed gameweek per division:');

    for (const id of toShow.sort()) {
        const before = seasonTotalsByManager(saved.documents[id]);
        const after = seasonTotalsByManager(live[id]);
        const managers = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();
        const moved = managers.filter((m) => (before[m] ?? 0) !== (after[m] ?? 0));

        console.log('');
        console.log(`  ${id}  (${moved.length} of ${managers.length} managers moved)`);
        for (const manager of moved) {
            const from = before[manager] ?? 0;
            const to = after[manager] ?? 0;
            const delta = to - from;
            console.log(`    ${manager.padEnd(24)} ${String(from).padStart(6)} -> ${String(to).padStart(6)}  ${delta > 0 ? '+' : ''}${delta}`);
        }
    }

    if (!verbose && changed.length > toShow.length) {
        console.log('');
        console.log(`${changed.length - toShow.length} other changed documents not shown. Re-run with --verbose for all of them.`);
    }
}

async function restore(db, path) {
    const saved = await readBackup(path);
    const live = await readLive(db);

    const ids = Object.keys(saved.documents);
    const orphans = Object.keys(live).filter((id) => !saved.documents[id]);
    const willChange = ids.filter(
        (id) => !live[id] || JSON.stringify(live[id]) !== JSON.stringify(saved.documents[id]),
    );

    console.log(`backup:  ${ids.length} documents, taken ${saved.exportedAt}`);
    console.log(`live:    ${Object.keys(live).length} documents`);
    console.log('');
    console.log(`would overwrite:  ${willChange.length} document(s) that differ from the backup`);
    console.log(`would leave:      ${ids.length - willChange.length} already identical`);
    console.log(
        `live-only:        ${orphans.length}${orphans.length ? ` (${orphans.join(', ')})` : ''}${
            orphans.length ? (prune ? ' -- WILL BE DELETED (--prune)' : ' -- left alone, pass --prune to delete') : ''
        }`,
    );

    if (!confirmed) {
        console.log('');
        console.log('Dry run. Nothing was written.');
        console.log(`Re-run with --yes to restore:`);
        console.log(
            `   node --env-file=.env.local scripts/backup-division-teams.mjs --restore ${path} --yes${prune ? ' --prune' : ''}`,
        );
        return;
    }

    console.log('');
    console.log('⚠️  Writing...');

    let written = 0;
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
        const batch = db.batch();
        for (const id of ids.slice(i, i + BATCH_SIZE)) {
            batch.set(db.collection(COLLECTION).doc(id), decode(saved.documents[id]));
        }
        await batch.commit();
        written += Math.min(BATCH_SIZE, ids.length - i);
        console.log(`   ${written}/${ids.length}`);
    }

    if (prune && orphans.length > 0) {
        const batch = db.batch();
        for (const id of orphans) batch.delete(db.collection(COLLECTION).doc(id));
        await batch.commit();
        console.log(`   deleted ${orphans.length} live-only document(s)`);
    }

    console.log('');
    console.log(`✅ restored ${ids.length} documents from ${path}`);
}

// ---------------------------------------------------------------------------

const { db, projectId, databaseId } = connect();

if (compareFile) {
    await compare(db, compareFile);
} else if (restoreFile) {
    await restore(db, restoreFile);
} else {
    await backup(db, { projectId, databaseId });
}

process.exit(0);
