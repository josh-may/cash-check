import reportStyles from "../../styles/Report.module.css";
import AppHeader from "../../components/app-header";
import PlaidReconnectNotification from "../../components/PlaidReconnectNotification";
import ManageAccountsModal from "../../components/ManageAccountsModal";
import ImportCsvModal from "../../components/ImportCsvModal";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { usePlaidLink } from "react-plaid-link";
import { fetchLinkToken, clearLinkTokenCache } from "../../lib/plaid-link-token";

const LoadingSpinner = () => (
  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);


const AddAccountButton = ({ onClick, disabled, isConnecting }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`text-sm rounded-lg px-5 py-2.5 focus:outline-none transition-colors whitespace-nowrap ${
      isConnecting
        ? "bg-warning text-white border border-warning cursor-not-allowed"
        : "bg-accent text-white hover:bg-accent-hover"
    }`}
  >
    {isConnecting ? (
      <div className="flex items-center gap-2">
        <LoadingSpinner />
        Connecting...
      </div>
    ) : (
      "Add Account"
    )}
  </button>
);

const BANK_SUBTYPES = [
  "checking",
  "savings",
  "money market",
  "cash management",
  "hsa",
];
const isBankAccount = (account) =>
  BANK_SUBTYPES.includes(account.subtype?.toLowerCase());

const EditableBalanceCell = ({ value, minimum, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue != value) {
      onSave(localValue);
    }
  };

  const getBalanceColor = (balance, minimum) => {
    if (balance === null || balance === "" || isNaN(balance)) return "text-quiet";
    const numBalance = parseFloat(balance);
    if (minimum) {
      return numBalance >= minimum ? "text-positive" : "text-negative";
    }
    return "";
  };

  if (isEditing) {
    return (
      <input
        autoFocus
        type="number"
        value={localValue ?? ""}
        placeholder="-"
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.target.blur();
          }
        }}
        className="w-24 bg-raised border border-line focus:outline-none focus:ring-2 focus:ring-accent rounded px-2 py-1 text-right text-sm tabular-nums text-content"
      />
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={`cursor-pointer hover:bg-line rounded py-1 text-right transition-colors font-semibold tabular-nums whitespace-nowrap ${getBalanceColor(value, minimum)}`}
      title="Click to edit"
    >
      {value === null || value === ""
        ? "\u2014"
        : `$${Math.round(parseFloat(value)).toLocaleString("en-US")}`}
    </div>
  );
};

