process.env.PERSONAL_REPORT_EMAIL = 'owner@example.com';
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTransactionTag, validateTransactionTag, canEditTransactionTag } from '../lib/transaction-tags.mjs';
import { summarizeMonth } from '../lib/monthly-email.mjs';

test('transaction tags override account defaults and can be reset', () => {
  assert.equal(resolveTransactionTag({ tag: 'Side Projects' }, 'Main'), 'Side Projects');
  assert.equal(resolveTransactionTag({ tag: 'Main' }, 'Side Projects'), 'Main');
  assert.equal(resolveTransactionTag({ tag: null }, 'Side Projects'), 'Side Projects');
  assert.equal(resolveTransactionTag({ tag: '  ' }, ''), 'Main');
});

test('tag validation supports custom names and rejects invalid values', () => {
  assert.equal(validateTransactionTag('  Side Projects  '), 'Side Projects');
  assert.equal(validateTransactionTag(null), null);
  for (const invalid of ['', ' ', 42, {}, undefined, 'a'.repeat(101)]) {
    assert.throws(() => validateTransactionTag(invalid));
  }
});

test('mixed personal account retains its balance while business income and spending leave personal net', () => {
  const user = { id: 'owner', email: 'owner@example.com' };
  const accounts = [{ plaidAccountId: 'personal', tag: 'Main', name: 'Personal', subtype: 'checking', currentBalance: 5000 }];
  const transaction = (amount, tag) => ({ date: '2026-10-03', userId: user.id, source: 'plaid', accountId: 'personal', amount, tag });
  const report = summarizeMonth(user, accounts, [transaction(-2000), transaction(500), transaction(-800, 'Side Projects'), transaction(200, 'Side Projects')]);
  assert.equal(report.income, 2000);
  assert.equal(report.spending, 500);
  assert.equal(report.net, 1500);
  assert.equal(report.bankAccounts[0].balance, 5000);
});


test('forward-only cutoff uses the transaction date, not import time', () => {
  for (const date of ['2026-09-30', '2026-10-02T23:59:59.999Z', null, 'invalid']) {
    assert.equal(canEditTransactionTag({ date }), false);
    assert.equal(resolveTransactionTag({ source: 'plaid', date, tag: 'Side Projects' }, 'Main'), 'Main');
  }
  for (const date of ['2026-10-03', new Date('2026-10-03T00:00:00Z'), '2026-11-01']) {
    assert.equal(canEditTransactionTag({ date }), true);
    assert.equal(resolveTransactionTag({ source: 'plaid', date, tag: 'Side Projects' }, 'Main'), 'Side Projects');
  }
  for (const source of ['manual', 'csv']) {
    assert.equal(resolveTransactionTag({ source, date: '2026-09-01', tag: 'Side Projects' }, 'Main'), 'Side Projects');
  }
});
