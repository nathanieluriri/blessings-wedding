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

export default function SettingsForm({
  weddingDateISO,
  currentLabel,
}: {
  weddingDateISO: string;
  currentLabel: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(() => toLocalInput(weddingDateISO));
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const iso = new Date(value).toISOString();
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weddingDate: iso }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not save.");
        return;
      }
      toast.success("Wedding date updated. The public site now reflects it.");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-lg">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Wedding date &amp; time</CardTitle>
          <CardDescription>
            Currently set to <strong>{currentLabel}</strong>. This drives the
            countdown, page metadata, manifest and the share image.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="wedding-date">Date &amp; time</Label>
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
        </CardContent>
        <CardFooter>
          <LoadingButton
            type="submit"
            loading={loading}
            className="h-11 w-full sm:h-9 sm:w-auto"
          >
            Save date
          </LoadingButton>
        </CardFooter>
      </form>
    </Card>
  );
}
