import { Skeleton } from "@/components/ui/skeleton";
export function ChatSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading conversation"
      className="mx-auto w-full max-w-3xl space-y-10 p-6 pt-14"
    >
      <span className="sr-only">Loading conversation…</span>
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-4">
          <div className="space-y-3">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/5" />
          </div>
        </div>
      ))}
    </div>
  );
}
