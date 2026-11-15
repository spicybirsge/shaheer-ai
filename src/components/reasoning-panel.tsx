"use client";
import { useEffect, useState } from "react";
import { BrainCircuit, ChevronRight, Loader2 } from "lucide-react";
import Markdown from "react-markdown";
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
    <details className="group/reasoning text-muted-foreground">
      <summary className="flex w-fit list-none items-center gap-2 rounded-md py-1 text-xs transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
        {active ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <BrainCircuit className="size-3.5" />
        )}
        <span>
          {active
            ? seconds > 0
              ? `Thinking for ${seconds}s…`
              : "Thinking…"
            : seconds > 0
              ? `Thought for ${seconds}s`
              : "Reasoning"}
        </span>
        <ChevronRight className="size-3 transition-transform group-open/reasoning:rotate-90" />
      </summary>
      <div className="mt-2 ml-1.5 max-h-56 overflow-y-auto border-l pl-4 text-xs leading-6">
        {text ? (
          <div className="pb-1 [&_p]:my-2 [&_strong]:font-medium [&_h1]:text-xs [&_h2]:text-xs [&_h3]:text-xs [&_pre]:overflow-x-auto [&_code]:text-[11px] [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_a]:underline">
            <Markdown>{text}</Markdown>
          </div>
        ) : (
          <p role="status" className="py-1">
            {active
              ? "Reasoning will appear here as it streams."
              : "No reasoning summary was returned."}
          </p>
        )}
      </div>
    </details>
  );
}
