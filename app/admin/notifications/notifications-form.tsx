"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type KeyboardEvent } from "react";
import { toast } from "sonner";
import {
  MailIcon,
  PlusIcon,
  SendIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AdminRecipient {
  email: string;
  notificationsEnabled: boolean;
}

type Row =
  | { email: string; role: "admin"; muted: boolean }
  | { email: string; role: "custom"; muted: false };

export default function NotificationsForm({
  newRsvpEnabled: initialEnabled,
  extraRecipients: initialExtra,
  admins,
  selfNotificationsEnabled,
}: {
  newRsvpEnabled: boolean;
  extraRecipients: string[];
  admins: AdminRecipient[];
  selfNotificationsEnabled: boolean;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [extras, setExtras] = useState<string[]>(initialExtra);
  const [newEmail, setNewEmail] = useState("");
  const [saving, setSaving] = useState(false);

  const rows = useMemo<Row[]>(
    () => [
      ...admins.map(
        (a): Row => ({
          email: a.email,
          role: "admin",
          muted: !a.notificationsEnabled,
        })
      ),
      ...extras.map((email): Row => ({ email, role: "custom", muted: false })),
    ],
    [admins, extras]
  );

  const allEmails = useMemo(
    () => [...admins.map((a) => a.email), ...extras],
    [admins, extras]
  );

  // Send a test email to one or many addresses; muted recipients are skipped
  // server-side. Returns a promise so LoadingButton tracks its own spinner.
  async function sendTest(emails: string[]) {
    try {
      const res = await fetch("/api/admin/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: emails.length === 1 ? emails[0] : emails }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not send test email.");
        return;
      }
      const sent: number = data.sent ?? 0;
      const skipped: number = data.skipped ?? 0;
      const failed: number = data.failed ?? 0;
      const bits = [
        `Test email sent to ${sent} recipient${sent === 1 ? "" : "s"}`,
      ];
      if (skipped) bits.push(`${skipped} skipped (notifications off)`);
      if (failed) bits.push(`${failed} failed`);
      toast.success(bits.join(" · "));
    } catch {
      toast.error("Could not send test email.");
    }
  }

  function addRecipient() {
    const v = newEmail.trim().toLowerCase();
    if (!v) return;
    if (!EMAIL_RE.test(v)) {
      toast.error(`"${v}" is not a valid email address.`);
      return;
    }
    if (admins.some((a) => a.email === v) || extras.includes(v)) {
      toast.error("That address is already a recipient.");
      return;
    }
    setExtras((prev) => [...prev, v]);
    setNewEmail("");
  }

  function onNewEmailKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addRecipient();
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newRsvpEnabled: enabled,
          extraRecipients: extras,
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

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>New RSVP notifications</CardTitle>
        <CardDescription>
          Get an email whenever a guest submits the RSVP form.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 space-y-0.5">
            <Label htmlFor="rsvp-toggle">Email me about new RSVPs</Label>
            <p className="text-xs text-muted-foreground">
              Turn off to stop all new-RSVP emails.
            </p>
          </div>
          <Switch
            id="rsvp-toggle"
            className="shrink-0"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        {!selfNotificationsEnabled && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
            <p>
              Your email notifications are turned off, so you won&apos;t receive
              test emails.{" "}
              <Link
                href="/admin/settings"
                className="font-medium underline underline-offset-2"
              >
                Turn them on in Settings
              </Link>{" "}
              to send and see test emails.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
            <div className="min-w-0 space-y-0.5">
              <Label>Recipients</Label>
              <p className="text-xs text-muted-foreground">
                Everyone emailed when a new RSVP arrives.
              </p>
            </div>
            <LoadingButton
              type="button"
              variant="outline"
              size="sm"
              disabled={!selfNotificationsEnabled || allEmails.length === 0}
              onClick={() => sendTest(allEmails)}
              className="h-10 w-full sm:h-8 sm:w-auto"
            >
              <SendIcon />
              Send test to all
            </LoadingButton>
          </div>

          {/* Mobile: stacked card list (the table below is hidden < md) */}
          <ul className="space-y-2 md:hidden">
            {rows.length === 0 && (
              <li className="rounded-lg border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
                No recipients yet. Add one below.
              </li>
            )}
            {rows.map((row) => {
              const recipientMuted = row.role === "admin" && row.muted;
              return (
                <li
                  key={row.email}
                  className="space-y-3 rounded-lg border bg-card p-4"
                >
                  <div
                    className={cn(
                      "flex items-start gap-2 text-sm",
                      recipientMuted && "text-muted-foreground"
                    )}
                  >
                    <MailIcon
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    <span className="min-w-0 break-all font-medium">
                      {row.email}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {row.role === "admin" ? (
                      <Badge variant="secondary">Admin</Badge>
                    ) : (
                      <Badge variant="outline">Custom</Badge>
                    )}
                    {recipientMuted && (
                      <Badge variant="outline" className="text-muted-foreground">
                        Notifications off
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <LoadingButton
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={!selfNotificationsEnabled || recipientMuted}
                      title={
                        recipientMuted
                          ? "This admin turned notifications off."
                          : undefined
                      }
                      onClick={() => sendTest([row.email])}
                      className="h-10 flex-1"
                    >
                      <SendIcon />
                      Send test
                    </LoadingButton>
                    {row.role === "custom" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-lg"
                        aria-label={`Remove ${row.email}`}
                        onClick={() =>
                          setExtras((prev) =>
                            prev.filter((e) => e !== row.email)
                          )
                        }
                      >
                        <Trash2Icon aria-hidden />
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {/* md+: full data table */}
          <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No recipients yet. Add one below.
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((row) => {
                  const recipientMuted = row.role === "admin" && row.muted;
                  return (
                    <TableRow key={row.email}>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 text-sm",
                            recipientMuted && "text-muted-foreground"
                          )}
                        >
                          <MailIcon
                            className="size-3.5 shrink-0 text-muted-foreground"
                            aria-hidden
                          />
                          <span className="break-all">{row.email}</span>
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex flex-wrap items-center gap-1.5">
                          {row.role === "admin" ? (
                            <Badge variant="secondary">Admin</Badge>
                          ) : (
                            <Badge variant="outline">Custom</Badge>
                          )}
                          {recipientMuted && (
                            <Badge
                              variant="outline"
                              className="text-muted-foreground"
                            >
                              Notifications off
                            </Badge>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <LoadingButton
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={!selfNotificationsEnabled || recipientMuted}
                            title={
                              recipientMuted
                                ? "This admin turned notifications off."
                                : undefined
                            }
                            onClick={() => sendTest([row.email])}
                          >
                            <SendIcon />
                            Send test
                          </LoadingButton>
                          {row.role === "custom" && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Remove ${row.email}`}
                              onClick={() =>
                                setExtras((prev) =>
                                  prev.filter((e) => e !== row.email)
                                )
                              }
                            >
                              <Trash2Icon aria-hidden />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              type="email"
              inputMode="email"
              placeholder="name@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={onNewEmailKeyDown}
              aria-label="Add a recipient email"
              className="h-11 sm:h-9"
            />
            <Button
              type="button"
              variant="outline"
              onClick={addRecipient}
              disabled={newEmail.trim().length === 0}
              className="h-11 w-full sm:h-9 sm:w-auto"
            >
              <PlusIcon />
              Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Admins are always notified. Add extra people — the couple, a planner
            — below.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <LoadingButton
          type="button"
          loading={saving}
          onClick={handleSave}
          className="h-11 w-full sm:h-9 sm:w-auto"
        >
          Save
        </LoadingButton>
      </CardFooter>
    </Card>
  );
}
