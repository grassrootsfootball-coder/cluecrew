/**
 * The Parents' Casebook (BUILD-PHASE-5 §5): ten short chapters for a parent
 * who did not grow up in the UK system. Manifesto parent voice throughout:
 * plain English, no eduspeak, no fear, explains what to DO. Each ≤5 minutes.
 *
 * Chapters 6 and 9 carry the mission and require David's PERSONAL approval
 * before they publish — they stay hidden in production until their ids are
 * added to APPROVED_SENSITIVE_CHAPTERS below (his edit is the approval).
 */

export interface Chapter {
  id: string;
  number: number;
  title: string;
  minutes: number;
  /** Requires David's personal sign-off before production (§5). */
  sensitive?: boolean;
  /** 'region' inserts the family's Region Registry entry (chapter 2). */
  dynamicBlock?: 'region';
  paragraphs: string[];
}

/**
 * Chapters 6 and 9 carry the mission, so BUILD-PHASE-5 §5 requires David's
 * personal approval before they publish. Approval is recorded by listing the
 * chapter id here.
 *
 * Approved by David, 2026-07-28 (both chapters, drafted by Claude Code and
 * approved on his instruction in session). Removing an id here un-publishes
 * that chapter immediately — the control stays live for future edits.
 */
export const APPROVED_SENSITIVE_CHAPTERS: string[] = [
  'supporting-without-pressure',
  'the-other-doors',
];

