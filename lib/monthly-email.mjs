import { resolveTransactionTag, canEditTransactionTag } from "./transaction-tags.mjs";
const BANK_SUBTYPES = new Set(['checking', 'savings', 'money market', 'cash management', 'hsa']);
const money = (amount) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
}).format(amount);
const signedMoney = (amount) => `${Math.round(amount) > 0 ? '+' : ''}${money(Math.round(amount))}`;
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);

export function isPersonalAccount(user, account) {
  return user.email.toLowerCase() !== (process.env.PERSONAL_REPORT_EMAIL || '').toLowerCase() || (
    account.tag?.trim().toLowerCase() !== (process.env.PERSONAL_REPORT_EXCLUDED_TAG || 'Side Projects').toLowerCase() && (!process.env.PERSONAL_REPORT_EXCLUDED_MASK || account.mask !== process.env.PERSONAL_REPORT_EXCLUDED_MASK)
  );
}

export function summarizeMonth(user, accounts, transactions) {
  const accountMap = new Map(accounts.map((account) => [account.plaidAccountId, account]));
  let income = 0;
  let spending = 0;
  for (const tx of transactions) {
    if (tx.userId !== user.id || tx.pending || tx.isExcluded) continue;
    const account = accountMap.get(tx.accountId);
    if (account?.isExcluded) continue;
    if (user.email.toLowerCase() === (process.env.PERSONAL_REPORT_EMAIL || '').toLowerCase()) {
      const isBusiness = canEditTransactionTag(tx)
        ? (process.env.PERSONAL_REPORT_EXCLUDED_MASK && account?.mask === process.env.PERSONAL_REPORT_EXCLUDED_MASK) || resolveTransactionTag(tx, account?.tag).toLowerCase() === (process.env.PERSONAL_REPORT_EXCLUDED_TAG || 'Side Projects').toLowerCase()
        : (account && !isPersonalAccount(user, account)) || tx.tag?.trim().toLowerCase() === (process.env.PERSONAL_REPORT_EXCLUDED_TAG || 'Side Projects').toLowerCase();
      if (isBusiness) continue;
    }
    // Unknown Plaid accounts cannot safely be assigned to the personal report.
    if (tx.source === 'plaid' && !account) continue;
    const category = `${tx.categoryId || ''} ${tx.category || ''}`;
    if (/TRANSFER_IN|TRANSFER_OUT|LOAN_PAYMENTS_CREDIT_CARD_PAYMENT/.test(category)) continue;
    if (tx.amount < 0) income -= tx.amount;
    else spending += tx.amount;
  }
  const bankAccounts = accounts.filter((account) =>
    !account.isExcluded && !account.closedAt && isPersonalAccount(user, account) &&
    BANK_SUBTYPES.has(account.subtype?.toLowerCase())
  ).map((account) => ({
    name: account.name,
    balance: account.balances?.[0]?.balance ?? account.currentBalance,
    minimum: account.minimumBalance || 0,
  }));
  return { income, spending, net: income - spending, bankAccounts };
}

export function generateMonthlyEmail({ firstName, month, balanceDate, report, appUrl }) {
  const { income, spending, net, bankAccounts } = report;
  const hasAllBalances = bankAccounts.every((account) => account.balance != null);
  const total = bankAccounts.reduce((sum, account) => sum + (account.balance ?? 0), 0);
  const minimum = bankAccounts.reduce((sum, account) => sum + account.minimum, 0);
  const difference = total - minimum;
  const minimumLine = minimum > 0 && hasAllBalances
    ? `You’re ${money(Math.abs(difference))} ${difference >= 0 ? 'above' : 'below'} your minimum.` : '';
  const headline = `You were net ${signedMoney(net)} in ${month}.`;
  const detail = `${money(income)} came in. ${money(spending)} went out.`;
  const balanceHeading = bankAccounts.length ? `Balances as of ${balanceDate}:` : '';
  const balanceLines = bankAccounts.map((account) => `- ${account.name}: ${account.balance == null ? 'Unavailable' : money(account.balance)}`);
  const totalLine = bankAccounts.length && hasAllBalances ? `Total: ${money(total)}` : '';
  const url = `${appUrl.replace(/\/+$/, '')}/app/cashflow`;
  const text = [
    `Hi ${firstName || 'there'},`, '', headline, detail, '',
    balanceHeading, ...balanceLines, totalLine, '', minimumLine, '', `View full report → ${url}`,
  ].join('\n').replace(/\n{3,}/g, '\n\n');
  const paragraph = (content) => `<p style="margin:0 0 16px">${content}</p>`;
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(month)} monthly report</title></head>
<body style="margin:0;background:#f4f4f4;color:#333;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;line-height:1.6">
<div style="max-width:600px;margin:0 auto;padding:30px;box-sizing:border-box;background:#fff">
${paragraph(escapeHtml(`Hi ${firstName || 'there'},`))}
${paragraph(`<strong style="font-size:20px">${escapeHtml(headline)}</strong><br>${escapeHtml(detail)}`)}
${balanceHeading ? paragraph([balanceHeading, ...balanceLines, totalLine].filter(Boolean).map(escapeHtml).join('<br>')) : ''}
${minimumLine ? paragraph(escapeHtml(minimumLine)) : ''}
${paragraph(`<a href="${escapeHtml(url)}" style="color:#3b82f6">View full report →</a>`)}
</div></body></html>`;
  return { subject: `${month}: net ${signedMoney(net)}`, html, text };
}
