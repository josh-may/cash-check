import "@/styles/globals.css";
import { Geist, Geist_Mono } from "next/font/google";
import Head from "next/head";
import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}) {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: "/ingest",
      ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
      defaults: "2025-05-24",
      person_profiles: "identified_only",
      // Enable debug mode in development
      loaded: (posthog) => {
        if (process.env.NODE_ENV === "development") posthog.debug();
      },
    });
  }, []);

  return (
    <PostHogProvider client={posthog}>
      <SessionProvider session={session}>
        <Head><meta name="robots" content="noindex, nofollow" key="robots" /><title>cash check</title><meta name="theme-color" content="#0a0a0a" /></Head>
        <div className={`${geistSans.variable} ${geistMono.variable} font-sans min-h-screen bg-canvas text-content`}>
          <Component {...pageProps} />
        </div>
      </SessionProvider>
    </PostHogProvider>
  );
}
