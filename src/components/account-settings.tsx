"use client";
import { useState } from "react";
import { Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "./ui/card";
import { Input } from "./ui/input";
import { Skeleton } from "./ui/skeleton";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { ThemeToggle } from "./theme-toggle";
export function AccountSettings() {
  const { data: session, isPending } = authClient.useSession();
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  async function signIn() {
    setSigningIn(true);
    setError("");
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/settings",
      });
      if (result.error) throw new Error(result.error.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign in");
      setSigningIn(false);
    }
  }
  async function removeAccount() {
    if (confirmation !== "DELETE" || deleting) return;
    setDeleting(true);
    setError("");
    try {
      const result = await authClient.deleteUser();
      if (result.error)
        throw new Error(
          result.error.code === "SESSION_NOT_FRESH"
            ? "Please sign out and sign in again with Google, then retry deletion."
            : result.error.message || "Could not delete account",
        );
      window.location.assign(new URL("/", window.location.origin).href);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete account");
      setDeleting(false);
    }
  }
  if (isPending)
    return (
      <div role="status" aria-label="Loading settings" className="space-y-5">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  if (!session)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your account, your control.</CardTitle>
          <CardDescription>
            Sign in to manage your profile and data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button disabled={signingIn} onClick={() => void signIn()}>
            {signingIn && <Loader2 className="animate-spin" />}Continue with
            Google
          </Button>
          {error && (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {error}
            </p>
          )}
        </CardContent>
      </Card>
    );
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Your profile is synced from your Google account.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="size-14">
            <AvatarImage
              src={session.user.image ?? undefined}
              alt={session.user.name}
              referrerPolicy="no-referrer"
            />
            <AvatarFallback>{session.user.name.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-medium">{session.user.name}</p>
            <p className="truncate text-sm text-muted-foreground">
              {session.user.email}
            </p>
            <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <ShieldCheck className="size-3" />
              Connected with Google
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Choose light, dark, or follow your system. Your preference is saved
            on this device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeToggle />
        </CardContent>
      </Card>
      <Card className="border-destructive/25">
        <CardHeader>
          <CardTitle>Delete account and data</CardTitle>
          <CardDescription>
            Permanently remove your account, Google connection, sign-in
            sessions, conversations, saved events, and usage records from our
            application database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-6 text-muted-foreground">
            Active agent sessions will be stopped first. New agent sessions are
            configured to discard Workflow content when they end. Provider logs,
            backups, and older runtime records may follow their own retention
            periods; see our privacy policy.
          </p>
          <AlertDialog
            open={open}
            onOpenChange={(value) => {
              if (!deleting) {
                setOpen(value);
                setError("");
                setConfirmation("");
              }
            }}
          >
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 />
                Delete my account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Delete your account permanently?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This cannot be undone. Your account and all associated data in
                  our application database will be removed. You may need to sign
                  in again with Google if your session is older than one day.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2">
                <label htmlFor="delete-confirmation" className="text-sm">
                  Type <strong>DELETE</strong> to confirm
                </label>
                <Input
                  id="delete-confirmation"
                  autoComplete="off"
                  value={confirmation}
                  disabled={deleting}
                  onChange={(e) => setConfirmation(e.target.value)}
                />
                {error && (
                  <p role="alert" className="text-sm text-destructive">
                    {error}
                  </p>
                )}
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>
                  Keep my account
                </AlertDialogCancel>
                <Button
                  variant="destructive"
                  disabled={confirmation !== "DELETE" || deleting}
                  onClick={() => void removeAccount()}
                >
                  {deleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
                  {deleting ? "Deleting your data…" : "Delete permanently"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
