import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" type="image/x-icon" href="/favicons/favicon.ico" sizes="16x16 32x32" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicons/favicon-16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicons/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicons/favicon-96.png" />
        <link rel="icon" type="image/png" sizes="128x128" href="/favicons/favicon-128.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/favicons/favicon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/favicons/favicon-512.png" />
        <link rel="icon" href="/favicons/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicons/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
