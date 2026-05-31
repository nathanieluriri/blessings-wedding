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

export default function ForgotForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/admin/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Generic outcome regardless of whether the email exists.
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm border-[color:var(--border)] shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 font-serif text-2xl tracking-[0.3em] text-[color:var(--primary)]">
          #OfoDiMma
        </div>
        <CardTitle className="text-xl">Reset your password</CardTitle>
        <CardDescription>
          We&apos;ll email you a link to choose a new one.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sent ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              If that email belongs to an admin account, a reset link is on its
              way. The link expires in 45 minutes.
            </p>
            <Link
              href="/login/admin"
              className="text-sm text-[color:var(--primary)] underline-offset-4 hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <LoadingButton type="submit" className="w-full" loading={loading}>
              Send reset link
            </LoadingButton>
            <div className="text-center">
              <Link
                href="/login/admin"
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                Back to sign in
              </Link>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
