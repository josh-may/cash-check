export function normalizeTransactionName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .substring(0, 50);
}

function toDateKey(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().split("T")[0];
}

export function createTransactionSignature({ date, amount, name }) {
  const dateKey = toDateKey(date);
  const amountNumber = Number(amount);

  if (!dateKey || !Number.isFinite(amountNumber)) {
    return null;
  }

  return `${dateKey}|${amountNumber.toFixed(2)}|${normalizeTransactionName(name)}`;
}
