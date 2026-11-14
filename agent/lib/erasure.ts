type Run = { status: Promise<string>; cancel: () => Promise<void> };
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
export async function cancelOwnedRuns(
  ids: readonly string[],
  getRun: (id: string) => Run,
) {
  for (let offset = 0; offset < ids.length; offset += 8)
    await Promise.all(
      ids.slice(offset, offset + 8).map(async (id) => {
        const run = getRun(id);
        try {
          const status = await run.status;
          if (status === "pending" || status === "running") await run.cancel();
        } catch (error) {
          if (!missingRun(error)) throw error;
        }
      }),
    );
}
