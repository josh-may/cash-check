import Head from "next/head";

const SEO = ({
  title = "cash check - Automated Monthly Financial Reports",
  description = "Get automated monthly cashflow reports delivered to your inbox. Track income, expenses, and net profit with bank-level security. Connect all your accounts in one place.",
  keywords = "cashflow tracking, financial reports, expense tracking, income tracking, automated bookkeeping, personal finance, business finance, monthly reports, bank synchronization, financial dashboard",
  author = "cash check",
  ogImage = "http://localhost:3000/og-image.png",
  ogType = "website",
  twitterCard = "summary_large_image",
  twitterHandle = "@cashcheck",
  canonicalUrl = "http://localhost:3000/",
  siteName = "cash check",
  noindex = true,
  structuredData = null,
}) => {
  const fullTitle = title.includes("cash check")
    ? title
    : `${title} | cash check`;

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charSet="utf-8" />

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      {twitterHandle && <meta name="twitter:creator" content={twitterHandle} />}
      {twitterHandle && <meta name="twitter:site" content={twitterHandle} />}

      {/* Additional SEO tags */}
      <meta
        name="robots"
        content={noindex ? "noindex, nofollow" : "index, follow"}
      />
      <meta
        name="googlebot"
        content={noindex ? "noindex, nofollow" : "index, follow"}
      />

      {/* Structured Data / JSON-LD */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
    </Head>
  );
};

export default SEO;
