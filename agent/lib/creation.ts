// Await ownership storage before the client learns the native Eve session ID.
export async function registerCreation(
  response: Response,
  save: (sessionId: string) => Promise<unknown>,
) {
  if (!response.ok) return response;
  const body: unknown = await response.clone().json();
  if (
    !body ||
    typeof body !== "object" ||
    !("sessionId" in body) ||
    typeof body.sessionId !== "string"
  )
    throw new Error("Eve did not return a session ID");
  await save(body.sessionId);
  return response;
}
