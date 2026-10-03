/**
 * Cleanup script to delete orphaned Plaid items
 *
 * This script reads the CSV of all access tokens from Plaid,
 * checks each one against the valid items in the production database,
 * and deletes all orphaned items.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

// Valid item_ids from production database - DO NOT DELETE THESE
const VALID_ITEM_IDS = new Set([
  '667owk9AZJHobnL7rm5rUo7bX9dYZOcaaPZEm', // Capital One
  'no6jL7pm06ioexam9yROCjAdPjBAbbUAqnv3x', // Discover (institution_error)
  'OgNBVxQ3ROtn85wvyYdKFb1nE6z7bYU8eQpB7', // Capital One
]);

// Initialize Plaid client
const configuration = new Configuration({
  basePath: PlaidEnvironments.production,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

async function getItemId(accessToken) {
  try {
    const response = await plaidClient.itemGet({ access_token: accessToken });
    return response.data.item.item_id;
  } catch (error) {
    // Item might already be deleted or invalid
    return null;
  }
}

async function main() {
  // Read the CSV file
  const csvPath = path.join(__dirname, '..', 'tokens.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.trim().split('\n');

  // Parse CSV header to determine format
  const header = lines[0].split(',');
  const hasItemId = header.includes('item_id');
  const hasEnv = header.includes('env');

  console.log(`CSV format: ${hasItemId ? 'has item_id' : 'access_token only'}`);

  // Parse CSV (skip header)
  const items = lines.slice(1).map(line => {
    const parts = line.split(',');
    if (hasItemId && hasEnv) {
      // Old format: access_token,client_id,env,event_ts,event_type,item_id
      return {
        access_token: parts[0],
        client_id: parts[1],
        env: parts[2],
        item_id: parts[5],
      };
    } else {
      // New format: access_token,client_id,event_ts
      return {
        access_token: parts[0],
        client_id: parts[1],
        env: 'production', // Assume production
        item_id: null, // Will need to fetch
      };
    }
  });

  console.log(`Total items in CSV: ${items.length}`);
  console.log(`Valid items to keep: ${VALID_ITEM_IDS.size}`);
  console.log('');

  // If we don't have item_ids, we need to fetch them first
  const toProcess = [];

  if (!hasItemId) {
    console.log('Fetching item_ids for each access token...');
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      process.stdout.write(`\rFetching ${i + 1}/${items.length}...`);

      const itemId = await getItemId(item.access_token);
      if (itemId) {
        item.item_id = itemId;
        if (!VALID_ITEM_IDS.has(itemId)) {
          toProcess.push(item);
        } else {
          console.log(`\n  Skipping valid item: ${itemId}`);
        }
      } else {
        console.log(`\n  Item already deleted or invalid: ${item.access_token.slice(0, 30)}...`);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('');
  } else {
    // Filter to items not in valid set
    for (const item of items) {
      if (!VALID_ITEM_IDS.has(item.item_id)) {
        toProcess.push(item);
      }
    }
  }

  console.log(`Items to delete: ${toProcess.length}`);
  console.log('');

  if (toProcess.length === 0) {
    console.log('No items to delete!');
    return;
  }

  // Confirm before proceeding
  console.log('Starting deletion in 3 seconds... (Ctrl+C to cancel)');
  await new Promise(resolve => setTimeout(resolve, 3000));

  let deleted = 0;
  let failed = 0;

  for (const item of toProcess) {
    try {
      console.log(`Deleting item ${item.item_id}...`);
      await plaidClient.itemRemove({ access_token: item.access_token });
      deleted++;
      console.log(`  ✓ Deleted (${deleted}/${toProcess.length})`);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      failed++;
      const errorMsg = error.response?.data?.error_message || error.message;
      if (errorMsg.includes('could not be found')) {
        console.log(`  ⊘ Already deleted: ${item.item_id}`);
      } else {
        console.error(`  ✗ Failed: ${errorMsg}`);
      }
    }
  }

  console.log('');
  console.log('=== CLEANUP COMPLETE ===');
  console.log(`Successfully deleted: ${deleted}`);
  console.log(`Already deleted/failed: ${failed}`);
  console.log(`Remaining valid items: ${VALID_ITEM_IDS.size}`);

  // Calculate expected savings
  const monthlySavings = deleted * 0.30;
  console.log(`Estimated additional monthly savings: $${monthlySavings.toFixed(2)}`);
}

main().catch(console.error);
