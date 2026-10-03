import { useState, useEffect } from "react";
import CsvUploader from "./CsvUploader";
import CsvPreview from "./CsvPreview";
import { parseCSV } from "../lib/csvParsers";
import { createTransactionSignature } from "../lib/transaction-signature";

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

export default function ImportCsvModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [tag, setTag] = useState("");
  const [newTag, setNewTag] = useState("");
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [existingTags, setExistingTags] = useState([]);
  const [csvData, setCsvData] = useState(null);
  const [parsedTransactions, setParsedTransactions] = useState([]);
  const [parseErrors, setParseErrors] = useState([]);
  const [detectedFormat, setDetectedFormat] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [duplicateSignatures, setDuplicateSignatures] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      handleReset();
      fetchTags();
    }
  }, [isOpen]);

  const fetchTags = async () => {
    try {
      const response = await fetch("/api/plaid/accounts");
      if (response.ok) {
        const accounts = await response.json();
        const tags = [...new Set(accounts.map((a) => a.tag).filter(Boolean))];
        setExistingTags(tags);
      }
    } catch (error) {}
  };

  useEffect(() => {
    if (!tag || !isOpen) {
      setDuplicateSignatures([]);
      return;
    }

    const fetchSignatures = async () => {
      try {
        const response = await fetch(`/api/plaid/report-data?year=${new Date().getFullYear()}`);
        if (response.ok) {
          const data = await response.json();
          const account = data.accounts?.find((a) => a.name === tag);
          if (account) {
            const signatures = new Set();
            account.monthlyData.forEach((month) => {
              month.transactions.forEach((tx) => {
                const signature = createTransactionSignature(tx);
                if (signature) signatures.add(signature);
              });
            });
            setDuplicateSignatures(Array.from(signatures));
          } else {
            setDuplicateSignatures([]);
          }
        }
      } catch (error) {}
    };
    fetchSignatures();
  }, [tag, isOpen]);

  const handleFileContent = (content) => {
    setCsvData(content);
    if (content) {
      const result = parseCSV(content);
      setParsedTransactions(result.transactions);
      setParseErrors(result.errors);
      setDetectedFormat(result.format);
      setSelectedIds(new Set(result.transactions.map((_, i) => i)));
    } else {
      setParsedTransactions([]);
      setParseErrors([]);
      setDetectedFormat("");
      setSelectedIds(new Set());
    }
  };

  const handleTagSelect = (selectedTag) => {
    setTag(selectedTag);
    setIsCreatingTag(false);
    setNewTag("");
  };

  const handleCreateTag = () => {
    if (newTag.trim()) {
      setTag(newTag.trim());
      setIsCreatingTag(false);
    }
  };

  const handleImport = async () => {
    if (selectedIds.size === 0) return;
    setIsImporting(true);
    setImportResult(null);

    try {
      const selectedTransactions = parsedTransactions.filter((_, i) => selectedIds.has(i));
      const response = await fetch("/api/transactions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactions: selectedTransactions,
          tag,
          importBatchId: globalThis.crypto?.randomUUID?.() || `import-${Date.now()}`,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        setImportResult({ success: true, imported: result.imported, skipped: result.skipped });
        setStep(4);
      } else {
        setImportResult({ success: false, error: result.error || "Import failed" });
      }
    } catch (error) {
      setImportResult({ success: false, error: "Network error. Please try again." });
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setTag("");
    setNewTag("");
    setIsCreatingTag(false);
    setCsvData(null);
    setParsedTransactions([]);
    setParseErrors([]);
    setDetectedFormat("");
    setSelectedIds(new Set());
    setDuplicateSignatures([]);
    setImportResult(null);
  };

  const handleDone = () => {
    if (onSuccess && importResult?.success) onSuccess(importResult);
    onClose();
  };

  if (!isOpen) return null;

  const canProceed = step === 1 ? tag.length > 0 : csvData && parsedTransactions.length > 0;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-lg border border-line w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-none flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <div>
            <h2 className="text-lg font-semibold text-white font-sans">
              Import CSV
            </h2>
            <p className="text-muted text-xs mt-0.5">
              Import transactions for your Transaction Report
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Select Tag */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-muted text-sm">
                Select an account to import transactions into.
              </p>

              {existingTags.length > 0 && !isCreatingTag && (
                <div className="flex flex-wrap gap-2">
                  {existingTags.map((t) => (
                    <button
                      key={t}
                      onClick={() => handleTagSelect(t)}
                      className={`px-4 py-2 rounded-lg font-sans text-sm transition-all ${
                        tag === t
                          ? "bg-accent text-white"
                          : "border border-line bg-surface text-white hover:bg-canvas"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}

              {!isCreatingTag ? (
                <button
                  onClick={() => setIsCreatingTag(true)}
                  className="text-sm text-muted hover:text-white transition-colors"
                >
                  + New account
                </button>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
                    placeholder="Account name"
                    autoFocus
                    maxLength={50}
                    className="flex-1 px-3 py-2 bg-surface border border-line rounded-lg text-white placeholder-content text-sm focus:outline-none focus:border-accent"
                  />
                  <button
                    onClick={handleCreateTag}
                    disabled={!newTag.trim()}
                    className="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent-hover transition-colors disabled:opacity-50"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => { setIsCreatingTag(false); setNewTag(""); }}
                    className="px-3 py-2 text-muted hover:text-white transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Upload CSV */}
          {step === 2 && (
            <div className="space-y-4">
              <CsvUploader onFileContent={handleFileContent} />

              {csvData && (
                <div className="text-sm">
                  {detectedFormat && (
                    <p className="text-muted">
                      Format: <span className="text-white capitalize">{detectedFormat}</span>
                    </p>
                  )}
                  {parsedTransactions.length > 0 && (
                    <p className="text-positive">
                      {parsedTransactions.length} transaction{parsedTransactions.length !== 1 ? "s" : ""} found
                    </p>
                  )}
                  {parseErrors.length > 0 && (
                    <p className="text-negative">{parseErrors.length} error{parseErrors.length !== 1 ? "s" : ""}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Preview */}
          {step === 3 && (
            <div className="space-y-4">
              <CsvPreview
                transactions={parsedTransactions}
                duplicateSignatures={duplicateSignatures}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
              />
            </div>
          )}

          {/* Step 4: Results */}
          {step === 4 && importResult && (
            <div className="text-center py-8">
              {importResult.success ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-positive/20 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-positive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-white font-medium mb-1">
                    Imported {importResult.imported} transaction{importResult.imported !== 1 ? "s" : ""}
                  </p>
                  {importResult.skipped > 0 && (
                    <p className="text-muted text-sm">
                      {importResult.skipped} duplicate{importResult.skipped !== 1 ? "s" : ""} skipped
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-negative/20 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-negative" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <p className="text-negative">{importResult.error}</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-line flex justify-between items-center">
          {step === 4 ? (
            <>
              <button
                onClick={handleReset}
                className="text-sm text-muted hover:text-white transition-colors"
              >
                Import more
              </button>
              <button
                onClick={handleDone}
                className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors"
              >
                Done
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => step > 1 && setStep(step - 1)}
                className={`text-sm transition-colors ${
                  step > 1 ? "text-muted hover:text-white" : "text-quiet cursor-default"
                }`}
              >
                Back
              </button>
              <div className="flex items-center gap-4">
                {step === 3 && (
                  <span className="text-sm text-muted">
                    {selectedIds.size} selected
                  </span>
                )}
                <button
                  onClick={() => step === 3 ? handleImport() : setStep(step + 1)}
                  disabled={!canProceed || isImporting}
                  className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isImporting ? (
                    <>
                      <LoadingSpinner />
                      Importing...
                    </>
                  ) : step === 3 ? (
                    "Import"
                  ) : (
                    "Continue"
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
