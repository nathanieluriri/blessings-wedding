"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ShieldCheckIcon, ShieldOffIcon, CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SetupData {
  qr: string;
  secret: string;
}

export default function SecurityManager({
  twoFactorEnabled,
}: {
  twoFactorEnabled: boolean;
}) {
  const router = useRouter();

  // Enrollment dialog state.
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [setup, setSetup] = useState<SetupData | null>(null);
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [working, setWorking] = useState(false);

  // Disable dialog state.
  const [disableOpen, setDisableOpen] = useState(false);
  const [password, setPassword] = useState("");

  async function beginEnroll() {
    setWorking(true);
    try {
      const res = await fetch("/api/admin/auth/2fa/setup", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not start setup.");
        return;
      }
      setSetup({ qr: data.qr, secret: data.secret });
      setCode("");
      setRecoveryCodes(null);
      setEnrollOpen(true);
    } finally {
      setWorking(false);
    }
  }

  async function confirmEnroll(e: FormEvent) {
    e.preventDefault();
    setWorking(true);
    try {
      const res = await fetch("/api/admin/auth/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not enable two-factor.");
        return;
      }
      setRecoveryCodes(data.recoveryCodes ?? []);
      toast.success("Two-factor authentication is on.");
    } finally {
      setWorking(false);
    }
  }

  async function disable(e: FormEvent) {
    e.preventDefault();
    setWorking(true);
    try {
      const res = await fetch("/api/admin/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not disable two-factor.");
        return;
      }
      toast.success("Two-factor authentication is off.");
      setDisableOpen(false);
      setPassword("");
      router.refresh();
    } finally {
      setWorking(false);
    }
  }

  function finishEnroll() {
    setEnrollOpen(false);
    setSetup(null);
    setRecoveryCodes(null);
    setCode("");
    router.refresh();
  }

  function copyRecovery() {
    if (recoveryCodes) {
      navigator.clipboard.writeText(recoveryCodes.join("\n"));
      toast.success("Recovery codes copied.");
    }
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Two-factor authentication</CardTitle>
          <Badge variant={twoFactorEnabled ? "default" : "secondary"}>
            {twoFactorEnabled ? "On" : "Off"}
          </Badge>
        </div>
        <CardDescription>
          Require a code from an authenticator app (Google Authenticator, Authy,
          1Password…) when you sign in. If you ever lose the app, you can get a
          code by email or use a recovery code.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          {twoFactorEnabled ? (
            <>
              <ShieldCheckIcon className="size-4 text-[color:var(--primary)]" />
              Your account is protected with two-factor authentication.
            </>
          ) : (
            <>
              <ShieldOffIcon className="size-4" />
              Your account is protected by password only.
            </>
          )}
        </p>
      </CardContent>
      <CardFooter>
        {twoFactorEnabled ? (
          <Button variant="outline" onClick={() => setDisableOpen(true)}>
            Disable two-factor
          </Button>
        ) : (
          <LoadingButton loading={working} onClick={beginEnroll}>
            Set up two-factor
          </LoadingButton>
        )}
      </CardFooter>

      {/* Enrollment dialog */}
      <Dialog
        open={enrollOpen}
        onOpenChange={(o) => {
          if (!o) finishEnroll();
        }}
      >
        <DialogContent>
          {recoveryCodes ? (
            <>
              <DialogHeader>
                <DialogTitle>Save your recovery codes</DialogTitle>
                <DialogDescription>
                  Store these somewhere safe. Each one works once if you lose
                  access to your authenticator. They won&apos;t be shown again.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-2 py-2 font-mono text-sm">
                {recoveryCodes.map((c) => (
                  <div
                    key={c}
                    className="rounded-md bg-secondary px-2.5 py-1.5 text-center text-secondary-foreground"
                  >
                    {c}
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={copyRecovery}>
                  <CopyIcon />
                  Copy
                </Button>
                <Button onClick={finishEnroll}>I&apos;ve saved them</Button>
              </DialogFooter>
            </>
          ) : (
            <form onSubmit={confirmEnroll}>
              <DialogHeader>
                <DialogTitle>Set up two-factor</DialogTitle>
                <DialogDescription>
                  Scan the QR code with your authenticator app, then enter the
                  6-digit code it shows.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {setup && (
                  <div className="flex flex-col items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={setup.qr}
                      alt="Two-factor QR code"
                      className="size-44 rounded-lg border bg-white p-2"
                    />
                    <p className="text-center text-xs text-muted-foreground">
                      Can&apos;t scan? Enter this key manually:
                      <br />
                      <span className="font-mono break-all text-foreground">
                        {setup.secret}
                      </span>
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="totp-code">6-digit code</Label>
                  <Input
                    id="totp-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    className="text-center tracking-[0.3em]"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="ghost">
                    Cancel
                  </Button>
                </DialogClose>
                <LoadingButton type="submit" loading={working}>
                  Verify &amp; enable
                </LoadingButton>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Disable dialog */}
      <Dialog open={disableOpen} onOpenChange={setDisableOpen}>
        <DialogContent>
          <form onSubmit={disable}>
            <DialogHeader>
              <DialogTitle>Disable two-factor</DialogTitle>
              <DialogDescription>
                Enter your password to turn off two-factor authentication.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-4">
              <Label htmlFor="disable-pass">Password</Label>
              <Input
                id="disable-pass"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </DialogClose>
              <LoadingButton
                type="submit"
                variant="destructive"
                loading={working}
              >
                Disable
              </LoadingButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
