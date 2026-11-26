/**
 * Walk shipped source (apps/, packages/) for static boundary checks. Skips build output, generated
 * clients, node_modules and tests — the checks that use it are about code that SHIPS.
 */
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const SKIP_DIRS = new Set(['node_modules', '.next', '.turbo', 'dist', 'build', 'coverage', 'generated', 'e2e', 'migrations']);

export function walkSource(dir: string, exts = /\.(ts|tsx|mts|mjs|js|jsx)$/): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
      out.push(...walkSource(full, exts));
    } else if (exts.test(entry.name) && !/\.(test|spec)\./.test(entry.name) && !entry.name.endsWith('.d.ts')) out.push(full);
  }
  return out;
}

/** Strip comments only — strings stay, because a URL in a string is exactly what some checks look for. */
export function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
}
