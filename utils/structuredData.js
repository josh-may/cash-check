export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "cash check",
  url: "http://localhost:3000",
  logo: "http://localhost:3000/logo.png",
  description:
    "Automated monthly financial reports for businesses and individuals. Track income, expenses, and cashflow with bank-level security.",
  sameAs: ["https://example.com"],
  contactPoint: {
    "@type": "ContactPoint",
    email: "owner@example.com",
    contactType: "Customer Support",
    availableLanguage: "English",
  },
};

export const productSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "cash check",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description:
    "Automated cashflow tracking and reporting software that connects to your bank accounts and delivers monthly financial summaries",
  url: "http://localhost:3000",
  screenshot: "http://localhost:3000/screenshot.png",
  creator: {
    "@type": "Organization",
    name: "cash check",
  },
  offers: [
    {
      "@type": "Offer",
      name: "Starter Plan",
      price: "8.00",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "8.00",
        priceCurrency: "USD",
        billingIncrement: {
          "@type": "QuantitativeValue",
          value: 1,
          unitCode: "MON",
        },
      },
      description:
        "Connect up to 5 accounts, daily email reports, basic cashflow analytics",
    },
    {
      "@type": "Offer",
      name: "Pro Plan",
      price: "19.00",
      priceCurrency: "USD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "19.00",
        priceCurrency: "USD",
        billingIncrement: {
          "@type": "QuantitativeValue",
          value: 1,
          unitCode: "MON",
        },
      },
      description:
        "Unlimited account connections, real-time notifications, advanced analytics & forecasting",
    },
  ],
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "256",
  },
  featureList: [
    "Automated bank synchronization",
    "Monthly email reports",
    "Income and expense tracking",
    "Multi-account support",
    "Bank-level encryption",
    "Real-time transaction categorization",
    "CSV exports",
    "Custom categories and rules",
    "API access",
  ],
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "cash check",
  url: "http://localhost:3000",
  description: "Automated monthly financial reports and cashflow tracking",
  publisher: {
    "@type": "Organization",
    name: "cash check",
    logo: {
      "@type": "ImageObject",
      url: "http://localhost:3000/logo.png",
    },
  },
};

export const combinedHomePageSchema = {
  "@context": "https://schema.org",
  "@graph": [organizationSchema, productSchema, websiteSchema],
};
