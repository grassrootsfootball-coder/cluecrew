/**
 * Drive a child session to its heaviest screen so Lighthouse can measure it.
 *
 * /crew renders the HQ landing page; the screen that actually costs something
 * is a practice item mid-session, where a lazily-loaded mechanic engine, the
 * Alphabet Rail and the mascot are all on stage at once. This script answers
 * its way through the warm-up and parks the session on exactly that activity,
 * then leaves it there for Lighthouse to load.
 *
 * Parking is stable: getActivity re-derives the activity from engine state
 * without mutating it, and item selection is deterministic, so repeated page
 * loads render the same item. Only submitting an answer advances the session.
 *
 * A caseId may be given to steer which mechanic family ends up on stage —
 * without one the focus case is deterministic, so every run would land on the
 * same engine and the other four would never be measured.
 *
 * Usage: node scripts/park-crew-session.mjs <baseUrl> <crewToken> <childId> [caseId]
 */

const [baseUrl, crewToken, childId, caseId] = process.argv.slice(2);
if (!baseUrl || !crewToken || !childId) {
  console.error('usage: park-crew-session.mjs <baseUrl> <crewToken> <childId> [caseId]');
  process.exit(1);
}

const headers = { Cookie: `crew_token=${crewToken}`, 'Content-Type': 'application/json' };
const api = `${baseUrl}/api/crew/${childId}/session`;
const MAX_STEPS = 60;

async function post(path, body) {
  const response = await fetch(`${api}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body ?? {}),
  });
  if (!response.ok) throw new Error(`POST ${path} → ${response.status} ${await response.text()}`);
  return response.json();
}

async function activity() {
  const response = await fetch(`${api}/activity`, { headers });
  if (!response.ok) throw new Error(`GET /activity → ${response.status}`);
  return response.json();
}

await post('', caseId ? { caseId } : {});

for (let step = 0; step < MAX_STEPS; step++) {
  const current = await activity();

  // The target: a practice item in Case mode, mechanic engine on stage.
  if (current.kind === 'item' && current.activityKind === 'practice_item' && !current.plain) {
    console.log(
      `  ✓ parked on a practice item — type ${current.questionTypeId}, ` +
        `family ${current.family}, rail ${current.rail}, ${current.options.length} options`,
    );
    process.exit(0);
  }

  switch (current.kind) {
    case 'item':
      // Warm-up or closer: any option advances us; correctness is irrelevant here.
      await post('/answer', { optionId: current.options[0]?.id, secondsElapsed: 5 });
      break;
    case 'word_collect':
      await post('/answer', { secondsElapsed: 3 });
      break;
    case 'word_review':
      await post('/answer', { optionId: current.options[0]?.id, secondsElapsed: 4 });
      break;
    case 'mode_content':
      await post('/mode', { action: 'decline' });
      break;
    case 'teachback':
      await post('/teachback', { stepIndex: 0, correctionIndex: 0, secondsElapsed: 5 });
      break;
    case 'wind_down':
    case 'no_session':
      console.error(
        `✗ session reached ${current.kind} before any practice item — cannot park. ` +
          'Is the item bank seeded and LIVE?',
      );
      process.exit(1);
      break;
    default:
      console.error(`✗ unexpected activity kind: ${current.kind}`);
      process.exit(1);
  }
}

console.error(`✗ no practice item within ${MAX_STEPS} steps`);
process.exit(1);
