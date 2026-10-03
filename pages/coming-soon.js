import Head from "next/head";
import Link from "next/link";

export default function ComingSoon() {
  return (
    <>
      <Head>
        <title>Coming Soon | cash check</title>
      </Head>
      <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="font-sans text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
            Coming Soon
          </h1>
          <p className="text-muted text-lg sm:text-xl mb-8">
            We&apos;re working hard to bring you something amazing. Stay tuned!
          </p>
          <Link href="/">
            <span className="inline-block font-sans px-6 py-3 bg-accent text-white rounded-lg font-semibold hover:bg-accent-hover transition-colors cursor-pointer">
              Back to Home
            </span>
          </Link>
        </div>
      </div>
    </>
  );
}
