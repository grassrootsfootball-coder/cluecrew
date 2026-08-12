/**
 * THE FIRST-DELIVERY PATH — a chapter that came through the gates, at the status a first
 * chapter actually has.
 *
 * `story-lit.spec.ts` proves the reader renders A chapter. It does not prove a GATED chapter
 * renders: its fixture lives in `apps/web/e2e/fixtures/chapters/`, and `e2e` is an excluded
 * segment in the vocabulary scanner, so that file reaches the reader without passing
 * scan:vocab, check:reading-age or scan:chapter-style. A writer's first submission meets the
 * reader and the gates at the same moment, and until now nothing exercised both together.
 *
 * This spec serves `content/chapters/s9-ch01-gate-fixture.json` — the same directory a writer
 * delivers into, held to the same five gates (validate:content, scan:vocab, check:reading-age,
 * scan:chapter-style, verify:chapters), all of which run ahead of the e2e steps in CI.
 *
 * AND IT COVERS THE REVIEW STATUS, which is the status that first chapter has for as long as it
 * takes a reviewer to read it. `readable()` serves `released` everywhere and `review` only
 * outside production. Both halves are asserted here, because half of that rule is a promise
 * about what a child CANNOT see, and an untested promise of absence is the easiest kind to
 * break — a stray `APP_ENV`, an inverted condition, and unreviewed prose is live.
 *
 * Two servers, because APP_ENV is read from the server's environment: one staging, one
 * production, both with STORY_MODE=on and both reading `content/chapters`. Same file, same
 * flag, one variable between them (see playwright.story.config.ts).
 *
 * Season `fixture` rather than `s1`: the id cannot collide with the writer's real first
 * chapter, and the reader prints the season as its kicker, so anyone who reaches this page in a
 * staging environment reads "FIXTURE" above the title.
 */
import { expect, test } from '@playwright/test';
import { cleanupFixtures, createFamily, enterCrewMode, parentApi } from './fixtures';
import { assertServerEnv } from '../playwright.story.config';

/** Matches content/chapters/s9-ch01-gate-fixture.json. */
const CHAPTER_ID = 's9-ch01';
const CHAPTER_TITLE = 'The Upside-Down Card';
/** A line from the fixture's body — proves the prose arrived, not just the heading. */
const CHAPTER_LINE = 'The lamp above the desk buzzes once';
/**
 * The chapter points at the PERMANENT seeded fixtures (`zz-e2e-fixture-word` / `-item`), not at
 * real vault content and not at rows a spec creates. That is what lets it live in
 * content/chapters at all: verify:chapters requires a seeded word to exist and a clue-tap item to
 * be LIVE, and CI seeds before it runs. This spec therefore MUTATES NOTHING — it has no
 * beforeAll, and the one thing it cleans up is the family it created.
 */
const SEEDED_WORD = 'lantern';
/** The chapter's own clue-tap prompt — the label on the button that opens it. */
const CLUE_PROMPT = 'One word on that card is doing the work. Want to try it?';

/** Both servers run STORY_MODE=on over content/chapters; only APP_ENV differs. */
const STAGING = `http://localhost:${process.env.E2E_GATED_PORT ?? 3102}`;
const PRODUCTION = `http://localhost:${process.env.E2E_GATED_PROD_PORT ?? 3103}`;

/**
 * These two servers differ ONLY in APP_ENV, and that difference is the entire subject of this
 * spec. `reuseExistingServer` is true off CI, so an orphan from an earlier run can be adopted in
 * place of either — which happened, and both tests failed as though the isolation rule were
 * broken when the app was fine. Assert the server before asserting anything about it.
 */
test.beforeAll(async () => {
  await assertServerEnv(STAGING, 'staging');
  await assertServerEnv(PRODUCTION, 'production');
});

test.afterAll(async () => {
  // Said in the run's own output, because a green tick on two tests reads like "story mode
  // works" and it is not that. What is NOT here is a decision, not an oversight: these are
  // features, and none of them is on the path a first delivery takes.
  console.log(
    [
      '',
      'story-gated-chapter.spec.ts covers ONE path: a review-status chapter, authored into',
      'content/chapters, rendered in staging and refused in production. NOT covered here:',
      '  · unlock triggers beyond rank — cases_cracked, season_complete, board',
      '  · the dialogue choice (this chapter carries none)',
      '  · collect-word from a tapped seeded word',
      '  · spotImage rendering',
      '  · clue-tap GRADING — the clue-tap renders here; story-lit asserts what it does',
      '  · storyWrapper — its shape is now gated at the schema and re-derived off the database',
      '    row by check:db-content, but nothing READS it: the phase-1 consumer was never built.',
      '    See docs/pedagogy-decisions.md, "OPEN — awaiting David".',
      'A green tick here means the first-delivery path works, not that story mode is covered.',
      '',
    ].join('\n'),
  );
  await cleanupFixtures();
});

