"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Trash2Icon, UserPlusIcon, SendIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface AdminRow {
  id: string;
  email: string;
  name?: string;
  role: "root" | "admin";
  createdAt: string;
  createdBy?: string;
  mustChangePassword: boolean;
}

export default function AdminsManager({
  admins,
  currentId,
  currentEmail,
  currentRole,
}: {
  admins: AdminRow[];
  currentId: string;
  currentEmail: string;
  currentRole: "root" | "admin";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"admin" | "root">("admin");
  const [loading, setLoading] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  // Destructive delete is confirmed via a controlled AlertDialog.
  const [confirmRow, setConfirmRow] = useState<AdminRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not create admin.");
        return;
      }
      toast.success(`Invite emailed to ${email}.`);
      setOpen(false);
      setEmail("");
      setName("");
      setRole("admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend(row: AdminRow) {
    setResendingId(row.id);
    try {
      const res = await fetch(`/api/admin/admins/${row.id}/resend-invite`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not resend invite.");
        return;
      }
      toast.success(`New invite emailed to ${row.email}.`);
      router.refresh();
    } finally {
      setResendingId(null);
    }
  }

  async function confirmDelete() {
    if (!confirmRow) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/admins/${confirmRow.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Could not remove admin.");
        return;
      }
      toast.success(`${confirmRow.email} removed.`);
      setConfirmRow(null);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlusIcon />
              Add admin
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Add an admin</DialogTitle>
                <DialogDescription>
                  We email them a temporary password and a sign-in link — you
                  never see or set it. They&apos;ll choose their own password on
                  first sign-in.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="a-email">Email</Label>
                  <Input
                    id="a-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="newadmin@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="a-name">Name (optional)</Label>
                  <Input
                    id="a-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                {currentRole === "root" && (
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={role}
                      onValueChange={(v) => setRole(v as "admin" | "root")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="root">Root</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="ghost">
                    Cancel
                  </Button>
                </DialogClose>
                <LoadingButton type="submit" loading={loading}>
                  Send invite
                </LoadingButton>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead className="hidden sm:table-cell">Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden md:table-cell">Added</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">
                  {a.email}
                  {a.id === currentId && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (you)
                    </span>
                  )}
                  {a.mustChangePassword && a.id !== currentId && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      Pending
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {a.name ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={a.role === "root" ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {a.role}
                  </Badge>
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                  {new Date(a.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell className="text-right">
                  {(() => {
                    const canResend =
                      a.id !== currentId &&
                      (currentRole === "root" ||
                        a.createdBy === currentEmail);
                    const canDelete =
                      currentRole === "root" && a.id !== currentId;
                    if (!canResend && !canDelete) {
                      return <span className="text-muted-foreground">—</span>;
                    }
                    return (
                      <div className="flex justify-end gap-1">
                        {canResend && (
                          <LoadingButton
                            variant="ghost"
                            size="icon-sm"
                            loading={resendingId === a.id}
                            onClick={() => handleResend(a)}
                            aria-label={`Resend invite to ${a.email}`}
                            title="Resend invite (new temporary password)"
                          >
                            <SendIcon />
                          </LoadingButton>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setConfirmRow(a)}
                            aria-label={`Remove ${a.email}`}
                          >
                            <Trash2Icon />
                          </Button>
                        )}
                      </div>
                    );
                  })()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!confirmRow}
        onOpenChange={(o) => {
          if (!o && !deleting) setConfirmRow(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this admin?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmRow?.email} will lose access immediately. This can&apos;t
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <LoadingButton
              variant="destructive"
              loading={deleting}
              onClick={confirmDelete}
            >
              Remove admin
            </LoadingButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
