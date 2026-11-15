import { SessionNotActiveError } from "eve/sessions";

type Session = { end: (options: { reason: string }) => Promise<unknown> };
function missingRun(error: unknown): boolean {
  const seen = new Set<unknown>();
  while (error && typeof error === "object" && !seen.has(error)) {
    seen.add(error);
    const value = error as {
      name?: string;
      status?: number;
      statusCode?: number;
      cause?: unknown;
    };
    if (
      value.status === 404 ||
      value.statusCode === 404 ||
      value.status === 410 ||
      value.statusCode === 410 ||
      [
        "WorkflowRunNotFoundError",
        "RunExpiredError",
        "StreamExpiredError",
      ].includes(value.name ?? "")
    )
      return true;
    error = value.cause;
  }
  return false;
}
export async function endOwnedSessions(
  ids: readonly string[],
  attachSession: (id: string) => Session,
) {
  for (let offset = 0; offset < ids.length; offset += 8)
    await Promise.all(
      ids.slice(offset, offset + 8).map(async (id) => {
        try {
          // Eve routes end() to the current owner and waits for its hooks to
          // release, including when a redeployment moved it to a successor run.
          await attachSession(id).end({ reason: "Account deletion" });
        } catch (error) {
          if (SessionNotActiveError.is(error) && !error.retryable) return;
          if (!missingRun(error)) throw error;
        }
      }),
    );
}
