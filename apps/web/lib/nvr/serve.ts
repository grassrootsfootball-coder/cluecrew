/**
 * The NVR serving door, server side (BUILD-DISTRICT-NVR §4 + gate #2).
 *
 * core's serveNvrItem holds the RULE — signed version, unvoided signature,
 * every distractor's misconception ACTIVE, in-range seed, checks green. This
 * module is only the plumbing: it loads the reviewer signature row and the
 * misconception statuses and hands them over. The rule stays pure and unit
 * tested; nothing here re-decides anything.
 *
 * What travels to the device is childPayload() — no isCorrect flag, no
 * misconception tags. Grading stays on this side of the wire, exactly like
 * mock sittings.
 */
import { prisma } from '@cluecrew/db';
import {
  childPayload,
  gradeNvrChoice,
  serveNvrItem,
  templateById,
  templateFingerprint,
  type NvrChildPayload,
  type NvrTemplate,
  type SeedKind,
  type ServeRefusal,
} from '@cluecrew/core';

export type NvrServeResult = { ok: true; payload: NvrChildPayload } | ServeRefusal;

/**
 * The behavioural fingerprint hashes five 30-item sample sheets, so it is
 * computed once per template version per process. Templates are compiled in,
 * so the cache can never go stale inside a running server.
 */
const fingerprints = new Map<string, string>();

function fingerprintFor(template: NvrTemplate): string {
  const key = `${template.id}@${template.version}`;
  const cached = fingerprints.get(key);
  if (cached) return cached;
  const fingerprint = templateFingerprint(template);
  fingerprints.set(key, fingerprint);
  return fingerprint;
}

async function misconceptionStates() {
  const rows = await prisma.misconception.findMany({
    where: { district: 'NVR' },
    select: { id: true, status: true },
  });
  return rows.map((row) => ({ id: row.id, status: row.status }));
}

/**
 * Serve one generated item, or refuse with the exact rule that blocked it.
 * The signature is loaded by template id at its HIGHEST signed version and
 * handed to core unfiltered — a signature for an older version must be seen
 * and refused as `unsigned-version`, not quietly missed by the query.
 */
export async function serveNvr(input: {
  templateId: string;
  kind: SeedKind;
  seed: number;
  tier: number;
}): Promise<NvrServeResult> {
  const template = templateById(input.templateId);
  if (!template) {
    return {
      ok: false,
      reason: 'unsigned-version',
      detail: `no template "${input.templateId}" is compiled in — nothing to serve`,
    };
  }

  const row = await prisma.nvrTemplateSignature.findFirst({
    where: { templateId: template.id },
    orderBy: { version: 'desc' },
  });

  const verdict = serveNvrItem({
    template,
    currentFingerprint: fingerprintFor(template),
    signature: row
      ? {
          templateId: row.templateId,
          version: row.version,
          fingerprint: row.fingerprint,
          signedBy: row.signedBy,
        }
      : null,
    misconceptions: await misconceptionStates(),
    kind: input.kind,
    seed: input.seed,
    tier: input.tier,
  });

  if (!verdict.ok) return verdict;
  return { ok: true, payload: childPayload(verdict.item) };
}

/**
 * Server-side grading: the client sends back the option index it tapped, and
 * the item is rebuilt from its identity rather than trusted from the wire.
 * Returns null when the item cannot be served — a refused item was never
 * answerable.
 */
export async function gradeNvr(input: {
  templateId: string;
  kind: SeedKind;
  seed: number;
  tier: number;
  optionIndex: number;
}): Promise<{ correct: boolean; misconceptionId: string | null } | null> {
  const template = templateById(input.templateId);
  if (!template) return null;
  const served = await serveNvr(input);
  if (!served.ok) return null;
  const graded = gradeNvrChoice(template.generate(input.seed, input.tier), input.optionIndex);
  return graded ? { correct: graded.correct, misconceptionId: graded.misconceptionId } : null;
}
