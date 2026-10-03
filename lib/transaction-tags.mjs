// Plaid dates are calendar dates stored at UTC midnight. Do not reinterpret
// existing history when enabling overrides on October 3, 2026.
export const TRANSACTION_TAG_START = '2026-10-03';

export function canEditTransactionTag(transaction) {
  if (!transaction.date) return false;
  return new Date(transaction.date).getTime() >= Date.parse(`${TRANSACTION_TAG_START}T00:00:00.000Z`);
}

export function resolveTransactionTag(transaction, accountTag = 'Main') {
  // Manual/CSV tags were already authoritative before transaction overrides.
  if (transaction.source === 'plaid' && !canEditTransactionTag(transaction)) {
    return accountTag || 'Main';
  }
  return transaction.tag?.trim() || accountTag?.trim() || 'Main';
}

export function validateTransactionTag(tag) {
  if (tag === null) return null;
  if (typeof tag !== 'string' || !tag.trim() || tag.trim().length > 100) {
    throw new Error('Tag must be 1–100 characters, or null to use the account tag.');
  }
  return tag.trim();
}