export const CHAPTERS: Chapter[] = [
  {
    id: 'what-the-11-plus-is',
    number: 1,
    title: "What the 11+ actually is (and isn't)",
    minutes: 4,
    paragraphs: [
      'The 11+ is an entrance test used by some state grammar schools and partially selective schools in parts of England. Your child sits it near the start of Year 6 — usually September — and the result decides whether they are offered a place at those particular schools. That is the whole of it. It is not a national exam, it says nothing official about your child, and most children in England never sit one.',
      'What it tests varies by area, but it draws from four subjects: verbal reasoning (word and logic puzzles), non-verbal reasoning (shape puzzles), maths, and English. Some areas test all four; some test two. Your region chapter (next) shows exactly what applies to you.',
      "What it is NOT: it is not an intelligence test, whatever anyone at the school gate says. It is a test of familiar puzzle types done under time pressure — which means preparation genuinely changes outcomes. That is uncomfortable and unfair in some ways, and it is also the reason ClueCrew exists: the preparation itself should not depend on what a family can pay.",
      'It is also not the only route to a good education. Grammar schools are one kind of school among several good kinds. Holding that thought lightly from the start is the single best thing you can do for your child through this process — more on that in chapters 6 and 9.',
      'What to do this week: nothing dramatic. Read your region chapter, note the test month, and count the school terms between now and then. That number is your runway, and it is almost certainly longer than the school-gate panic suggests.',
    ],
  },
  {
    id: 'your-region-decoded',
    number: 2,
    title: 'Your region, decoded',
    minutes: 3,
    dynamicBlock: 'region',
    paragraphs: [
      'Every area runs the 11+ its own way: different provider, different subjects, different dates, different pass rules. This chapter shows what we know about YOUR area, based on the region you chose at setup.',
      'Two habits worth forming now. First, confirm details with the actual schools for your entry year — providers and formats change, and the school website is the only source that counts. Second, put the registration window in your calendar the moment it is announced: registering is free, and missing the window is the one mistake that cannot be fixed later.',
    ],
  },
  {
    id: 'scoring-and-standardisation',
    number: 3,
    title: 'How scoring and standardisation work',
    minutes: 5,
    paragraphs: [
      "Your child's raw marks are not the number that matters. Almost every area converts raw marks into a STANDARDISED score — typically centred around 100 — which adjusts for two things: how everyone else did, and your child's exact age in months.",
      'The age adjustment surprises people, and it is good news: an August-born child is not competing unadjusted against classmates nearly a year older. The adjustment is automatic; you do not apply for it.',
      'Standardisation is why nobody can tell you "the pass mark" in advance. A qualifying score (often around 110–121 depending on the area) reflects where the line fell for that year\'s children. It also means small raw-mark differences near the middle move the standardised score more than you would expect — and differences at the extremes move it less.',
      'What this means practically: ignore percentage scores on practice papers as predictions. They tell you which QUESTION TYPES are secure and which need another way in — that is their entire useful content. ClueCrew reads them exactly that way and nothing more.',
      "One more thing worth knowing: a qualifying score does not always equal a place. In many areas more children qualify than there are places, and distance or oversubscription criteria decide the rest. The school's admissions page explains its own rules; chapter 10 shows what to check.",
    ],
  },
  {
    id: 'the-four-papers',
    number: 4,
    title: 'The four papers, plainly',
    minutes: 5,
    paragraphs: [
      'Verbal reasoning (VR) is word and logic puzzles: codes, sequences, hidden words, odd-ones-out, word relationships. It rewards vocabulary and calm method more than speed of cleverness. It is also the most coachable paper — which is why ClueCrew starts here.',
      'Non-verbal reasoning (NVR) is the same kind of thinking with shapes instead of words: what comes next, which is the odd one, how does the pattern rotate. Children who "hate maths" are often quietly excellent at it.',
      'Maths covers the national curriculum to the end of Year 5, moved along briskly: arithmetic, fractions, simple ratio, reading charts. Nothing your child has not met at school — the challenge is doing familiar things quickly and accurately.',
      'English is usually comprehension (read a passage, answer questions on it) plus spelling, punctuation and grammar. A few areas add a short piece of writing; most do not mark it unless there is a tie to break.',
      'The strategic point: these papers reward different strengths, and your area may not use all of them. Check your region chapter, then spend attention proportionally. A child strong in maths but tested only on VR and NVR needs their practice time in VR and NVR — obvious written down, easy to get backwards in the anxiety of it.',
    ],
  },
  {
    id: 'the-rhythm',
    number: 5,
    title: 'The two-year / one-year rhythm — how much is enough',
    minutes: 4,
    paragraphs: [
      'Here is the number that matters: fifteen minutes a day, five days a week, beats a two-hour Sunday session every time. Memory research is unambiguous about this — spaced, short, frequent practice builds durable skill; cramming builds tired children.',
      'Starting in Year 4 (the two-year rhythm) means everything stays gentle: one short session most days, vocabulary compounding quietly in the background, no term ever feeling urgent. Starting in Year 5 (the one-year rhythm) is completely workable too — the sessions stay the same size; there are simply fewer rest weeks in the plan.',
      "ClueCrew enforces the ceiling for you: sessions end at fifteen minutes, on purpose, even mid-streak. If your child asks for more, the answer that serves them best is \"tomorrow\" — wanting more is the engine of the whole thing, and we never spend it all in one day.",
      'What enough looks like from the outside: your child can explain a puzzle type back to you in their own words; new words from the Vault turn up at dinner unprompted; practice happens without negotiation most days. What too much looks like: tears, bargaining, dread on the walk to school. If you see the second list, halve everything and read chapter 6 — nothing about the exam is worth that, and the exam does not require it either.',
    ],
  },
  {
    id: 'supporting-without-pressure',
    number: 6,
    title: 'Supporting without pressuring — what the evidence says',
    minutes: 5,
    sensitive: true,
    paragraphs: [
      "First, the finding that should change how every 11+ home operates: children's test anxiety tracks their parents' anxiety more closely than it tracks the difficulty of the test. Your calm is not a nice-to-have around the edges of preparation. It IS preparation.",
      'Anxiety and working memory use the same mental space. A frightened child cannot hold a four-step letter sequence in mind, because fear is occupying the room the sequence needs. This is why pressure is not just unkind but counterproductive: every degree of heat you add subtracts marks.',
      'What support looks like in practice: interest in the puzzles rather than the scores ("show me how you cracked that one" beats "how many did you get right" every single time). Practice at a predictable, boring time, like teeth-brushing — negotiated once, never daily. Wins named specifically ("you tracked those letter jumps carefully") rather than globally ("you\'re so clever" — which, counter-intuitively, the evidence says makes children play safe and hide struggle).',
      'What to say when a practice session goes badly: "that one hasn\'t clicked YET — the app will show it another way." Then close the tablet and do something else. The engine is built to route around stuck points; your job is only to make stuck feel unremarkable.',
      "And the sentence to say early, out loud, and mean: \"whatever happens with this test, nothing about our family changes.\" Children who believe that sentence test BETTER, not worse — security is performance-enhancing. It is the closest thing to a secret this whole process has.",
      'If you notice sleep changes, stomach aches on practice days, or your child talking about the test as something that decides their worth — stop preparation entirely for two weeks and talk to their class teacher. No school place is worth teaching a nine-year-old that love is conditional on performance. That is the hill this company is built on.',
    ],
  },
  {
    id: 'reading-the-biggest-lever',
    number: 7,
    title: 'Reading: the biggest lever you have',
    minutes: 4,
    paragraphs: [
      'If you do exactly one thing beyond the daily loop, make it this: twenty minutes of reading for pleasure, most evenings. Vocabulary is the strongest single predictor of verbal reasoning performance, and vocabulary is built overwhelmingly by reading — not by word lists, including ours. The Word Vault reinforces; books supply.',
      'For pleasure is a load-bearing phrase. A child devouring comics, football annuals or the same dragon series for the fourth time is doing high-value preparation. A child trudging through an improving classic under duress is learning to dislike reading. Let them choose; your only role is supply and the occasional "read me the funny bit".',
      'What moves the needle fastest for 8–11s: books slightly above their level read TO them (they absorb vocabulary past their own decoding ceiling); series (momentum matters more than merit); audiobooks in the car (they count in full); and you, visibly reading your own book sometimes — children do what we do, not what we say.',
      'A practical library-card plan: one visit a fortnight, they choose three, no vetoes unless it is genuinely unsuitable. Total cost of the biggest lever in the whole process: £0. That is not an accident of the system — it is the one place where the playing field is genuinely level, and it belongs to families who use it.',
    ],
  },
  {
    id: 'mocks-and-what-results-mean',
    number: 8,
    title: 'Mock exams and what the results mean',
    minutes: 4,
    paragraphs: [
      'A mock exam has exactly two purposes: making the FORMAT boring (real answer sheets, real timing, real silence — so test day contains no surprises) and showing which question types wobble under time pressure. That is all. It is a thermometer, not a verdict.',
      'This is why ClueCrew renders mock and boss questions in deliberately plain exam formatting, with none of the usual warmth — meeting the exam\'s plainness in practice is itself the preparation. Expect scores on mocks to sit BELOW everyday practice at first. That gap is normal, it is the gap mocks exist to close, and it closes with familiarity rather than with more content.',
      'How to handle results at home: you look at them; your child hears one specific, true, forward-looking sentence ("your letter codes have got stronger — hidden words next"). Never share standardised guesses or rankings with them, and treat any external mock centre\'s "predicted outcome" with deep scepticism — see chapter 3 for why prediction is close to astrology at the individual level.',
      'Two or three full-format mocks across the final six months is plenty. Weekly mocking is anxiety theatre; it teaches children the test is enormous. It is not. It is one morning.',
    ],
  },
  {
    id: 'the-other-doors',
    number: 9,
    title: "The other doors: if it's a no",
    minutes: 5,
    sensitive: true,
    paragraphs: [
      'Read this chapter now, months before any result — because the family that has genuinely thought about a "no" prepares with less fear, and (chapter 6) less fear means better preparation. This is not defeatism. It is the opposite.',
      'Start with the honest arithmetic: in most selective areas, well-prepared, capable children outnumber places several times over. A "no" routinely says nothing more than "more children than chairs". It does not say your child lacked ability, and it says absolutely nothing about their future — the evidence on long-run outcomes for similar children either side of a grammar-school cut-off finds remarkably little difference. The child carries their ability with them through whichever door they walk.',
      "What an eleven-year-old needs on results day is smaller and harder than a plan: your face. If your face says something has been lost, that is the lesson they will keep. If it says \"interesting — so it's the blue-jumper school then\", the whole event shrinks to its true size within a fortnight. You can only produce that face by having actually made peace with the other doors in advance. Hence this chapter, now.",
      'Practically, then, while it is still hypothetical: visit at least two non-selective schools with the same seriousness you would give a grammar open day. Ask about the top maths set, the reading culture, what happens for a child working ahead of year level. Good comprehensives answer those questions well, and your child seeing you take those schools seriously IS the message.',
      "Know the review routes exist — appeals and waiting lists are covered in chapter 10 — but know also that the strongest move after a genuine no is usually forward, not back. A child who prepared well built vocabulary, number fluency, and the experience of working at something steadily. None of that is refunded at the door of a grammar school. It was never the school's property.",
      "One last thing, parent to parent: children take their definition of failure from us for a few more years yet. A family where a no is met with lunch somewhere nice and a genuinely open conversation about the school they WILL attend has taught a lesson worth more than any place at any school. We built this company to widen access to a test — never to teach children that the test measures them. Please hold us to that, and hold yourself to it too.",
    ],
  },
  {
    id: 'admissions-logistics',
    number: 10,
    title: 'Admissions logistics: dates, forms, and where to check',
    minutes: 4,
    paragraphs: [
      'The 11+ has two separate paper trails and missing either can undo everything else. Trail one: REGISTERING FOR THE TEST, directly with the school or consortium, usually between April and June of Year 5. Trail two: the COMMON APPLICATION FORM (CAF) from your local council, listing your school preferences, due 31 October of Year 6. Doing the first does not do the second — every year, families are caught by this.',
      'The safe sequence: April–June of Year 5, register for the test (free) via each target school\'s admissions page. September of Year 6, the test. October, results arrive BEFORE the CAF deadline in most (not all) areas — check yours. 31 October, CAF submitted, and use every preference line you are given: listing only grammar schools does not improve your chances at them and removes your say over the alternative. 1 March, National Offer Day.',
      'If the answer disappoints: waiting lists move more than people expect (ask to stay on them past September), and you have a legal right to appeal to an independent panel — the school must explain the process. For how appeals work in your circumstances, the council admissions team and the school are the right sources; where it gets complicated, seek proper advice. We explain the map here, but we are not admissions advisers, and anyone selling certainty in this territory should be walked away from briskly.',
      'A single afternoon in Year 5 with a calendar, your region chapter, and each target school\'s admissions page puts every date in its place. Do it once, early, and the logistics never get to add themselves to the emotional load.',
    ],
  },
];

/** A mission-critical chapter still waiting on David's personal approval (§5). */
export function awaitingApproval(chapter: Chapter): boolean {
  return Boolean(chapter.sensitive) && !APPROVED_SENSITIVE_CHAPTERS.includes(chapter.id);
}

export function visibleChapters(env: string | undefined): Chapter[] {
  const production = env === 'production';
  return CHAPTERS.filter(
    (chapter) => !production || !chapter.sensitive || APPROVED_SENSITIVE_CHAPTERS.includes(chapter.id),
  );
}
