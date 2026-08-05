"""
PASSAGE INTEGRITY AUDIT — David's instruction, 2026-08-02. REPORT ONLY.

"WIW-18 flags a probable normalisation error — Grahame's text has "it's", our
extract has "its". The curation brief demanded verbatim; if normalisation
stripped one, it may have stripped others."

METHOD. Tokens are aligned on a LETTERS-ONLY key, then the originals are
compared. That is the whole trick: "it's" and "its" both key to "its", so they
align as the same word and the difference in the original surfaces as a
discrepancy. A diff over raw text would not find this — it would show the two
sentences as different and leave a human to spot which character moved.

difflib does the alignment, so the fifteen documented editorial cuts fall out
as "delete" blocks rather than being mistaken for corruption; only the EQUAL
blocks are compared.

Stream B and C are commissioned originals with no external source. For those
the check is internal: numberedLines must reconstruct the body exactly.

Fixes nothing. Writes a report.
"""

import difflib
import json
import pathlib
import re
import shutil
import sys
from collections import Counter

GUTENBERG = pathlib.Path(sys.argv[1])
PASSAGES = pathlib.Path("content/passages")

# Which Gutenberg id each extract cites, taken from its own copyrightCheck.
QUOTE_CHARS = "'‘’“”\"ʼ‛„‟"


def strip_gutenberg(text):
    start = re.search(r"\*\*\* START OF TH[EIS]+ PROJECT GUTENBERG EBOOK.*?\*\*\*", text, re.S)
    end = re.search(r"\*\*\* END OF TH[EIS]+ PROJECT GUTENBERG EBOOK.*?\*\*\*", text, re.S)
    return text[start.end() if start else 0 : end.start() if end else len(text)]


def key(token):
    return re.sub(r"[^a-z0-9]", "", token.lower())


def tokenise(text):
    """(original, letters-only key) for every whitespace-separated token."""
    out = []
    for token in text.split():
        k = key(token)
        if k:
            out.append((token, k))
    return out


# Project Gutenberg's plain-text editions carry their own typesetting
# conventions: _underscores_ for italics, ALL CAPS for small capitals,
# [bracketed] editorial marks. Stripping those is what curating a plain
# extract MEANS, and reporting them as corruption would bury the real
# findings under thirty benign ones. They are separated, not hidden — the
# count is still printed, so nobody has to take this classification on trust.
BENIGN = "Gutenberg typesetting (expected)"


def classify(a, b):
    """What KIND of difference this is — the report is only useful if the
    families are separated. An apostrophe that vanished is a different
    problem from a curly quote that was flattened."""
    if b.replace("_", "") == a or b.replace("[", "").replace("]", "") == a:
        return BENIGN
    if b.isupper() and not a.isupper() and b.lower() == a.lower():
        return BENIGN
    if b.replace("_", "").replace("[", "").replace("]", "").lower() == a.lower():
        return BENIGN
    aq = [c for c in a if c in QUOTE_CHARS]
    bq = [c for c in b if c in QUOTE_CHARS]
    if len(aq) != len(bq):
        return "apostrophe/quote LOST" if len(aq) < len(bq) else "apostrophe/quote ADDED"
    if aq != bq:
        return "quote mark CHANGED"
    if a.lower() == b.lower():
        return "capitalisation"
    return "other punctuation"


def audit_stream_a(passage, source_text):
    body = " ".join(line["text"] for line in passage["numberedLines"] if line["n"] is not None)
    ours = tokenise(body)
    theirs = tokenise(source_text)

    # Anchor the search: find roughly where our extract sits, so the matcher
    # is not asked to align 900 tokens against 130,000.
    anchor_key = [k for _, k in ours[:14]]
    start = None
    src_keys = [k for _, k in theirs]
    for i in range(len(src_keys) - len(anchor_key)):
        if src_keys[i : i + len(anchor_key)] == anchor_key:
            start = i
            break
    if start is None:
        return None, [{"kind": "NOT FOUND", "detail": "the extract's opening does not appear in the source"}]
    window = theirs[start : start + int(len(ours) * 2.5) + 200]

    matcher = difflib.SequenceMatcher(None, [k for _, k in ours], [k for _, k in window], autojunk=False)
    opcodes = matcher.get_opcodes()
    # Where the documented editorial cuts land, in OUR token positions. A
    # difference sitting on one of these is a seam repair — the join of two
    # separately-verbatim spans — not corruption, and the distinction is the
    # entire question the curation brief asks.
    seams = [i1 for tag, i1, i2, j1, j2 in opcodes if tag != "equal"]

    findings = []
    matched = 0
    for tag, i1, i2, j1, j2 in opcodes:
        if tag != "equal":
            continue
        for offset in range(i2 - i1):
            matched += 1
            position = i1 + offset
            mine, source = ours[position][0], window[j1 + offset][0]
            if mine == source:
                continue
            at_seam = any(abs(position - seam) <= 2 for seam in seams)
            findings.append(
                {
                    "kind": classify(mine, source),
                    "atCutSeam": at_seam,
                    "ours": mine,
                    "source": source,
                    "context": " ".join(t for t, _ in ours[max(0, position - 5) : position + 6]),
                }
            )
    return matched, findings


