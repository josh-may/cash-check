import Link from "next/link";
import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";
import { signOut, useSession } from "next-auth/react";

export default function AppHeader({ children, onManageAccounts, onImportCsv }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [router.pathname]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isDropdownOpen]);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/sign-in" });
  };

  const handleManageBilling = async () => {
    try {
      const response = await fetch("/api/stripe/billing-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (response.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to open billing portal. Please try again.");
      }
    } catch (error) {
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div className="font-sans min-h-screen bg-canvas text-content">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-[1700px] items-center justify-between px-6 py-5">
          <Link href="/">
            <span className="text-lg font-bold">cash check</span>
          </Link>

          <div className="flex items-center gap-8">
            <nav className="hidden items-center gap-6 text-base md:flex">
              <Link
                href="/app/cashflow"
                className={`pb-0.5 transition-colors ${
                  router.pathname === "/app/cashflow"
                    ? "border-b-2 border-accent font-medium text-white"
                    : "text-muted hover:text-white"
                }`}
              >
                Cashflow
              </Link>
              <Link
                href="/app/balance"
                className={`pb-0.5 transition-colors ${
                  router.pathname === "/app/balance"
                    ? "border-b-2 border-accent font-medium text-white"
                    : "text-muted hover:text-white"
                }`}
              >
                Balances
              </Link>
            </nav>
            {/* Desktop Hamburger Menu */}
            <div className="hidden md:block relative" ref={dropdownRef}>
              <button
                aria-label="Account menu"
                aria-expanded={isDropdownOpen}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="rounded-lg p-2 text-muted transition-colors hover:text-white"
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
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border border-line bg-surface shadow-none z-50">
                  {onManageAccounts && (
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onManageAccounts();
                      }}
                      className="w-full text-left px-5 py-3.5 text-base text-muted transition-colors hover:bg-canvas hover:text-white border-b border-line"
                    >
                      Manage Accounts
                    </button>
                  )}
                  {onImportCsv && (
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onImportCsv();
                      }}
                      className="w-full text-left px-5 py-3.5 text-base text-muted transition-colors hover:bg-canvas hover:text-white border-b border-line"
                    >
                      Import CSV
                    </button>
                  )}
                  <button
                    onClick={handleManageBilling}
                    className="w-full text-left px-5 py-3.5 text-base text-muted transition-colors hover:bg-canvas hover:text-white border-b border-line"
                  >
                    Manage Billing
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-5 py-3.5 text-base text-muted transition-colors hover:bg-canvas hover:text-white"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              aria-label="Navigation menu"
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden rounded-lg p-2 text-muted transition-colors hover:text-white"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-surface">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-line">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                <span className="text-sm font-bold">cash check</span>
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-lg p-1.5 text-muted transition-colors hover:text-white"
              >
                <svg
                  className="w-5 h-5"
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

            <nav className="flex flex-col space-y-1">
              <Link
                href="/app/cashflow"
                className={`rounded-lg px-4 py-3 text-[15px] font-medium transition-colors ${
                  router.pathname === "/app/cashflow"
                    ? "text-white"
                    : "text-muted hover:text-white"
                }`}
              >
                Cashflow
              </Link>
              <Link
                href="/app/balance"
                className={`rounded-lg px-4 py-3 text-[15px] font-medium transition-colors ${
                  router.pathname === "/app/balance"
                    ? "text-white"
                    : "text-muted hover:text-white"
                }`}
              >
                Balances
              </Link>

              <div className="border-t border-line mt-4 pt-4 space-y-1">
                {onManageAccounts && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onManageAccounts();
                    }}
                    className="w-full rounded-lg px-4 py-3 text-left text-[15px] font-medium text-muted transition-colors hover:text-white"
                  >
                    Manage Accounts
                  </button>
                )}
                {onImportCsv && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onImportCsv();
                    }}
                    className="w-full rounded-lg px-4 py-3 text-left text-[15px] font-medium text-muted transition-colors hover:text-white"
                  >
                    Import CSV
                  </button>
                )}
                <button
                  onClick={handleManageBilling}
                  className="w-full rounded-lg px-4 py-3 text-left text-[15px] font-medium text-muted transition-colors hover:text-white"
                >
                  Manage Billing
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full rounded-lg px-4 py-3 text-left text-[15px] font-medium text-muted transition-colors hover:text-white"
                >
                  Sign Out
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}

      <main>{children}</main>
    </div>
  );
}
