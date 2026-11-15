type SavedEvent = {
  line: number;
  eventIndex: number;
  payload: unknown;
  updatedAt: Date;
};

// Restore only unavailable Workflow history; live streams and auth errors pass through.
// The loader must enforce account ownership and exclude tombstoned chats.
export async function restoreExpiredHistory(
  response: Response,
  request: Request,
  sessionId: string,
  load: () => Promise<SavedEvent[]>,
) {
  if (response.status !== 404 && response.status !== 410) return response;
  const events = await load();
  if (!events.length) return response;
  await response.body?.cancel();

  const query = new URL(request.url).searchParams;
  const tail = events.at(-1)!.line;
  const requested = Number(query.get("startIndex") ?? 0);
  const start = requested < 0 ? Math.max(0, tail + 1 + requested) : requested;
  function* records() {
    let offset = 0;
    while (offset < events.length) {
      const first = events[offset];
      const facts: unknown[] = [];
      while (offset < events.length && events[offset].line === first.line)
        facts.push(events[offset++].payload);
      if (first.line < start) continue;
      // Token progress was never saved. Keep source positions across those gaps
      // so a cached cursor still refers to the same commits as the live stream.
      yield { $eve: "position", next: first.line };
      yield { at: first.updatedAt.toISOString(), facts };
    }
    yield { $eve: "stream.ended" };
  }
  const iterator = records();
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      pull(controller) {
        const next = iterator.next();
        if (next.done) controller.close();
        else controller.enqueue(encoder.encode(`${JSON.stringify(next.value)}\n`));
      },
      cancel() {
        iterator.return();
      },
    }),
    {
      headers: {
        "cache-control": "no-store, no-transform",
        "content-type": "application/x-ndjson; charset=utf-8",
        "x-eve-session-id": sessionId,
        "x-eve-stream-format": "ndjson",
        "x-eve-stream-version": "27",
        "x-eve-stream-tail-index": String(tail),
      },
    },
  );
}
