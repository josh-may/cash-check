/**
 * MANUAL UTILITY SCRIPT - Sync All Users' Plaid Data
 *
 * This script manually syncs account balances for ALL users at once.
 *
 * WHEN TO USE:
 * - Initial data migration (like adding Balance table)
 * - Disaster recovery / backfilling missing data
 * - Manual admin operations
 *
 * NORMAL OPERATIONS:
 * - Cron job handles monthly syncs automatically
 * - New account connections sync automatically
 * - Users can manually sync via the UI
 *
 * USAGE:
 * node scripts/sync-all-users-plaid.js
 */

const { PrismaClient } = require('@prisma/client');
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

const prisma = new PrismaClient();

// Initialize Plaid client
const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});
const plaidClient = new PlaidApi(configuration);

const getFirstDayOfMonth = () => {
  const now = new Date();
  // Use UTC to avoid timezone issues when storing in database
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
};

const isDepository = (accountType) => accountType === 'depository';

async function syncAllUsersPlaidData() {
  console.log('🚀 Starting Plaid sync for all users...\n');

  try {
    // Get all Plaid items from all users
    const plaidItems = await prisma.plaidItem.findMany({
      include: {
        user: {
          select: { id: true, email: true, firstName: true, lastName: true }
        }
      }
    });

    if (!plaidItems.length) {
      console.log('⚠️  No Plaid items found in database');
      return;
    }

    console.log(`📊 Found ${plaidItems.length} Plaid items to sync\n`);

    const currentMonth = getFirstDayOfMonth();
    let globalStats = {
      totalItems: plaidItems.length,
      itemsProcessed: 0,
      itemsFailed: 0,
      balancesSynced: 0,
      accountsProcessed: 0,
      users: new Set()
    };

    // Process each Plaid item
    for (const item of plaidItems) {
      const userEmail = item.user.email;
      const userName = `${item.user.firstName} ${item.user.lastName}`;
      globalStats.users.add(userEmail);

      console.log(`\n👤 Processing: ${userName} (${userEmail})`);
      console.log(`   Item ID: ${item.itemId}`);

      try {
        // Fetch account data from Plaid
        const { data } = await plaidClient.accountsGet({
          access_token: item.accessToken
        });

        console.log(`   ✓ Found ${data.accounts.length} accounts`);

        // Filter for depository accounts (checking, savings, etc.)
        const depositoryAccounts = data.accounts.filter(a => isDepository(a.type));
        console.log(`   ✓ ${depositoryAccounts.length} depository accounts`);

        // Process each account
        for (const account of depositoryAccounts) {
          globalStats.accountsProcessed++;

          // Find or create account in database
          const dbAccount = await prisma.account.upsert({
            where: { plaidAccountId: account.account_id },
            create: {
              plaidItemId: item.id,
              plaidAccountId: account.account_id,
              name: account.name,
              officialName: account.official_name,
              mask: account.mask,
              type: account.type,
              subtype: account.subtype,
              currentBalance: account.balances.current,
              availableBalance: account.balances.available,
              isoCurrencyCode: account.iso_currency_code,
            },
            update: {
              currentBalance: account.balances.current,
              availableBalance: account.balances.available,
              officialName: account.official_name,
            }
          });

          // Upsert balance record for current month
          await prisma.balance.upsert({
            where: {
              accountId_month: {
                accountId: dbAccount.id,
                month: currentMonth
              }
            },
            create: {
              accountId: dbAccount.id,
              month: currentMonth,
              balance: account.balances.current || 0
            },
            update: {
              balance: account.balances.current || 0
            }
          });

          globalStats.balancesSynced++;
          console.log(`   ✓ Synced balance for: ${account.name} - $${account.balances.current}`);
        }

        // Mark item as good
        await prisma.plaidItem.update({
          where: { id: item.id },
          data: {
            status: 'good',
            lastSyncedAt: new Date()
          }
        });

        globalStats.itemsProcessed++;
        console.log(`   ✅ Successfully synced item`);

      } catch (error) {
        globalStats.itemsFailed++;
        console.error(`   ❌ Failed to sync item:`, error.message);

        // Update item status based on error
        const status = error.response?.data?.error_code === 'ITEM_LOGIN_REQUIRED' ? 'bad' : 'good';
        await prisma.plaidItem.update({
          where: { id: item.id },
          data: { status }
        });

        if (status === 'bad') {
          console.log(`   ⚠️  Item marked as 'bad' - user needs to reconnect their bank`);
        }
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 SYNC SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Users:           ${globalStats.users.size}`);
    console.log(`Total Items:           ${globalStats.totalItems}`);
    console.log(`Items Processed:       ${globalStats.itemsProcessed}`);
    console.log(`Items Failed:          ${globalStats.itemsFailed}`);
    console.log(`Accounts Processed:    ${globalStats.accountsProcessed}`);
    console.log(`Balances Synced:       ${globalStats.balancesSynced}`);
    console.log(`Month:                 ${currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`);
    console.log('='.repeat(60));

    if (globalStats.itemsFailed > 0) {
      console.log('\n⚠️  Some items failed to sync. Users may need to reconnect their banks.');
    }

    console.log('\n✅ Sync complete!');

  } catch (error) {
    console.error('\n❌ Fatal error during sync:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
syncAllUsersPlaidData().catch((error) => {
  console.error(error);
  process.exit(1);
});
