import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { validateTransactionTag, canEditTransactionTag, TRANSACTION_TAG_START } from '../lib/transaction-tags.mjs';

const source = (await readFile(new URL('../pages/api/transactions/tag.js', import.meta.url), 'utf8'))
  .replace(/^import .*;\n/gm, '').replace('export default async function handler', 'async function handler');

async function request({ owner = 'owner', session = true, tag = 'Side Projects', sourceType = 'plaid', date = '2026-10-03' } = {}) {
  let updated = null;
  const context = vm.createContext({
    validateTransactionTag, canEditTransactionTag, TRANSACTION_TAG_START, authOptions: {},
    getServerSession: async () => session ? { user: { email: 'owner@example.com' } } : null,
    prisma: {
      user: { findUnique: async () => ({ id: 'owner' }) },
      transaction: {
        findFirst: async ({ where }) => owner === where.userId ? { id: 'tx', source: sourceType, date } : null,
        update: async ({ data }) => (updated = data),
      },
    },
  });
  vm.runInContext(`${source}\nthis.handler = handler;`, context);
  const response = { code: 200, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } };
  await context.handler({ method: 'PATCH', body: { transactionId: 'tx', tag } }, response);
  return { response, updated };
}

test('tag endpoint scopes edits to the signed-in user', async () => {
  assert.equal((await request({ session: false })).response.code, 401);
  const forbidden = await request({ owner: 'someone-else' });
  assert.equal(forbidden.response.code, 404);
  assert.equal(forbidden.updated, null);
  assert.equal((await request()).updated.tag, 'Side Projects');
});

test('tag endpoint validates values and only resets linked transactions', async () => {
  assert.equal((await request({ tag: '' })).response.code, 400);
  assert.equal((await request({ tag: null, sourceType: 'manual' })).response.code, 400);
  assert.equal((await request({ tag: null })).updated.tag, null);
});


test('historical tags cannot be changed or reset through the API', async () => {
  for (const sourceType of ['plaid', 'csv', 'manual']) {
    for (const tag of ['Side Projects', 'Main', null]) {
      const result = await request({ sourceType, tag, date: '2026-09-30' });
      assert.equal(result.response.code, 400);
      assert.equal(result.updated, null);
    }
  }
});
