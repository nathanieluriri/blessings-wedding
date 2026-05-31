"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShieldCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DISMISS_KEY = "admin:2fa-onboarding-dismissed";

export default function TwoFactorOnboarding({
  twoFactorEnabled,
  mustChangePassword,
}: {
  twoFactorEnabled: boolean;
  mustChangePassword: boolean;
}) {
  const [open, setOpen] = useState(false);

  // Decide whether to prompt. We read sessionStorage only on the client (inside
  // an effect) to stay SSR/hydration-safe — the dialog defaults to closed and is
  // opened here once we confirm the admin still needs 2FA and hasn't dismissed
  // the prompt during this browser session.
  useEffect(() => {
    if (mustChangePassword) return; // set a real password first; don't stack prompts
    if (twoFactorEnabled) return; // already protected

    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      // sessionStorage unavailable (private mode / blocked) — fail open and prompt.
    }

    if (!dismissed) setOpen(true);
  }, [mustChangePassword, twoFactorEnabled]);

  function persistDismissal() {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Ignore storage failures — worst case the prompt reappears next mount.
    }
  }

  function handleOpenChange(next: boolean) {
    if (!next) persistDismissal();
    setOpen(next);
  }

  function handleSetUp() {
    // Mark dismissed before navigating so we don't re-prompt on return this session.
    persistDismissal();
    setOpen(false);
  }

  // Nothing to render while conditions aren't met — keeps the prompt out of the DOM.
  if (mustChangePassword || twoFactorEnabled) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center sm:text-center">
          <span
            aria-hidden
            className="mb-2 flex size-14 items-center justify-center rounded-full border border-primary/15 bg-primary/8 text-primary shadow-sm"
          >
            <ShieldCheckIcon className="size-7 text-(--gold,#c9a96b)" />
          </span>
          <DialogTitle className="font-serif text-2xl font-normal tracking-tight text-primary">
            Secure your account
          </DialogTitle>
          <DialogDescription className="mx-auto max-w-sm text-pretty leading-relaxed">
            Welcome aboard. Add two-factor authentication to keep the wedding
            dashboard, your guest list, and RSVPs safe behind a second layer of
            protection. It only takes a minute.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-2 flex-col gap-2 sm:flex-col">
          <Button asChild size="lg" className="w-full" onClick={handleSetUp}>
            <Link href="/admin/security">
              <ShieldCheckIcon />
              Set up two-factor authentication
            </Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => handleOpenChange(false)}
          >
            Remind me later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
