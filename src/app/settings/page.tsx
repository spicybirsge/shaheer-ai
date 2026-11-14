import { SiteFrame } from "@/components/site-frame";
import { AccountSettings } from "@/components/account-settings";
export const metadata = { title: "Account settings — Shaheer" };
export default function Settings() {
  return (
    <SiteFrame>
      <div className="mx-auto max-w-2xl">
        <p className="mb-3 text-xs tracking-[.2em] text-muted-foreground">
          YOUR WORKSPACE
        </p>
        <h1 className="text-3xl font-medium tracking-tight">
          Account settings
        </h1>
        <p className="mt-3 mb-9 text-sm text-muted-foreground">
          A little housekeeping. Everything in one place.
        </p>
        <AccountSettings />
      </div>
    </SiteFrame>
  );
}