export default function BankBalances() {
  const [balanceData, setBalanceData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [linkToken, setLinkToken] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [relinkPlaidItemId, setRelinkPlaidItemId] = useState(null);
  const [showRelinkModal, setShowRelinkModal] = useState(false);
  const [badItemInfo, setBadItemInfo] = useState(null);
  const [isManageAccountsOpen, setIsManageAccountsOpen] = useState(false);
  const [manageAccountsInitialTab, setManageAccountsInitialTab] = useState("balance");
  const [isImportCsvOpen, setIsImportCsvOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([
    new Date().getFullYear(),
  ]);
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/sign-in");
      return;
    }

    const fetchData = async () => {
      try {
        let relinkItemId = null;

        const balanceRes = await fetch(
          `/api/plaid/balance-data?year=${selectedYear}`
        );
        if (balanceRes.ok) {
          const data = await balanceRes.json();
          setBalanceData(data);
          if (data.availableYears?.length > 0) {
            setAvailableYears(data.availableYears);
          }

          const hasInstitutionError = data.hasInstitutionError;
          // Prefer the first reconnectable item (includes both `bad` + `institution_error`).
          const firstBadItem = data.badItems?.[0] || null;
          setBadItemInfo(firstBadItem);
          relinkItemId = firstBadItem?.id || null;
          setRelinkPlaidItemId(relinkItemId);

          if (relinkItemId || hasInstitutionError) {
            setShowRelinkModal(true);
          } else {
            setShowRelinkModal(false);
          }
        }

        const token = await fetchLinkToken(relinkItemId);
        if (token) setLinkToken(token);
      } catch (error) {
        // Silently handle errors
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [status, router, selectedYear]);

  const refreshBalanceData = async () => {
    const res = await fetch(`/api/plaid/balance-data?year=${selectedYear}`);
    if (res.ok) {
      const data = await res.json();
      setBalanceData(data);
      if (data.availableYears?.length > 0) {
        setAvailableYears(data.availableYears);
      }

      const hasInstitutionError = data.hasInstitutionError;
      const firstBadItem = data.badItems?.[0] || null;
      setBadItemInfo(firstBadItem);
      const relinkItemId = firstBadItem?.id || null;
      setRelinkPlaidItemId(relinkItemId);

      if (relinkItemId || hasInstitutionError) {
        setShowRelinkModal(true);
      } else {
        setShowRelinkModal(false);
      }

      const token = await fetchLinkToken(relinkItemId);
      if (token) setLinkToken(token);
    }
  };

  const handleRemoveAndReconnect = async () => {
    if (!relinkPlaidItemId) return;

    // Remove from Plaid's side but keep DB records (accounts, balances, etc.)
    const res = await fetch("/api/plaid/delete-item", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plaidItemId: relinkPlaidItemId }),
    });

    if (!res.ok) return;

    // Keep relinkPlaidItemId so exchange_public_token reattaches
    // to the existing records instead of creating new ones
    setBadItemInfo(null);
    setShowRelinkModal(false);

    // Fetch a new link token in new-connection mode (no plaidItemId
    // since access token is cleared), but Plaid Link will let the
    // user pick Discover fresh
    clearLinkTokenCache(relinkPlaidItemId);
    clearLinkTokenCache(null);
    const newToken = await fetchLinkToken(null);
    if (newToken) setLinkToken(newToken);
  };

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token) => {
      setIsConnecting(true);
      try {
        const oldIds = balanceData?.accounts.map((a) => a.id) || [];

        const exchangeRes = await fetch("/api/plaid/exchange_public_token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            relinkPlaidItemId
              ? { public_token, plaidItemId: relinkPlaidItemId }
              : { public_token }
          ),
        });

        if (!exchangeRes.ok) {
          const body = await exchangeRes.json().catch(() => ({}));
          if (exchangeRes.status === 409 && body.error === "duplicate_institution") {
            alert(body.message || "This institution is already connected.");
            await refreshBalanceData();
            return;
          }
          console.error("[Plaid Link] exchange failed:", exchangeRes.status, body);
          return;
        }

        await refreshBalanceData();

        // Fetch all accounts to get the new ones with proper metadata
        const response = await fetch("/api/plaid/accounts");
        if (response.ok) {
          const allAccounts = await response.json();
          const newBankAccounts = allAccounts.filter(
            (a) => !oldIds.includes(a.id) && isBankAccount(a)
          );

          if (newBankAccounts?.length > 0) openManageAccounts("balance");
        }
      } catch (error) {
        console.error("[Plaid Link] Error in onSuccess:", error);
      } finally {
        setIsConnecting(false);
      }
    },
    onExit: async (error) => {
      setIsConnecting(false);

      // Link tokens are single-use — clear the cache and fetch a fresh
      // token so the user can retry immediately.
      clearLinkTokenCache(relinkPlaidItemId);
      const newToken = await fetchLinkToken(relinkPlaidItemId);
      if (newToken) setLinkToken(newToken);

      // If Link exited with an institution error, show the notification
      if (error) {
        const isInstitutionError =
          error.error_code === "INSTITUTION_NOT_RESPONDING" ||
          error.error_code === "INSTITUTION_DOWN" ||
          error.error_type === "INSTITUTION_ERROR" ||
          error.institution_error ||
          (error.display_message && error.display_message.includes("institution"));

        if (isInstitutionError) {
          setShowRelinkModal(true);
        }
      }
    },
  });

  const handleSaveMinimum = async (accountId, minimumBalance) => {
    await fetch("/api/plaid/set-minimum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, minimumBalance }),
    });
    await refreshBalanceData();
  };

  const handleUpdateBalance = async (accountId, month, amount) => {
    try {
      const response = await fetch("/api/plaid/update-balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          month,
          year: selectedYear,
          amount,
        }),
      });

      if (response.ok) {
        // Optimistically update local state or just refresh
        await refreshBalanceData();
      }
    } catch (error) {
      console.error("Failed to update balance:", error);
    }
  };

  const handleToggleHide = async (accountId) => {
    try {
      const response = await fetch("/api/plaid/accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });

      if (response.ok) {
        await refreshBalanceData();
      }
    } catch (error) {
      // Silently handle errors
    }
  };

  const handleTagChange = async (accountId, tag) => {
    try {
      await fetch("/api/plaid/accounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId,
          tag: tag.trim() || "Main",
        }),
      });
    } catch (error) {
      // Silently handle errors
    }
  };

  const handleRenameAccount = async (accountId, name) => {
    const response = await fetch("/api/plaid/accounts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, name }),
    });

    if (!response.ok) {
      throw new Error("Failed to rename account");
    }

    await refreshBalanceData();
  };

  const openManageAccounts = (tab = "balance") => {
    setManageAccountsInitialTab(tab);
    setIsManageAccountsOpen(true);
  };

  const closeManageAccounts = async () => {
    setIsManageAccountsOpen(false);
    await refreshBalanceData();
  };

  // Calculate total minimum balance needed across all accounts
  const totalMinimumNeeded = balanceData?.accounts
    ? balanceData.accounts.reduce((total, account) => {
        return total + (parseFloat(account.minimumBalance) || 0);
      }, 0)
    : 0;

  // Get current total balance (most recent month with data)
  const currentTotalBalance = balanceData?.accounts
    ? balanceData.accounts.reduce((total, account) => {
        const latestBalance =
          account.monthlyData[account.monthlyData.length - 1]?.balance;
        return total + (parseFloat(latestBalance) || 0);
      }, 0)
    : 0;

  const balanceDifference = currentTotalBalance - totalMinimumNeeded;

  const accountCount = balanceData?.accounts?.length || 0;
  const accountsWithMins = balanceData?.accounts
    ? balanceData.accounts.filter((a) => parseFloat(a.minimumBalance) > 0).length
    : 0;

  if (isLoading) {
    return (
      <AppHeader onManageAccounts={() => openManageAccounts("balance")} onImportCsv={() => setIsImportCsvOpen(true)}>
        <PlaidReconnectNotification
          isOpen={showRelinkModal}
          badItem={badItemInfo}
          onReconnect={() => ready && open()}
          onRemoveAndReconnect={handleRemoveAndReconnect}
        />
        <section>
          <div className="flex justify-center items-center h-64">
            <div className="text-muted text-sm">Loading balances...</div>
          </div>
        </section>
        <ManageAccountsModal
          isOpen={isManageAccountsOpen}
          onClose={closeManageAccounts}
          initialTab={manageAccountsInitialTab}
          onSaveMinimum={handleSaveMinimum}
          onToggleHide={handleToggleHide}
          onTagChange={handleTagChange}
          onRenameAccount={handleRenameAccount}
          onAddAccount={() => ready && open()}
          addAccountDisabled={isConnecting || !ready}
          isConnecting={isConnecting}
        />
        <ImportCsvModal
          isOpen={isImportCsvOpen}
          onClose={() => setIsImportCsvOpen(false)}
          onSuccess={() => refreshBalanceData()}
        />
      </AppHeader>
    );
  }

  if (!balanceData?.accounts?.length) {
    return (
      <AppHeader onManageAccounts={() => openManageAccounts("balance")} onImportCsv={() => setIsImportCsvOpen(true)}>
        <PlaidReconnectNotification
          isOpen={showRelinkModal}
          badItem={badItemInfo}
          onReconnect={() => ready && open()}
          onRemoveAndReconnect={handleRemoveAndReconnect}
        />
        <div className="mx-auto max-w-[1750px] px-3 py-4 sm:px-6 sm:py-6">
          <section>
            <div className="text-center py-12">
              <p className="text-muted mb-4">
                No balance data available
              </p>
              <p className="text-muted text-sm mb-6">
                Connect your accounts and refresh balances to see your data
              </p>
              <AddAccountButton
                onClick={() => ready && open()}
                disabled={isConnecting || !ready}
                isConnecting={isConnecting}
              />
            </div>
          </section>
        </div>
        <ManageAccountsModal
          isOpen={isManageAccountsOpen}
          onClose={closeManageAccounts}
          initialTab={manageAccountsInitialTab}
          onSaveMinimum={handleSaveMinimum}
          onToggleHide={handleToggleHide}
          onTagChange={handleTagChange}
          onRenameAccount={handleRenameAccount}
          onAddAccount={() => ready && open()}
          addAccountDisabled={isConnecting || !ready}
          isConnecting={isConnecting}
        />
        <ImportCsvModal
          isOpen={isImportCsvOpen}
          onClose={() => setIsImportCsvOpen(false)}
          onSuccess={() => refreshBalanceData()}
        />
      </AppHeader>
    );
  }

  return (
    <AppHeader onManageAccounts={() => openManageAccounts("balance")} onImportCsv={() => setIsImportCsvOpen(true)}>
      <PlaidReconnectNotification
        isOpen={showRelinkModal}
        badItem={badItemInfo}
        onReconnect={() => ready && open()}
      />
      <div className="mx-auto max-w-[1750px] px-3 py-4 sm:px-6 sm:py-6">
        <section>
          {/* Balance Table */}
          <div className={`overflow-hidden rounded-lg border border-line bg-surface shadow-none ${reportStyles.card}`}>
            <div className="overflow-x-auto">
              <table className="data-table w-full min-w-[840px] table-auto border-collapse text-sm sm:text-base">
                <thead>
                  <tr>
                    <th className="w-[200px] min-w-[200px] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted sm:px-6 sm:py-4 sm:text-sm">
                      Account
                    </th>
                    {balanceData.months.map((month) => (
                      <th
                        key={month}
                        className="min-w-[96px] px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted sm:px-4 sm:py-4 sm:text-sm"
                      >
                        {month}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {balanceData.accounts.map((account, idx) => (
                    <tr
                      key={account.name}
                      className={idx < balanceData.accounts.length - 1 ? "border-b border-line" : ""}
                    >
                      <td className="px-3 py-3 text-left sm:px-6 sm:py-4">
                        <strong className="block max-w-[180px] truncate sm:max-w-none">{account.name}</strong>
                        <span className="mt-0.5 block text-xs text-muted">
                          {account.minimumBalance
                            ? `Min: $${parseFloat(account.minimumBalance).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                            : "No minimum"}
                        </span>
                      </td>
                      {balanceData.months.map((month) => {
                        const balance = account.monthlyData.find(
                          (d) => d.month === month
                        )?.balance;
                        const parsedBalance = balance
                          ? parseFloat(balance)
                          : null;

                        return (
                          <td
                            key={month}
                            className="px-3 py-3 text-right sm:px-4 sm:py-4"
                          >
                            <EditableBalanceCell
                              value={parsedBalance}
                              minimum={account.minimumBalance}
                              onSave={(val) =>
                                handleUpdateBalance(account.id, month, val)
                              }
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Year Tabs */}
            <div className="flex items-center gap-2 border-t border-line px-5 py-3.5">
              {availableYears.map((year) => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`rounded-md px-3 py-1 text-sm transition-colors ${
                    year === selectedYear
                      ? "bg-accent text-white"
                      : "border border-line text-muted hover:text-white cursor-pointer"
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      <ManageAccountsModal
        isOpen={isManageAccountsOpen}
        onClose={closeManageAccounts}
        initialTab={manageAccountsInitialTab}
        onSaveMinimum={handleSaveMinimum}
        onToggleHide={handleToggleHide}
        onTagChange={handleTagChange}
        onRenameAccount={handleRenameAccount}
        onAddAccount={() => ready && open()}
        addAccountDisabled={isConnecting || !ready}
        isConnecting={isConnecting}
      />
      <ImportCsvModal
        isOpen={isImportCsvOpen}
        onClose={() => setIsImportCsvOpen(false)}
        onSuccess={() => refreshBalanceData()}
      />
    </AppHeader>
  );
}
