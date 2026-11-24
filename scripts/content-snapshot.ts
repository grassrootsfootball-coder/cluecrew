/**
 * THE CONTENT SNAPSHOT (David, 2026-11-22 — R1039).
 *
 * WHY IT EXISTS. CI builds its database from migrations, the seed and the generator. Everything
 * imported or reviewed since August — English, the bank questions, every signature — lived only in
 * the dev database, so nineteen CI checks screened an empty or synthetic store and correctly refused
 * to call that a pass (R60). The checks were right; CI was reading a copy that was not the artefact
 * (R60 question 3). This file makes the artefact travel with the code.
 *
 * WHAT IT HOLDS. The content tables and their provenance, and nothing about families:
 *   QuestionType, Region, Case, Word, Misconception, Item, ItemOption, ItemOptionTag,
 *   Reviewer, AttributionEvent, FamilyBankSignature, NvrTemplateSignature,
 *   ContentWriteLog, AdminAuditLog.
 * That set is closed under foreign keys (no content row points at a family row). Parent, child,
 * session, attempt, billing and webhook tables are never exported.
 *
 * DETERMINISTIC. One TSV per table in Postgres COPY text format, rows ordered by primary key under
 * the C collation, columns named explicitly. Re-exporting unchanged content gives a byte-identical
 * tree, so `git diff` on the snapshot IS the content diff. The manifest carries no clock.
 *
 *   tsx scripts/content-snapshot.ts export    write packages/db/snapshot/ from DATABASE_URL
 *   tsx scripts/content-snapshot.ts restore   load it into DATABASE_URL — REFUSES unless every
 *                                             snapshot table is empty (a fresh, migrated database)
 *   tsx scripts/content-snapshot.ts check     compare DATABASE_URL with the committed snapshot,
 *                                             table by table; exits 1 on any difference
 *
 * ENCRYPTED IN GIT (David, 2026-11-22: "Encrypt it instead" — the repository is public). Three files:
 *   packages/db/snapshot.manifest.json  COMMITTED, plain: tables, columns, row counts, digests. A
 *                                       content change shows in review as a count and digest change.
 *   packages/db/snapshot.enc            COMMITTED, AES-256-GCM over the gzipped tables, with the
 *                                       manifest digest as authenticated data, so a ciphertext cannot
 *                                       be paired with a manifest it was not made for.
 *   packages/db/snapshot/               GITIGNORED plain TSVs, a local working copy only.
 * The key is SNAPSHOT_KEY (32 bytes, base64): the root .env locally, a GitHub Actions secret in CI.
 * GCM needs a fresh IV every time, so the ciphertext is rewritten ONLY when the digest changes —
 * otherwise every export would commit 2 MB of noise. RESTORE ALWAYS DECRYPTS THE COMMITTED FILE,
 * never the local TSVs: it loads the artefact CI loads, not a copy of it (R60 question 3).
 * No key is a refusal, never a skip. Pull requests from forks get no secrets, so they cannot restore.
 *
 * `check` is two tests depending on where it runs. In CI, straight after `restore`, it proves the
 * restore was faithful (reading the database, not the files). Locally against dev, it proves the
 * committed snapshot is not stale. It cannot prove freshness in CI — CI has no dev database — and
 * it says so on every run rather than letting a green round-trip read as "up to date".
 */
import { spawnSync } from 'node:child_process';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gunzipSync, gzipSync } from 'node:zlib';

const REPO = join(__dirname, '..');
const SNAPSHOT_DIR = join(REPO, 'packages', 'db', 'snapshot');
const MANIFEST_FILE = join(REPO, 'packages', 'db', 'snapshot.manifest.json');
const CIPHER_FILE = join(REPO, 'packages', 'db', 'snapshot.enc');
const MAGIC = Buffer.from('CCSNAP1');

