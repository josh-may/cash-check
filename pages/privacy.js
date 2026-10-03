import Link from "next/link";
import SEO from "@/components/SEO";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-canvas p-4 sm:p-6 md:p-8 lg:p-12">
      <SEO
        title="Privacy Policy"
        description="Learn how cash check protects your financial data with bank-level security and encryption."
        canonicalUrl="http://localhost:3000/privacy"
      />
      <div className="max-w-4xl mx-auto">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <Link href="/">
            <span className="text-2xl font-sans font-bold text-white cursor-pointer">
              cash check
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-sans font-bold text-white mb-2 mt-6">
            Privacy Policy
          </h1>
          <p className="text-muted text-sm sm:text-base">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Privacy Policy Content */}
        <div className="bg-surface border border-line rounded-lg p-6 sm:p-8 shadow-none">
          <div className="prose prosemax-w-none space-y-6">
            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                1. Introduction
              </h2>
              <p className="text-content leading-relaxed">
                cash check (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or
                &ldquo;us&rdquo;) is committed to protecting your privacy. This
                Privacy Policy explains how we collect, use, disclose, and
                safeguard your information when you use our financial tracking
                service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                2. Information We Collect
              </h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-sans font-medium text-white mb-2">
                    Personal Information
                  </h3>
                  <ul className="text-content list-disc list-inside space-y-1 ml-4">
                    <li>
                      Name and contact information you provide when creating an
                      account
                    </li>
                    <li>
                      Email address for account verification and communications
                    </li>
                    <li>Payment information for subscription billing</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-sans font-medium text-white mb-2">
                    Financial Data
                  </h3>
                  <ul className="text-content list-disc list-inside space-y-1 ml-4">
                    <li>Transaction data from connected financial accounts</li>
                    <li>Account balances and financial summaries</li>
                    <li>Cash flow calculations and analytics</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-sans font-medium text-white mb-2">
                    Usage Data
                  </h3>
                  <ul className="text-content list-disc list-inside space-y-1 ml-4">
                    <li>How you interact with our service</li>
                    <li>Device information and browser data</li>
                    <li>Log files and analytics information</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                2.5. Data Access and Export
              </h2>
              <p className="text-content leading-relaxed mb-3">
                We believe you should have access to and control over your data:
              </p>
              <ul className="text-content list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Data Export:</strong> You can download all your
                  transactional data, including categories and notes, from your
                  cash check account settings
                </li>
                <li>
                  <strong>Account Data:</strong> Your personal financial account
                  data is only accessed by our team when necessary to provide
                  support services
                </li>
                <li>
                  <strong>Analytics:</strong> We use aggregated and anonymized
                  data for internal analytics and business purposes, never for
                  individual user tracking
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                3. How We Use Your Information
              </h2>
              <p className="text-content leading-relaxed mb-3">
                We use your information to:
              </p>
              <ul className="text-content list-disc list-inside space-y-2 ml-4">
                <li>Provide and maintain our financial tracking service</li>
                <li>Generate monthly cash flow reports and email summaries</li>
                <li>Process payments and manage your subscription</li>
                <li>Send you important service updates and notifications</li>
                <li>Improve our service through analytics and user feedback</li>
                <li>Provide customer support and respond to your inquiries</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                4. Data Security
              </h2>
              <p className="text-content leading-relaxed mb-3">
                We implement robust security measures:
              </p>
              <ul className="text-content list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Encryption:</strong> All data is encrypted using
                  256-bit SSL/TLS encryption both at rest and in transit
                </li>
                <li>
                  <strong>Access Controls:</strong> Strict access controls and
                  regular security audits
                </li>
                <li>
                  <strong>Secure Connections:</strong> Read-only access to
                  financial institutions through trusted data aggregators
                </li>
                <li>
                  <strong>Data Minimization:</strong> We only collect data
                  necessary for our service
                </li>
                <li>
                  <strong>Regular Backups:</strong> Secure, encrypted backups of
                  your data
                </li>
                <li>
                  <strong>Multi-Factor Authentication:</strong> We use MFA on
                  all internal systems and company devices
                </li>
                <li>
                  <strong>Security Testing:</strong> Regular application
                  penetration tests to identify and mitigate vulnerabilities
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                4.5. Infrastructure and Security Practices
              </h2>
              <p className="text-content leading-relaxed mb-3">
                Our infrastructure is built on industry-leading cloud platforms
                with robust security controls:
              </p>
              <ul className="text-content list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Cloud Infrastructure:</strong> Hosted on secure cloud
                  platforms used by leading financial institutions worldwide
                </li>
                <li>
                  <strong>Compliance Standards:</strong> Adheres to industry
                  standard security, privacy, and compliance controls including
                  SOC 2, ISO 27001, and PCI DSS requirements
                </li>
                <li>
                  <strong>Access Management:</strong> Multi-factor
                  authentication (MFA) required on all internal systems and
                  company devices
                </li>
                <li>
                  <strong>Security Testing:</strong> Regular application
                  penetration tests and security assessments to identify and
                  mitigate vulnerabilities
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                5. Data Sharing and Disclosure
              </h2>
              <p className="text-content leading-relaxed mb-3">
                We do not sell, trade, or rent your personal information to
                third parties. We may share your information only in the
                following circumstances:
              </p>
              <ul className="text-content list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Service Providers:</strong> With trusted third-party
                  service providers who help us operate our service
                </li>
                <li>
                  <strong>Legal Requirements:</strong> When required by law or
                  to protect our rights
                </li>
                <li>
                  <strong>Business Transfers:</strong> In connection with a
                  merger, acquisition, or sale of assets
                </li>
                <li>
                  <strong>With Your Consent:</strong> When you explicitly agree
                  to the sharing
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                6. Financial Institution Connections
              </h2>
              <p className="text-content leading-relaxed">
                When you connect your financial accounts, we establish secure,
                read-only connections through trusted financial data providers.
                We never store your bank login credentials and cannot make
                transactions on your behalf. All financial data is aggregated
                and anonymized for reporting purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                7. Data Retention
              </h2>
              <p className="text-content leading-relaxed mb-3">
                We retain your personal information for as long as your account
                is active or as needed to provide our services. Financial
                transaction data is retained according to tax and legal
                requirements.
              </p>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-sans font-medium text-white mb-2">
                    Account Deletion
                  </h3>
                  <p className="text-content leading-relaxed mb-2">
                    You can delete your cash check account at any time from
                    the Settings menu, or by sending a request to{" "}
                    <a
                      href="mailto:support@example.com"
                      className="text-accent hover:text-accent-hover transition-colors"
                    >
                      support@example.com
                    </a>
                    .
                  </p>
                  <ul className="text-content list-disc list-inside space-y-1 ml-4">
                    <li>
                      If you delete your account, we do not keep any of your
                      linked financial data or account data
                    </li>
                    <li>
                      Data will be completely removed from all internal systems,
                      including backups, within 60 days
                    </li>
                    <li>
                      We may retain limited data where required by law, to
                      resolve disputes, or protect our rights
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-sans font-medium text-white mb-2">
                    Subscription Management
                  </h3>
                  <p className="text-content leading-relaxed">
                    Deleting your account and canceling your subscription are
                    separate actions. Subscription management is handled through
                    your app store or payment provider. You can cancel
                    subscriptions independently of account deletion.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                8. Your Rights
              </h2>
              <p className="text-content leading-relaxed mb-3">
                You have the right to:
              </p>
              <ul className="text-content list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Access:</strong> Request a copy of the personal
                  information we hold about you
                </li>
                <li>
                  <strong>Correction:</strong> Request correction of inaccurate
                  or incomplete data
                </li>
                <li>
                  <strong>Deletion:</strong> Request deletion of your personal
                  information
                </li>
                <li>
                  <strong>Portability:</strong> Request transfer of your data in
                  a structured format
                </li>
                <li>
                  <strong>Opt-out:</strong> Opt out of marketing communications
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                9. Cookies and Tracking
              </h2>
              <p className="text-content leading-relaxed">
                We use cookies and similar technologies to enhance your
                experience, analyze usage patterns, and maintain security. You
                can control cookie preferences through your browser settings,
                though some features may not function properly without certain
                cookies.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                10. International Data Transfers
              </h2>
              <p className="text-content leading-relaxed">
                Your data may be processed and stored in countries other than
                your own. We ensure that such transfers comply with applicable
                data protection laws and implement appropriate safeguards to
                protect your information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                11. Children&apos;s Privacy
              </h2>
              <p className="text-content leading-relaxed">
                Our service is not intended for children under 13 years of age.
                We do not knowingly collect personal information from children
                under 13. If we become aware that we have collected such
                information, we will promptly delete it.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                12. Transparency Above All Else
              </h2>
              <p className="text-content leading-relaxed mb-3">
                <strong>
                  What you do in cash check, stays in cash check.
                </strong>
              </p>
              <p className="text-content leading-relaxed mb-3">
                Our only focus is on building tools that help you improve your
                finances. We respect your privacy, so we give you transparency
                and control over your data and keep it private. We don&apos;t
                sell your personal data to third parties for advertising.
              </p>
              <p className="text-content leading-relaxed">
                Our Privacy Policy comprehensively details our data practices,
                but we understand that legal documents aren&apos;t
                everyone&apos;s favorite thing to read. That&apos;s why we
                provide clear summaries and remain available if you have any
                questions or concerns. You can always contact us through our
                support channels or at{" "}
                <a
                  href="mailto:support@example.com"
                  className="text-accent hover:text-accent-hover transition-colors"
                >
                  support@example.com
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                13. Changes to This Privacy Policy
              </h2>
              <p className="text-content leading-relaxed">
                We may update this Privacy Policy from time to time. We will
                notify you of any material changes via email or through our
                service. Your continued use of the service after such changes
                constitutes your acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                14. Contact Us
              </h2>
              <p className="text-content leading-relaxed">
                If you have any questions about this Privacy Policy or our data
                practices, please contact us at{" "}
                <a
                  href="mailto:support@example.com"
                  className="text-accent hover:text-accent-hover transition-colors"
                >
                  support@example.com
                </a>
              </p>
            </section>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <Link href="/">
            <span className="text-sm font-sans text-accent hover:text-accent-hover transition-colors cursor-pointer">
              ← Back to Home
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
