"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  MoreHorizontalIcon,
  MailIcon,
  PhoneIcon,
  Loader2Icon,
  SendIcon,
  Trash2Icon,
  CheckCheckIcon,
  XIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import StatusBadge from "./status-badge";
import {
  ALL_FILTER_COLOR,
  RSVP_STATUSES,
  STATUS_COLOR,
  STATUS_META,
  TRANSITIONS,
  type RsvpStatus,
} from "@/lib/rsvp-status";

export interface RsvpRow {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  attending: "yes" | "no";
  message?: string;
  status: RsvpStatus;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  ivSentAt?: string;
  hasIv: boolean;
}

const FILTERS: ("all" | RsvpStatus)[] = ["all", ...RSVP_STATUSES];

// What the confirm dialogs are about to do. Single-row actions from the row
// menu and multi-row actions from the selection bar share these, so the copy
// and the execution path stay in one place.
type Confirm =
  | { kind: "resend"; rows: RsvpRow[] }
  | { kind: "delete-iv"; rows: RsvpRow[] }
  | { kind: "status"; rows: RsvpRow[]; status: RsvpStatus };

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}

// Shared row/card action menu. Used by both the desktop table and the mobile
// card list so transitions, the IV actions and "View details" stay identical
// everywhere. On mobile the menu opens full-width with large (touch-friendly)
// hit areas.
function RowActions({
  row,
  pending,
  onUpdate,
  onView,
  onConfirm,
}: {
  row: RsvpRow;
  pending: boolean;
  onUpdate: (row: RsvpRow, next: RsvpStatus) => void;
  onView: (row: RsvpRow) => void;
  onConfirm: (confirm: Confirm) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-10 shrink-0 md:size-8"
          disabled={pending}
          aria-label={`Actions for ${row.name}`}
        >
          {pending ? (
            <Loader2Icon className="animate-spin" aria-hidden />
          ) : (
            <MoreHorizontalIcon aria-hidden />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[calc(100vw-2rem)] max-w-xs sm:w-56 md:w-auto md:max-w-none"
      >
        <DropdownMenuLabel>Set status</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {TRANSITIONS[row.status].map((next) => (
          <DropdownMenuItem
            key={next}
            disabled={pending}
            className="min-h-10 md:min-h-0"
            onClick={() => onUpdate(row, next)}
          >
            <span
              className={cn("size-2 rounded-full", STATUS_COLOR[next].dot)}
              aria-hidden
            />
            {STATUS_META[next].label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Invitation</DropdownMenuLabel>
        <DropdownMenuItem
          disabled={pending || !row.email}
          className="min-h-10 md:min-h-0"
          onClick={() => onConfirm({ kind: "resend", rows: [row] })}
        >
          <SendIcon aria-hidden />
          {row.ivSentAt ? "Resend IV" : "Send IV"}
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          disabled={pending || !row.hasIv}
          className="min-h-10 md:min-h-0"
          onClick={() => onConfirm({ kind: "delete-iv", rows: [row] })}
        >
          <Trash2Icon aria-hidden />
          Delete IV
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="min-h-10 md:min-h-0"
          onClick={() => onView(row)}
        >
          View details
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function RsvpsTable({ rows }: { rows: RsvpRow[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | RsvpStatus>("all");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [detail, setDetail] = useState<RsvpRow | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Radix keeps a dialog mounted through its close animation, so clearing
  // `confirm` on close would flash "Delete 0 invitations?" on the way out.
  // Open/closed is its own flag; `confirm` just keeps describing the last
  // action, which is all the copy needs.
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [running, setRunning] = useState(false);

  function openConfirm(next: Confirm) {
    setConfirm(next);
    setConfirmOpen(true);
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    for (const s of RSVP_STATUSES) c[s] = 0;
    for (const r of rows) c[r.status] = (c[r.status] ?? 0) + 1;
    return c;
  }, [rows]);

  const visible = useMemo(
    () => (filter === "all" ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter]
  );

  // Derive from `rows` rather than trusting the id set: after a refresh a
  // selected row may be gone, and a stale id must not reach the server.
  const selectedRows = useMemo(
    () => rows.filter((r) => selectedIds.has(r.id)),
    [rows, selectedIds]
  );

  const allVisibleSelected =
    visible.length > 0 && visible.every((r) => selectedIds.has(r.id));
  const someVisibleSelected =
    !allVisibleSelected && visible.some((r) => selectedIds.has(r.id));

  function toggleRow(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  // Header checkbox only ever touches what's on screen, so a filtered view
  // can't silently sweep rows the admin can't see.
  function toggleAllVisible(checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const r of visible) {
        if (checked) next.add(r.id);
        else next.delete(r.id);
      }
      return next;
    });
  }

  async function updateStatus(row: RsvpRow, next: RsvpStatus) {
    setPendingId(row.id);
    try {
      const res = await fetch(`/api/admin/rsvps/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Update failed.");
        return;
      }
      toast.success(`${row.name} → ${STATUS_META[next].label}`);
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  // The details dialog and the confirm dialogs are siblings, so the first has
  // to close before the second opens — two stacked modals fight over the focus
  // trap and the confirm ends up unreachable.
  function openConfirmFromDetail(kind: "resend" | "delete-iv", row: RsvpRow) {
    setDetail(null);
    openConfirm({ kind, rows: [row] });
  }

  // Runs whatever the open confirm dialog describes. A single row goes to the
  // per-guest endpoint (it can answer precisely, e.g. "no email address");
  // anything larger goes to the bulk endpoint, which paces sends for Resend's
  // rate limit.
  async function runConfirmed() {
    if (!confirm) return;
    const { kind, rows: targets } = confirm;
    const ids = targets.map((r) => r.id);
    if (ids.length === 0) {
      setConfirmOpen(false);
      return;
    }

    setRunning(true);
    try {
      let res: Response;
      if (kind !== "status" && ids.length === 1) {
        res = await fetch(`/api/admin/rsvps/${ids[0]}/iv`, {
          method: kind === "resend" ? "POST" : "DELETE",
        });
      } else {
        res = await fetch("/api/admin/rsvps/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            kind === "status"
              ? { ids, action: "status", status: confirm.status }
              : { ids, action: kind }
          ),
        });
      }

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "That didn't work.");
        return;
      }

      toast.success(summarize(confirm, data));
      setSelectedIds(new Set());
      setConfirmOpen(false);
      router.refresh();
    } finally {
      setRunning(false);
    }
  }

  function summarize(c: Confirm, data: Record<string, unknown>): string {
    const n = c.rows.length;
    if (c.kind === "resend") {
      if (n === 1) return `Invitation resent to ${c.rows[0].name}.`;
      const parts = [`${data.sent ?? 0} sent`];
      if (data.failed) parts.push(`${data.failed} failed`);
      if (data.skippedNoEmail)
        parts.push(`${data.skippedNoEmail} without email`);
      if (data.notAttempted) parts.push(`${data.notAttempted} not attempted`);
      return `Resend: ${parts.join(", ")}.`;
    }
    if (c.kind === "delete-iv") {
      const removed = Number(data.removed ?? 0);
      return n === 1
        ? `${c.rows[0].name}'s IV deleted.`
        : `Deleted ${plural(removed, "invitation")}.`;
    }
    const parts = [`${data.updated ?? 0} updated`];
    if (data.unchanged) parts.push(`${data.unchanged} already there`);
    if (data.blocked) parts.push(`${data.blocked} not allowed`);
    if (data.queuedIvs) parts.push(`${data.queuedIvs} IVs sending`);
    return `${STATUS_META[c.status].label}: ${parts.join(", ")}.`;
  }

  const selectionCount = selectedRows.length;

  return (
    <div className="space-y-4">
      {/* Status filter pills. Wrapping flex on every breakpoint so all six are
          always visible (no off-screen scroll) and each pill sizes to its label.
          Themed to the burgundy / cream / gold palette: active pill is filled
          burgundy with a gold ring; its count sits in a gold chip with burgundy
          text so it stays readable. `!` overrides shadcn's base active styles
          (which would otherwise force a light `bg-background`). */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-none bg-transparent p-0">
          {FILTERS.map((f) => {
            const color = f === "all" ? ALL_FILTER_COLOR : STATUS_COLOR[f];
            const active = filter === f;
            return (
              <TabsTrigger
                key={f}
                value={f}
                className={cn(
                  // h-auto! overrides shadcn's base h-[calc(100%-1px)]; without it
                  // a wrapped (two-row) list stretches each pill to the full list
                  // height, so rows overlap the section below.
                  "h-auto! flex-none gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                  "border-border! bg-card! text-muted-foreground!",
                  "hover:border-primary/40 hover:text-foreground!",
                  "data-[state=active]:border-(--gold)! data-[state=active]:bg-primary! data-[state=active]:font-semibold data-[state=active]:text-primary-foreground! data-[state=active]:shadow-sm"
                )}
              >
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    color.dot,
                    active && "ring-1 ring-inset ring-white/60"
                  )}
                  aria-hidden
                />
                {f === "all" ? "All" : STATUS_META[f].label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums",
                    active
                      ? "bg-(--gold) text-primary"
                      : "bg-foreground/10 text-foreground"
                  )}
                >
                  {counts[f] ?? 0}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Selection action bar. Sticks under the admin header so it stays
          reachable while scrolling a long list. */}
      {selectionCount > 0 && (
        <div className="sticky top-2 z-20 flex flex-wrap items-center gap-2 rounded-lg border border-(--gold) bg-card p-3 shadow-md">
          <span className="mr-auto text-sm font-medium tabular-nums">
            {plural(selectionCount, "row")} selected
          </span>
          <Button
            size="sm"
            disabled={running}
            onClick={() =>
              openConfirm({
                kind: "status",
                rows: selectedRows,
                status: "accepted",
              })
            }
          >
            <CheckCheckIcon aria-hidden />
            Approve
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" disabled={running}>
                Set status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {RSVP_STATUSES.filter((s) => s !== "new" && s !== "accepted").map(
                (s) => (
                  <DropdownMenuItem
                    key={s}
                    onClick={() =>
                      openConfirm({
                        kind: "status",
                        rows: selectedRows,
                        status: s,
                      })
                    }
                  >
                    <span
                      className={cn("size-2 rounded-full", STATUS_COLOR[s].dot)}
                      aria-hidden
                    />
                    {STATUS_META[s].label}
                  </DropdownMenuItem>
                )
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            size="sm"
            variant="outline"
            disabled={running}
            onClick={() => openConfirm({ kind: "resend", rows: selectedRows })}
          >
            <SendIcon aria-hidden />
            Resend IV
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={running}
            onClick={() =>
              openConfirm({ kind: "delete-iv", rows: selectedRows })
            }
          >
            <Trash2Icon aria-hidden />
            Delete IV
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={running}
            onClick={() => setSelectedIds(new Set())}
            aria-label="Clear selection"
          >
            <XIcon aria-hidden />
            Clear
          </Button>
        </div>
      )}

      {/* Mobile (< md): stacked card list */}
      <div className="space-y-3 md:hidden">
        {visible.length > 0 && (
          <label className="flex items-center gap-2.5 px-1 text-sm text-muted-foreground">
            <Checkbox
              checked={
                allVisibleSelected
                  ? true
                  : someVisibleSelected
                    ? "indeterminate"
                    : false
              }
              onCheckedChange={(c) => toggleAllVisible(c === true)}
              aria-label="Select all shown"
            />
            Select all shown
          </label>
        )}
        {visible.length === 0 && (
          <div className="rounded-lg border bg-card py-10 text-center text-muted-foreground">
            No RSVPs in this view.
          </div>
        )}
        {visible.map((row) => (
          <div
            key={row.id}
            className={cn(
              "rounded-lg border bg-card p-4 shadow-xs",
              selectedIds.has(row.id) && "border-(--gold) ring-1 ring-(--gold)"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <Checkbox
                checked={selectedIds.has(row.id)}
                onCheckedChange={(c) => toggleRow(row.id, c === true)}
                className="mt-1"
                aria-label={`Select ${row.name}`}
              />
              <div className="min-w-0 flex-1">
                <button
                  className="block max-w-full truncate text-left font-medium hover:underline"
                  onClick={() => setDetail(row)}
                >
                  {row.name}
                </button>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <StatusBadge status={row.status} />
                  {row.ivSentAt ? (
                    <span className="text-xs text-muted-foreground">
                      IV sent
                    </span>
                  ) : row.status === "accepted" && !row.email ? (
                    <span className="text-xs text-amber-600">No email</span>
                  ) : null}
                </div>
              </div>
              <RowActions
                row={row}
                pending={pendingId === row.id}
                onUpdate={updateStatus}
                onView={setDetail}
                onConfirm={openConfirm}
              />
            </div>

            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">Attending</dt>
                <dd>
                  {row.attending === "yes" ? (
                    <span className="text-primary">Yes</span>
                  ) : (
                    <span className="text-muted-foreground">No</span>
                  )}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="shrink-0 text-muted-foreground">Email</dt>
                <dd className="min-w-0 text-right">
                  {row.email ? (
                    <a
                      href={`mailto:${row.email}`}
                      className="inline-flex max-w-full items-center gap-1 hover:underline"
                    >
                      <MailIcon className="size-3.5 shrink-0" />
                      <span className="truncate">{row.email}</span>
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="shrink-0 text-muted-foreground">Phone</dt>
                <dd className="min-w-0 text-right">
                  {row.phone ? (
                    <a
                      href={`tel:${row.phone.replace(/\s+/g, "")}`}
                      className="inline-flex max-w-full items-center gap-1 hover:underline"
                    >
                      <PhoneIcon className="size-3.5 shrink-0" />
                      <span className="truncate">{row.phone}</span>
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="shrink-0 text-muted-foreground">Submitted</dt>
                <dd className="text-right text-muted-foreground">
                  {formatWhen(row.createdAt)}
                </dd>
              </div>
              {row.message && (
                <div>
                  <dt className="text-muted-foreground">Message</dt>
                  <dd className="mt-0.5 line-clamp-3 text-muted-foreground">
                    “{row.message}”
                  </dd>
                </div>
              )}
            </dl>
          </div>
        ))}
      </div>

      {/* Desktop (md+): full table */}
      <div className="hidden rounded-lg border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={
                    allVisibleSelected
                      ? true
                      : someVisibleSelected
                        ? "indeterminate"
                        : false
                  }
                  onCheckedChange={(c) => toggleAllVisible(c === true)}
                  disabled={visible.length === 0}
                  aria-label="Select all shown"
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Attending</TableHead>
              <TableHead className="hidden md:table-cell">Contact</TableHead>
              <TableHead className="hidden lg:table-cell">Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="py-10 text-center text-muted-foreground"
                >
                  No RSVPs in this view.
                </TableCell>
              </TableRow>
            )}
            {visible.map((row) => (
              <TableRow
                key={row.id}
                data-state={selectedIds.has(row.id) ? "selected" : undefined}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(row.id)}
                    onCheckedChange={(c) => toggleRow(row.id, c === true)}
                    aria-label={`Select ${row.name}`}
                  />
                </TableCell>
                <TableCell>
                  <button
                    className="text-left font-medium hover:underline"
                    onClick={() => setDetail(row)}
                  >
                    {row.name}
                  </button>
                  {row.message && (
                    <div className="max-w-[28ch] truncate text-xs text-muted-foreground">
                      “{row.message}”
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {row.attending === "yes" ? (
                    <span className="text-primary">Yes</span>
                  ) : (
                    <span className="text-muted-foreground">No</span>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {row.email || row.phone ? (
                    <div className="flex flex-col gap-1 text-sm">
                      {row.email && (
                        <a
                          href={`mailto:${row.email}`}
                          className="inline-flex items-center gap-1 hover:underline"
                        >
                          <MailIcon className="size-3.5 shrink-0" />
                          {row.email}
                        </a>
                      )}
                      {row.phone && (
                        <a
                          href={`tel:${row.phone.replace(/\s+/g, "")}`}
                          className="inline-flex items-center gap-1 hover:underline"
                        >
                          <PhoneIcon className="size-3.5 shrink-0" />
                          {row.phone}
                        </a>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                  {formatWhen(row.createdAt)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                  {row.ivSentAt ? (
                    <div className="mt-1 text-xs text-muted-foreground">
                      IV sent {formatWhen(row.ivSentAt)}
                    </div>
                  ) : row.status === "accepted" && !row.email ? (
                    <div className="mt-1 text-xs text-amber-600">
                      No email — can&rsquo;t send IV
                    </div>
                  ) : null}
                </TableCell>
                <TableCell className="text-right">
                  <RowActions
                    row={row}
                    pending={pendingId === row.id}
                    onUpdate={updateStatus}
                    onView={setDetail}
                    onConfirm={openConfirm}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Resend / bulk status confirm. Both put mail in real inboxes, so they
          always ask first. */}
      <Dialog
        open={confirmOpen && confirm?.kind !== "delete-iv"}
        onOpenChange={(o) => {
          if (!o && !running) setConfirmOpen(false);
        }}
      >
        <DialogContent>
          {confirm && confirm.kind !== "delete-iv" && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {confirm.kind === "resend"
                    ? confirm.rows.length === 1
                      ? `Send the IV to ${confirm.rows[0].name}?`
                      : `Resend ${plural(confirm.rows.length, "invitation")}?`
                    : `Move ${plural(confirm.rows.length, "row")} to ${
                        STATUS_META[confirm.status].label
                      }?`}
                </DialogTitle>
                <DialogDescription>
                  {confirm.kind === "resend" ? (
                    <>
                      The invitation email goes out again, even to guests who
                      already received one.
                      {countWithoutEmail(confirm.rows) > 0 && (
                        <>
                          {" "}
                          {plural(
                            countWithoutEmail(confirm.rows),
                            "selected guest has",
                            "selected guests have"
                          )}{" "}
                          no email address and will be skipped.
                        </>
                      )}
                    </>
                  ) : confirm.status === "accepted" ? (
                    <>
                      Approving sends each newly-accepted guest their invitation
                      automatically. Guests who already have one are never
                      emailed twice. Rows the status rules don&rsquo;t allow are
                      left untouched.
                    </>
                  ) : (
                    <>
                      No email is sent. Rows the status rules don&rsquo;t allow
                      are left untouched.
                    </>
                  )}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost" disabled={running}>
                    Cancel
                  </Button>
                </DialogClose>
                <LoadingButton loading={running} onClick={runConfirmed}>
                  {confirm.kind === "resend" ? "Send now" : "Apply"}
                </LoadingButton>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Deleting an IV invalidates a link that may already be in a guest's
          inbox, so it gets the destructive treatment. */}
      <AlertDialog
        open={confirmOpen && confirm?.kind === "delete-iv"}
        onOpenChange={(o) => {
          if (!o && !running) setConfirmOpen(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.rows.length === 1
                ? `Delete ${confirm.rows[0].name}'s IV?`
                : `Delete ${plural(confirm?.rows.length ?? 0, "invitation")}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Their existing invitation link stops working immediately, and any
              copy already in their inbox will no longer open. They go back into
              the &ldquo;not sent&rdquo; pool, so sending again mints a brand-new
              link. This can&rsquo;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={running}>Cancel</AlertDialogCancel>
            <LoadingButton
              variant="destructive"
              loading={running}
              onClick={runConfirmed}
            >
              Delete
            </LoadingButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          {detail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2">
                  <span className="wrap-break-word">{detail.name}</span>
                  <StatusBadge status={detail.status} />
                </DialogTitle>
                <DialogDescription>
                  Submitted {formatWhen(detail.createdAt)}
                </DialogDescription>
              </DialogHeader>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Attending</dt>
                  <dd>{detail.attending === "yes" ? "Yes" : "No"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="wrap-break-word">{detail.email ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd className="wrap-break-word">{detail.phone ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Message</dt>
                  <dd className="whitespace-pre-wrap">
                    {detail.message ? detail.message : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">IV</dt>
                  <dd>
                    {detail.ivSentAt
                      ? `Sent ${formatWhen(detail.ivSentAt)}`
                      : detail.hasIv
                        ? "Link created, not sent"
                        : "Not sent"}
                  </dd>
                </div>
                {detail.reviewedBy && (
                  <div>
                    <dt className="text-muted-foreground">Last reviewed by</dt>
                    <dd>
                      {detail.reviewedBy}
                      {detail.reviewedAt
                        ? ` · ${formatWhen(detail.reviewedAt)}`
                        : ""}
                    </dd>
                  </div>
                )}
              </dl>
              <DialogFooter className="gap-2 sm:justify-between">
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 sm:h-9"
                    disabled={!detail.email}
                    onClick={() => openConfirmFromDetail("resend", detail)}
                  >
                    <SendIcon aria-hidden />
                    {detail.ivSentAt ? "Resend IV" : "Send IV"}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="h-11 sm:h-9"
                    disabled={!detail.hasIv}
                    onClick={() => openConfirmFromDetail("delete-iv", detail)}
                  >
                    <Trash2Icon aria-hidden />
                    Delete IV
                  </Button>
                </div>
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 sm:h-9"
                  >
                    Close
                  </Button>
                </DialogClose>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function countWithoutEmail(rows: RsvpRow[]) {
  return rows.filter((r) => !r.email).length;
}