function key(): Buffer {
  const k = process.env.SNAPSHOT_KEY;
  if (!k) throw new Error('SNAPSHOT_KEY is not set — the snapshot is encrypted (R1039). Locally it lives in the root .env; in CI it is a repository secret. This is a refusal, not a skip.');
  const b = Buffer.from(k, 'base64');
  if (b.length !== 32) throw new Error(`SNAPSHOT_KEY must be 32 bytes of base64; it decodes to ${b.length}`);
  return b;
}
function encrypt(files: Map<string, string>, digest: string): Buffer {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', key(), iv);
  c.setAAD(Buffer.from(digest));
  const body = Buffer.concat([c.update(gzipSync(JSON.stringify(Object.fromEntries(files)), { level: 9 })), c.final()]);
  return Buffer.concat([MAGIC, iv, c.getAuthTag(), body]);
}
function decrypt(digest: string): Map<string, string> {
  if (!existsSync(CIPHER_FILE)) throw new Error(`no encrypted snapshot at ${CIPHER_FILE}`);
  const buf = readFileSync(CIPHER_FILE);
  if (!buf.subarray(0, MAGIC.length).equals(MAGIC)) throw new Error(`${CIPHER_FILE}: not a CCSNAP1 file`);
  const iv = buf.subarray(7, 19); const tag = buf.subarray(19, 35);
  const d = createDecipheriv('aes-256-gcm', key(), iv);
  d.setAAD(Buffer.from(digest)); d.setAuthTag(tag);
  let plain: Buffer;
  try { plain = Buffer.concat([d.update(buf.subarray(35)), d.final()]); } catch {
    throw new Error('snapshot.enc failed authentication — wrong SNAPSHOT_KEY, or the ciphertext does not belong to this manifest');
  }
  const obj = JSON.parse(gunzipSync(plain).toString('utf8')) as Record<string, unknown>;
  const files = new Map<string, string>();
  for (const [k, v] of Object.entries(obj)) { if (typeof v !== 'string') throw new Error(`snapshot.enc: ${k} is not text (R173)`); files.set(k, v); }
  return files;
}

/** Restore order: parents before children. Order matters only for readability — FK triggers are
 *  off during restore — but a reader should be able to follow it. */
export const SNAPSHOT_TABLES = [
  'QuestionType', 'Region', 'Case', 'Word', 'Misconception', 'Item', 'ItemOption', 'ItemOptionTag',
  'Reviewer', 'AttributionEvent', 'FamilyBankSignature', 'NvrTemplateSignature',
  'ContentWriteLog', 'AdminAuditLog',
] as const;

interface TableEntry { table: string; columns: string[]; primaryKey: string[]; rows: number; sha256: string }
interface Manifest {
  ruling: 'R1039';
  note: string;
  latestMigration: string;
  tables: TableEntry[];
  digest: string;
}

function dbUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  // psql rejects Prisma's ?schema= parameter.
  return url.replace(/\?.*$/, '');
}

function psql(args: string[], input?: string): string {
  const r = spawnSync('psql', [dbUrl(), '-X', '-v', 'ON_ERROR_STOP=1', ...args], {
    input, encoding: 'utf8', maxBuffer: 1024 * 1024 * 1024,
  });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`psql failed (${r.status}): ${r.stderr.trim()}`);
  return r.stdout;
}
const q = (sql: string) => psql(['-At', '-c', sql]).replace(/\n$/, '');
const ident = (s: string) => `"${s.replace(/"/g, '""')}"`;
const sha = (b: string | Buffer) => createHash('sha256').update(b).digest('hex');

function columnsOf(table: string): string[] {
  const out = q(`select column_name from information_schema.columns where table_schema='public' and table_name='${table}' order by ordinal_position`);
  if (!out) throw new Error(`table ${table}: not in this database`);
  return out.split('\n');
}
function primaryKeyOf(table: string): string[] {
  const out = q(`select a.attname from pg_index i join pg_attribute a on a.attrelid=i.indrelid and a.attnum = any(i.indkey)
    where i.indrelid='public.${ident(table)}'::regclass and i.indisprimary order by array_position(i.indkey, a.attnum)`);
  if (!out) throw new Error(`table ${table}: no primary key — rows cannot be ordered deterministically`);
  return out.split('\n');
}
function latestMigration(): string {
  return q(`select migration_name from _prisma_migrations where finished_at is not null order by migration_name desc limit 1`);
}

/** Dump one table, ordered, as COPY text. Text-typed key columns sort under "C" so the order does
 *  not depend on the database's collation (dev is C, CI is en_US). */
function dumpTable(table: string, columns: string[], pk: string[]): string {
  const textKeys = new Set(q(`select column_name from information_schema.columns where table_schema='public' and table_name='${table}'
    and data_type in ('text','character varying')`).split('\n'));
  const order = pk.map((c) => (textKeys.has(c) ? `${ident(c)} collate "C"` : ident(c))).join(', ');
  return psql(['-c', `\\copy (select ${columns.map(ident).join(', ')} from ${ident(table)} order by ${order}) to stdout`]);
}

