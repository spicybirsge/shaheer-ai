# Shaheer 1.0 Flash

A text chat app built with Next.js 16 / React 19 and Vercel Eve. Shaheer is the product name; Gemini 2.5 Flash Lite supplies responses through Vercel AI Gateway.

## Local setup

Requires Node.js 24+ and PostgreSQL. Run `npm ci`, copy `.env.example` to `.env.local`, and fill in all values. Generate a secret with:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

Create a Google OAuth **Web application** client with `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI. Configure `DATABASE_URL`, `BETTER_AUTH_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `AI_GATEWAY_API_KEY`.

```sh
npm run db:migrate
npm run dev
```

Open `http://localhost:3000`. `withEve` starts the agent alongside Next.js. The landing page builds without credentials; Google login and model calls need them. For standalone Eve commands, export the environment values in the shell or provide a root `.env` file. Never commit secrets.

## Features and limits

- Google sign-in through Better Auth, with Drizzle/Postgres sessions.
- Atomic Postgres quota: 50 send attempts per account per UTC day. Failures after reservation still consume a slot, so provider failures cannot be used for free retries.
- Text only, at most 4,000 characters per message. Attachments, callbacks, client context, and tool stubs are rejected.
- AI Gateway → Gemini 2.5 Flash Lite. Maximum 2,048 output tokens per call, four model calls per turn, and session usage limits. Configure a Gateway spending budget separately to cap total spending across accounts.
- Calculator tool with actual input/results, streamed Markdown, model-provided reasoning when available, thinking status, stop/copy controls, saved history and daily allowance display. Reasoning availability depends on the provider; transcripts are never fabricated.
- Eve optional default tools are disabled. An in-memory JustBash sandbox avoids paid sandbox VMs; no shell or file tools are exposed.
- Postgres stores chats, owners, titles, authoritative events and usage counters. Eve owns live Workflow sessions and their reconnect streams. Local Workflow data lives under `.eve`; Vercel uses hosted durable Workflow storage.
- Delete hides a chat and denies subsequent access through a tombstone. Events and Workflow records remain retained; this is not permanent data erasure.

## Interface and account controls

The shared workspace layout keeps navigation mounted between `/` and `/chat/[id]`. Chat loading stays in the conversation panel, with up to 12 recent snapshots cached in memory for faster revisits. Stream progress bypasses database persistence; completed content remains saved. The model requests a bounded 512-token thinking budget and thought summaries. A brain panel appears immediately after sending and displays reasoning summaries incrementally when the provider returns them. Providers can omit or buffer summaries; the app does not invent text while waiting.

shadcn/ui supplies the interface components. Light, dark, and system themes are saved on the current device. Google profile picture URLs are stored by Better Auth and shown in the account menu; user messages use right-aligned bubbles.

`/settings` offers account deletion after confirmation and Better Auth's fresh-session check. Deletion cancels active owned Workflow runs before Better Auth deletes the account. Foreign keys cascade removal through sessions, connected accounts, chats, events, and daily usage; account/email verification records are also removed. New Workflow runs use zero content retention at termination, and local/Agent Runs trace exporters are disabled. Legacy runs, provider logs, backups, and runtime metadata may have separate retention periods. `/terms` and `/privacy` use contact@shaheerahamed.com as the support and data-request address.

`/about` contains the model showcase and Chart.js visualizations. The display figures belong to the requested model persona and are not measurements of the underlying provider.

## Deployment

Deploy from the repository root using Vercel's Eve/Next.js hosting integration (`eve link`, then `eve deploy`). Set all environment variables, use Node.js 24+, set `BETTER_AUTH_URL` to your canonical HTTPS origin, and register `https://YOUR-DOMAIN/api/auth/callback/google` in Google Cloud. Apply `npm run db:migrate` to production before serving traffic. Use your Postgres provider's pooled connection URL and required SSL settings.

`npm run build` builds Eve and Next.js; `npm start` starts both locally. Self-hosting requires persistent Workflow storage: do not discard `.eve` or use its local backend on ephemeral containers. A live Gateway smoke test confirmed that reasoning summary chunks arrive before answer text with the configured model. Google account deletion and hosted Workflow behavior still require end-to-end validation.

## Checks

```sh
npm test
npm run lint
npm run typecheck
npm run build
```

Tests apply the actual migration in PGlite's Postgres engine, submit 100 concurrent quota reservations, check independent account/day allowances, and ensure ownership registration finishes before session creation returns.

See [PLAN.md](PLAN.md) for the implementation sequence and [REVIEW.md](REVIEW.md) for the review-agent findings and fixes.

Documentation: [Vercel Eve](https://vercel.com/eve), [Eve Next.js integration](https://eve.dev/docs/guides/frontend/nextjs), [Eve hooks](https://eve.dev/docs/guides/hooks), [Eve authentication](https://eve.dev/docs/guides/auth-and-route-protection), [React API](https://eve.dev/docs/guides/frontend/use-eve-agent), [Next.js](https://nextjs.org/docs/app/getting-started/installation), [Better Auth Google](https://better-auth.com/docs/authentication/google), [Drizzle adapter](https://better-auth.com/docs/adapters/drizzle), [Gateway model](https://vercel.com/ai-gateway/models/gemini-2.5-flash-lite).
