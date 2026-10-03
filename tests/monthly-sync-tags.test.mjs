import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = (await readFile(new URL('../pages/api/cron/monthly-sync-and-email.js', import.meta.url), 'utf8'))
  .replace(/^import .*;\n/gm, '').replace('export default async function handler', 'async function handler');

test('monthly refresh updates existing transactions without overwriting tags or manual exclusions', async () => {
  const operations = [];
  const now = new Date();
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth() - 1, 15)).toISOString().slice(0, 10);
  const context = vm.createContext({
    process: { env: { CRON_SECRET_KEY: 'test' } }, console: { log() {}, error() {} },
    Resend: class {}, shouldExcludeTransaction: () => false,
    fetch: async () => ({ ok: true, json: async () => ({ success: true, syncedItemIds: ['item'] }) }),
    plaidClient: { transactionsGet: async () => ({ data: { transactions: [{ transaction_id: 'plaid-tx', account_id: 'bank', date, amount: -800, name: 'Project income', pending: false }], total_transactions: 1 } }) },
    prisma: {
      plaidItem: { findMany: async () => [{ id: 'item', userId: 'owner' }], update: async () => ({}) },
      user: { findMany: async () => [] },
      transaction: {
        upsert: (args) => ({ type: 'upsert', args }),
        deleteMany: (args) => ({ type: 'delete', args }),
      },
      $transaction: async (batch) => { operations.push(...batch); return [{ count: 0 }, {}]; },
    },
  });
  vm.runInContext(`${source}\nthis.handler = handler;`, context);
  const res = { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; } };
  await context.handler({ method: 'POST', headers: { 'x-cron-secret': 'test' } }, res);
  assert.equal(res.code, 200);
  assert.equal(res.body.sync.itemsProcessed, 1);
  const update = operations.find((op) => op.type === 'upsert').args;
  assert.equal(update.where.plaidTransactionId, 'plaid-tx');
  assert.equal(update.update.userId, 'owner');
  assert.equal(Object.hasOwn(update.update, 'tag'), false);
  assert.equal(Object.hasOwn(update.update, 'isExcluded'), false);
  const deletion = operations.find((op) => op.type === 'delete').args.where;
  assert.equal(deletion.userId, 'owner');
  assert.equal(deletion.plaidTransactionId.notIn[0], 'plaid-tx');
});
