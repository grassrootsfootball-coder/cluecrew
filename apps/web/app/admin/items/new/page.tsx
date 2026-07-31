import { prisma } from '@cluecrew/db';
import { createItemAction } from '@/lib/actions/admin-items';
import { ItemFormFields } from '@/components/item-form';

const ERROR_COPY: Record<string, string> = {
  'unapproved-misconception':
    'Blocked: one or more misconception ids are still PROPOSED. Approve them in the misconception queue first (Addendum E §2).',
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
