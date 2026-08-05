import { prisma } from '@cluecrew/db';
import {
  approveMisconceptionAction,
  bulkApproveMisconceptionsAction,
  bulkRecordMisconceptionApprovalsAction,
  importMisconceptionsAction,
  rejectMisconceptionAction,
  restoreMisconceptionAction,
  upsertMisconceptionAction,
} from '@/lib/actions/admin-libraries';
import { SelectAll } from '@/components/admin/select-all';
import { ScrollTo } from '@/components/admin/scroll-to';
import { currentStaff } from '@/lib/staff';
import { describeProvenance } from '@/lib/review-provenance';

export default async function MisconceptionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    recorded?: string;
    approved?: string;
    skipped?: string;
    error?: string;
    confirmReject?: string;
    rejected?: string;
    restored?: string;
  }>;
}) {
  const { recorded, approved, skipped, error, confirmReject, rejected: justRejected, restored } =
    await searchParams;
  const staff = await currentStaff();
  const misconceptions = await prisma.misconception.findMany({ orderBy: { id: 'asc' } });
  const proposed = misconceptions.filter((entry) => entry.status === 'PROPOSED');
  const active = misconceptions.filter((entry) => entry.status === 'ACTIVE');
  const rejected = misconceptions.filter((entry) => entry.status === 'REJECTED');

  const isAdmin = staff?.effectiveRole === 'ADMIN';
  const reviewers = isAdmin
    ? await prisma.parentAccount.findMany({
        where: { staffRole: 'REVIEWER', deletedAt: null },
        select: { id: true, email: true, displayName: true },
        orderBy: { displayName: 'asc' },
      })
    : [];
  const today = new Date().toISOString().slice(0, 10);


  return (
    <main className="cc-container">
      {/* The hash is lost across a server action, so the outcome params are
          what bring the reader back to the queue they were working. */}
      <ScrollTo
        targetId={restored ? 'rejected' : 'queue'}
        when={Boolean(recorded || approved || justRejected || restored || confirmReject)}
      />
      <h1>Misconception library</h1>
      <p className="cc-muted">
        A misconception is the <em>reason</em> a child picks a particular wrong answer. Every
        incorrect option in every item points at one of these, and the child sees its hint when
        they choose it. Nothing here is shown to a child except the hint.
      </p>

      {/* The two paths report differently on purpose: "you approved" and
          "you typed in someone else's approval" are not the same act, and the
          confirmation is the last place a user could be left believing they
          were. */}
      {Number(approved ?? 0) > 0 ? (
        <p role="status" className="cc-notice">
          Done: {approved} approved. Your name is on them.
          {skipped && skipped !== '0' ? ` ${skipped} skipped — already decided.` : ''}
        </p>
      ) : null}
      {Number(recorded ?? 0) > 0 ? (
        <p role="status" className="cc-notice">
          Recorded {recorded} approval(s) made by the reviewer. Their name is on the decision,
          yours on the entry.
          {skipped && skipped !== '0' ? ` ${skipped} skipped — already decided.` : ''}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="cc-notice-alert">
          {decodeURIComponent(error)}
        </p>
      ) : null}

      <h2 id="queue">Waiting for your decision ({proposed.length})</h2>
      {proposed.length === 0 ? (
        <p className="cc-notice">Nothing is waiting. Well done.</p>
      ) : (
        <div className="cc-card" data-testid="proposed-queue">
          <p>
            These came from analysis of real past papers. <strong>Nothing here is in use.</strong>{' '}
            No question can point at one until you approve it, so an unapproved entry never reaches
            a child. Approving one makes it available to question writers.
          </p>

          <form
            id="bulk-approve"
            className="cc-form cc-form-wide"
            action={bulkApproveMisconceptionsAction}
            data-testid="bulk-approve-form"
          >
            <SelectAll name="ids" formId="bulk-approve" />

            <ol className="cc-checklist">
              {proposed.map((entry) => (
                <li key={entry.id} id={`m-${entry.id}`}>
                  <label>
                    <input type="checkbox" name="ids" value={entry.id} />{' '}
                    <strong>{entry.description}</strong>
                  </label>
                  <p className="cc-muted">
                    Hint the child would see: “{entry.childHint}” · {entry.district} ·{' '}
                    <code>{entry.id}</code>
                  </p>
                  {confirmReject === entry.id ? null : (
                    <p className="cc-row-actions">
                      <a className="cc-button-quiet" href={`?confirmReject=${entry.id}#m-${entry.id}`}>
                        Reject this one…
                      </a>
                    </p>
                  )}
                </li>
              ))}
            </ol>

            <button className="cc-button" type="submit" data-testid="bulk-approve-submit">
              Approve the ones I ticked
            </button>{' '}
            <span className="cc-muted">Your name goes on every one of them.</span>
          </form>

          {/* The reject confirmation lives OUTSIDE the approve form: nested
              forms are invalid HTML, and a reject that could be submitted by
              the approve button would be the worst possible bug here. */}
          {confirmReject && proposed.some((entry) => entry.id === confirmReject) ? (
            <div className="cc-notice-alert" data-testid="confirm-reject">
              <p>
                <strong>
                  Reject “{proposed.find((entry) => entry.id === confirmReject)!.description}”?
                </strong>
              </p>
              <p>
                It leaves the queue and no question can use it. It is not deleted — an admin can
                put it back.
              </p>
              <form action={rejectMisconceptionAction} className="cc-form">
                <input type="hidden" name="id" value={confirmReject} />
                <label>
                  Why? (optional, but it helps whoever reads this later)
                  <input name="note" type="text" maxLength={500} />
                </label>
                <button className="cc-button" type="submit" data-testid="confirm-reject-submit">
                  Yes, reject it
                </button>{' '}
                <a className="cc-button-quiet" href="#queue">
                  Cancel
                </a>
              </form>
            </div>
          ) : null}

          {isAdmin ? (
            <details className="cc-card">
              <summary>
                <strong>Recording decisions made away from the screen</strong> — for catching up
                after a meeting
              </summary>
              <form
                id="bulk-record"
                className="cc-form cc-form-wide"
                action={bulkRecordMisconceptionApprovalsAction}
                data-testid="bulk-record-form"
              >
                <p className="cc-muted">
                  Use this only when someone else decided and you are typing it in. Their name goes
                  on the decision; yours goes on the typing. Both are kept, separately, for good.
                </p>
                <label>
                  Whose decision was this?
                  <select name="approvedByStaffId" defaultValue="">
                    <option value="" disabled>
                      Choose the reviewer…
                    </option>
                    {reviewers.map((reviewer) => (
                      <option key={reviewer.id} value={reviewer.id}>
                        {reviewer.displayName} ({reviewer.email})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  How did they tell you?
                  <input name="method" type="text" defaultValue={`verbal — sitting #1, ${today}`} maxLength={120} />
                </label>
                <label>
                  What did they say?
                  <textarea name="note" rows={2} maxLength={500} />
                </label>
                <SelectAll name="ids" formId="bulk-record" />
                <ol className="cc-checklist">
                  {proposed.map((entry) => (
                    <li key={entry.id}>
                      <label>
                        <input type="checkbox" name="ids" value={entry.id} />{' '}
                        <strong>{entry.description}</strong>
                      </label>
                    </li>
                  ))}
                </ol>
                <button className="cc-button-quiet" type="submit" data-testid="bulk-record-submit">
                  Record these approvals
                </button>
              </form>
            </details>
          ) : null}

          <details>
            <summary>Or decide them one at a time</summary>
            {proposed.map((entry) => (
              <div key={entry.id} className="cc-card" data-testid={`proposed-${entry.id}`}>
                <strong>{entry.description}</strong>
                <p style={{ margin: '0.3rem 0' }}>Hint the child would see: “{entry.childHint}”</p>
                <form action={approveMisconceptionAction} style={{ display: 'inline' }}>
                  <input type="hidden" name="id" value={entry.id} />
                  <button className="cc-button" type="submit">
                    Approve — question writers can use it
                  </button>
                </form>{' '}
                <a className="cc-button-quiet" href={`?confirmReject=${entry.id}#m-${entry.id}`}>
                  Reject this one…
                </a>
              </div>
            ))}
          </details>
        </div>
      )}

      {isAdmin && rejected.length > 0 ? (
        <>
          <h2 id="rejected">Rejected ({rejected.length})</h2>
          <p className="cc-muted">
            Kept, not deleted. No question can use one of these. Restoring puts it back in the
            queue.
          </p>
          <table className="cc-table" data-testid="rejected-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Rejected by</th>
                <th>Why</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rejected.map((entry) => (
                <tr key={entry.id} data-testid={`rejected-${entry.id}`}>
                  <td>{entry.description}</td>
                  <td className="cc-muted">
                    {entry.rejectedBy ?? 'unknown'}
                    {entry.rejectedAt ? ` · ${entry.rejectedAt.toLocaleDateString('en-GB')}` : ''}
                  </td>
                  <td className="cc-muted">{entry.rejectionNote ?? '—'}</td>
                  <td>
                    <form action={restoreMisconceptionAction}>
                      <input type="hidden" name="id" value={entry.id} />
                      <button className="cc-button-quiet" type="submit" data-testid={`restore-${entry.id}`}>
                        Put it back
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}

      <h2>In use ({active.length})</h2>
      <table className="cc-table">
        <thead>
          <tr>
            <th>Description (staff only)</th>
            <th>Hint the child sees</th>
            <th>District</th>
            <th>How it was approved</th>
          </tr>
        </thead>
        <tbody>
          {active.map((misconception) => (
            <tr key={misconception.id} data-testid={`active-${misconception.id}`}>
              <td>{misconception.description}</td>
              <td>{misconception.childHint}</td>
              <td>{misconception.district}</td>
              <td className="cc-muted">
                {describeProvenance({
                  approvedBy: misconception.approvedBy,
                  recordedBy: misconception.recordedBy,
                  method: misconception.approvalMethod,
                })}
                {misconception.approvalNote ? <> — “{misconception.approvalNote}”</> : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <details className="cc-card">
        <summary>
          <strong>Add, edit or import</strong> — for the content team
        </summary>
        <div>
          <h3>Import proposals (misconception-import.json)</h3>
          <form className="cc-form" action={importMisconceptionsAction}>
            <label>
              Paste the artefact — entries land as proposals, never in use
              <textarea name="payload" rows={6} required />
            </label>
            <button className="cc-button-quiet" type="submit">
              Import as proposals
            </button>
          </form>

          <h3>Add or update one</h3>
          <form className="cc-form" action={upsertMisconceptionAction}>
            <label>
              Slug (e.g. vr-analogy-surface-match)
              <input name="id" type="text" required pattern="[a-z0-9-]+" />
            </label>
            <label>
              District
              <select name="district" defaultValue="VR">
                <option value="VR">VR</option>
                <option value="NVR">NVR</option>
                <option value="MATHS">MATHS</option>
                <option value="ENGLISH">ENGLISH</option>
              </select>
            </label>
            <label>
              Description (staff only)
              <textarea name="description" rows={2} required maxLength={500} />
            </label>
            <label>
              Hint the child sees when they choose this answer (warm, no banned words)
              <textarea name="childHint" rows={2} required maxLength={300} />
            </label>
            <button className="cc-button" type="submit">
              Save
            </button>
          </form>
        </div>
      </details>
    </main>
  );
}
