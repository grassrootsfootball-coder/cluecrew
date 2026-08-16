"""
ANCHORED FILE EDITING THAT ASSERTS BY DEFAULT — `python3 tools/edit.py`, or `from tools.edit import sub`.

THE THIRD MECHANISM THIS MONTH THAT REPORTS SUCCESS ON DOING NOTHING (David, 2026-08-16).
`str.replace` returns the string unchanged when the anchor does not match. It does not raise, does
not warn, and the script exits 0. Twice in one turn an edit silently no-opped on a mismatched
anchor and every downstream check stayed green, because a check cannot see an edit that was never
made:

  · the Addendum 36 empty-population declaration was never inserted into `check-line-refs.ts`,
    while `typecheck:scripts` passed over the file it was supposed to be in;
  · the `attractorLine`/`defeaterLine` columns were never added to the schema, and the migration
    that should have carried them emitted an unrelated `ALTER` instead — which is how Prisma's
    revert of the R80 clock fix came to be discovered, by accident, from an empty migration.

It is the same family as `verify:solutions` printing "0 MATHS items checked" (R60) and a gate whose
population is empty for a reason nobody declared (R61): the operation is CORRECT, the report is
TRUE, and neither says that nothing happened.

**ASSERTING IS THE DEFAULT AND NOT-ASSERTING NEEDS A NAME.** `sub()` raises unless the anchor is
found exactly `count` times. A deliberate no-op must say `required=False`, which is a word someone
has to type on purpose and a reviewer can see in the diff — the same shape as `declareMayBeEmpty`.
"""
from __future__ import annotations

import sys
from pathlib import Path


class AnchorError(RuntimeError):
    """Raised when an anchor is absent, or present a different number of times than expected."""


def sub(text: str, old: str, new: str, *, count: int = 1, required: bool = True) -> str:
    """
    Replace `old` with `new`, asserting that it occurred exactly `count` times.

    `required=False` permits zero occurrences — for a genuinely idempotent edit that may already
    have been applied. It never permits the WRONG number: two matches where one was expected is
    still an error, because an anchor that is not unique is an anchor that edited something else
    as well.
    """
    found = text.count(old)
    if found == count:
        return text.replace(old, new, count)
    if found == 0 and not required:
        return text
    raise AnchorError(
        f"anchor matched {found} time(s), expected {count}.\n"
        f"  anchor: {old[:140]!r}\n"
        "  Nothing was written. An edit that silently matches nothing is the fault this exists for."
    )


def edit_file(path: str | Path, pairs: list[tuple[str, str]], *, required: bool = True) -> int:
    """
    Apply every (old, new) pair to a file, or write NOTHING.

    All-or-nothing on purpose: a partially applied set of edits is the half-applied-import fault in
    a text editor, and it leaves a file whose state matches neither the before nor the intent.
    """
    p = Path(path)
    original = p.read_text()
    text = original
    for old, new in pairs:
        text = sub(text, old, new, required=required)
    if text == original:
        return 0
    p.write_text(text)
    return len(pairs)


def main(argv: list[str]) -> int:
    if len(argv) < 4 or len(argv) % 2 != 0:
        print("usage: edit.py <file> <old> <new> [<old> <new> ...]", file=sys.stderr)
        return 2
    path, rest = argv[1], argv[2:]
    pairs = list(zip(rest[0::2], rest[1::2]))
    try:
        n = edit_file(path, pairs)
    except AnchorError as e:
        print(f"REFUSED — {e}", file=sys.stderr)
        return 1
    print(f"applied {n} edit(s) to {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
