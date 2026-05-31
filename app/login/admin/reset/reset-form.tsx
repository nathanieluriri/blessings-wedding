"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { LoadingButton } from "@/components/ui/loading-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ResetForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not reset password.");
        setLoading(false);
        return;
      }
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm border-[color:var(--border)] shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 font-serif text-2xl tracking-[0.3em] text-[color:var(--primary)]">
          #OfoDiMma
        </div>
        <CardTitle className="text-xl">Choose a new password</CardTitle>
        <CardDescription>
          {done
            ? "You're all set."
            : "Enter a new password for your admin account."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!token ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-[color:var(--destructive)]">
              This reset link is invalid. Request a new one.
            </p>
            <Link
              href="/login/admin/forgot"
              className="text-sm text-[color:var(--primary)] underline-offset-4 hover:underline"
            >
              Request a reset link
            </Link>
          </div>
        ) : done ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Your password has been updated. Sign in with your new password.
            </p>
            <Link
              href="/login/admin"
              className="text-sm text-[color:var(--primary)] underline-offset-4 hover:underline"
            >
              Go to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            {error && (
              <p className="text-sm text-[color:var(--destructive)]">{error}</p>
            )}
            <LoadingButton type="submit" className="w-full" loading={loading}>
              Update password
            </LoadingButton>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
