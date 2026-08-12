/**
 * THE CANONICAL ITEM STEM SCHEMA — one definition, every import door.
 *
 * PASSTHROUGH PLUS VALIDATE-KNOWN-KEYS (David's ruling, 2026-08-12, R57). A stem is an open JSON
 * object: it holds whatever the district needs — `words` and `series` for VR, `operands` for maths,
 * `passageRef`/`lineRefs`/`quotes` for English comprehension, `sentence` for the error-spot and
 * cloze formats where the sentence IS the item. Twenty distinct keys exist across the live bank.
 *
 * So a stem is validated, never filtered: every key the schema KNOWS is checked when present, and
 * every key it does not know passes through untouched. The alternative — an allowlist that drops
 * what it cannot name — is a gate that fails OPEN and reports success, and it silently destroyed a
 * declared field four times before this rule existed (R23 `quotes`, R42 `passageNames`, R55
 * `techniqueKey`, and the latent `sentence` gap R56 measured).
 *
 * THIS FILE IS THE STANDARD FOR ANY FUTURE IMPORT PATH. A new door validates a stem by calling
 * `stemSchema` here — never by re-listing the fields it expects. Two doors that enumerate
 * separately will disagree, which is R42's finding and was true again in R55: the CMS door passed
 * a stem through while the script door stripped it, so the same authored item survived one and not
 * the other. One definition is what makes them agree by construction rather than by coincidence.
 */
import { z } from 'zod';

export const stemSchema = z.record(z.unknown()).superRefine((stem, ctx) => {
  if ('passageRef' in stem) {
    const value = stem.passageRef;
    if (typeof value !== 'string' || value.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['passageRef'],
        message: 'passageRef must be a non-empty passage id string',
      });
    }
  }
  if ('lineRefs' in stem) {
    const value = stem.lineRefs;
    const isCanonical =
      Array.isArray(value) && value.every((line) => Number.isInteger(line) && (line as number) > 0);
    if (!isCanonical) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['lineRefs'],
        message:
          'lineRefs must be an array of positive integers — a {from,to} range is the superseded shape; author "lines 12–14" as [12, 13, 14]',
      });
    }
  }
  // Inline quotation (2026-08-02): a stem declares the spans it quotes from
  // its passage, so the ban list can step over exactly those characters. The
  // span must genuinely appear in the prompt — a declared quote that is not
  // there is a claim, not a quote.
  if ('quotes' in stem) {
    const quotes = stem.quotes;
    const prompt = typeof stem.prompt === 'string' ? stem.prompt : '';
    if (!Array.isArray(quotes)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['quotes'], message: 'quotes must be an array' });
    } else {
      quotes.forEach((quote, index) => {
        const entry = quote as { text?: unknown; passageRef?: unknown };
        if (typeof entry.text !== 'string' || entry.text.trim().length < 3) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['quotes', index, 'text'],
            message: 'a quoted span needs its text, at least 3 characters',
          });
          return;
        }
        if (!prompt.includes(entry.text.trim())) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['quotes', index, 'text'],
            message: `the declared quote is not in the stem: "${entry.text.slice(0, 30)}"`,
          });
        }
        if (typeof entry.passageRef !== 'string' || !entry.passageRef.trim()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['quotes', index, 'passageRef'],
            message: 'a quoted span must name the passage it came from',
          });
        } else if (typeof stem.passageRef === 'string' && entry.passageRef !== stem.passageRef) {
          // You may only quote the passage this item is about.
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['quotes', index, 'passageRef'],
            message: `quote cites "${entry.passageRef}" but the item reads "${stem.passageRef}"`,
          });
        }
      });
    }
  }
  // Tested tokens (2026-08-02): the words an item exists to test, exempt from
  // the vocabulary ceiling inside this item only. A token that appears
  // nowhere in the item is a claim, not a test — the stem check below is the
  // cheap half; the option check happens at import, which can see them.
  if ('testedTokens' in stem) {
    const tokens = stem.testedTokens;
    if (!Array.isArray(tokens) || tokens.some((token) => typeof token !== 'string' || !token.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['testedTokens'],
        message: 'testedTokens must be an array of non-empty strings',
      });
    } else if (tokens.length > 6) {
      // A generous ceiling that still refuses "exempt everything".
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['testedTokens'],
        message: 'at most 6 tested tokens per item — beyond that it is not a test, it is an exemption',
      });
    }
  }
  // Carrier sentence (2026-08-06): a stem sentence disambiguates the intended
  // sense of a word card — vr-04 at tiers 4-5, and vr-06's existing cloze
  // sentence. Bounds mirror the Word-Vault card sentence (content-schema
  // wordContentSchema.sentence). The child-facing gate screens it at the
  // word-card role (uncapped length, vocabulary ceiling holds).
  if ('sentence' in stem) {
    const value = stem.sentence;
    if (typeof value !== 'string' || value.trim().length < 3 || value.trim().length > 200) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sentence'],
        message: 'sentence must be a string of 3–200 characters',
      });
    }
  }
  if ('lineRefs' in stem && !('passageRef' in stem)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['passageRef'],
      message: 'lineRefs without a passageRef point at nothing',
    });
  }
});
