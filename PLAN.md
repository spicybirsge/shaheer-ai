# Shaheer 1.0 Flash implementation plan

Scaffold: Next.js App Router with TypeScript, Eve agent at agent/, npm dependencies.

1. Configure Eve + Next.js hosting and a cheap Gemini Flash Lite model through AI Gateway. Restrict agent capabilities to explicitly provided tools.
2. Add Postgres/Drizzle tables and migrations for Better Auth, owned chats, persisted events, and atomic daily quotas. Configure Google OAuth.
3. Guard every Eve session route with Better Auth and ownership checks. Count each accepted message against a 50/day UTC allowance in Postgres; validate input and bound model costs.
4. Build responsive chat UI: history, new/delete chats, Markdown, streamed answers, actual reasoning/tool activity, errors, Google sign-in, remaining allowance.
5. Run typecheck, lint, build and meaningful database/security tests. Document environment and deployment.
6. Apply review-agent skill read-only to the complete change, record findings, then fix confirmed issues and rerun relevant checks.

No credentials are present initially. Live OAuth and paid model calls require configured environment values; local validation must distinguish this from verified behavior.

## Completion

Steps 1–6 implemented. Seven regression/database tests cover quota concurrency, account-data cascades, run cancellation, creation ownership, and streaming progress. The interface now uses shadcn neutral themes, persistent workspace navigation, `/chat/[id]`, account settings, and policy/showcase pages. Review findings and remediation are in REVIEW.md. Live Google/Gateway/browser smoke testing remains separate from local automated checks.
