"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2Icon, MailCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Bulk-delivers the IV email to every accepted guest who hasn't received one.
// pendingCount comes from the server page so the button can say how many
// guests it will target (and disable itself when there's nothing to send).
export default function SendIvsButton({ pendingCount }: { pendingCount: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);

  async function sendAll() {
    setSending(true);
    try {
      const res = await fetch("/api/admin/rsvps/send-ivs", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Sending failed.");
        return;
      }
      const parts = [`${data.sent} sent`];
      if (data.failed) parts.push(`${data.failed} failed`);
      if (data.skippedNoEmail) parts.push(`${data.skippedNoEmail} without email`);
      toast.success(`IV delivery: ${parts.join(", ")}.`);
      setOpen(false);
      router.refresh();
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} disabled={pendingCount === 0}>
        <MailCheckIcon aria-hidden />
        Send IV to approved guests
        {pendingCount > 0 && (
          <span className="rounded-full bg-(--gold) px-1.5 py-0.5 text-xs font-semibold text-primary tabular-nums">
            {pendingCount}
          </span>
        )}
      </Button>
      <Dialog open={open} onOpenChange={(o) => !sending && setOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send invitations?</DialogTitle>
            <DialogDescription>
              This emails the personalized IV to {pendingCount} accepted{" "}
              {pendingCount === 1 ? "guest" : "guests"} who haven&rsquo;t
              received it yet. Guests are never emailed twice.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" disabled={sending}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={sendAll} disabled={sending}>
              {sending && <Loader2Icon className="animate-spin" aria-hidden />}
              {sending ? "Sending…" : "Send now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
