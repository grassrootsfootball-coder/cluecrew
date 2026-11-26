/**
 * NO SHIPPED CODE SPENDS MODEL TOKENS UNLESS IT IS DECLARED, SIGNED-IN AND CAPPED —
 * `pnpm check:model-spend` (R1075)
 *
 * Today nothing in apps/ or packages/ calls a language-model provider (measured 2026-11-26), so no
 * request to the site can spend money on our behalf, and S3 holds: no conversational AI talks to a
 * child. This makes that a property of the code rather than of the day it was measured. Any import
 * of a model SDK, any provider URL, or any such package in a shipped package.json fails — unless the
 * file is DECLARED below with the sign-in it sits behind, the per-user cap that bounds it, and the
 * register entry that approved it. A declaration with an empty field is refused.
 *
 * CANARY: planted positives are run through the detector first (R60 Q2).
 */
import { readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { requirePopulation } from './lib/population';
import { stripComments, walkSource } from './lib/source-walk';

const ROOT = resolve(import.meta.dirname, '..');
const SCAN = ['apps', 'packages'];

const PROVIDER_PACKAGES = /^(@anthropic-ai\/|openai$|ai$|@ai-sdk\/|@google\/generative-ai|@google\/genai|@mistralai\/|cohere-ai$|replicate$|groq-sdk$|@vercel\/ai)/;
const IMPORT = /(?:from\s+|import\s*\(\s*|require\s*\(\s*)['"]([^'"]+)['"]/g;
const PROVIDER_URL = /(api\.anthropic\.com|api\.openai\.com|ai-gateway\.vercel\.sh|generativelanguage\.googleapis\.com|api\.mistral\.ai|api\.groq\.com|api\.replicate\.com)/;

/** Every model-spending file, declared. Empty today; an entry needs all three fields. */
const DECLARED: Record<string, { signIn: string; perUserCap: string; ruling: string }> = {};

const PLANTED = ["import Anthropic from '@anthropic-ai/sdk';", "import { generateText } from 'ai';", "const { openai } = await import('@ai-sdk/openai');", "fetch('https://api.openai.com/v1/chat/completions')"];
const SAFE = ["import { z } from 'zod';", "import { aiHint } from './ai-hint';"];

function hits(src: string): string[] {
  const out: string[] = [];
  for (const m of src.matchAll(IMPORT)) if (PROVIDER_PACKAGES.test(m[1]!)) out.push(`imports ${m[1]}`);
  const u = src.match(PROVIDER_URL);
  if (u) out.push(`calls ${u[1]}`);
  return out;
}

function main(): void {
  const blind = PLANTED.filter((s) => hits(s).length === 0);
  const overeager = SAFE.filter((s) => hits(s).length > 0);
  if (blind.length || overeager.length) {
    console.error('check:model-spend ABORTED — the detector no longer separates provider calls from ordinary code.');
    for (const s of blind) console.error(`  MISSED planted provider call: ${s}`);
    for (const s of overeager) console.error(`  FLAGGED ordinary code: ${s}`);
    process.exit(1);
  }
  for (const [f, d] of Object.entries(DECLARED)) {
    if (!d.signIn.trim() || !d.perUserCap.trim() || !d.ruling.trim()) {
      console.error(`check:model-spend ABORTED — declaration for ${f} has an empty field; sign-in, per-user cap and ruling are all required.`);
      process.exit(1);
    }
  }

  const files = SCAN.flatMap((d) => walkSource(join(ROOT, d)));
  const manifests = SCAN.flatMap((d) => walkSource(join(ROOT, d), /^package\.json$/));
  requirePopulation('check:model-spend', { 'shipped source files (apps/, packages/)': files.length, 'package.json manifests': manifests.length });

  const faults: string[] = [];
  for (const f of files) {
    const rel = relative(ROOT, f);
    const h = hits(stripComments(readFileSync(f, 'utf8')));
    if (h.length && !DECLARED[rel]) faults.push(`${rel} — ${h.join('; ')}`);
  }
  for (const m of manifests) {
    const j = JSON.parse(readFileSync(m, 'utf8')) as Record<string, Record<string, string> | undefined>;
    for (const k of ['dependencies', 'devDependencies', 'optionalDependencies'])
      for (const dep of Object.keys(j[k] ?? {})) if (PROVIDER_PACKAGES.test(dep)) faults.push(`${relative(ROOT, m)} — depends on ${dep}`);
  }
  console.log(`  ${Object.keys(DECLARED).length} declared model-spending file(s).`);
  if (faults.length) {
    console.error(`\nUNDECLARED MODEL SPEND in shipped code (${faults.length}):`);
    for (const x of faults) console.error(`  ✗ ${x}`);
    console.error(
      '\nA route that calls a model provider spends money on every request and may put generated text\n' +
        'in front of a child (manifesto S3). It needs sign-in, a per-user cap, and a ruling — declare all\n' +
        'three in DECLARED in scripts/check-model-spend.ts, or remove the call.',
    );
    process.exit(1);
  }
  console.log('Model spend: no shipped code calls a model provider outside a declared, capped entry.');
}

main();
