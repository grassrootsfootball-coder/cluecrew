import { prisma } from '@cluecrew/db';
import { createItemAction } from '@/lib/actions/admin-items';
import { ItemFormFields } from '@/components/item-form';

export default async function NewItemPage() {
  const questionTypes = await prisma.questionType.findMany({ orderBy: { id: 'asc' } });

  return (
    <main className="cc-container">
      <h1>New item</h1>
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
