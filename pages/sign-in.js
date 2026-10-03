import Link from "next/link";
import { useState, useEffect } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/router";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [pageLoading, setPageLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        router.push("/app/cashflow");
      } else {
        setPageLoading(false);
      }
    });
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result.error) {
      setError("Unable to sign in. Check your credentials and account access.");
      setIsLoading(false);
    } else if (result.ok) {
      router.push("/app/cashflow");
    }
  };

  if (pageLoading) {
    return null;
  }

  return (
    <div
      className="min-h-[100dvh] bg-canvas font-sans flex items-start sm:items-center justify-center px-3 py-6 sm:p-4 md:p-8"
    >
      <div className="w-full max-w-md">
        {/* Header with Logo */}
        <div className="text-center mb-5 sm:mb-8">
          <Link href="/">
            <h1 className="mb-2 text-[32px] font-semibold tracking-tight text-white sm:mb-3 sm:text-[40px]">
              cash check
            </h1>
          </Link>
          <p className="text-base text-muted sm:text-xl">Welcome back</p>
        </div>

        {/* Sign In Form */}
        <div className="rounded-lg border border-line bg-surface p-4 sm:p-8 md:p-10 shadow-none">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Error Message */}
            {error && (
              <div className="rounded-lg border border-negative/30 bg-negative/10 px-3 py-3 text-center text-sm leading-relaxed text-negative sm:px-5 sm:py-4">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-white"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="min-h-11 w-full rounded-lg border border-line bg-surface px-4 py-3 text-base text-white placeholder-muted transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:px-5 sm:py-3.5"
                placeholder="your@email.com"
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-white"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="min-h-11 w-full rounded-lg border border-line bg-surface px-4 py-3 text-base text-white placeholder-muted transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 sm:px-5 sm:py-3.5"
                placeholder="••••••••"
              />
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="min-h-11 w-full rounded-lg bg-accent px-6 py-3 text-base font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50 sm:px-8 sm:py-3.5"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin"
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
                  Signing in...
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>


        </div>

        {/* Footer */}
        <div className="mt-5 text-center sm:mt-8">
          <p className="px-2 text-xs leading-relaxed text-muted">
            By signing in, you agree to our{" "}
            <Link
              href="/terms"
              className="text-muted transition-colors hover:text-white"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="text-muted transition-colors hover:text-white"
            >
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
