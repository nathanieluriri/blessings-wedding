"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { KeyRoundIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ChangePasswordDialog({
  defaultOpen = false,
  trigger,
}: {
  defaultOpen?: boolean;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not change password.");
        return;
      }
      toast.success("Password updated.");
      setOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm">
            <KeyRoundIcon />
            Change password
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>
              Choose a new password (at least 8 characters).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="current">Current password</Label>
              <Input
                id="current"
                type="password"
                autoComplete="current-password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new">New password</Label>
              <Input
                id="new"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <LoadingButton type="submit" loading={loading}>
              Update password
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
