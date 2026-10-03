import { useState } from 'react';
import { canEditTransactionTag } from '../lib/transaction-tags.mjs';

export default function TransactionTagEditor({ transaction, tags, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [tag, setTag] = useState(transaction.tag || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async (value) => {
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/transactions/tag', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: transaction.id, tag: value }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not save tag');
      await onSaved();
      setEditing(false);
    } catch (error) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!canEditTransactionTag(transaction)) return null;

  if (!editing) return (
    <button type="button" className="text-xs text-blue-300 hover:text-blue-200 mt-1"
      onClick={() => { setTag(transaction.tag || transaction.effectiveTag || 'Main'); setEditing(true); }}
      aria-label={`Edit tag for ${transaction.merchantName || transaction.name}`}>
      {transaction.effectiveTag} · Edit tag
    </button>
  );

  return (
    <div className="mt-2 text-xs space-y-2">
      <input aria-label="Transaction tag" value={tag} onChange={(event) => setTag(event.target.value)}
        list={`tags-${transaction.id}`} maxLength={100} disabled={saving}
        className="w-full max-w-48 bg-raised border border-line-strong rounded p-1 text-white" />
      <datalist id={`tags-${transaction.id}`}>
        {[...new Set(['Main', 'Side Projects', ...tags])].map((value) => <option key={value} value={value} />)}
      </datalist>
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={saving || !tag.trim()} onClick={() => save(tag.trim())}
          className="text-blue-300 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
        {transaction.source === 'plaid' && transaction.tag && (
          <button type="button" disabled={saving} onClick={() => save(null)} className="text-blue-300">Use account tag</button>
        )}
        <button type="button" disabled={saving} onClick={() => setEditing(false)} className="text-muted">Cancel</button>
      </div>
      {error && <p role="alert" className="text-negative">{error}</p>}
    </div>
  );
}
