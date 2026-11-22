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
 * `check` is two tests depending on where it runs. In CI, straight after `restore`, it proves the
 * restore was faithful (reading the database, not the files). Locally against dev, it proves the
 * committed snapshot is not stale. It cannot prove freshness in CI — CI has no dev database — and
 * it says so on every run rather than letting a green round-trip read as "up to date".
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO = join(__dirname, '..');
const SNAPSHOT_DIR = join(REPO, 'packages', 'db', 'snapshot');

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
  const f = join(SNAPSHOT_DIR, 'manifest.json');
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
  const keep = new Set([...files.keys(), 'manifest.json']);
  for (const f of readdirSync(SNAPSHOT_DIR)) if (!keep.has(f)) rmSync(join(SNAPSHOT_DIR, f));
  for (const [name, body] of files) writeFileSync(join(SNAPSHOT_DIR, name), body);
  writeFileSync(join(SNAPSHOT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 1)}\n`);
  console.log(`snapshot: ${total} rows across ${manifest.tables.length} tables, digest ${manifest.digest}`);
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
  for (const t of m.tables) {
    const body = readFileSync(join(SNAPSHOT_DIR, `${t.table}.tsv`), 'utf8');
    if (sha(body) !== t.sha256) throw new Error(`${t.table}.tsv does not match its manifest digest — the file was edited by hand`);
  }
  // One transaction. Triggers off (session_replication_role = replica): the write log must hold the
  // dev history, not 6,000 rows of "restore wrote this", and FK order is then not load-bearing.
  const script = ['begin;', 'set session_replication_role = replica;',
    ...m.tables.map((t) => `\\copy ${ident(t.table)} (${t.columns.map(ident).join(', ')}) from '${join(SNAPSHOT_DIR, `${t.table}.tsv`).replace(/'/g, "''")}'`),
    'set session_replication_role = origin;', 'commit;'].join('\n');
  psql(['-q'], script);
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
    console.error(afterRestore ? 'restore was NOT faithful.' : 'snapshot is STALE — run `pnpm snapshot:export` and commit packages/db/snapshot/.');
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
