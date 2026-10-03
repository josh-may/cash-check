process.env.PERSONAL_REPORT_EMAIL = 'owner@example.com';
process.env.PERSONAL_REPORT_EXCLUDED_MASK = '0000';
import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeMonth, generateMonthlyEmail } from '../lib/monthly-email.mjs';

const user = { id: 'owner', email: 'owner@example.com' };
const accounts = [
  { plaidAccountId: 'bank', name: 'Checking', subtype: 'checking', currentBalance: 4250 },
  { plaidAccountId: 'card', name: 'Card', type: 'credit' },
  { plaidAccountId: 'business', name: 'Business', subtype: 'checking', tag: 'Side Projects', currentBalance: 9000 },
  { plaidAccountId: 'business-card', mask: '0000', type: 'credit' },
  { plaidAccountId: 'excluded', isExcluded: true },
];
const tx = (amount, values = {}) => ({ userId: user.id, accountId: 'bank', amount, source: 'plaid', ...values });

test('monthly net includes card spending and imports while excluding other tenants and nonpersonal activity', () => {
  const report = summarizeMonth(user, accounts, [
    tx(-6800), tx(5000, { accountId: 'card' }), tx(560, { source: 'csv', accountId: null, tag: 'Main' }),
    tx(100, { accountId: 'business' }), tx(100, { accountId: 'business-card' }),
    tx(100, { source: 'manual', tag: 'Side Projects' }), tx(100, { accountId: 'excluded' }),
    tx(100, { pending: true }), tx(100, { isExcluded: true }), tx(100, { userId: 'other' }),
    tx(100, { categoryId: 'TRANSFER_OUT' }), tx(-100, { categoryId: 'TRANSFER_IN' }),
    tx(100, { category: '["LOAN_PAYMENTS", "LOAN_PAYMENTS_CREDIT_CARD_PAYMENT"]' }),
    tx(100, { accountId: 'unknown' }),
  ]);
  assert.equal(report.income, 6800);
  assert.equal(report.spending, 5560);
  assert.equal(report.net, 1240);
  assert.deepEqual(report.bankAccounts, [{ name: 'Checking', balance: 4250, minimum: 0 }]);
});

const render = (report, extra = {}) => generateMonthlyEmail({
  firstName: 'Example', month: 'September', balanceDate: 'October 1', appUrl: 'http://localhost:3000/', report, ...extra,
});

test('renders the approved example with optional minimums and escaped HTML', () => {
  const email = render({ income: 6800, spending: 5560, net: 1240, bankAccounts: [
    { name: 'Checking', balance: 4250, minimum: 2000 },
    { name: 'Savings', balance: 12000, minimum: 8000 },
  ] }, { firstName: '<Example>' });
  assert.equal(email.subject, 'September: net +$1,240');
  assert.match(email.text, /You were net \+\$1,240 in September\./);
  assert.match(email.text, /\$6,800 came in\. \$5,560 went out\./);
  assert.match(email.text, /Balances as of October 1:/);
  assert.match(email.text, /Total: \$16,250/);
  assert.match(email.text, /\$6,250 above your minimum/);
  assert.match(email.html, /&lt;Example&gt;/);
  assert.match(email.html, /http:\/\/localhost:3000\/app\/cashflow/);
});

test('negative, zero, missing balances and unset minimums remain readable', () => {
  const negative = render({ income: 10, spending: 20, net: -10, bankAccounts: [] });
  assert.equal(negative.subject, 'September: net -$10');
  assert.doesNotMatch(negative.text, /minimum|Balances as of/);
  const zero = render({ income: 0, spending: 0, net: 0, bankAccounts: [{ name: 'Checking', balance: null, minimum: 100 }] });
  assert.equal(zero.subject, 'September: net $0');
  assert.match(zero.text, /Checking: Unavailable/);
  assert.doesNotMatch(zero.text, /Total:|your minimum/);
  const below = render({ income: 0, spending: 0, net: 0, bankAccounts: [{ name: 'Checking', balance: 50, minimum: 100 }] });
  assert.match(below.text, /\$50 below your minimum/);
});

test('business exclusions are specific to Example; closed accounts can contribute historical spending', () => {
  const other = { id: 'other', email: 'someone@example.com' };
  const report = summarizeMonth(other, accounts, [tx(100, { userId: other.id, accountId: 'business' })]);
  assert.equal(report.spending, 100);
  assert.equal(report.bankAccounts.length, 2);
  const closed = summarizeMonth(user, [{ ...accounts[0], closedAt: new Date() }], [tx(100)]);
  assert.equal(closed.spending, 100);
  assert.equal(closed.bankAccounts.length, 0);
});
