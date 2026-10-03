# Cash Check

Open-source personal finance: monthly cash-flow reports, account balances, CSV imports, and email summaries.

[Landing page](https://cashcheck.jmmay.com/) · [Source](https://github.com/josh-may/cash-check)

The landing page uses fictional sample data. Run your own instance to use the app; there is no shared hosted signup.

## Run locally

Requires Node.js 22+ and npm. The included Prisma schema uses SQLite for a standalone instance.

```sh
npm ci
cp .env.example .env
# Edit .env and generate secrets with: openssl rand -hex 32
npx prisma generate
npx prisma migrate deploy
```

Set `SETUP_EMAIL`, `SETUP_PASSWORD` (at least 12 characters), and optional `SETUP_NAME` in your local `.env`, then create your account:

```sh
node scripts/create-user.mjs
npm run dev
```

Open http://localhost:3000/sign-in. Remove the `SETUP_*` values after creating your account. Registration stays closed; the setup script creates a local admin account that bypasses legacy subscription checks. Manual entry and CSV imports can be used without bank credentials.

## Configuration

- Set `NEXTAUTH_SECRET`, `CRON_SECRET_KEY`, and instance URLs before deployment. Keep the database and environment files private. Use HTTPS and persist/back up the database.
- Plaid connections require your own `PLAID_CLIENT_ID` and `PLAID_SECRET`. Start with `PLAID_ENV=sandbox`; live bank connections require appropriate Plaid access.
- Monthly email requires your own Resend key and verified sender. Schedule a POST to `/api/cron/monthly-sync-and-email` with the `x-cron-secret` header matching `CRON_SECRET_KEY`.
- Optional `PERSONAL_REPORT_EMAIL`, `PERSONAL_REPORT_EXCLUDED_TAG`, and `PERSONAL_REPORT_EXCLUDED_MASK` configure business exclusions for one owner's monthly summary. Leave them unset to include all non-excluded accounts.
- Analytics is disabled unless you supply a PostHog key.
- Legacy Stripe billing endpoints remain in the source. Local admin accounts do not need a subscription. The example Stripe value is an inert development placeholder to allow the legacy SDK to initialize; configure real credentials only if you enable billing. Resend's placeholder behaves similarly. Placeholder values cannot send mail or charge payments.

For production, run `npm run build` then `npm start`. Review the retained legal pages, integration configuration, and instance metadata for your own deployment. This is an early self-hosted release, not a managed financial service.

## Landing page

`landing/` is an independent static site with no analytics or app connection. See [its README](landing/README.md) for preview and deployment.

## Tests

```sh
npm test
```

## License

MIT. See [LICENSE](LICENSE).
