/**
 * THE SET OF FILES THAT CAN REACH A SURFACE, DERIVED BY FOLLOWING IMPORTS — NEVER HAND-KEPT.
 *
 * R57's discipline applied to reachability: a hand-kept list of "the files that serve children"
 * is an allowlist, and an allowlist drifts the moment someone adds a file. This walks the actual
 * import graph from declared entry roots, so a new module joins the closure on the commit that
 * imports it.
 *
 * IT RESOLVES WHAT IT CAN AND REPORTS WHAT IT CANNOT. An unresolved specifier is returned, not
 * swallowed — a closure that silently drops an import it failed to resolve is R173's failed read
 * returning empty, and every "not found in the closure" verdict built on it would be worthless.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const EXTS = ['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts'];

/** Specifiers we deliberately do not follow: they leave the repo or are type-only runtimes. */
function isExternal(spec: string): boolean {
  return !spec.startsWith('.') && !spec.startsWith('/');
}

function resolveFile(spec: string, fromFile: string): string | null {
  const base = resolve(dirname(fromFile), spec);
  const candidates = [
    base,
    ...EXTS.map((e) => `${base}${e}`),
    ...EXTS.map((e) => resolve(base, `index${e}`)),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

const SPECIFIER = /(?:^|\n)\s*(?:import|export)\s[^;\n]*?from\s+['"]([^'"]+)['"]/g;
const BARE_IMPORT = /(?:^|\n)\s*import\s+['"]([^'"]+)['"]/g;
const DYNAMIC = /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;

export type Closure = {
  /** Absolute paths of every file reachable from the roots, roots included. */
  files: string[];
  /** Relative specifiers that could not be resolved to a file — a fault, not a gap. */
  unresolved: { from: string; spec: string }[];
};

/**
 * Walk the import graph from `roots`. Package-name imports (`@cluecrew/core`) are followed when a
 * mapping is supplied — the workspace packages are in-repo, so their code IS in a child's bundle
 * and excluding them would understate the closure by the entire shared layer.
 */
export function importClosure(roots: string[], packageRoots: Record<string, string> = {}): Closure {
  const seen = new Set<string>();
  const unresolved: { from: string; spec: string }[] = [];
  const queue = [...roots];

  while (queue.length > 0) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    const src = readFileSync(file, 'utf8');
    const specs: string[] = [];
    for (const re of [SPECIFIER, BARE_IMPORT, DYNAMIC]) {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(src)) !== null) specs.push(m[1]!);
    }
    for (const spec of specs) {
      if (isExternal(spec)) {
        const pkg = Object.keys(packageRoots).find(
          (p) => spec === p || spec.startsWith(p.endsWith('/') ? p : `${p}/`),
        );
        if (!pkg) continue;
        const rest = spec.slice(pkg.length).replace(/^\//, '');
        const target = resolveFile(rest === '' ? './index' : `./${rest}`, `${packageRoots[pkg]!}/x.ts`);
        if (target) queue.push(target);
        else unresolved.push({ from: file, spec });
        continue;
      }
      const target = resolveFile(spec, file);
      if (target) queue.push(target);
      else unresolved.push({ from: file, spec });
    }
  }
  return { files: [...seen].sort(), unresolved };
}
