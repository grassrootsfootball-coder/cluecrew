/**
 * THE WORKED-EXAMPLE REPLAY REACHES A CHILD (R1064). After a miss on a Maths item whose replay a
 * reviewer turned on, the answer response carries the replay lines the play screen walks one tap at
 * a time. This walks a real child through the real API into the Maths case, answers until a miss
 * returns a replay, and checks the lines are the house-notation render — never the raw trace.
 */
import { expect, test } from '@playwright/test';
import { cleanupFixtures, completeFluency, createFamily, enterCrewMode, parentApi } from './fixtures';

test.afterAll(cleanupFixtures);

test('a missed Maths item walks its worked example in house notation', async ({ page }) => {
  test.setTimeout(120_000);
  const family = await createFamily('maths-replay');
  const api = await parentApi(family.email);
  await enterCrewMode(page, api, family.child.id);
  const session = `/api/crew/${family.child.id}/session`;
  expect((await api.post(session, { data: { caseId: 'case-maths-01' } })).ok()).toBeTruthy();

  let replay: string[] | null = null;
  for (let step = 0; step < 80 && !replay; step++) {
    const current = (await (await api.get(`${session}/activity`)).json()) as { kind: string; options?: Array<{ id: string }>; questions?: unknown[]; mode?: string };
    if (current.kind === 'fluency_round') { await completeFluency(api, session, current); continue; }
    if (current.kind === 'mode_content') { await api.post(`${session}/mode`, { data: { mode: current.mode, action: 'decline' } }); continue; }
    if (current.kind === 'word_collect') { await api.post(`${session}/answer`, { data: { secondsElapsed: 3 } }); continue; }
    if (current.kind !== 'item' && current.kind !== 'word_review') break;
    // The LAST option is wrong at least as often as any other; a correct answer simply moves on.
    const options = current.options ?? [];
    const result = (await (await api.post(`${session}/answer`, { data: { optionId: options[options.length - 1]?.id, secondsElapsed: 6 } })).json()) as { correct?: boolean; replaySteps?: string[] };
    if (result.correct === false && result.replaySteps?.length) replay = result.replaySteps;
  }
  await api.dispose();

  expect(replay, 'a missed Maths item with a reviewed replay returns its lines').not.toBeNull();
  const lines = replay!;
  expect(lines[0]).toMatch(/one step at a time\.$/);
  expect(lines.at(-1)).toMatch(/^So the answer is .+\.$/);
  for (const line of lines) {
    expect(line, 'no raw operators reach a child').not.toMatch(/\s[*/]\s/);
    expect(line, 'no em dash in child copy').not.toMatch(/—/);
  }
});
