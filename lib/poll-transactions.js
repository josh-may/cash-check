// Utility for polling Plaid transactions after account connection
// Plaid needs 30-90 seconds to sync transactions after initial connection

export async function pollForTransactions(plaidItemId = null, maxAttempts = 10) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Wait before polling (3s for first attempt, 2s for subsequent)
    const delay = attempt === 1 ? 3000 : 2000;
    await new Promise((resolve) => setTimeout(resolve, delay));

    try {
      // Include plaidItemId in request if provided for isolated syncing
      const url = plaidItemId 
        ? `/api/plaid/transactions?plaidItemId=${plaidItemId}`
        : "/api/plaid/transactions";
      
      const response = await fetch(url);
      const data = await response.json();

      // Check if we have transactions
      if (data.transactionCount > 0) {
        return {
          success: true,
          transactionCount: data.transactionCount
        };
      }

      // If not syncing anymore, account might be empty
      if (!data.syncPending && attempt > 5) {
        return { success: true, transactionCount: 0 };
      }
    } catch (error) {
      // Continue polling on error
    }
  }

  // Max attempts reached
  return { success: false, timeout: true };
}
