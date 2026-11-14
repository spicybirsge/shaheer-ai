"use client";
import { useEffect, useState } from "react";
import { BrainCircuit, Check, ChevronDown, Loader2 } from "lucide-react";
import Markdown from "react-markdown";
import { Skeleton } from "./ui/skeleton";
export function ReasoningPanel({
  text = "",
  active = false,
}: {
  text?: string;
  active?: boolean;
}) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!active) return;
    const started = performance.now();
    const timer = setInterval(
      () => setSeconds(Math.floor((performance.now() - started) / 1000)),
      500,
    );
    return () => clearInterval(timer);
  }, [active]);
  return (
    <details
      open={active || undefined}
      className="group rounded-xl border bg-card/60"
    >
      <summary className="flex list-none items-center gap-2.5 px-4 py-3 text-xs">
        <span className="flex size-7 items-center justify-center rounded-lg border bg-background">
          <BrainCircuit className="size-4" />
        </span>
        <span className="font-medium">{active ? "Thinking" : "Reasoning"}</span>
        {seconds > 0 && (
          <span className="text-[10px] text-muted-foreground">{seconds}s</span>
        )}
        <span className="ml-auto flex items-center gap-2 text-muted-foreground">
          {active ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Check className="size-3.5" />
          )}
          <ChevronDown className="size-3 transition-transform group-open:rotate-180" />
        </span>
      </summary>
      <div className="border-t px-4 py-3">
        {text ? (
          <div className="markdown text-muted-foreground [&_p]:text-xs [&_p]:leading-6">
            <Markdown>{text}</Markdown>
          </div>
        ) : (
          <div
            role="status"
            aria-label="Waiting for model reasoning"
            className="space-y-2.5 py-1"
          >
            <p className="mb-3 text-[11px] text-muted-foreground">
              Waiting for the model’s reasoning summary…
            </p>
            <Skeleton className="h-2 w-4/5" />
            <Skeleton className="h-2 w-full" />
            <Skeleton className="h-2 w-3/5" />
          </div>
        )}
      </div>
    </details>
  );
}
