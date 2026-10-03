import Link from "next/link";

const PricingSection = () => {
  return (
    <section id="pricing" className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-sans font-bold text-white mb-3 sm:mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted text-sm sm:text-base md:text-lg lg:text-xl">
            Choose the plan that works best for you
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
          {/* Starter Plan */}
          <div className="bg-surface border border-line rounded-lg p-6 sm:p-8 hover:border-line-strong transition-colors">
            <div className="mb-6">
              <h3 className="text-xl sm:text-2xl font-sans font-bold text-white mb-2">
                Starter
              </h3>
              <p className="text-muted text-sm sm:text-base">
                Perfect for personal finance tracking
              </p>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl md:text-5xl font-sans font-bold text-white">
                  $8
                </span>
                <span className="text-muted text-base sm:text-lg">
                  /month
                </span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-positive mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-label="Feature included"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-white text-sm sm:text-base">
                  Connect up to 5 accounts
                </span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-positive mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-label="Feature included"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-white text-sm sm:text-base">
                  Daily email reports
                </span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-positive mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-label="Feature included"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-white text-sm sm:text-base">
                  Basic cashflow analytics
                </span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-positive mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-label="Feature included"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-white text-sm sm:text-base">
                  CSV exports
                </span>
              </li>
            </ul>

            <Link
              href={`/sign-up?planPriceId=${process.env.NEXT_PUBLIC_STRIPE_STARTER_PLAN_PRICE_ID}`}
            >
              <button className="w-full bg-accent hover:bg-accent-hover text-white font-sans font-semibold py-3 px-6 rounded-lg transition-colors text-sm sm:text-base">
                Get Started
              </button>
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="border-2 border-accent bg-surface shadow-none rounded-lg p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-accent text-white text-xs sm:text-sm font-bold px-4 py-1.5 rounded-bl-lg">
              MOST POPULAR
            </div>

            <div className="mb-6 mt-2">
              <h3 className="text-xl sm:text-2xl font-sans font-bold text-white mb-2">
                Pro
              </h3>
              <p className="text-white text-sm sm:text-base">
                For serious wealth builders
              </p>
            </div>

            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl md:text-5xl font-sans font-bold text-white">
                  $19
                </span>
                <span className="text-muted text-base sm:text-lg">
                  /month
                </span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-positive mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-label="Feature included"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-white text-sm sm:text-base">
                  Unlimited account connections
                </span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-positive mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-label="Feature included"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-white text-sm sm:text-base">
                  Real-time notifications
                </span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-positive mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-label="Feature included"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-white text-sm sm:text-base">
                  Advanced analytics & forecasting
                </span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-positive mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-label="Feature included"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-white text-sm sm:text-base">
                  Custom categories & rules
                </span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-positive mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-label="Feature included"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-white text-sm sm:text-base">
                  Priority support
                </span>
              </li>
              <li className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-positive mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-label="Feature included"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-white text-sm sm:text-base">
                  API access
                </span>
              </li>
            </ul>

            <Link
              href={`/sign-up?planPriceId=${process.env.NEXT_PUBLIC_STRIPE_PRO_PLAN_PRICE_ID}`}
            >
              <button className="w-full bg-accent hover:bg-accent-hover text-white font-sans font-semibold py-3 px-6 rounded-lg transition-colors text-sm sm:text-base">
                Start Pro Trial
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;