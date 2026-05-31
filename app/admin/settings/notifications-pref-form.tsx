"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { BellIcon, BellOffIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function NotificationsPrefForm({
  enabled: initialEnabled,
}: {
  enabled: boolean;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);

  // Auto-save on toggle: optimistically flip, revert if the request fails.
  async function handleChange(next: boolean) {
    setEnabled(next);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailNotificationsEnabled: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEnabled(!next);
        toast.error(data.error ?? "Could not update notifications.");
        return;
      }
      toast.success(
        next
          ? "Email notifications turned on."
          : "Email notifications turned off."
      );
      router.refresh();
    } catch {
      setEnabled(!next);
      toast.error("Could not update notifications.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Email notifications</CardTitle>
        <CardDescription>
          Controls the platform emails sent to <strong>your</strong> address.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span
              className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center text-[color:var(--primary)]"
              aria-hidden="true"
            >
              {enabled ? (
                <BellIcon className="size-4" />
              ) : (
                <BellOffIcon className="size-4" />
              )}
            </span>
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">
                Receive RSVP &amp; test emails
              </Label>
              <p className="text-xs text-muted-foreground">
                When off, you won&apos;t get new-RSVP or test emails. Security
                emails — sign-in codes and password resets — are always sent.
              </p>
            </div>
          </div>
          <Switch
            id="email-notifications"
            checked={enabled}
            disabled={saving}
            onCheckedChange={handleChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}
