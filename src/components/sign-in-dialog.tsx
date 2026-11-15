"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function SignInDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");

  async function signIn() {
    if (signingIn) return;
    setSigningIn(true);
    setError("");
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: window.location.pathname,
      });
      if (result.error) throw new Error(result.error.message);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not sign in. Please try again.",
      );
      setSigningIn(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <div aria-hidden="true" className="text-center text-5xl">
          ✳
        </div>
        <DialogHeader className="items-center text-center sm:text-center">
          <DialogTitle className="text-xl">Your next idea starts here.</DialogTitle>
          <DialogDescription>
            Sign in to chat with Shaheer 1.0 Flash, save your conversations, and
            get 50 free messages every day.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <Button
          variant="outline"
          className="h-11 w-full gap-2"
          disabled={signingIn}
          onClick={() => void signIn()}
        >
          {signingIn ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Image
              src="/icons/google.svg"
              alt=""
              width={20}
              height={20}
              className="shrink-0"
              unoptimized
            />
          )}
          {signingIn ? "Connecting to Google…" : "Continue with Google"}
        </Button>
        <p className="text-center text-xs leading-5 text-muted-foreground">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-2">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            Privacy Policy
          </Link>
          .
        </p>
      </DialogContent>
    </Dialog>
  );
}
