import { prisma } from '@cluecrew/db';
import { createItemAction } from '@/lib/actions/admin-items';
import { ItemFormFields } from '@/components/item-form';

const ERROR_COPY: Record<string, string> = {
  // THREE CAUSES, THREE INSTRUCTIONS (David's ruling, 2026-08-16 — R106). This was one message for
  // all three, and it told the reviewer to approve the tag in the queue. For a RETIRED tag that is
  // WRONG — the tag is not in the queue and approving is not the fix; the item needs retagging,
  // which is not her job at all. Eleven English items sit in exactly that state.
  'unapproved-misconception':
    'Blocked: one or more misconception ids are still PROPOSED. Approve them in the misconception queue first (Addendum E §2).',
  'retired-misconception':
    'Blocked: one or more misconception ids are RETIRED — approved once and since withdrawn. This is NOT an approval you can give: the tag is gone and the option needs retagging onto its successor. Run pnpm check:verdict-refusals for which option on which item.',
  'unknown-misconception':
    'Blocked: one or more misconception ids have no library row at all. Neither approving nor retagging reaches this — the id is wrong, or the entry was never imported.',
};

export default async function NewItemPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const questionTypes = await prisma.questionType.findMany({ orderBy: { id: 'asc' } });

  return (
    <main className="cc-container">
      <h1>New item</h1>
      {error ? <p role="alert">{ERROR_COPY[error] ?? 'That action was blocked.'}</p> : null}
      <p className="cc-muted">
        Saves as DRAFT under your name. A different reviewer must check it before it can go LIVE.
      </p>
      <form className="cc-form" action={createItemAction} style={{ maxWidth: 640 }}>
        <ItemFormFields questionTypes={questionTypes} />
        <button className="cc-button" type="submit">
          Save draft
        </button>
      </form>
    </main>
  );
}