function build(): { manifest: Manifest; files: Map<string, string> } {
  const files = new Map<string, string>();
  const tables: TableEntry[] = [];
  for (const table of SNAPSHOT_TABLES) {
    const columns = columnsOf(table);
    const primaryKey = primaryKeyOf(table);
    const body = dumpTable(table, columns, primaryKey);
    const rows = body === '' ? 0 : body.split('\n').length - 1;
    files.set(`${table}.tsv`, body);
    tables.push({ table, columns, primaryKey, rows, sha256: sha(body) });
  }
  const digest = sha(tables.map((t) => `${t.table}:${t.sha256}`).join('\n')).slice(0, 16);
  return {
    manifest: {
      ruling: 'R1039',
      note: 'Content tables of the dev database, for CI. Regenerate with `pnpm snapshot:export`; never hand-edit.',
      latestMigration: latestMigration(), tables, digest,
    },
    files,
  };
}

function readManifest(): Manifest {
  const f = MANIFEST_FILE;
  if (!existsSync(f)) throw new Error(`no snapshot at ${f} — run \`pnpm snapshot:export\` against the dev database`);
  const m = JSON.parse(readFileSync(f, 'utf8')) as Partial<Manifest>;
  // R173: a reader refuses a shape it cannot parse.
  if (!Array.isArray(m.tables) || typeof m.digest !== 'string') throw new Error(`${f}: expected {tables[], digest}`);
  return m as Manifest;
}

/** Write the snapshot. Exported so an apply script can call it as its final step. */
export function exportContentSnapshot(): Manifest {
  const { manifest, files } = build();
  const total = manifest.tables.reduce((n, t) => n + t.rows, 0);
  const items = manifest.tables.find((t) => t.table === 'Item')?.rows ?? 0;
  // R60: an export that delivers must REFUSE to supersede a good artefact with a blind one.
  if (items === 0) throw new Error('export REFUSED — the source database holds no Item rows; this is not the dev store');
  mkdirSync(SNAPSHOT_DIR, { recursive: true });
  const keep = new Set(files.keys());
  for (const f of readdirSync(SNAPSHOT_DIR)) if (!keep.has(f)) rmSync(join(SNAPSHOT_DIR, f));
  for (const [name, body] of files) writeFileSync(join(SNAPSHOT_DIR, name), body);
  const previous = existsSync(MANIFEST_FILE) ? (JSON.parse(readFileSync(MANIFEST_FILE, 'utf8')) as { digest?: string }).digest : undefined;
  const unchanged = previous === manifest.digest && existsSync(CIPHER_FILE);
  if (!unchanged) writeFileSync(CIPHER_FILE, encrypt(files, manifest.digest));
  writeFileSync(MANIFEST_FILE, `${JSON.stringify(manifest, null, 1)}\n`);
  // Prove the committed file opens with the key we hold, before anyone commits it.
  const back = decrypt(manifest.digest);
  for (const [name, body] of files) if (back.get(name) !== body) throw new Error(`snapshot.enc round trip FAILED on ${name}`);
  console.log(`snapshot: ${total} rows across ${manifest.tables.length} tables, digest ${manifest.digest} — ` +
    (unchanged ? 'content unchanged, snapshot.enc left as it was' : `snapshot.enc rewritten (${readFileSync(CIPHER_FILE).length} bytes)`));
  for (const t of manifest.tables) console.log(`  ${t.table.padEnd(22)} ${String(t.rows).padStart(6)}`);
  return manifest;
}

