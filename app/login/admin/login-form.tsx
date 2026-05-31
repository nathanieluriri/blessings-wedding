"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { LoadingButton } from "@/components/ui/loading-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Step = "credentials" | "twofa";
type Mode = "totp" | "recovery" | "email";

const MODE_COPY: Record<Mode, { label: string; hint: string; placeholder: string }> = {
  totp: {
    label: "Authentication code",
    hint: "Enter the 6-digit code from your authenticator app.",
    placeholder: "123456",
  },
  recovery: {
    label: "Recovery code",
    hint: "Enter one of your saved recovery codes.",
    placeholder: "xxxx-xxxx",
  },
  email: {
    label: "Email code",
    hint: "Enter the 6-digit code we just emailed you.",
    placeholder: "123456",
  },
};

export default function LoginForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<Mode>("totp");
  const [code, setCode] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Login failed.");
        setLoading(false);
        return;
      }
      if (data.twoFactorRequired) {
        setStep("twofa");
        setMode("totp");
        setLoading(false);
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: mode, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Verification failed.");
        setLoading(false);
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  async function emailCode() {
    setError(null);
    setInfo(null);
    const res = await fetch("/api/admin/auth/2fa/email", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Couldn't send a code.");
      return;
    }
    setMode("email");
    setCode("");
    setInfo("We emailed you a 6-digit code. It expires in 10 minutes.");
  }

  function switchMode(next: Mode) {
    setMode(next);
    setCode("");
    setError(null);
    setInfo(null);
  }

  return (
    <Card className="w-full max-w-sm border-[color:var(--border)] shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 font-serif text-2xl tracking-[0.3em] text-[color:var(--primary)]">
          #OfoDiMma
        </div>
        <CardTitle className="text-xl">
          {step === "credentials" ? "Admin sign in" : "Two-factor verification"}
        </CardTitle>
        <CardDescription>
          {step === "credentials"
            ? "Blessing & Justice — wedding dashboard"
            : MODE_COPY[mode].hint}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "credentials" ? (
          <form onSubmit={handleLogin} className="space-y-4">
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
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p className="text-sm text-[color:var(--destructive)]">{error}</p>
            )}
            <LoadingButton type="submit" className="w-full" loading={loading}>
              Sign in
            </LoadingButton>
            <div className="text-center">
              <Link
                href="/login/admin/forgot"
                className="text-sm text-muted-foreground underline-offset-4 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">{MODE_COPY[mode].label}</Label>
              <Input
                id="code"
                inputMode={mode === "recovery" ? "text" : "numeric"}
                autoComplete="one-time-code"
                autoFocus
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={MODE_COPY[mode].placeholder}
                className="text-center tracking-[0.3em]"
              />
            </div>
            {info && <p className="text-sm text-muted-foreground">{info}</p>}
            {error && (
              <p className="text-sm text-[color:var(--destructive)]">{error}</p>
            )}
            <LoadingButton type="submit" className="w-full" loading={loading}>
              Verify
            </LoadingButton>

            <div className="flex flex-col gap-1 text-center text-sm">
              {mode !== "email" && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={emailCode}
                >
                  Email me a code instead
                </Button>
              )}
              {mode !== "recovery" ? (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => switchMode("recovery")}
                >
                  Use a recovery code
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => switchMode("totp")}
                >
                  Back to authenticator app
                </Button>
              )}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
