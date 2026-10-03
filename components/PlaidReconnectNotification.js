import { useEffect, useState } from "react";

const DISMISSED_KEY = "plaid_reconnect_dismissed";

export default function PlaidReconnectNotification({ isOpen, badItem, onReconnect, onRemoveAndReconnect }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Generate a dismissal key unique to this bad item
  const dismissKey = badItem?.id ? `${DISMISSED_KEY}_${badItem.id}` : DISMISSED_KEY;

  useEffect(() => {
    if (isOpen) {
      // The item is still bad — clear any previous dismissal so the
      // notification reappears on every page load / data refresh.
      try {
        localStorage.removeItem(dismissKey);
      } catch {}
      setIsDismissed(false);
      setIsVisible(true);
    }
  }, [isOpen, dismissKey]);

  const handleDismiss = () => {
    try {
      localStorage.setItem(dismissKey, "true");
    } catch {
      // Ignore storage failures and still hide notification for this session.
    }
    setIsDismissed(true);
    setIsVisible(false);
  };

  if (!isOpen || !isVisible || isDismissed) return null;

  // Determine connection name for display
  const connectionName = badItem?.institutionName ||
    (badItem?.accountType === "credit" ? "credit card" : "bank account");

  const isInstitutionError = badItem?.status === "institution_error";
  const handleReconnect = () => {
    if (onReconnect) {
      onReconnect();
      return;
    }
    window.location.href = "/app/balance";
  };

  const handleRemoveAndReconnect = async () => {
    if (!onRemoveAndReconnect) return;
    setIsRemoving(true);
    await onRemoveAndReconnect();
    setIsRemoving(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-surface rounded-lg border border-warning shadow-none p-4 flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg
              className="h-5 w-5 text-warning"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white text-sm font-sans">
              {isInstitutionError ? "Connection Issue" : "Reconnection Required"}
            </h3>
            <p className="text-muted text-sm mt-1 font-sans leading-relaxed">
              {isInstitutionError ? (
                <>Your {connectionName} connection is temporarily unavailable. This is usually a temporary issue with the bank.</>
              ) : (
                <>Your {connectionName} connection needs to be re-linked.</>
              )}
            </p>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleReconnect}
                className="inline-flex items-center rounded-md bg-warning px-3 py-1.5 text-xs font-semibold text-white hover:bg-warning"
              >
                Reconnect Account
              </button>
              {onRemoveAndReconnect && (
                <button
                  onClick={handleRemoveAndReconnect}
                  disabled={isRemoving}
                  className="inline-flex items-center rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-white hover:bg-canvas disabled:opacity-50"
                >
                  {isRemoving ? "Removing..." : "Remove & Re-add"}
                </button>
              )}
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted hover:text-white"
          >
            <span className="sr-only">Dismiss</span>
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