function restore(): void {
  const m = readManifest();
  const nonEmpty = m.tables.map((t) => ({ t: t.table, n: Number(q(`select count(*) from ${ident(t.table)}`)) })).filter((x) => x.n > 0);
  if (nonEmpty.length) {
    throw new Error(`restore REFUSED — these tables already hold rows: ${nonEmpty.map((x) => `${x.t} (${x.n})`).join(', ')}.\n` +
      'Restore only loads a freshly migrated database; it never merges into or replaces a store.');
  }
  const have = latestMigration();
  if (have !== m.latestMigration) {
    throw new Error(`restore REFUSED — snapshot was taken at migration ${m.latestMigration}, this database is at ${have}. ` +
      'Re-export the snapshot after migrating dev.');
  }
  const files = decrypt(m.digest);
  const stage = mkdtempSync(join(tmpdir(), 'cc-snapshot-'));
  for (const t of m.tables) {
    const body = files.get(`${t.table}.tsv`);
    if (body === undefined) throw new Error(`snapshot.enc holds no ${t.table}.tsv`);
    if (sha(body) !== t.sha256) throw new Error(`${t.table}.tsv does not match its manifest digest`);
    writeFileSync(join(stage, `${t.table}.tsv`), body);
  }
  // One transaction, with the content-write triggers off: the write log must hold the dev history, not
  // 45,000 rows of "restore wrote this". A SUPERUSER switches every trigger off (session_replication_role
  // = replica), so FK order is not load-bearing. A hosted database's OWNER is not a superuser (Neon,
  // R1066): it disables only this repo's own triggers (DISABLE TRIGGER USER, which an owner may do) and
  // the foreign keys stay ENFORCED — safe because SNAPSHOT_TABLES lists every parent before its children.
  const superuser = q(`select rolsuper from pg_roles where rolname = current_user`) === 't';
  const off = superuser ? ['set session_replication_role = replica;'] : m.tables.map((t) => `alter table ${ident(t.table)} disable trigger user;`);
  const on = superuser ? ['set session_replication_role = origin;'] : m.tables.map((t) => `alter table ${ident(t.table)} enable trigger user;`);
  const script = ['begin;', ...off,
    ...m.tables.map((t) => `\\copy ${ident(t.table)} (${t.columns.map(ident).join(', ')}) from '${join(stage, `${t.table}.tsv`).replace(/'/g, "''")}'`),
    ...on, 'commit;'].join('\n');
  try { psql(['-q'], script); } finally { rmSync(stage, { recursive: true, force: true }); }
  // Serial columns: move each sequence past the restored maximum.
  for (const t of m.tables) {
    for (const col of t.columns) {
      const seq = q(`select pg_get_serial_sequence('public.${ident(t.table)}', '${col}')`);
      if (seq) q(`select setval('${seq}', greatest(coalesce((select max(${ident(col)}) from ${ident(t.table)}), 0), 1))`);
    }
  }
  const total = m.tables.reduce((n, t) => n + t.rows, 0);
  console.log(`restore: loaded snapshot ${m.digest} — ${total} rows across ${m.tables.length} tables`);
  check(true);
}

function check(afterRestore = false): void {
  const m = readManifest();
  const { manifest: now } = build();
  const byName = new Map(now.tables.map((t) => [t.table, t]));
  const faults: string[] = [];
  for (const t of m.tables) {
    const n = byName.get(t.table);
    if (!n) { faults.push(`${t.table}: in the snapshot, not in this database`); continue; }
    if (n.columns.join(',') !== t.columns.join(',')) faults.push(`${t.table}: columns differ (snapshot ${t.columns.length}, database ${n.columns.length})`);
    else if (n.sha256 !== t.sha256) faults.push(`${t.table}: rows differ (snapshot ${t.rows}, database ${n.rows})`);
  }
  for (const n of now.tables) if (!m.tables.some((t) => t.table === n.table)) faults.push(`${n.table}: in this database, not in the snapshot`);
  const total = m.tables.reduce((n, t) => n + t.rows, 0);
  if (total === 0) faults.push('the snapshot holds no rows at all');
  console.log(`snapshot check: compared ${m.tables.length} tables, ${total} snapshot rows, digest ${m.digest} → database digest ${now.digest}`);
  console.log(afterRestore || process.env.CI
    ? '  (this database was loaded FROM the snapshot: a match proves the restore is faithful, NOT that the snapshot is current with dev)'
    : '  (against this database: a match proves the committed snapshot is current with it)');
  if (faults.length) {
    for (const f of faults) console.error(`  ✗ ${f}`);
    console.error(afterRestore ? 'restore was NOT faithful.' : 'snapshot is STALE — run `pnpm snapshot:export` and commit packages/db/snapshot.manifest.json and snapshot.enc.');
    process.exit(1);
  }
  console.log('  ✓ every table matches');
}

if (require.main === module) {
  const mode = process.argv[2];
  try {
    if (mode === 'export') exportContentSnapshot();
    else if (mode === 'restore') restore();
    else if (mode === 'check') check();
    else throw new Error('usage: content-snapshot.ts export | restore | check');
  } catch (e) {
    console.error((e as Error).message);
    process.exit(1);
  }
}
