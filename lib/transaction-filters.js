// Patterns to exclude from cashflow (avoid double-counting transfers & credit card payments)
export const EXCLUDED_PATTERNS = [
  /ACH Withdrawal CAPITAL ONE/i,
  /CAPITAL ONE AUTOPAY/i,
  /CAPITAL ONE ONLINE PYMT/i,
  /ACH Withdrawal CHASE/i,
  /transfer from/i,
  /transfer to/i,
];

export function shouldExcludeTransaction(transaction) {
  const text = `${transaction.name || ""} ${transaction.merchantName || ""}`;
  return EXCLUDED_PATTERNS.some((pattern) => pattern.test(text));
}
