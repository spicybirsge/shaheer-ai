# Review-agent review

Reviewed all application source, the complete working-tree diff and untracked additions, migration, tests, and installed Eve request handlers against AGENTS.md. Read-only review completed before remediation.

[P1] Persist session ownership before returning creation — agent/channels/eve.ts:94

The create handler can return a session ID before the workflow's persistence hook runs. The browser immediately opens its event stream; the ownership guard rejects it because its chat row does not yet exist. Register the owned chat synchronously before returning a successful create response.

[P2] Surface computation-limit interactions — src/components/chat.tsx:393

The model's session usage cap can pause the turn with an interaction. The renderer drops interaction parts, leaving the user without an explanation or a way to recover. Show the limit and direct the user to start a new conversation; do not expose budget overrides.

Overall: quota SQL passed a Postgres-engine concurrency test, but live OAuth, Gateway streaming, and a hosted Workflow backend need configured credentials. Build validation also caught a prerender restriction on reading the current date; remove the unnecessary dynamic footer date. These findings must be fixed before final handoff.

## Remediation

Both findings were fixed. The native creation route now awaits Postgres ownership registration before returning the session ID, with regression tests for successful, failed and database-error cases. Interaction parts now explain the computation limit and recovery through a new conversation. The footer no longer reads the current date during prerendering. Quota rejection occurs in the authenticator so Eve returns the actionable limit message rather than masking an onMessage error as a generic 500.

Residual validation gap: no live OAuth, paid provider calls, browser interaction, or production deployment was exercised. Dependency audit reports a moderate development-server advisory in Drizzle Kit's transitive esbuild tooling; the suggested downgrade would break the selected tooling, so it was not applied.

A targeted `guarded-fetch` → `undici` override updates its vulnerable 7.29.0 pin to the patched 7.30.1-compatible line. npm reports no remaining high-severity advisories; 11 moderate advisories remain in Drizzle Kit / ESLint tooling dependencies.

## Interface and account follow-up

The workspace shell now lives in a shared route-group layout, so conversation route loading does not unmount the sidebar. Saved-chat pages still check ownership before rendering, and native stream endpoints also enforce ownership. Recent reader snapshots are retained only in a bounded memory cache scoped by user ID.

Transient token/tool progress now returns immediately from persistence rather than doing Postgres writes; completed content remains persisted. User bubbles are right-aligned, empty assistant parts are hidden, and copy actions wait for text. Following the user's request for visible thinking, the model requests a 512-token thinking budget with thought summaries; the brain panel appears at submission and streams provider reasoning before the answer when available.

Account deletion requires Better Auth's session freshness and cancels owned active runs before deleting the user. Database cascade tests verify that account-linked chats, events, sessions, provider tokens and quota records disappear while another user's records remain intact. Cancellation errors prevent false success, while missing or expired runs do not block deletion. Newly created Workflow runs have zero content retention at termination and trace exporters are disabled; legacy/provider-side retention remains disclosed.

Seven isolated regression/database tests pass, including 100 quota attempts accepting exactly 50 and a progress-handler test that forbids any context/database access for reasoning and answer deltas. A live Gateway check with the configured Gemini model and 512-token thinking budget returned two reasoning chunks before answer text. About, Privacy, Terms, and Settings returned HTTP 200 in the local app. Live OAuth deletion and interactive browser streaming still require end-to-end validation.
