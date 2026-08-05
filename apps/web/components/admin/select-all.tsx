'use client';

/**
 * Select-all for a bulk queue. A reviewer working through a backlog of
 * seventy needs one tick, not seventy — and needs to see the count change so
 * they know what they are about to act on before they act on it.
 */
import { useEffect, useState } from 'react';

export function SelectAll({ name, formId }: { name: string; formId: string }) {
  const [selected, setSelected] = useState(0);
  const [total, setTotal] = useState(0);

  const boxes = (): HTMLInputElement[] => {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (!form) return [];
    return [...form.querySelectorAll<HTMLInputElement>(`input[type="checkbox"][name="${name}"]`)];
  };

  const recount = () => {
    const all = boxes();
    setTotal(all.length);
    setSelected(all.filter((box) => box.checked).length);
  };

  useEffect(() => {
    recount();
    const form = document.getElementById(formId);
    form?.addEventListener('change', recount);
    return () => form?.removeEventListener('change', recount);
  }, [formId, name]);

  const setAll = (checked: boolean) => {
    for (const box of boxes()) box.checked = checked;
    recount();
  };

  return (
    <p className="cc-bulk-bar">
      <button type="button" className="cc-button-quiet" onClick={() => setAll(true)} data-testid="select-all">
        Select all {total}
      </button>{' '}
      <button type="button" className="cc-button-quiet" onClick={() => setAll(false)} data-testid="select-none">
        Clear
      </button>{' '}
      <strong data-testid="selected-count">{selected} selected</strong>
    </p>
  );
}
