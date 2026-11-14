import { Suspense } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ChatConversation } from "@/components/chat";
import { ChatSkeleton } from "@/components/chat-skeleton";
import { getAuth } from "@/lib/auth";
import { database } from "@/lib/db";
import { chats } from "@/lib/db/schema";
async function SavedChat({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) redirect("/");
  const [chat] = await database()
    .select({ id: chats.id })
    .from(chats)
    .where(
      and(
        eq(chats.id, id),
        eq(chats.userId, session.user.id),
        eq(chats.deleted, false),
      ),
    );
  if (!chat) notFound();
  return <ChatConversation key={id} initialId={id} />;
}
export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<ChatSkeleton />}>
      <SavedChat params={params} />
    </Suspense>
  );
}
