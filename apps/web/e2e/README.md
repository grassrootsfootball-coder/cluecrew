# Writing e2e tests here

Two failure modes have cost real time. Both are invisible in CI and both are about the
*environment* a test assumes rather than the behaviour it checks.

## 1. Do not assert on an empty database

CI seeds a fresh database. A developer's machine holds a real library — hundreds of misconceptions,
thirteen of them PROPOSED, items at every status. **An assertion that only holds when the test's own
row is the only row will pass in CI forever and fail the moment it meets real content.**

The instance that taught us this (`corpus-gates.spec.ts`, 2026-08-09):

```ts
// WRONG — "after approving, the queue disappears". True only if this proposal was the only one.
await expect(page.getByTestId('proposed-queue')).not.toBeVisible();

// RIGHT — what the test is actually about: THIS entry left the queue.
await expect(proposedCard).toHaveCount(0);
```

It had been passing in CI since it was written. It says nothing about the system; it says the
database was empty.

**The four patterns that are safe**, all already used in this suite — prefer them:

| pattern | example |
|---|---|
| scope to the row your test created, by id | `getByTestId(\`rejected-${id}\`)` — `reviewer-surfaces` |
| derive the expectation from the database | `expect(links).toBe(await prisma.case.count({ where: { freeTier: true } }))` — `entitlements` |
| assert a floor, not an equality, when others may add rows | `expect(selected).toBeGreaterThanOrEqual(ids.length)` — `reviewer-surfaces` |
| filter a payload to your own fixture before counting | `report.sittings.filter((s) => s.blueprintId === BLUEPRINT.id)` — `mock-papers` |

Absence asserted because of **behaviour** is fine and is not this fault: a feature flag hiding the
shelf (`story-flag`), CSP blocking a request (`csp`), a role gate refusing a page (`cms-publish-gate`),
a marketing page with no pricing (`demand-test`). Those are true on any database. The test is
whether a real library could falsify the assertion.

## 2. The suite has ordering-dependent state coupling

Some tests fail only inside a full local run, passing both in isolation and in CI. **Which tests
those are changes between runs.** Two consecutive clean full runs on the same commit produced
different casualties — `daily-loop`, `nvr-samples`, `session-integrity` in one; `reviewer-surfaces`,
`story-flag` in the next — and every one of them passed when run alone.

So this is not a list of five flaky tests to fix. It is **shared state across the suite**: 71 tests
against one dev server and one database, where any test can be the victim of what ran before it.

**They are not treated as findings, but they are not nothing either: a suite that produces a
different failure set each run cannot be trusted to fail for a real reason later.** If a full run
reports a failure, re-run that spec alone before believing it. The durable fix is fixture isolation
per spec, not chasing whichever test lost this time.

## Locators

Prefer structure over prose. `locator('details', { has: card })` survives a copy edit;
`locator('summary', { hasText: 'Or decide them one at a time' })` does not, and picked the wrong one
of two sibling disclosures when it was tried. The same suite has been broken three separate times by
button labels changing (`Import as PROPOSED` → `Import as proposals`, `Approve — activates` →
`Approve — question writers can use it`).

## Running them

```
pnpm --filter @cluecrew/web e2e                       # everything (~14 min)
pnpm --filter @cluecrew/web exec playwright test e2e/corpus-gates.spec.ts   # one spec
```

Never run two Playwright invocations at once. They share port 3100 and the database; the runs starve
each other and report failures that mean nothing. A full suite once reported per-file durations of
*12.8 hours* under contention.