def audit_commissioned(passage):
    """No external source: numberedLines must reconstruct the body."""
    rebuilt = " ".join(line["text"] for line in passage["numberedLines"] if line["n"] is not None)
    original = " ".join(passage["body"].split())
    if " ".join(rebuilt.split()) == original:
        return []
    matcher = difflib.SequenceMatcher(None, tokenise(original), tokenise(rebuilt), autojunk=False)
    out = []
    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            continue
        out.append(
            {
                "kind": f"numberedLines {tag}s text",
                "ours": " ".join(t for t, _ in tokenise(rebuilt)[j1:j2])[:80],
                "source": " ".join(t for t, _ in tokenise(original)[i1:i2])[:80],
            }
        )
    return out


def main():
    report = {"generated": "2026-08-02", "streamA": {}, "commissioned": {}, "totals": Counter()}
    for path in sorted(PASSAGES.glob("*.json")):
        passage = json.loads(path.read_text())
        pid = passage["id"]
        edition = (passage.get("copyrightCheck") or {}).get("sourceEdition", "")
        gid = re.search(r"#(\d+)", edition)
        if not gid:
            findings = audit_commissioned(passage)
            report["commissioned"][pid] = {"findings": findings}
            report["totals"][f"commissioned:{'clean' if not findings else 'DISCREPANT'}"] += 1
            continue
        source = strip_gutenberg((GUTENBERG / f"{gid.group(1)}.txt").read_text(encoding="utf-8"))
        matched, findings = audit_stream_a(passage, source)
        report["streamA"][pid] = {
            "gutenberg": gid.group(1),
            "tokensCompared": matched,
            "findings": findings,
            "claimedVerbatim": (passage.get("verbatimVerification") or {}).get("pct"),
        }
        for finding in findings:
            report["totals"][finding["kind"]] += 1

    print(f"STREAM A — {len(report['streamA'])} extracts against Project Gutenberg\n")
    for pid, entry in report["streamA"].items():
        marks = [f for f in entry["findings"] if f["kind"] != BENIGN]
        benign = len(entry["findings"]) - len(marks)
        status = "VERBATIM" if not marks else f"{len(marks)} discrepanc{'y' if len(marks) == 1 else 'ies'}"
        tail = f"  (+{benign} Gutenberg typesetting)" if benign else ""
        print(f"  {pid:34s} #{entry['gutenberg']:<6s} {entry['tokensCompared'] or 0:5d} tokens — {status}{tail}")
        for finding in marks:
            seam = " AT A DOCUMENTED CUT SEAM" if finding.get("atCutSeam") else ""
            print(f"       [{finding['kind']}]{seam} ours {finding.get('ours')!r} · source {finding.get('source')!r}")
            if finding.get("context"):
                print(f"          …{finding['context']}…")

    print(f"\nCOMMISSIONED (Stream B/C) — {len(report['commissioned'])} texts, internal consistency\n")
    for pid, entry in report["commissioned"].items():
        marks = entry["findings"]
        print(f"  {pid:34s} {'numberedLines reconstruct the body exactly' if not marks else f'{len(marks)} discrepancies'}")
        for finding in marks[:6]:
            print(f"       [{finding['kind']}] ours {finding['ours']!r} · body {finding['source']!r}")

    print("\nBY KIND:")
    for kind, count in sorted(report["totals"].items(), key=lambda pair: -pair[1]):
        print(f"  {count:4d}  {kind}")

    out = pathlib.Path("content/exports/passage-integrity-audit-2026-08-02.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    report["totals"] = dict(report["totals"])
    out.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n")
    print(f"\nWritten: {out}")
    # Delivered, not left for someone to remember — see
    # scripts/lib/export-destination.ts for why that distinction matters.
    outbound = pathlib.Path("/Users/davidb/Downloads/11+/from-cluecrew")
    outbound.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(out, outbound / out.name)
    print(f"  delivered -> {outbound / out.name}")


main()
