import Link from "next/link";
import SEO from "@/components/SEO";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-canvas p-4 sm:p-6 md:p-8 lg:p-12">
      <SEO
        title="Terms of Service"
        description="Read the terms and conditions for using cash check's financial tracking service."
        canonicalUrl="http://localhost:3000/terms"
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
            Terms of Service
          </h1>
          <p className="text-muted text-sm sm:text-base">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>

        {/* Terms Content */}
        <div className="bg-surface border border-line rounded-lg p-6 sm:p-8 shadow-none">
          <div className="prose prosemax-w-none space-y-6">
            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="text-content leading-relaxed">
                By accessing and using cash check (&quot;the Service&quot;),
                you accept and agree to be bound by the terms and provision of
                this agreement. If you do not agree to abide by the above,
                please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                2. Description of Service
              </h2>
              <p className="text-content leading-relaxed">
                cash check is a financial tracking application that helps
                users monitor their income, expenses, and cash flow. The service
                provides automated monthly email reports and connects to
                financial institutions to sync transaction data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                3. User Accounts
              </h2>
              <p className="text-content leading-relaxed mb-3">
                To use our service, you must:
              </p>
              <ul className="text-content list-disc list-inside space-y-2 ml-4">
                <li>
                  Provide accurate and complete information when creating your
                  account
                </li>
                <li>
                  Maintain the security of your password and account credentials
                </li>
                <li>
                  Notify us immediately of any unauthorized use of your account
                </li>
                <li>
                  Be responsible for all activities that occur under your
                  account
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                4. Data Privacy and Security
              </h2>
              <p className="text-content leading-relaxed mb-3">
                We are committed to protecting your financial data:
              </p>
              <ul className="text-content list-disc list-inside space-y-2 ml-4">
                <li>All data is encrypted using 256-bit SSL encryption</li>
                <li>We use read-only access to your financial accounts</li>
                <li>Your data is never sold to third parties</li>
                <li>We comply with SOC 2 security standards</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                5. Financial Data Connection
              </h2>
              <p className="text-content leading-relaxed">
                When you connect your financial accounts, you authorize us to
                access transaction data through secure, read-only connections.
                We do not have the ability to make transactions or access
                sensitive information like full account numbers or login
                credentials.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                6. Acceptable Use
              </h2>
              <p className="text-content leading-relaxed mb-3">
                You agree not to:
              </p>
              <ul className="text-content list-disc list-inside space-y-2 ml-4">
                <li>Use the service for any illegal or unauthorized purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Share your account credentials with others</li>
                <li>Use automated tools to access the service</li>
                <li>Interfere with the service&apos;s normal operation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                7. Service Availability
              </h2>
              <p className="text-content leading-relaxed">
                While we strive for 99.9% uptime, we do not guarantee that the
                service will be available at all times. We may perform
                maintenance or experience technical issues that temporarily make
                the service unavailable.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                8. Subscription and Billing
              </h2>
              <p className="text-content leading-relaxed mb-3">
                For paid subscriptions:
              </p>
              <ul className="text-content list-disc list-inside space-y-2 ml-4">
                <li>You will be billed in advance on a monthly basis</li>
                <li>
                  Subscription fees are non-refundable except as required by law
                </li>
                <li>We may change pricing with 30 days advance notice</li>
                <li>You may cancel your subscription at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                9. Termination
              </h2>
              <p className="text-content leading-relaxed">
                We may terminate or suspend your account immediately, without
                prior notice, for any reason, including breach of these terms.
                Upon termination, your right to use the service will cease
                immediately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                10. Disclaimer of Warranties
              </h2>
              <p className="text-content leading-relaxed">
                The service is provided &quot;as is&quot; without warranties of
                any kind. We do not guarantee that the service will meet your
                requirements or that it will be error-free, secure, or
                uninterrupted.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                11. Limitation of Liability
              </h2>
              <p className="text-content leading-relaxed">
                In no event shall cash check be liable for any indirect,
                incidental, special, consequential, or punitive damages arising
                out of or related to your use of the service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                12. Governing Law
              </h2>
              <p className="text-content leading-relaxed">
                These terms shall be governed by and construed in accordance
                with the laws of the United States, without regard to its
                conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                13. Dispute Resolution and Arbitration
              </h2>
              <div className="space-y-4">
                <p className="text-content leading-relaxed">
                  <strong>Agreement to Arbitrate:</strong> You and cash check
                  agree that any dispute, claim, or controversy arising out of
                  or relating to these Terms or your use of the Service will be
                  resolved by binding arbitration, rather than in court, except
                  that you may assert claims in small claims court if your
                  claims qualify.
                </p>
                <p className="text-content leading-relaxed">
                  <strong>Arbitration Process:</strong> The arbitration will be
                  administered by the American Arbitration Association (AAA)
                  under its Consumer Arbitration Rules. The arbitrator&apos;s
                  decision will be final and binding. You can opt out of this
                  arbitration agreement within 30 days of first accepting these
                  Terms by emailing support@example.com with your full name
                  stating your intent to opt out.
                </p>
                <p className="text-content leading-relaxed">
                  <strong>Class Action Waiver:</strong> You agree to resolve
                  disputes only on an individual basis, and not as a class
                  action or collective action. You waive any right to
                  participate in class actions against cash check.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                14. User Responsibilities and Conduct
              </h2>
              <p className="text-content leading-relaxed mb-3">
                You agree to use the Service only for lawful purposes and in
                compliance with these Terms. You are prohibited from:
              </p>
              <ul className="text-content list-disc list-inside space-y-2 ml-4">
                <li>
                  Using the Service for any commercial purposes without our
                  written consent
                </li>
                <li>
                  Attempting to gain unauthorized access to our systems or other
                  users&apos; accounts
                </li>
                <li>
                  Sharing your account credentials or allowing others to use
                  your account
                </li>
                <li>
                  Using automated tools, bots, or scripts to access the Service
                </li>
                <li>
                  Interfering with the Service&apos;s normal operation or other
                  users&apos; experience
                </li>
                <li>
                  Uploading or transmitting harmful code, viruses, or malware
                </li>
                <li>Violating any applicable laws or regulations</li>
                <li>Attempting to reverse engineer or modify the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                15. Third-Party Services and Integrations
              </h2>
              <p className="text-content leading-relaxed mb-3">
                The Service may integrate with or provide access to third-party
                services, including:
              </p>
              <ul className="text-content list-disc list-inside space-y-2 ml-4">
                <li>Financial institution APIs for account data aggregation</li>
                <li>Payment processors for subscription billing</li>
                <li>Analytics and performance monitoring services</li>
                <li>Customer support and communication tools</li>
              </ul>
              <p className="text-content leading-relaxed mt-3">
                We are not responsible for the availability, accuracy, or
                policies of third-party services. Your use of third-party
                services is subject to their respective terms and conditions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                16. Mobile Applications and App Stores
              </h2>
              <p className="text-content leading-relaxed mb-3">
                If you access the Service through a mobile application:
              </p>
              <ul className="text-content list-disc list-inside space-y-2 ml-4">
                <li>
                  You are responsible for data charges incurred through your
                  mobile carrier
                </li>
                <li>
                  The application may send push notifications with your consent
                </li>
                <li>
                  App store terms (Apple App Store, Google Play) also apply to
                  your use
                </li>
                <li>We may update the application automatically</li>
                <li>
                  App store purchases are subject to the app store&apos;s refund
                  policies
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                17. Export Controls and Geographic Restrictions
              </h2>
              <p className="text-content leading-relaxed">
                The Service may be subject to U.S. export control laws. You may
                not use, export, or re-export the Service in violation of these
                laws. This includes using the Service in embargoed countries or
                by prohibited persons. You represent that you are not located in
                a restricted jurisdiction or on any government prohibited
                persons list.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                18. Changes to Terms
              </h2>
              <p className="text-content leading-relaxed">
                We reserve the right to modify these terms at any time. We will
                notify users of significant changes via email or through the
                service. Continued use of the service after changes constitutes
                acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                19. California Consumer Notice
              </h2>
              <p className="text-content leading-relaxed">
                Under California Civil Code Section 1789.3, California users are
                entitled to the following notice: If you have a complaint
                regarding the Service or desire further information on use of
                the Service, contact the Complaint Assistance Unit of the
                Division of Consumer Services of the California Department of
                Consumer Affairs in writing at 1625 North Market Blvd., Suite N
                112, Sacramento, CA 95834, or by telephone at (800) 952-5210.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-sans font-semibold text-white mb-4">
                20. Contact Information
              </h2>
              <p className="text-content leading-relaxed">
                If you have any questions about these Terms of Service, please
                contact us at{" "}
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
