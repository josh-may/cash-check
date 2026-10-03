import { useState, useEffect } from "react";
import { usePlaidLink } from "react-plaid-link";
import { pollForTransactions } from "../lib/poll-transactions";
import { fetchLinkToken } from "../lib/plaid-link-token";
import { useRouter } from "next/router";
import { signIn, useSession } from "next-auth/react";
import SEO from "@/components/SEO";

function FlashingMessage({ message1, message2 }) {
  const [showFirst, setShowFirst] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowFirst((prev) => !prev);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return <span>{showFirst ? message1 : message2}</span>;
}

export default function Onboarding() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [linkToken, setLinkToken] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null); // 'polling', 'success', 'error'
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Auto-login after Stripe payment
  useEffect(() => {
    const handleAuth = async () => {
      const { session_id } = router.query;
      const pendingEmail = sessionStorage.getItem("pendingAuthEmail");
      const pendingPassword = sessionStorage.getItem("pendingAuthPassword");

      if (session_id && pendingEmail && pendingPassword) {
        setIsAuthenticating(true);

        try {
          // Make the onboarding flow resilient to Stripe webhook delays/misconfig:
          // confirm the Checkout Session server-side, then attempt login (with retries).
          const confirmCheckout = async () => {
            try {
              await fetch("/api/stripe/confirm-checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId: session_id }),
              });
            } catch {
              // Non-fatal; we still attempt login, and retries below will try again.
            }
          };

          await confirmCheckout();

          let lastResult = null;
          for (let attempt = 0; attempt < 6; attempt++) {
            lastResult = await signIn("credentials", {
              redirect: false,
              email: pendingEmail,
              password: pendingPassword,
            });

            if (lastResult?.ok) break;
            if (!lastResult?.error?.includes("Payment required")) break;

            // Give Stripe webhook/confirmation a moment, then re-confirm and retry.
            await new Promise((r) => setTimeout(r, 1000 + attempt * 750));
            await confirmCheckout();
          }

          if (lastResult?.ok) {
            sessionStorage.removeItem("pendingAuthEmail");
            sessionStorage.removeItem("pendingAuthPassword");
          }
        } catch (e) {
          console.error("Auto-login failed:", e);
        } finally {
          setIsAuthenticating(false);
        }
      }
    };

    if (router.isReady) {
      handleAuth();
    }
  }, [router.isReady, router.query]);

  // Get link token
  useEffect(() => {
    if (isAuthenticating || status === "loading") return;

    if (status === "unauthenticated") {
      setTimeout(() => router.push("/sign-in"), 500);
      return;
    }

    if (status === "authenticated") {
      fetchLinkToken().then((token) => token && setLinkToken(token));
    }
  }, [status, isAuthenticating, router]);

  // Handle polling with visual feedback for specific PlaidItem
  const startPolling = async (plaidItemId = null) => {
    setSyncStatus("polling");

    const result = await pollForTransactions(plaidItemId);

    if (result.success) {
      setSyncStatus("success");
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } else if (result.timeout) {
      setSyncStatus("timeout");
    }

    return result.success;
  };

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token) => {
      setIsConnecting(true);
      setError(null);

      try {
        // Exchange token
        const response = await fetch("/api/plaid/exchange_public_token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ public_token }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to connect account");
        }

        // Poll for transactions to be ready for the specific new PlaidItem
        const syncSuccess = await startPolling(data.plaidItemId);

        if (syncSuccess) {
          window.location.href = "/app/cashflow";
        } else {
          setError(
            "Transaction sync is taking longer than expected. You can refresh transactions later."
          );
          setTimeout(() => {
            window.location.href = "/app/cashflow";
          }, 3000);
        }
      } catch (err) {
        setError(err.message || "Failed to connect account");
        setIsConnecting(false);
        setSyncStatus(null);
      }
    },
    onExit: () => {
      setIsConnecting(false);
    },
  });

  const handleConnectPlaid = () => {
    if (ready) {
      open();
    }
  };

  // Show loading state while authenticating
  if (isAuthenticating || status === "loading") {
    return (
      <div className="font-sans min-h-screen bg-canvas flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="text-center">
          <svg
            className="animate-spin h-8 w-8 text-accent mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
          >
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
          <p className="text-white text-sm">Setting up your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="font-sans min-h-screen bg-canvas flex items-center justify-center p-4 sm:p-6 md:p-8">
      <SEO
        title="Get Started — cash check"
        description="Connect your financial accounts and start tracking your cashflow in minutes."
        canonicalUrl="http://localhost:3000/onboarding"
      />
      <main className="max-w-4xl w-full">
        {/* Step Content */}
        <div className="text-center">
          <div className="space-y-6 md:space-y-8">
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white">
                Welcome to <span className="font-sans">cash check</span>
              </h2>
              <p className="text-base sm:text-lg text-muted max-w-2xl mx-auto leading-relaxed">
                Let&apos;s get you set up with automated cashflow tracking.
                First, let&apos;s connect your financial accounts.
              </p>
            </div>

            {error && (
              <div className="bg-negative/10 border border-negative/30 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-negative text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleConnectPlaid}
              disabled={isConnecting || syncStatus === "polling"}
              className={`font-medium text-base px-8 md:px-12 py-3 md:py-4 rounded-lg transition-colors ${
                isConnecting || syncStatus === "polling"
                  ? "bg-accent/50 text-white cursor-not-allowed"
                  : "bg-accent hover:bg-accent-hover text-white"
              }`}
            >
              {isConnecting || syncStatus === "polling" ? (
                <div className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 md:h-5 md:w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
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
                  <FlashingMessage
                    message1={syncStatus === "polling"
                      ? "Syncing Transactions..."
                      : "Connecting to Plaid..."}
                    message2="Please don't exit or reload"
                  />
                </div>
              ) : (
                "Connect Your Accounts"
              )}
            </button>

            <div className="rounded-lg border border-line bg-surface p-6 max-w-md mx-auto mt-6 text-left">
              <h4 className="text-base font-medium text-white mb-2">
                Your data is your data.
              </h4>
              <p className="text-sm text-muted leading-relaxed mb-4">
                We treat your personal and financial data like we&apos;d want
                ours to be treated. Here&apos;s what that means:
              </p>
              <ul className="space-y-3 text-sm text-white">
                {[
                  "We never sell your data.",
                  "There are zero AI features meaning no models are reading your financial data.",
                  "We use Plaid for read-only access to transactions. We can\u2019t touch your money.",
                  "All data is protected with bank-level 256-bit SSL encryption.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-positive/10 text-xs text-positive mt-0.5">
                      &#x2713;
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
