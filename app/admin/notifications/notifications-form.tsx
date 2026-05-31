"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { SendIcon } from "lucide-react";
import { LoadingButton } from "@/components/ui/loading-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Split textarea content on commas / whitespace / newlines into addresses. */
function parseRecipients(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function NotificationsForm({
  newRsvpEnabled: initialEnabled,
  extraRecipients: initialExtra,
  adminEmails,
}: {
  newRsvpEnabled: boolean;
  extraRecipients: string[];
  adminEmails: string[];
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [extra, setExtra] = useState(initialExtra.join("\n"));
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const recipients = parseRecipients(extra);
    const bad = recipients.find((r) => !EMAIL_RE.test(r));
    if (bad) {
      toast.error(`"${bad}" is not a valid email address.`);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newRsvpEnabled: enabled,
          extraRecipients: recipients,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not save.");
        return;
      }
      toast.success("Notification settings saved.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function sendTest() {
    const res = await fetch("/api/admin/notifications/test", {
      method: "POST",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error ?? "Could not send test email.");
      return;
    }
    toast.success("Test email sent — check your inbox.");
  }

  return (
    <Card className="max-w-lg">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>New RSVP notifications</CardTitle>
          <CardDescription>
            Get an email whenever a guest submits the RSVP form.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <Label htmlFor="rsvp-toggle">Email me about new RSVPs</Label>
              <p className="text-xs text-muted-foreground">
                Turn off to stop all new-RSVP emails.
              </p>
            </div>
            <Switch
              id="rsvp-toggle"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          <div className="space-y-2">
            <Label>Always notified (every admin)</Label>
            <div className="flex flex-wrap gap-1.5">
              {adminEmails.length === 0 ? (
                <span className="text-sm text-muted-foreground">—</span>
              ) : (
                adminEmails.map((e) => (
                  <span
                    key={e}
                    className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
                  >
                    {e}
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="extra">Also notify (one email per line)</Label>
            <Textarea
              id="extra"
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              placeholder={"couple@example.com\nplanner@example.com"}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Extra people — the couple, a planner — beyond the admins above.
            </p>
          </div>
        </CardContent>
        <CardFooter className="gap-2">
          <LoadingButton type="submit" loading={saving}>
            Save
          </LoadingButton>
          <LoadingButton type="button" variant="outline" onClick={sendTest}>
            <SendIcon />
            Send test email
          </LoadingButton>
        </CardFooter>
      </form>
    </Card>
  );
}
