import { useState, useEffect } from "react";

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

const BANK_SUBTYPES = [
  "checking",
  "savings",
  "money market",
  "cash management",
  "hsa",
];

const isBankAccount = (account) =>
  BANK_SUBTYPES.includes(account.subtype?.toLowerCase());

export default function ManageAccountsModal({
  isOpen,
  onClose,
  initialTab = "balance", // "balance" or "transactions"
  onSaveMinimum,
  onToggleHide,
  onTagChange,
  onRenameAccount,
  onAddAccount,
  addAccountDisabled,
  isConnecting,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [accounts, setAccounts] = useState([]);
  const [minimums, setMinimums] = useState({});
  const [accountTags, setAccountTags] = useState({});
  const [accountNames, setAccountNames] = useState({});
  const [editingNameAccountId, setEditingNameAccountId] = useState(null);
  const [savingAccountId, setSavingAccountId] = useState(null);
  const [savingNameAccountId, setSavingNameAccountId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch accounts when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      fetchAccounts();
    }
  }, [isOpen, initialTab]);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/plaid/accounts");
      if (response.ok) {
        const allAccounts = await response.json();
        setAccounts(allAccounts);

        const names = allAccounts.reduce((acc, account) => {
          acc[account.id] = account.name || "";
          return acc;
        }, {});
        setAccountNames(names);

        // Initialize minimums
        const mins = allAccounts.reduce((acc, account) => {
          if (account.minimumBalance) acc[account.id] = account.minimumBalance;
          return acc;
        }, {});
        setMinimums(mins);

        // Initialize tags
        const tags = allAccounts.reduce((acc, account) => {
          acc[account.id] = account.tag || "Main";
          return acc;
        }, {});
        setAccountTags(tags);
      }
    } catch (error) {
      // Silently handle errors
    } finally {
      setIsLoading(false);
    }
  };

  const handleMinimumBlur = async (accountId, value) => {
    const originalValue = accounts.find((a) => a.id === accountId)?.minimumBalance || "";
    if (value !== originalValue) {
      setSavingAccountId(accountId);
      await onSaveMinimum(accountId, value);
      setSavingAccountId(null);
    }
  };

  const handleToggleHide = async (accountId) => {
    // Optimistically update local state
    setAccounts((current) =>
      current.map((acc) =>
        acc.id === accountId ? { ...acc, isExcluded: !acc.isExcluded } : acc
      )
    );
    await onToggleHide(accountId);
  };

  const handleTagChange = async (accountId, tag) => {
    const sanitizedTag = tag.slice(0, 50);
    setAccountTags((currentTags) => ({
      ...currentTags,
      [accountId]: sanitizedTag,
    }));
    await onTagChange(accountId, sanitizedTag);
  };

  const handleNameBlur = async (accountId) => {
    const originalName = accounts.find((a) => a.id === accountId)?.name || "";
    const nextName = (accountNames[accountId] || "").trim();

    setEditingNameAccountId(null);

    if (!nextName) {
      setAccountNames((currentNames) => ({
        ...currentNames,
        [accountId]: originalName,
      }));
      return;
    }

    if (nextName === originalName) return;

    setSavingNameAccountId(accountId);
    try {
      await onRenameAccount(accountId, nextName);
      setAccounts((current) =>
        current.map((account) =>
          account.id === accountId ? { ...account, name: nextName } : account
        )
      );
      setAccountNames((currentNames) => ({
        ...currentNames,
        [accountId]: nextName,
      }));
    } catch (error) {
      setAccountNames((currentNames) => ({
        ...currentNames,
        [accountId]: originalName,
      }));
    } finally {
      setSavingNameAccountId(null);
    }
  };

  const renderEditableAccountName = (account, className = "") => {
    const isEditing = editingNameAccountId === account.id;

    if (isEditing) {
      return (
        <input
          autoFocus
          type="text"
          value={accountNames[account.id] || ""}
          onChange={(e) =>
            setAccountNames({
              ...accountNames,
              [account.id]: e.target.value.slice(0, 100),
            })
          }
          onBlur={() => handleNameBlur(account.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
            if (e.key === "Escape") {
              setAccountNames({
                ...accountNames,
                [account.id]: account.name || "",
              });
              setEditingNameAccountId(null);
            }
          }}
          className={`min-w-0 rounded border border-accent bg-surface px-2 py-1 text-sm font-medium text-white focus:outline-none ${className}`}
        />
      );
    }

    return (
      <button
        type="button"
        onClick={() => setEditingNameAccountId(account.id)}
        className={`min-w-0 truncate rounded px-2 py-1 text-left text-sm font-medium text-white transition-colors hover:bg-line focus:outline-none focus:ring-2 focus:ring-accent ${
          account.isExcluded ? "line-through" : ""
        } ${className}`}
        title="Click to rename account"
      >
        {savingNameAccountId === account.id ? (
          <span className="inline-flex items-center gap-2">
            <LoadingSpinner />
            Saving...
          </span>
        ) : (
          account.name
        )}
      </button>
    );
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  const bankAccounts = accounts.filter(isBankAccount);

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div
        className="overflow-hidden rounded-lg border border-line bg-surface max-w-2xl w-full max-h-[80vh] shadow-none flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-line px-6 pt-6 pb-0">
          <h2 className="text-lg font-semibold text-white mb-4">
            Manage Accounts
          </h2>

          {/* Tabs + Add Account */}
          <div className="flex items-center justify-between pb-3">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab("balance")}
                className={`rounded-md px-3 py-1 text-sm transition-colors ${
                  activeTab === "balance"
                    ? "bg-canvas font-medium text-white"
                    : "text-muted hover:text-white"
                }`}
              >
                Balance Settings
              </button>
              <button
                onClick={() => setActiveTab("transactions")}
                className={`rounded-md px-3 py-1 text-sm transition-colors ${
                  activeTab === "transactions"
                    ? "bg-canvas font-medium text-white"
                    : "text-muted hover:text-white"
                }`}
              >
                Cashflow Settings
              </button>
            </div>
            <button
              onClick={onAddAccount}
              disabled={addAccountDisabled}
              className={`rounded-md px-3 py-1 text-sm font-medium flex items-center gap-1.5 transition-colors ${
                isConnecting
                  ? "text-accent cursor-not-allowed"
                  : "text-muted hover:text-white"
              }`}
            >
              {isConnecting ? (
                <>
                  <LoadingSpinner />
                  Connecting...
                </>
              ) : (
                "+ Add Account"
              )}
            </button>
          </div>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-sm text-muted flex items-center gap-2">
                <LoadingSpinner />
                Loading accounts...
              </div>
            </div>
          ) : (
            <>
              {/* Bank Balance Settings Tab */}
              {activeTab === "balance" && (
                <div>
                  <p className="text-sm text-muted mb-5 leading-relaxed">
                    Set target minimum balances for each account. Balances below
                    your minimum will be highlighted in red to help you stay on
                    track.
                  </p>

                  <div className="space-y-2">
                    {bankAccounts.length === 0 ? (
                      <p className="text-sm text-muted text-center py-4">
                        No bank accounts found. Add an account to get started.
                      </p>
                    ) : (
                      bankAccounts.map((account) => (
                        <div
                          key={account.id}
                          className={`flex items-center gap-4 rounded-lg border border-line px-4 py-3 ${
                            account.isExcluded ? "opacity-50" : ""
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            {renderEditableAccountName(account, "w-full")}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted">$</span>
                            <div className="relative">
                              <input
                                type="number"
                                placeholder="None"
                                value={minimums[account.id] || ""}
                                onChange={(e) =>
                                  setMinimums({ ...minimums, [account.id]: e.target.value })
                                }
                                onBlur={(e) => handleMinimumBlur(account.id, e.target.value)}
                                className="w-28 rounded border border-line bg-surface px-3 py-1.5 text-sm text-white placeholder-content focus:outline-none focus:border-accent"
                              />
                              {savingAccountId === account.id && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                  <LoadingSpinner />
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => handleToggleHide(account.id)}
                              className="rounded-lg p-1.5 text-muted transition-colors hover:text-white"
                              title={account.isExcluded ? "Show account" : "Hide account"}
                            >
                              {account.isExcluded ? (
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                  />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Cashflow Settings Tab */}
              {activeTab === "transactions" && (
                <div>
                  <p className="text-sm text-muted mb-5 leading-relaxed">
                    Add tags to group accounts into separate cashflow tables.
                    Hide accounts by clicking the eye icon.
                  </p>

                  <div className="space-y-2">
                    {accounts.length === 0 ? (
                      <p className="text-sm text-muted text-center py-4">
                        No accounts found. Add an account to get started.
                      </p>
                    ) : (
                      accounts.map((account) => (
                        <div
                          key={account.id}
                          className={`flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-line px-4 py-3 ${
                            account.isExcluded ? "opacity-50" : ""
                          }`}
                        >
                          <div className="flex flex-col flex-1">
                            {renderEditableAccountName(account, "max-w-full")}
                            <span className="text-xs text-muted mt-0.5">
                              {account.mask && `****${account.mask} · `}
                              <span className="capitalize">
                                {account.subtype || account.type}
                              </span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            <input
                              type="text"
                              value={accountTags[account.id] || ""}
                              onChange={(e) =>
                                handleTagChange(account.id, e.target.value)
                              }
                              placeholder="Tag"
                              maxLength={50}
                              className="rounded border border-line bg-surface px-3 py-1.5 text-sm text-white placeholder-content focus:outline-none focus:border-accent flex-1 sm:flex-none sm:w-32 md:w-44"
                            />
                            <button
                              onClick={() => handleToggleHide(account.id)}
                              className="rounded-lg p-1.5 text-muted transition-colors hover:text-white"
                              title={
                                account.isExcluded ? "Show account" : "Hide account"
                              }
                            >
                              {account.isExcluded ? (
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                              ) : (
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                  />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}