test('review status, staging: the gated chapter reaches the shelf and the reader', async ({
  page,
}) => {
  test.info().annotations.push({
    type: 'covers',
    description: 'readable() serves a review chapter outside production; content/chapters is the source',
  });

  const family = await createFamily(`story-gated-${Date.now()}`);
  const api = await parentApi(family.email);
  await enterCrewMode(page, api, family.child.id);
  await api.dispose();

  // Law 3: the shelf is opt-in and lives in the case file, never in the way of practice.
  await page.goto(`${STAGING}/crew/casefile`);
  const shelf = page.getByTestId('chapter-shelf');
  await expect(shelf).toBeVisible();
  await expect(shelf.getByRole('link', { name: CHAPTER_TITLE })).toBeVisible();

  await shelf.getByRole('link', { name: CHAPTER_TITLE }).click();
  await expect(page).toHaveURL(new RegExp(`/crew/story/${CHAPTER_ID}$`));
  await expect(page.getByRole('heading', { name: CHAPTER_TITLE })).toBeVisible();

  // The prose itself, not just the title: the file that passed the gates is the file that rendered.
  await expect(page.locator('.crew-story-body')).toContainText(CHAPTER_LINE);

  // Law 5: the marker resolved to a tappable card rather than leaking its brackets. The word is
  // a seeded fixture and LIVE by construction, so this asserts the resolution rather than
  // tolerating a silent fall-through to plain text — which is the failure mode that does not
  // announce itself.
  await expect(page.locator('.crew-story-body')).not.toContainText('[[');
  await expect(page.getByRole('button', { name: SEEDED_WORD })).toBeVisible();

  // Real-Puzzle Law: a gated chapter can carry a clue-tap, because it points at a LIVE item that
  // verify:chapters checked before this suite ran. The opening button carries the CHAPTER's
  // prompt; the item's own stem arrives only when it is tapped, which is the assertion that
  // proves the id resolved to a real row rather than to a button with nothing behind it.
  await page.getByRole('button', { name: CLUE_PROMPT }).click();
  const clue = page.getByRole('group', { name: 'A clue to try' });
  await expect(clue).toBeVisible();
  await expect(clue).toContainText('Which word is closest in meaning to brave?');

  // Law 4 the other way round: review carries no audio yet, and the reader offers no player
  // rather than an empty one. Narration is a RELEASE condition, not a drafting one.
  await expect(page.locator('audio.crew-story-audio')).toHaveCount(0);
});

test('review status, production: the same chapter is not served and not listed', async ({
  page,
}) => {
  test.info().annotations.push({
    type: 'covers',
    description: 'readable() refuses a review chapter when APP_ENV=production — unreviewed prose cannot reach a child',
  });

  const family = await createFamily(`story-gated-prod-${Date.now()}`);
  const api = await parentApi(family.email);
  await enterCrewMode(page, api, family.child.id);
  await api.dispose();

  // The crew layout streams, so the shell commits 200 before notFound() throws — the same
  // convention story-flag.spec.ts follows. The honest assertion is the BODY.
  await page.goto(`${PRODUCTION}/crew/story/${CHAPTER_ID}`);
  await expect(page.getByText('404')).toBeVisible();
  await expect(page.getByRole('heading', { name: CHAPTER_TITLE })).toHaveCount(0);
  await expect(page.locator('.crew-story-body')).toHaveCount(0);

  // The POSITIVE CONTROL, and the reason this test can be trusted. An empty shelf proves
  // nothing on its own: a broken server, a missing cookie or a story flag left off would all
  // produce one. The case file page itself has to render for the absence to mean "the review
  // filter did this".
  await page.goto(`${PRODUCTION}/crew/casefile`);
  await expect(page.getByRole('heading', { name: 'Your case file' })).toBeVisible();
  await expect(page.getByTestId('chapter-shelf')).toHaveCount(0);
});
