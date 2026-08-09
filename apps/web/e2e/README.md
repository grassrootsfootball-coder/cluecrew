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

## 2. The suite runs against a production build

`pnpm e2e` builds first and Playwright serves it with `next start` — the same binary CI runs. This
is not a preference; it was the fix for a whole class of trouble:

- **Speed.** The full suite went from ~12 minutes to **1.8**. Dev compiles each route on first hit.
- **Determinism.** Local and CI now differ in no way that matters, so "passes locally, fails in CI"
  stopped being a category.
- **It surfaced faults dev was hiding** — a read-after-write race that only loses on a fast server,
  and a middleware bug that only appears in a production build (see below).

`E2E_DEV=1 pnpm e2e:dev` opts back into the dev server for iterating on one spec.

**Do not add `retries`.** CI used to retry once, and the retry was quietly turning a real race
green. If a test is flaky, it is telling you something.

### On the ordering-dependent failures this file used to describe

Earlier runs against the dev server produced a different failure set each time — `daily-loop`,
`nvr-samples`, `session-integrity` in one run; `reviewer-surfaces`, `story-flag` in the next. That
looked like shared state across the suite and was written up here as such.

**It was not.** Against a production build the suite has run green twice consecutively, 71 for 71,
with no isolation work of any kind. The instability was the dev server's compile timing, not
cross-spec coupling — which is worth remembering the next time a suite looks like it needs
per-spec databases.

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
