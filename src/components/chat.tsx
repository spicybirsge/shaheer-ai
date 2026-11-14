"use client";
import {
  createContext,
  Suspense,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Link, { useLinkStatus } from "next/link";
import { useSelectedLayoutSegments, useRouter } from "next/navigation";
import type { UseEveAgentSnapshot } from "eve/react";
import { ThemeToggle } from "./theme-toggle";
import { useEveAgent } from "eve/react";
import {
  ArrowUp,
  ArrowUpRight,
  Bolt,
  Check,
  ChevronDown,
  Code2,
  Copy,
  Ellipsis,
  Loader2,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Settings,
  Sparkles,
  Square,
  Trash2,
  X,
} from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Brand } from "./brand";
import { ChatSkeleton } from "./chat-skeleton";
import { ReasoningPanel } from "./reasoning-panel";
type Chat = { id: string; title: string };
type Quota = { remaining: number; limit: number; resetsAt: string };
const suggestions = [
  [
    Sparkles,
    "Find the right words",
    "Write a clever Instagram caption about building something from scratch.",
  ],
  [
    Code2,
    "Build something new",
    "Suggest three small useful weekend coding projects.",
  ],
  [
    MessageSquare,
    "Explore a big question",
    "Explain how AI models learn with a memorable analogy.",
  ],
  [
    Bolt,
    "Work through the details",
    "Use the calculator: what is 18 multiplied by 24?",
  ],
] as const;
function ChatLinkLabel({ title }: { title: string }) {
  const { pending } = useLinkStatus();
  return (
    <>
      {pending ? (
        <Loader2 className="size-4 shrink-0 animate-spin" />
      ) : (
        <MessageSquare className="size-4 shrink-0 text-muted-foreground" />
      )}
      <span className="truncate">{title}</span>
    </>
  );
}
type Workspace = {
  signedIn: boolean;
  quota: Quota | null;
  refresh: () => Promise<void>;
  version: number;
  onSession: (id: string) => void;
  cache: Map<string, Pick<UseEveAgentSnapshot, "events" | "session">>;
  userId: string;
};
const WorkspaceContext = createContext<Workspace | null>(null);
function RouteObserver({ onChange }: { onChange: (path: string) => void }) {
  const segments = useSelectedLayoutSegments().filter(
    (segment) => !segment.startsWith("("),
  );
  const path = `/${segments.join("/")}`;
  useEffect(() => onChange(path), [path, onChange]);
  return null;
}
export function ChatApp({ children }: { children: React.ReactNode }) {
  const [pathname, setPathname] = useState("/");
  const router = useRouter();
  const [cache] = useState(
    () => new Map<string, Pick<UseEveAgentSnapshot, "events" | "session">>(),
  );
  const { data: session, isPending } = authClient.useSession();
  const [chats, setChats] = useState<Chat[]>([]);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [active, setActive] = useState<string | undefined>();
  const [version, setVersion] = useState(0);
  const [mobile, setMobile] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/chats");
      if (!response.ok)
        throw new Error("Could not load your history. Please try again.");
      const data = await response.json();
      setChats(data.chats);
      setQuota(data.quota);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load history");
    } finally {
      setHistoryLoading(false);
    }
  }, []);
  useEffect(() => {
    if (!session) return;
    const timer = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(timer);
  }, [session, refresh]);
  useEffect(() => {
    if (!quota) return;
    const timer = setTimeout(
      () => void refresh(),
      Math.max(1000, new Date(quota.resetsAt).getTime() - Date.now() + 1000),
    );
    return () => clearTimeout(timer);
  }, [quota, refresh]);
  const activeId = pathname?.startsWith("/chat/")
    ? decodeURIComponent(pathname.split("/")[2])
    : active;
  function newChat() {
    setActive(undefined);
    if (pathname === "/") setVersion((v) => v + 1);
    setMobile(false);
    router.push("/");
  }
  async function remove(id: string) {
    if (deleting) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/chats?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Could not remove conversation");
      if (activeId === id) newChat();
      await refresh();
    } catch (e) {
      setError(String(e));
    } finally {
      setDeleting(null);
    }
  }
  async function signOut() {
    setSigningOut(true);
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error(result.error.message);
      // A full navigation clears in-memory conversation snapshots after sign-out.
      window.location.assign(new URL("/", window.location.origin).href);
    } catch (e) {
      setError(String(e));
      setSigningOut(false);
    }
  }
  const sidebar = (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="px-2 pt-3">
        <Brand />
      </div>
      <Button
        variant="outline"
        className="h-10 justify-start gap-2 bg-background/40"
        onClick={newChat}
      >
        <Plus />
        New conversation<span className="ml-auto text-muted-foreground">↗</span>
      </Button>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mb-3 px-2 text-[10px] font-medium tracking-[.18em] text-muted-foreground">
          CONVERSATIONS
        </div>
        {isPending || (session && historyLoading) ? (
          <div className="space-y-3 px-2">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : chats.length ? (
          <nav aria-label="Chat history" className="space-y-1">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={cn(
                  "group flex items-center rounded-lg transition-colors hover:bg-accent",
                  activeId === chat.id && "bg-accent",
                )}
              >
                <Link
                  href={`/chat/${encodeURIComponent(chat.id)}`}
                  onClick={() => setMobile(false)}
                  className="flex min-w-0 flex-1 items-center gap-2.5 px-2 py-3 text-xs"
                >
                  <ChatLinkLabel title={chat.title} />
                </Link>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="mr-1 shrink-0 text-muted-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                  aria-label={`Delete ${chat.title}`}
                  disabled={!!deleting}
                  onClick={() => void remove(chat.id)}
                >
                  {deleting === chat.id ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <Trash2 />
                  )}
                </Button>
              </div>
            ))}
          </nav>
        ) : (
          <p className="px-2 text-xs leading-6 text-muted-foreground">
            A little room for your next big idea.
            <br />
            Your conversations will live here.
          </p>
        )}
      </div>
      <div className="rounded-xl border bg-background/40 p-3.5">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="flex items-center gap-2">
            <Bolt className="size-3.5" />
            Flash access
          </span>
          <Badge variant="secondary" className="text-[9px]">
            FREE
          </Badge>
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          {quota
            ? `${quota.remaining} of ${quota.limit} messages left today`
            : "50 messages. A fresh start, daily."}
        </p>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-foreground/70 transition-[width]"
            style={{
              width: `${quota ? (quota.remaining / quota.limit) * 100 : 100}%`,
            }}
          />
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Resets at midnight UTC
        </p>
      </div>
      <div className="flex items-center gap-2.5 px-1">
        <Avatar className="size-8">
          <AvatarImage
            src={session?.user.image ?? undefined}
            alt={session?.user.name ?? ""}
            referrerPolicy="no-referrer"
          />
          <AvatarFallback>
            {session?.user.name.slice(0, 1) || "S"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">
            {session?.user.name || "Your personal workspace"}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {session ? "Personal account" : "Sign in to get started"}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Account menu">
              {signingOut ? <Loader2 className="animate-spin" /> : <Ellipsis />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings />
                Account settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/about">
                <Sparkles />
                About Shaheer
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {session && (
              <DropdownMenuItem
                disabled={signingOut}
                onSelect={() => void signOut()}
              >
                <LogOut />
                Sign out
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex gap-4 px-1 text-[10px] text-muted-foreground">
        <Link href="/about" className="hover:text-foreground">
          About
        </Link>
        <Link href="/terms" className="hover:text-foreground">
          Terms
        </Link>
        <Link href="/privacy" className="hover:text-foreground">
          Privacy
        </Link>
      </div>
    </div>
  );
  return (
    <WorkspaceContext.Provider
      value={{
        signedIn: !!session,
        quota,
        refresh,
        version,
        cache,
        userId: session?.user.id ?? "guest",
        onSession: (id) => {
          setActive(id);
          if (window.location.pathname !== `/chat/${id}`)
            History.prototype.replaceState.call(
              window.history,
              window.history.state,
              "",
              `/chat/${encodeURIComponent(id)}`,
            );
        },
      }}
    >
      <div className="flex h-dvh overflow-hidden">
        <Suspense fallback={null}>
          <RouteObserver onChange={setPathname} />
        </Suspense>
        <aside className="hidden w-64 shrink-0 border-r bg-sidebar md:block">
          {sidebar}
        </aside>
        <main className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between border-b px-4 sm:px-7">
            <div className="flex items-center gap-3">
              <Sheet open={mobile} onOpenChange={setMobile}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    aria-label="Open navigation"
                  >
                    <Menu />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Navigation</SheetTitle>
                  </SheetHeader>
                  {sidebar}
                </SheetContent>
              </Sheet>
              <div className="flex items-center gap-2 text-sm font-medium">
                shaheer{" "}
                <span className="font-normal text-muted-foreground">
                  1.0 flash
                </span>
                <ChevronDown className="size-3 text-muted-foreground" />
              </div>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Button
                asChild
                size="sm"
                variant="ghost"
                className="text-muted-foreground"
              >
                <Link href="/about">
                  Meet Shaheer
                  <ArrowUpRight />
                </Link>
              </Button>
            </div>
          </header>
          {error && (
            <div
              role="alert"
              className="mx-4 mt-3 flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              {error}
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label="Dismiss error"
                onClick={() => setError("")}
              >
                <X />
              </Button>
            </div>
          )}
          {isPending ? (
            <div className="flex-1 overflow-hidden">
              <ChatSkeleton />
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </WorkspaceContext.Provider>
  );
}
export function ChatConversation({ initialId }: { initialId?: string }) {
  const workspace = useContext(WorkspaceContext);
  if (!workspace) throw new Error("Chat requires workspace layout");
  return (
    <Conversation
      key={`${initialId ?? "new"}-${workspace.version}-${workspace.userId}`}
      initialId={initialId}
      {...workspace}
    />
  );
}
function Conversation({
  initialId,
  signedIn,
  quota,
  refresh,
  onSession,
  cache,
  userId,
}: {
  cache: Workspace["cache"];
  userId: string;
  initialId?: string;
  signedIn: boolean;
  quota: Quota | null;
  refresh: () => Promise<void>;
  onSession: (id: string) => void;
}) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const sendLock = useRef(false);
  const [seed] = useState(() =>
    initialId ? cache.get(`${userId}/${initialId}`) : undefined,
  );
  const agent = useEveAgent({
    initialEvents: seed?.events,
    initialSession:
      seed?.session ??
      (initialId ? { sessionId: initialId, streamIndex: 0 } : undefined),
    resume: !!initialId,
    onSessionChange: (state) => {
      if (state) onSession(state.sessionId);
    },
  });
  useEffect(() => {
    if (!agent.session || !agent.events.length) return;
    cache.set(`${userId}/${agent.session.sessionId}`, {
      session: agent.session,
      events: agent.events,
    });
    if (cache.size > 12) cache.delete(cache.keys().next().value!);
  }, [agent.session, agent.events, cache, userId]);
  const busy = agent.status !== "idle";
  const resuming = agent.status === "resuming";
  const loading = resuming && !seed?.events.length;
  useEffect(() => {
    if (stickToBottom.current && scroll.current)
      scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [agent.messages]);
  useEffect(() => {
    if (agent.status === "idle" && signedIn) {
      const timer = setTimeout(() => void refresh(), 0);
      return () => clearTimeout(timer);
    }
  }, [agent.status, signedIn, refresh]);
  async function send() {
    const text = input.trim();
    if (
      !text ||
      !signedIn ||
      busy ||
      sendLock.current ||
      quota?.remaining === 0
    )
      return;
    sendLock.current = true;
    setSubmitting(true);
    stickToBottom.current = true;
    setError("");
    setInput("");
    try {
      await agent.send(text);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to send your message");
      setInput(text);
    } finally {
      sendLock.current = false;
      setSubmitting(false);
    }
  }
  async function signIn() {
    setSigningIn(true);
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: window.location.pathname,
      });
      if (result.error) throw new Error(result.error.message);
    } catch (e) {
      setError(String(e));
      setSigningIn(false);
    }
  }
  const empty = agent.messages.length === 0 && !submitting && !busy;
  return (
    <>
      <div
        ref={scroll}
        onScroll={() => {
          const el = scroll.current;
          if (el)
            stickToBottom.current =
              el.scrollHeight - el.scrollTop - el.clientHeight < 100;
        }}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        {loading ? (
          <ChatSkeleton />
        ) : empty ? (
          <section className="mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center px-5 py-10 text-center">
            <Badge
              variant="outline"
              className="gap-2 py-1.5 text-[9px] font-normal tracking-[.16em]"
            >
              <span className="size-1 rounded-full bg-foreground" />
              INTRODUCING SHAHEER 1.0
            </Badge>
            <span
              aria-hidden="true"
              className="my-6 text-7xl leading-none sm:text-8xl"
            >
              ✳
            </span>
            <h1 className="text-3xl leading-[1.16] font-medium tracking-[-.045em] sm:text-5xl">
              A spark of intelligence.
              <br />
              <span className="text-muted-foreground">
                A world of possibilities.
              </span>
            </h1>
            <p className="mt-5 max-w-sm text-sm leading-6 text-muted-foreground">
              Your thoughts, a little further. Write, build, explore, and figure
              things out with Shaheer.
            </p>
            <div className="mt-8 grid w-full max-w-xl grid-cols-1 gap-2 text-left min-[420px]:grid-cols-2">
              {suggestions.map(([Icon, title, text]) => (
                <Button
                  variant="outline"
                  key={title}
                  className="h-auto min-h-14 justify-start gap-3 bg-card/40 px-4 py-4 text-xs font-normal text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setInput(text);
                    document.getElementById("message")?.focus();
                  }}
                >
                  <Icon className="size-4" />
                  <span className="whitespace-normal">{title}</span>
                  <ArrowUpRight className="ml-auto size-3.5" />
                </Button>
              ))}
            </div>
            <p className="mt-5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Bolt className="size-3" />
              Built for the speed of thought
            </p>
          </section>
        ) : (
          <div className="mx-auto max-w-3xl space-y-8 px-5 py-8 sm:px-8">
            {agent.messages
              .filter(
                (message) =>
                  message.role === "user" ||
                  message.parts.some((part) =>
                    part.type === "text" || part.type === "reasoning"
                      ? !!part.text
                      : part.type === "tool" || part.type === "interaction",
                  ),
              )
              .map((message) =>
                message.role === "user" ? (
                  <article
                    key={message.id}
                    className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-tr-md bg-muted px-4 py-2.5 text-sm leading-7 whitespace-pre-wrap break-words"
                  >
                    {message.parts
                      .map((p) => (p.type === "text" ? p.text : ""))
                      .join("\n")}
                    {message.metadata?.status === "failed" && (
                      <p className="text-xs text-destructive">
                        Message not sent.
                      </p>
                    )}
                  </article>
                ) : (
                  <article key={message.id} className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "flex size-7 items-center justify-center rounded-full bg-muted text-[10px]",
                          message.role === "assistant" &&
                            "bg-transparent text-3xl",
                        )}
                      >
                        {message.role === "assistant" ? "✳" : "Y"}
                      </span>
                      <span className="text-xs font-medium">
                        {message.role === "assistant" ? "shaheer" : "You"}
                      </span>
                      {message.role === "assistant" && (
                        <span className="text-[9px] tracking-widest text-muted-foreground">
                          1.0 FLASH
                        </span>
                      )}
                    </div>
                    <div className="space-y-3 sm:pl-9">
                      {message.parts.map((part, i) => {
                        if (part.type === "text")
                          return (
                            <div className="markdown" key={part.id ?? i}>
                              <Markdown remarkPlugins={[remarkGfm]}>
                                {part.text}
                              </Markdown>
                            </div>
                          );
                        if (part.type === "reasoning")
                          return (
                            <ReasoningPanel
                              key={part.id ?? i}
                              text={part.text}
                              active={
                                busy &&
                                message.metadata?.status === "streaming" &&
                                part.state === "streaming"
                              }
                            />
                          );
                        if (part.type === "tool")
                          return (
                            <details
                              key={part.callId}
                              className="rounded-xl border bg-card/40"
                            >
                              <summary className="flex items-center gap-2 px-3 py-2.5 text-xs">
                                <Code2 className="size-3.5" />
                                {part.label || part.name}
                                <span className="ml-auto flex items-center gap-1.5 text-muted-foreground">
                                  {[
                                    "running",
                                    "requested",
                                    "streaming",
                                  ].includes(part.state) && (
                                    <Loader2 className="size-3 animate-spin" />
                                  )}
                                  {part.state}
                                </span>
                              </summary>
                              <pre className="overflow-auto p-4 pt-1 text-[11px] text-muted-foreground">
                                {JSON.stringify(
                                  {
                                    input: part.input,
                                    output: part.output,
                                    error: part.error,
                                  },
                                  null,
                                  2,
                                )}
                              </pre>
                            </details>
                          );
                        if (part.type === "interaction")
                          return (
                            <p
                              key={i}
                              className="text-xs text-muted-foreground"
                            >
                              This conversation reached its computation limit.
                              Start a new conversation to continue.
                            </p>
                          );
                        return null;
                      })}
                      {message.metadata?.status === "failed" && (
                        <p className="text-xs text-destructive">
                          Message not sent. Please try again below.
                        </p>
                      )}
                      {message.role === "assistant" &&
                        message.metadata?.status !== "streaming" &&
                        message.parts.some(
                          (p) => p.type === "text" && p.text.trim(),
                        ) && (
                          <Button
                            size="xs"
                            variant="ghost"
                            className="text-muted-foreground"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(
                                  message.parts
                                    .map((p) =>
                                      p.type === "text" ? p.text : "",
                                    )
                                    .join("\n"),
                                );
                                setCopied(message.id);
                              } catch {
                                setError("Clipboard unavailable");
                              }
                            }}
                          >
                            {copied === message.id ? <Check /> : <Copy />}
                            {copied === message.id ? "Copied" : "Copy"}
                          </Button>
                        )}
                    </div>
                  </article>
                ),
              )}
            {(busy || submitting) &&
              !agent.messages.some(
                (m) =>
                  m.role === "assistant" &&
                  m.metadata?.status === "streaming" &&
                  m.parts.some(
                    (p) =>
                      (p.type === "text" || p.type === "reasoning") && p.text,
                  ),
              ) && (
                <div role="status" aria-label="Shaheer is thinking">
                  <ReasoningPanel active />
                </div>
              )}
            <div ref={bottom} />
          </div>
        )}
      </div>
      <div className="mx-auto w-full max-w-3xl shrink-0 px-4 pt-2 pb-4 sm:px-7">
        {(error || agent.error) && (
          <p
            role="alert"
            className="mb-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive"
          >
            {error || agent.error?.message}
          </p>
        )}
        {quota?.remaining === 0 && (
          <p className="mb-3 text-xs text-muted-foreground">
            Daily limit reached. Your 50 messages reset at midnight UTC.
          </p>
        )}
        {!signedIn && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>Your next idea starts here.</span>
            <Button
              size="sm"
              disabled={signingIn}
              onClick={() => void signIn()}
            >
              {signingIn ? (
                <Loader2 className="animate-spin" />
              ) : (
                <span className="font-bold">G</span>
              )}
              Continue with Google
            </Button>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
          className="rounded-2xl border bg-card p-3 shadow-lg shadow-black/10 transition-shadow focus-within:ring-2 focus-within:ring-ring/30"
        >
          <Textarea
            id="message"
            aria-label="Message Shaheer"
            placeholder={
              resuming ? "Loading conversation…" : "What’s on your mind?"
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={4000}
            rows={2}
            disabled={resuming || submitting || quota?.remaining === 0}
            className="min-h-14 resize-none border-0 bg-transparent p-1 text-sm shadow-none focus-visible:ring-0 disabled:bg-transparent dark:bg-transparent dark:disabled:bg-transparent"
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="flex items-center gap-2 pl-1 text-[10px] text-muted-foreground">
              <Bolt className="size-3" />
              Flash
              <span className="h-3 border-l" />
              Text only
            </span>
            {busy && !resuming ? (
              <Button
                type="button"
                size="icon"
                variant="secondary"
                aria-label="Stop generating"
                disabled={stopping}
                onClick={async () => {
                  setStopping(true);
                  try {
                    await agent.cancel();
                  } catch (e) {
                    setError(String(e));
                  } finally {
                    setStopping(false);
                  }
                }}
              >
                {stopping ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Square className="size-3" />
                )}
              </Button>
            ) : (
              <Button
                size="icon"
                aria-label="Send message"
                disabled={
                  !signedIn ||
                  !input.trim() ||
                  busy ||
                  submitting ||
                  quota?.remaining === 0
                }
              >
                {submitting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <ArrowUp />
                )}
              </Button>
            )}
          </div>
        </form>
        <p className="mt-3 text-center text-[10px] leading-4 text-muted-foreground">
          Shaheer can make mistakes.{" "}
          <Link href="/terms" className="underline-offset-2 hover:underline">
            Terms
          </Link>
          <span className="mx-1.5">·</span>
          <Link href="/privacy" className="underline-offset-2 hover:underline">
            Privacy
          </Link>
        </p>
      </div>
    </>
  );
}
