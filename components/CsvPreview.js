import { createTransactionSignature } from "../lib/transaction-signature";

export default function CsvPreview({
  transactions,
  duplicateSignatures,
  selectedIds,
  onSelectionChange,
}) {
  // Build duplicate signature set for quick lookups
  const duplicateSet = new Set(duplicateSignatures || []);
  const allSelected = transactions.length > 0 && selectedIds.size === transactions.length;

  // Check if transaction is a potential duplicate
  const isDuplicate = (tx) => duplicateSet.has(createTransactionSignature(tx));

  // Count duplicates and ready transactions
  const duplicateCount = transactions.filter(isDuplicate).length;
  const readyCount = selectedIds.size;

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(transactions.map((_, i) => i)));
    }
  };

  const handleRowToggle = (index) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    onSelectionChange(newSelected);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formatAmount = (amount) => {
    const isExpense = amount > 0;
    return (
      <span className={isExpense ? "text-negative" : "text-positive"}>
        {isExpense ? "-" : "+"}${Math.abs(amount).toFixed(2)}
      </span>
    );
  };

  return (
    <div className="w-full">
      {/* Summary */}
      <div className="mb-4 p-4 bg-surface rounded-lg border border-line">
        <div className="flex flex-wrap gap-4 text-sm font-sans">
          <span className="text-white">
            <span className="text-positive font-semibold">{readyCount}</span>{" "}
            transaction{readyCount !== 1 ? "s" : ""} selected
          </span>
          {duplicateCount > 0 && (
            <span className="text-white">
              <span className="text-warning font-semibold">{duplicateCount}</span>{" "}
              potential duplicate{duplicateCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-lg border border-line overflow-hidden">
        <div className="overflow-x-auto max-h-96">
          <table className="data-table w-full font-sans text-sm">
            <thead className="bg-surface sticky top-0">
              <tr className="border-b border-line">
                <th className="p-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-line bg-surface text-positive focus:ring-accent focus:ring-offset-0 focus:ring-offset-surface"
                  />
                </th>
                <th className="p-3 text-left text-muted font-semibold">
                  Date
                </th>
                <th className="p-3 text-left text-muted font-semibold">
                  Description
                </th>
                <th className="p-3 text-right text-muted font-semibold">
                  Amount
                </th>
                <th className="p-3 text-center text-muted font-semibold">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx, index) => {
                const duplicate = isDuplicate(tx);
                const selected = selectedIds.has(index);

                return (
                  <tr
                    key={index}
                    onClick={() => handleRowToggle(index)}
                    className={`
                      border-t border-line cursor-pointer transition-colors
                      ${selected ? "bg-surface" : "bg-surface opacity-60"}
                      hover:bg-line
                    `}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => handleRowToggle(index)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-line bg-surface text-positive focus:ring-accent focus:ring-offset-0 focus:ring-offset-surface"
                      />
                    </td>
                    <td className="p-3 text-white whitespace-nowrap">
                      {formatDate(tx.date)}
                    </td>
                    <td className="p-3 text-white max-w-xs truncate">
                      {tx.name}
                    </td>
                    <td className="p-3 text-right font-semibold tabular-nums whitespace-nowrap">
                      {formatAmount(tx.amount)}
                    </td>
                    <td className="p-3 text-center">
                      {duplicate ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-warning/10 text-warning border border-warning/30">
                          Duplicate?
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-positive/10 text-positive border border-positive/30">
                          OK
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
