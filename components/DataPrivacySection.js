const DataPrivacySection = () => {
  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8 sm:mb-10 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-sans font-bold text-white mb-3 sm:mb-4 md:mb-5">
            Your Data Is <span className="text-muted">Your Data</span>
          </h2>
          <p className="text-muted text-sm sm:text-base md:text-lg lg:text-xl max-w-3xl mx-auto">
            We treat your personal and financial data like we&apos;d want
            ours to be treated. Here&apos;s what that means:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          <div className="bg-surface border border-line rounded-lg p-6 sm:p-8 hover:border-line-strong transition-colors">
            <div className="w-12 h-12 bg-positive/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-positive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-label="Never sold checkmark"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-sans font-semibold text-white mb-2 text-center">
              Never Sold
            </h3>
            <p className="text-muted text-sm sm:text-base text-center">
              Your financial data stays private. We never sell, share, or
              monetize your information.
            </p>
          </div>

          <div className="bg-surface border border-line rounded-lg p-6 sm:p-8 hover:border-line-strong transition-colors">
            <div className="w-12 h-12 bg-positive/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-positive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-label="No AI checkmark"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-sans font-semibold text-white mb-2 text-center">
              No AI Analysis
            </h3>
            <p className="text-muted text-sm sm:text-base text-center">
              Zero AI features means no machine learning models ever touch
              your financial data.
            </p>
          </div>

          <div className="bg-surface border border-line rounded-lg p-6 sm:p-8 hover:border-line-strong transition-colors">
            <div className="w-12 h-12 bg-positive/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-positive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-label="Read-only access checkmark"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-sans font-semibold text-white mb-2 text-center">
              Read-Only Access
            </h3>
            <p className="text-muted text-sm sm:text-base text-center">
              Through Plaid, we only view your transaction history. We
              can&apos;t touch your money.
            </p>
          </div>

          <div className="bg-surface border border-line rounded-lg p-6 sm:p-8 hover:border-line-strong transition-colors">
            <div className="w-12 h-12 bg-positive/10 rounded-lg flex items-center justify-center mb-4 mx-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-positive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-label="Security checkmark"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg sm:text-xl font-sans font-semibold text-white mb-2 text-center">
              Bank-Level Security
            </h3>
            <p className="text-muted text-sm sm:text-base text-center">
              256-bit SSL encryption and SOC2 compliance protect all your
              data.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DataPrivacySection;