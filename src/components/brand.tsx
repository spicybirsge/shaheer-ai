import Link from "next/link";
export function Brand() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-2.5 text-xl font-semibold tracking-tight"
    >
      <span className="text-2xl italic leading-none" aria-hidden="true">
        s✳
      </span>
      shaheer
      <span className="mt-1 text-[9px] font-medium tracking-[.2em] text-muted-foreground">
        LABS
      </span>
    </Link>
  );
}
