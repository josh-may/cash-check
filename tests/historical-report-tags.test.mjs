process.env.PERSONAL_REPORT_EMAIL = 'owner@example.com';
process.env.PERSONAL_REPORT_EXCLUDED_MASK = '0000';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { resolveTransactionTag } from '../lib/transaction-tags.mjs';
import { summarizeMonth } from '../lib/monthly-email.mjs';

const source = (await readFile(new URL('../pages/api/plaid/report-data.js', import.meta.url), 'utf8'))
  .replace(/^import .*;\n/gm, '').replace('export default async function handler', 'async function handler');
const tx = (id, accountId, amount, tag, date = '2026-09-15', source = 'plaid') => ({
  id, accountId, amount, tag, date, source, userId: 'owner', name: id,
});

test('September keeps legacy linked-account, orphan, CSV and manual grouping', async () => {
  const linked = [
    tx('personal', 'checking', -2000, 'Side Projects'),
    tx('personal-expense', 'checking', 500),
    tx('business', 'business', -800, 'Main'),
    tx('october-override', 'checking', -100, 'Side Projects', '2026-10-03'),
  ];
  const orphan = [tx('orphan-first', 'old', -50, 'Archive'), tx('orphan-second', 'old', 10, 'Different')];
  const imported = [tx('csv', null, 20, 'Side Projects', '2026-09-15', 'csv'), tx('manual', null, -30, 'Main', '2026-09-15', 'manual')];
  const user = { id: 'owner', email: 'owner@example.com', plaidItems: [{ id: 'item', status: 'good', accounts: [
    { plaidAccountId: 'checking', name: 'Checking', tag: 'Main' },
    { plaidAccountId: 'business', name: 'Business', tag: 'Side Projects' },
  ], transactions: linked }] };
  const before = JSON.stringify({ user, orphan, imported });
  const context = vm.createContext({ resolveTransactionTag, authOptions: {}, console,
    getServerSession: async () => ({ user: { email: user.email } }),
    prisma: {
      user: { findUnique: async () => user },
      transaction: { findMany: async ({ where }) => {
        assert.equal(where.userId, user.id);
        return where.source === 'plaid' ? orphan : imported;
      } },
      account: { findMany: async () => [] },
    },
  });
  vm.runInContext(`${source}\nthis.handler = handler;`, context);
  const response = { status(code) { throw new Error(`Unexpected status ${code}`); }, json(data) { this.data = JSON.parse(JSON.stringify(data)); } };
  await context.handler({ query: { year: '2026' } }, response);
  const september = Object.fromEntries(response.data.accounts.map((group) => {
    const month = group.monthlyData.find((month) => month.month === 'Sep');
    return [group.name, { income: month.income, expenses: month.expenses, net: month.net, ids: month.transactions.map((tx) => tx.id).sort() }];
  }));
  assert.deepEqual(september, {
    Main: { income: '2030.00', expenses: '500.00', net: '1530.00', ids: ['manual', 'personal', 'personal-expense'] },
    'Side Projects': { income: '800.00', expenses: '20.00', net: '780.00', ids: ['business', 'csv'] },
    Archive: { income: '50.00', expenses: '10.00', net: '40.00', ids: ['orphan-first', 'orphan-second'] },
  });
  const october = response.data.accounts.find((group) => group.name === 'Side Projects').monthlyData.find((month) => month.month === 'Oct');
  assert.equal(october.income, '100.00');
  assert.equal(JSON.stringify({ user, orphan, imported }), before);
});

test('historical monthly email keeps account-based business exclusion even with a Main override', () => {
  const user = { id: 'owner', email: 'owner@example.com' };
  const accounts = [{ plaidAccountId: 'business', tag: 'Side Projects' }];
  assert.equal(summarizeMonth(user, accounts, [tx('old', 'business', -800, 'Main')]).income, 0);
  assert.equal(summarizeMonth(user, accounts, [tx('new', 'business', -800, 'Main', '2026-10-03')]).income, 800);
});
