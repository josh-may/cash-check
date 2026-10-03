import Link from "next/link";
import SEO from "@/components/SEO";

export default function Developers() {
  return (
    <div className="font-sans">
      <SEO
        title="Developers — cash check API"
        description="Access your financial data programmatically. Bring your own LLM and talk to your finances through our API."
        canonicalUrl="http://localhost:3000/developers"
      />

      {/* Header */}
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-10">
            <Link href="/">
              <span className="text-lg font-bold">
                cash check
              </span>
            </Link>
            <nav className="hidden items-center gap-7 sm:flex">
              <Link
                href="/#features"
                className="text-base text-muted transition-colors hover:text-white"
              >
                Features
              </Link>
              <Link
                href="/#pricing"
                className="text-base text-muted transition-colors hover:text-white"
              >
                Pricing
              </Link>
              <Link
                href="/developers"
                className="text-base text-white"
              >
                Developers
              </Link>
              <Link
                href="/#faq"
                className="text-base text-muted transition-colors hover:text-white"
              >
                FAQs
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="rounded-lg px-4 py-2.5 text-base font-medium text-muted transition-colors hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href={`/sign-up?planPriceId=${process.env.NEXT_PUBLIC_STRIPE_STARTER_PLAN_PRICE_ID}`}
              className="rounded-lg bg-accent px-5 py-2.5 text-base font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6">
        {/* Hero */}
        <section className="pb-20 pt-24 sm:pt-32">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-xs font-medium text-muted">
              Coming Soon
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Your financial data,
            <br className="hidden sm:block" />{" "}
            <span className="text-accent">your way.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            Access balances, transactions, and cashflow data through a simple
            REST API. Bring your own LLM and talk to your finances
            programmatically.
          </p>
          <p className="mt-3 text-sm text-muted">
            This feature is currently in development. Sign up now and
            you&apos;ll get access as soon as it launches.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href={`/sign-up?planPriceId=${process.env.NEXT_PUBLIC_STRIPE_STARTER_PLAN_PRICE_ID}`}
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Get Started
            </Link>
          </div>
        </section>

        {/* How it works */}
        <section className="pb-24">
          <div className="mb-2 text-sm font-medium uppercase tracking-wider text-accent">
            How It Works
          </div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Three steps to programmatic finance
          </h2>
          <p className="mt-3 max-w-xl text-base text-muted">
            Connect your accounts, grab your API key, and start querying your
            financial data from anywhere.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <div className="rounded-lg border border-line bg-surface p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 font-mono text-lg font-bold text-accent">
                1
              </div>
              <h3 className="font-semibold text-white">Connect accounts</h3>
              <p className="mt-2 text-sm text-muted">
                Link your bank accounts, credit cards, and investment accounts
                through Plaid. Takes under a minute.
              </p>
            </div>
            <div className="rounded-lg border border-line bg-surface p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 font-mono text-lg font-bold text-accent">
                2
              </div>
              <h3 className="font-semibold text-white">Get your API key</h3>
              <p className="mt-2 text-sm text-muted">
                Generate an API key from your dashboard. Use it to authenticate
                requests to any endpoint.
              </p>
            </div>
            <div className="rounded-lg border border-line bg-surface p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 font-mono text-lg font-bold text-accent">
                3
              </div>
              <h3 className="font-semibold text-white">Query your data</h3>
              <p className="mt-2 text-sm text-muted">
                Fetch balances, transactions, and cashflow data. Pipe it into
                your own tools, scripts, or LLMs.
              </p>
            </div>
          </div>
        </section>

        {/* API Example */}
        <section className="pb-24">
          <div className="mb-2 text-sm font-medium uppercase tracking-wider text-accent">
            REST API
          </div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Simple JSON endpoints
          </h2>
          <p className="mt-3 max-w-xl text-base text-muted">
            Get balances, transactions, and cashflow data across all your
            accounts with straightforward API calls.
          </p>

          <div className="mt-8 overflow-hidden rounded-lg border border-line bg-surface">
            <div className="flex items-center gap-2 border-b border-line px-5 py-3">
              <span className="rounded bg-accent/10 px-2 py-0.5 font-mono text-xs font-medium text-accent">
                GET
              </span>
              <span className="font-mono text-sm text-muted">
                /api/v1/balances
              </span>
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-sm leading-relaxed text-content">
{`{
  "accounts": [
    {
      "name": "Main Account",
      "balance": 8900,
      "minimum": 7000,
      "status": "healthy",
      "institution": "Chase"
    },
    {
      "name": "Emergency Fund",
      "balance": 24000,
      "minimum": 21000,
      "status": "healthy",
      "institution": "Ally"
    }
  ],
  "total_balance": 32900,
  "total_minimum": 28000,
  "over_minimum_by": 4900
}`}
            </pre>
          </div>

          <div className="mt-6 overflow-hidden rounded-lg border border-line bg-surface">
            <div className="flex items-center gap-2 border-b border-line px-5 py-3">
              <span className="rounded bg-accent/10 px-2 py-0.5 font-mono text-xs font-medium text-accent">
                GET
              </span>
              <span className="font-mono text-sm text-muted">
                /api/v1/cashflow?months=3
              </span>
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-sm leading-relaxed text-content">
{`{
  "months": [
    { "month": "Mar", "income": 8500, "expenses": 6400, "net": 2100 },
    { "month": "Apr", "income": 8200, "expenses": 7500, "net": 700 },
    { "month": "May", "income": 9400, "expenses": 6900, "net": 2500 }
  ],
  "average_net": 1767
}`}
            </pre>
          </div>
        </section>

        {/* Bring Your LLM */}
        <section className="pb-24">
          <div className="mb-2 text-sm font-medium uppercase tracking-wider text-accent">
            LLM Integration
          </div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Bring your own LLM
          </h2>
          <p className="mt-3 max-w-xl text-base text-muted">
            Pipe your financial data into any LLM — ChatGPT, Claude, open-source
            models, or your own. Ask questions about your spending, get
            forecasts, or build custom financial agents.
          </p>

          <div className="mt-8 overflow-hidden rounded-lg border border-line bg-surface">
            <div className="flex items-center gap-2 border-b border-line px-5 py-3">
              <span className="font-mono text-sm text-muted">
                Example: Ask your LLM about your finances
              </span>
            </div>
            <div className="space-y-4 p-5">
              <div className="rounded-lg bg-canvas px-4 py-3">
                <p className="mb-1 text-xs font-medium text-muted">You</p>
                <p className="text-sm text-white">
                  How much did I spend on food last month across all accounts?
                </p>
              </div>
              <div className="rounded-lg border border-line px-4 py-3">
                <p className="mb-1 text-xs font-medium text-accent">
                  LLM (using cash check API)
                </p>
                <p className="text-sm text-content">
                  Based on your transaction data, you spent $847 on
                  food-related transactions in April across your Main Account
                  and Business 1. That&apos;s up 12% from March ($756). The
                  biggest charges were restaurants at $412 and groceries at
                  $389.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            <div className="rounded-lg border border-line bg-surface p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 font-mono text-lg text-accent">
                &#123;&#125;
              </div>
              <h3 className="font-semibold text-white">Structured data</h3>
              <p className="mt-2 text-sm text-muted">
                Clean JSON responses ready to be injected into any LLM context
                window as structured tool output.
              </p>
            </div>
            <div className="rounded-lg border border-line bg-surface p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 font-mono text-lg text-accent">
                &larr;&rarr;
              </div>
              <h3 className="font-semibold text-white">Webhooks</h3>
              <p className="mt-2 text-sm text-muted">
                Get notified when balances update or when an account dips below
                its minimum threshold.
              </p>
            </div>
            <div className="rounded-lg border border-line bg-surface p-6">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 font-mono text-lg text-accent">
                &gt;_
              </div>
              <h3 className="font-semibold text-white">CSV Export</h3>
              <p className="mt-2 text-sm text-muted">
                Export your full transaction and balance history as CSV for use
                in spreadsheets or custom scripts.
              </p>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="pb-24 pt-12 text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Start building with your financial data.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-base text-muted">
            Sign up, connect your accounts, and get your API key in minutes.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={`/sign-up?planPriceId=${process.env.NEXT_PUBLIC_STRIPE_STARTER_PLAN_PRICE_ID}`}
              className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Get Started
            </Link>
            <Link
              href="/#pricing"
              className="rounded-lg border border-line px-5 py-2.5 text-sm font-medium text-white transition-colors hover:border-line-strong hover:text-white"
            >
              See Pricing
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-line/50">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="flex flex-col justify-between gap-8 sm:flex-row">
            <div>
              <Link href="/">
                <span className="text-lg font-bold">
                  cash check
                </span>
              </Link>
              <p className="mt-2 max-w-xs text-sm text-muted">
                Your monthly finance check-in, in minutes.
              </p>
            </div>
            <div className="flex gap-16">
              <div>
                <h4 className="text-xs font-medium uppercase tracking-wider text-muted">
                  Product
                </h4>
                <ul className="mt-3 space-y-2">
                  <li>
                    <Link
                      href="/#features"
                      className="text-sm text-muted transition-colors hover:text-white"
                    >
                      Features
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/#pricing"
                      className="text-sm text-muted transition-colors hover:text-white"
                    >
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/#faq"
                      className="text-sm text-muted transition-colors hover:text-white"
                    >
                      FAQs
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-xs font-medium uppercase tracking-wider text-muted">
                  Account
                </h4>
                <ul className="mt-3 space-y-2">
                  <li>
                    <Link
                      href="/sign-in"
                      className="text-sm text-muted transition-colors hover:text-white"
                    >
                      Sign In
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={`/sign-up?planPriceId=${process.env.NEXT_PUBLIC_STRIPE_STARTER_PLAN_PRICE_ID}`}
                      className="text-sm text-muted transition-colors hover:text-white"
                    >
                      Get Started
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-line/50 pt-6 sm:flex-row">
            <span className="text-xs text-muted">
              &copy; {new Date().getFullYear()} cash check. All rights reserved.
            </span>
            <div className="flex gap-6">
              <Link
                href="/privacy"
                className="text-xs text-muted transition-colors hover:text-muted"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-xs text-muted transition-colors hover:text-muted"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
