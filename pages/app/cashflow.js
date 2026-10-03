import reportStyles from "../../styles/Report.module.css";
import TransactionTagEditor from "../../components/TransactionTagEditor";
import AppHeader from "../../components/app-header";
import PlaidReconnectNotification from "../../components/PlaidReconnectNotification";
import ManageAccountsModal from "../../components/ManageAccountsModal";
import ImportCsvModal from "../../components/ImportCsvModal";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { usePlaidLink } from "react-plaid-link";
import { fetchLinkToken } from "../../lib/plaid-link-token";

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

export default function Report() {
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    date: "",
    name: "",
    amount: "",
    type: "expense",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkToken, setLinkToken] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [relinkPlaidItemId, setRelinkPlaidItemId] = useState(null);
  const [showRelinkModal, setShowRelinkModal] = useState(false);
  const [badItemInfo, setBadItemInfo] = useState(null);
  const [isManageAccountsOpen, setIsManageAccountsOpen] = useState(false);
  const [manageAccountsInitialTab, setManageAccountsInitialTab] = useState("transactions");
  const [isImportCsvOpen, setIsImportCsvOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedAccountTab, setSelectedAccountTab] = useState("");
  const [availableYears, setAvailableYears] = useState([
    new Date().getFullYear(),
  ]);
  const { status } = useSession();
  const router = useRouter();
  const pendingTagSaves = useRef(new Map());
  const tagDebounceTimers = useRef(new Map());
  const pendingTagValues = useRef(new Map());

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/sign-in");
      return;
    }

    const fetchData = async () => {
      try {
        let relinkItemId = null;

        const response = await fetch(
          `/api/plaid/report-data?year=${selectedYear}`
        );
        if (response.ok) {
          const data = await response.json();
          setReportData(data);
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

  // Plaid Link configuration
  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token) => {
      setIsConnecting(true);

      try {
        const response = await fetch("/api/plaid/exchange_public_token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            relinkPlaidItemId
              ? { public_token, plaidItemId: relinkPlaidItemId }
              : { public_token }
          ),
        });

        if (response.ok) {
          // Refresh report data
          const reportResponse = await fetch(
            `/api/plaid/report-data?year=${selectedYear}`
          );
        if (reportResponse.ok) {
          const data = await reportResponse.json();
          setReportData(data);
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
        }
      } catch (error) {
        // Silently handle errors
      } finally {
        setIsConnecting(false);
      }
    },
    onExit: (error) => {
      setIsConnecting(false);

      // If Link exited with an institution error, show the appropriate notification
      if (error?.error_code === "INSTITUTION_NOT_RESPONDING" ||
          error?.error_code === "INSTITUTION_DOWN" ||
          error?.error_type === "INSTITUTION_ERROR") {
        setShowRelinkModal(true);
      }
    },
  });

  const handleAddAccount = () => {
    if (ready) {
      open();
    }
  };

  const handleMonthClick = (month, accountName) => {
    setSelectedMonth(month);
    setSelectedAccount(accountName);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedMonth("");
    setSelectedAccount("");
    setShowAddForm(false);
    setNewTransaction({
      date: "",
      name: "",
      amount: "",
      type: "expense",
    });
  };

  const openManageAccounts = (tab = "transactions") => {
    setManageAccountsInitialTab(tab);
    setIsManageAccountsOpen(true);
  };

  const closeManageAccounts = async () => {
    setIsManageAccountsOpen(false);
    // Flush any debounced tag edits immediately, then wait for the PUTs to
    // settle so the refresh reflects the final state.
    Array.from(pendingTagValues.current.keys()).forEach((id) => flushTagSave(id));
    const pending = Array.from(pendingTagSaves.current.values());
    pendingTagSaves.current.clear();
    if (pending.length > 0) {
      await Promise.all(pending);
    }
    await refreshReportData();
  };

  const handleToggleHide = async (accountId) => {
    try {
      const response = await fetch("/api/plaid/accounts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId }),
      });

      if (response.ok) {
        await refreshReportData();
      }
    } catch (error) {
      // Silently handle errors
    }
  };

  const flushTagSave = (accountId) => {
    const tag = pendingTagValues.current.get(accountId);
    if (tag === undefined) return Promise.resolve();
    pendingTagValues.current.delete(accountId);
    const existingTimer = tagDebounceTimers.current.get(accountId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      tagDebounceTimers.current.delete(accountId);
    }
    const promise = fetch("/api/plaid/accounts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId,
        tag: tag.trim() || "Main",
      }),
    }).catch(() => {});
    pendingTagSaves.current.set(accountId, promise);
    return promise;
  };

  const handleTagChange = (accountId, tag) => {
    pendingTagValues.current.set(accountId, tag);
    const existing = tagDebounceTimers.current.get(accountId);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => flushTagSave(accountId), 400);
    tagDebounceTimers.current.set(accountId, timer);
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

    await refreshReportData();
  };

  const handleSaveMinimum = async (accountId, minimumBalance) => {
    await fetch("/api/plaid/set-minimum", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, minimumBalance }),
    });
  };

  const refreshReportData = async () => {
    const response = await fetch(`/api/plaid/report-data?year=${selectedYear}`);
    if (response.ok) {
      const data = await response.json();
      setReportData(data);
      if (data.availableYears?.length > 0) {
        setAvailableYears(data.availableYears);
      }
      setBadItemInfo(data.badItems?.[0] || null);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/transactions/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tag: selectedAccount,
          date: newTransaction.date,
          name: newTransaction.name,
          amount: parseFloat(newTransaction.amount),
          type: newTransaction.type,
        }),
      });

      if (response.ok) {
        await refreshReportData();
        setShowAddForm(false);
        setNewTransaction({ date: "", name: "", amount: "", type: "expense" });
      }
    } catch (error) {
      // Silently handle errors
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleExclude = async (transactionId) => {
    try {
      const response = await fetch("/api/transactions/toggle-exclude", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId }),
      });

      if (response.ok) {
        await refreshReportData();
      }
    } catch (error) {
      // Silently handle errors
    }
  };

  const copyTransactions = () => {
    const transactions =
      reportData.accounts
        .find((acc) => acc.name === selectedAccount)
        ?.monthlyData.find((data) => data.month === selectedMonth)
        ?.transactions || [];

    const header = "Date\tDescription\tAccount\tAmount";
    const rows = transactions
      .filter((tx) => !tx.isExcluded)
      .map((tx) => {
        const date = new Date(tx.date).toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        });
        const amount =
          tx.amount > 0
            ? `-$${Math.abs(tx.amount).toFixed(2)}`
            : `$${Math.abs(tx.amount).toFixed(2)}`;
        return `${date}\t${tx.merchantName || tx.name}\t${
          tx.accountName
        }\t${amount}`;
      })
      .join("\n");

    const text = `${header}\n${rows}`;

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Calculate totals across all accounts
  const calculateTotals = () => {
    if (!reportData?.accounts) return null;

    const totals = {};
    reportData.months.forEach((month) => {
      totals[month] = { income: 0, expenses: 0, net: 0 };
    });

    reportData.accounts.forEach((account) => {
      account.monthlyData.forEach((data) => {
        totals[data.month].income += parseFloat(data.income);
        totals[data.month].expenses += parseFloat(data.expenses);
        totals[data.month].net += parseFloat(data.net);
      });
    });

    // Calculate averages
    let totalIncome = 0;
    let totalExpenses = 0;
    let monthsWithData = 0;

    Object.values(totals).forEach((monthTotal) => {
      if (monthTotal.income > 0 || monthTotal.expenses > 0) {
        monthsWithData++;
        totalIncome += monthTotal.income;
        totalExpenses += monthTotal.expenses;
      }
    });

    const avgIncome = monthsWithData > 0 ? totalIncome / monthsWithData : 0;
    const avgExpenses = monthsWithData > 0 ? totalExpenses / monthsWithData : 0;
    const avgNet = avgIncome - avgExpenses;

    return {
      monthly: totals,
      averages: {
        income: avgIncome,
        expenses: avgExpenses,
        net: avgNet,
      },
    };
  };

  if (isLoading) {
    return (
      <AppHeader onManageAccounts={() => openManageAccounts("transactions")} onImportCsv={() => setIsImportCsvOpen(true)}>
        <PlaidReconnectNotification
          isOpen={showRelinkModal}
          badItem={badItemInfo}
          onReconnect={handleAddAccount}
        />
        <section>
          <div className="flex justify-center items-center h-64">
            <div className="text-muted text-sm">Loading report...</div>
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
          onAddAccount={handleAddAccount}
          addAccountDisabled={isConnecting || !ready}
          isConnecting={isConnecting}
        />
      </AppHeader>
    );
  }

  if (!reportData || reportData.accounts.length === 0) {
    return (
      <AppHeader onManageAccounts={() => openManageAccounts("transactions")} onImportCsv={() => setIsImportCsvOpen(true)}>
        <PlaidReconnectNotification
          isOpen={showRelinkModal}
          badItem={badItemInfo}
          onReconnect={handleAddAccount}
        />
        <div className="mx-auto max-w-[1750px] px-3 py-4 sm:px-6 sm:py-6">
          <section>
            <div className="text-center py-12">
              <p className="text-muted mb-4">
                No transaction data available
              </p>
              <p className="text-muted text-sm mb-6">
                Connect your accounts and refresh transactions to see your
                report
              </p>
              <AddAccountButton
                onClick={handleAddAccount}
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
          onAddAccount={handleAddAccount}
          addAccountDisabled={isConnecting || !ready}
          isConnecting={isConnecting}
        />
      </AppHeader>
    );
  }

  const totals = calculateTotals();

  return (
    <AppHeader onManageAccounts={() => openManageAccounts("transactions")} onImportCsv={() => setIsImportCsvOpen(true)}>
      <PlaidReconnectNotification
        isOpen={showRelinkModal}
        badItem={badItemInfo}
        onReconnect={handleAddAccount}
      />
      <div className="mx-auto max-w-[1750px] px-3 py-4 sm:px-6 sm:py-6">
        <section>

          {/* Cashflow Tables */}
          <div className="flex flex-col gap-6">
            {reportData.accounts.map((account, accountIdx) => (
              <div key={account.name} className={`overflow-hidden rounded-lg border border-line bg-surface shadow-none ${reportStyles.card}`}>
                <div className="overflow-x-auto">
                  <table className="data-table w-full min-w-[760px] table-auto border-collapse text-sm sm:text-base">
                    <thead>
                      <tr>
                        <th className="w-[160px] min-w-[160px] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted sm:px-6 sm:py-4 sm:text-sm">
                          {account.name}
                        </th>
                        {reportData.months.map((month) => (
                          <th
                            key={month}
                            onClick={() => handleMonthClick(month, account.name)}
                            className="min-w-[88px] px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted cursor-pointer hover:text-white transition-colors sm:px-4 sm:py-4 sm:text-sm"
                          >
                            {month}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Income Row */}
                      <tr className="border-b border-line">
                        <td className="px-3 py-3 text-left sm:px-6 sm:py-4">
                          <strong>Income</strong>
                        </td>
                        {reportData.months.map((month) => {
                          const monthData = account.monthlyData.find(
                            (d) => d.month === month
                          );
                          const income = monthData
                            ? parseFloat(monthData.income)
                            : null;
                          return (
                            <td
                              key={month}
                              className="px-3 py-3 text-right tabular-nums whitespace-nowrap sm:px-4 sm:py-4"
                            >
                              {income === null || income === 0
                                ? <span className="text-quiet">&mdash;</span>
                                : `$${income.toLocaleString("en-US", {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  })}`}
                            </td>
                          );
                        })}
                      </tr>
                      {/* Expenses Row */}
                      <tr className="border-b border-line">
                        <td className="px-3 py-3 text-left sm:px-6 sm:py-4">
                          <strong>Expenses</strong>
                        </td>
                        {reportData.months.map((month) => {
                          const monthData = account.monthlyData.find(
                            (d) => d.month === month
                          );
                          const expenses = monthData
                            ? parseFloat(monthData.expenses)
                            : null;
                          return (
                            <td
                              key={month}
                              className="px-3 py-3 text-right tabular-nums whitespace-nowrap sm:px-4 sm:py-4"
                            >
                              {expenses === null || expenses === 0
                                ? <span className="text-quiet">&mdash;</span>
                                : `$${expenses.toLocaleString("en-US", {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  })}`}
                            </td>
                          );
                        })}
                      </tr>
                      {/* Net Row */}
                      <tr>
                        <td className="px-3 py-3 text-left sm:px-6 sm:py-4">
                          <strong>Net</strong>
                        </td>
                        {reportData.months.map((month) => {
                          const monthData = account.monthlyData.find(
                            (d) => d.month === month
                          );
                          const net = monthData
                            ? parseFloat(monthData.net)
                            : null;
                          return (
                            <td
                              key={month}
                              data-net={net === null || net === 0 ? "zero" : net > 0 ? "positive" : "negative"}
                              className={`px-3 py-3 text-right font-semibold tabular-nums whitespace-nowrap sm:px-4 sm:py-4 ${
                                net === null || net === 0
                                  ? "text-quiet"
                                  : net > 0
                                  ? "text-positive"
                                  : "text-negative"
                              }`}
                            >
                              {net === null || net === 0
                                ? "\u2014"
                                : `${net > 0 ? "+" : "-"}$${Math.abs(
                                    net
                                  ).toLocaleString("en-US", {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 0,
                                  })}`}
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {/* Year Tabs */}
            <div className="flex flex-wrap items-center gap-2 px-1 py-2">
              {availableYears.map((year) => (
                <button
                  key={year}
                  aria-pressed={year === selectedYear}
                  onClick={() => setSelectedYear(year)}
                  className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
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

      {/* Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeModal}
          ></div>
          <div className="relative bg-surface rounded-lg border border-line w-full max-w-5xl mx-2 sm:mx-auto max-h-[90vh] sm:max-h-[85vh] overflow-hidden shadow-none">
            <div className="flex justify-between items-center gap-2 px-3 py-3 sm:px-5 sm:py-5 border-b border-line">
              <h2 className="text-sm sm:text-lg font-semibold text-white truncate">
                {selectedMonth} {reportData.year} &mdash; {selectedAccount}{" "}
                Transactions
              </h2>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="text-muted hover:text-white transition-colors"
                  title="Add manual transaction"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </button>
                <button
                  onClick={copyTransactions}
                  className={`transition-all duration-200 ${
                    isCopied
                      ? "text-positive scale-110"
                      : "text-muted hover:text-white active:scale-95"
                  }`}
                  title="Copy transactions"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {isCopied ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    )}
                  </svg>
                </button>
                <button
                  onClick={closeModal}
                  className="text-muted hover:text-white transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Add Transaction Form Panel */}
            {showAddForm && (
              <div className="border-b border-line bg-surface p-4 sm:p-6">
                <form onSubmit={handleAddTransaction} className="space-y-4">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Add Transaction
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-muted mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        required
                        value={newTransaction.date}
                        onChange={(e) =>
                          setNewTransaction({
                            ...newTransaction,
                            date: e.target.value,
                          })
                        }
                        className="w-full bg-surface border border-line rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-muted mb-1">
                        Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={newTransaction.amount}
                        onChange={(e) =>
                          setNewTransaction({
                            ...newTransaction,
                            amount: e.target.value,
                          })
                        }
                        placeholder="0.00"
                        className="w-full bg-surface border border-line rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-muted mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        required
                        value={newTransaction.name}
                        onChange={(e) =>
                          setNewTransaction({
                            ...newTransaction,
                            name: e.target.value,
                          })
                        }
                        placeholder="Transaction description"
                        className="w-full bg-surface border border-line rounded px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-muted mb-1">
                        Type
                      </label>
                      <div className="flex gap-4 mt-2">
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            value="expense"
                            checked={newTransaction.type === "expense"}
                            onChange={(e) =>
                              setNewTransaction({
                                ...newTransaction,
                                type: e.target.value,
                              })
                            }
                            className="mr-2"
                          />
                          <span className="text-white">Expense</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="radio"
                            value="income"
                            checked={newTransaction.type === "income"}
                            onChange={(e) =>
                              setNewTransaction({
                                ...newTransaction,
                                type: e.target.value,
                              })
                            }
                            className="mr-2"
                          />
                          <span className="text-white">Income</span>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setNewTransaction({
                          date: "",
                          name: "",
                          amount: "",
                          type: "expense",
                        });
                      }}
                      className="px-4 py-2 border border-line bg-surface hover:bg-canvas text-muted rounded transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? "Adding..." : "Add Transaction"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="overflow-auto max-h-[calc(85vh-80px)] sm:max-h-[calc(85vh-100px)]">
              <table className="data-table w-full text-sm">
                <thead className="sticky top-0">
                  <tr className="border-b border-line bg-surface">
                    <th className="text-left px-3 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted whitespace-nowrap sm:px-5">
                      Date
                    </th>
                    <th className="text-left px-2 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted min-w-[120px] sm:px-4 sm:min-w-[150px]">
                      Description
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted hidden sm:table-cell">
                      Account
                    </th>
                    <th className="text-right px-2 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted whitespace-nowrap sm:px-4">
                      Amount
                    </th>
                    <th className="w-12 px-2 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-muted whitespace-nowrap sm:w-16 sm:px-3">
                      Ignore
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.accounts
                    .find((acc) => acc.name === selectedAccount)
                    ?.monthlyData.find((data) => data.month === selectedMonth)
                    ?.transactions.sort((a, b) => {
                      // First sort by exclusion status
                      if (a.isExcluded && !b.isExcluded) return 1;
                      if (!a.isExcluded && b.isExcluded) return -1;

                      // Then sort by amount (highest expenses first)
                      // Positive amounts are expenses, negative are income
                      return b.amount - a.amount;
                    })
                    .map((tx) => (
                      <tr
                        key={tx.id}
                        className={`group transition-colors border-b border-line hover:bg-canvas ${
                          tx.isExcluded ? "opacity-50" : ""
                        }`}
                      >
                        <td className="px-3 py-3 text-muted whitespace-nowrap text-sm tabular-nums sm:px-5">
                          {new Date(tx.date).toLocaleDateString("en-US", {
                            month: "2-digit",
                            day: "2-digit",
                          })}
                        </td>
                        <td
                          className={`px-2 py-3 text-white break-words sm:px-4 ${
                            tx.isExcluded ? "line-through" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {tx.merchantName || tx.name}
                            {tx.source === "manual" && (
                              <span
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-blue-500/15 text-blue-300 border border-blue-500/20"
                                title="Manually added transaction"
                              >
                                Manual
                              </span>
                            )}
                            {tx.source === "csv" && (
                              <span
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-purple-500/15 text-purple-300 border border-purple-500/20"
                                title="Imported from CSV"
                              >
                                CSV
                              </span>
                            )}
                          </div>
                          <TransactionTagEditor transaction={tx}
                            tags={reportData.accounts.map((account) => account.name)}
                            onSaved={refreshReportData} />
                        </td>
                        <td className="px-4 py-3 text-muted text-sm hidden sm:table-cell">
                          {tx.accountName}
                        </td>
                        <td
                          className={`px-2 py-3 text-right text-sm font-semibold tabular-nums whitespace-nowrap sm:px-4 ${
                            tx.isExcluded
                              ? "text-quiet line-through"
                              : tx.amount > 0
                              ? "text-negative"
                              : "text-positive"
                          }`}
                        >
                          {tx.amount > 0 ? "-" : "+"}$
                          {Math.abs(tx.amount).toFixed(2)}
                        </td>
                        <td className="px-2 py-3 text-right sm:px-3">
                          <div className="relative inline-block group/hide">
                            <button
                              onClick={() => handleToggleExclude(tx.id)}
                              className="text-quiet hover:text-white transition-colors p-1 rounded"
                            >
                              {tx.isExcluded ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              )}
                            </button>
                            <div className="pointer-events-none absolute right-0 top-full mt-1 z-10 w-64 rounded-md border border-line bg-canvas px-3 py-2 text-left text-xs text-content shadow-lg opacity-0 group-hover/hide:opacity-100 transition-opacity">
                              {tx.isExcluded
                                ? "Click to include this transaction again in your cashflow totals."
                                : "Click to ignore this transaction. For example, hide a one-off reimbursement or transfer between your own accounts so it doesn't skew your monthly income or expense totals."}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <ManageAccountsModal
        isOpen={isManageAccountsOpen}
        onClose={closeManageAccounts}
        initialTab={manageAccountsInitialTab}
        onSaveMinimum={handleSaveMinimum}
        onToggleHide={handleToggleHide}
        onTagChange={handleTagChange}
        onRenameAccount={handleRenameAccount}
        onAddAccount={handleAddAccount}
        addAccountDisabled={isConnecting || !ready}
        isConnecting={isConnecting}
      />
      <ImportCsvModal
        isOpen={isImportCsvOpen}
        onClose={() => setIsImportCsvOpen(false)}
        onSuccess={() => refreshReportData()}
      />
    </AppHeader>
  );
}
