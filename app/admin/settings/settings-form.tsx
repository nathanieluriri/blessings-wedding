"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { LoadingButton } from "@/components/ui/loading-button";
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

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

// The RSVP deadline is a whole calendar day. Render the date input in West
// Africa Time so the stored noon-Lagos timestamp maps back to the right day
// regardless of where the admin is browsing from.
function toDateInput(iso: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

export default function SettingsForm({
  weddingDateISO,
  currentLabel,
  rsvpDeadlineISO,
  rsvpDeadlineLabel,
}: {
  weddingDateISO: string;
  currentLabel: string;
  rsvpDeadlineISO: string;
  rsvpDeadlineLabel: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(() => toLocalInput(weddingDateISO));
  const [deadline, setDeadline] = useState(() => toDateInput(rsvpDeadlineISO));
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const iso = new Date(value).toISOString();
      // Anchor the deadline at noon Lagos (+01:00) so it never slips a day.
      const deadlineIso = new Date(`${deadline}T12:00:00+01:00`).toISOString();
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weddingDate: iso, rsvpDeadline: deadlineIso }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not save.");
        return;
      }
      toast.success("Dates updated. The public site now reflects them.");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-lg">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Wedding date &amp; RSVP deadline</CardTitle>
          <CardDescription>
            The wedding is set to <strong>{currentLabel}</strong> and RSVPs close{" "}
            <strong>{rsvpDeadlineLabel}</strong>. The wedding date drives the
            countdown, scratch reveal, thank-you card, page metadata, manifest
            and share image; the deadline drives the RSVP form and Q&amp;A.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="wedding-date">Wedding date &amp; time</Label>
            <Input
              id="wedding-date"
              type="datetime-local"
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-11 sm:h-9"
            />
            <p className="text-xs text-muted-foreground">
              Entered in your local time; the public site displays it in West
              Africa Time (Lagos).
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rsvp-deadline">RSVP deadline</Label>
            <Input
              id="rsvp-deadline"
              type="date"
              required
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="h-11 sm:h-9"
            />
            <p className="text-xs text-muted-foreground">
              The last day guests can confirm attendance, shown as a full date
              on the site.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <LoadingButton
            type="submit"
            loading={loading}
            className="h-11 w-full sm:h-9 sm:w-auto"
          >
            Save dates
          </LoadingButton>
        </CardFooter>
      </form>
    </Card>
  );
}
