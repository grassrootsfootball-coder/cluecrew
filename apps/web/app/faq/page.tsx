import { Plausible } from '@/components/plausible';

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: 'Will ClueCrew get my child into a grammar school?',
    a: 'No one can promise that — places are limited and selection depends on far more than preparation. What we do promise is the process: clear teaching of every question type your region uses, calm daily practice that adapts to your child, and honest reporting to you. We never make outcome claims, and we would be wary of anyone who does.',
  },
  {
    q: 'How much time does it take?',
    a: 'Fifteen minutes a day, and we enforce the ceiling — sessions end on time even if your child wants more. Short, frequent, calm practice outperforms weekend marathons, so the app is built to make marathons impossible.',
  },
  {
    q: 'Which exam boards and regions do you cover?',
    a: 'The first release covers the full set of 21 GL-style verbal reasoning types, with region pages describing what your area tests. Exam-board names are used factually — we are independent and unaffiliated with GL Assessment, CEM, ISEB, any school or consortium.',
  },
  {
    q: 'Is my child safe on it?',
    a: 'There is no chat, no social features, no public profiles, and no child-to-child contact of any kind. Child pages carry no third-party scripts at all. We collect a first name or nickname, year group and practice progress — no surname, no date of birth, no school, no photos. See our safeguarding page for the full commitments.',
  },
  {
    q: 'What happens when my child gets things wrong?',
    a: 'They never see red ink or the word "wrong". A miss shows a warm "not yet" with a hint written for the exact mix-up they made, and an offer to see the idea another way. After a run of misses, the session gently changes course rather than pressing on. Mistakes are how detectives work.',
  },
  {
    q: 'Do you use AI to teach my child?',
    a: 'No conversational AI ever talks to your child. Everything a child reads or hears is written by humans or comes from a fixed, human-reviewed bank. AI helps us draft practice questions behind the scenes, and every one of those passes human review before a child can see it.',
  },
  {
    q: 'Can I cancel easily?',
    a: 'Two clicks in Parent HQ. Full refund within 14 days of first payment, no questions. Renewal reminders arrive 14 and 3 days ahead. The exit door is as easy to use as the entrance — that is a design rule, not a favour.',
  },
  {
    q: 'What is the Crew Bursary?',
    a: 'A free place — the identical product, nothing cut down, nothing labelled — for families receiving free school meals or pupil premium. One new bursary place opens for every ten paid subscriptions.',
  },
];

export default function FaqPage() {
  return (
    <main className="cc-container">
      <Plausible />
      <h1>Questions, answered straight</h1>
      {FAQS.map((faq) => (
        <section className="cc-card" key={faq.q}>
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>{faq.q}</h2>
          <p style={{ marginBottom: 0 }}>{faq.a}</p>
        </section>
      ))}
    </main>
  );
}
