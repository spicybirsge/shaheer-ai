"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="text-5xl">✳</span>
      <h1 className="text-xl font-medium">
        Something interrupted the conversation.
      </h1>
      <p className="text-sm text-muted-foreground">
        Please try again in a moment.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
