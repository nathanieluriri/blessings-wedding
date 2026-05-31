"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { MoreHorizontalIcon, MailIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  attending: "yes" | "no";
  message?: string;
  status: RsvpStatus;
  createdAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
}

const FILTERS: ("all" | RsvpStatus)[] = ["all", ...RSVP_STATUSES];

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Shared row/card action menu. Used by both the desktop table and the mobile
// card list so transitions + "View details" stay identical everywhere. On
// mobile the menu opens full-width with large (touch-friendly) hit areas.
function RowActions({
  row,
  pending,
  onUpdate,
  onView,
}: {
  row: RsvpRow;
  pending: boolean;
  onUpdate: (row: RsvpRow, next: RsvpStatus) => void;
  onView: (row: RsvpRow) => void;
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

  return (
    <div className="space-y-4">
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1 rounded-xl border border-stone-200 bg-stone-100 p-1.5 dark:border-stone-700 dark:bg-stone-800/60">
          {FILTERS.map((f) => {
            const color = f === "all" ? ALL_FILTER_COLOR : STATUS_COLOR[f];
            const active = filter === f;
            return (
              <TabsTrigger
                key={f}
                value={f}
                className={cn(
                  "min-h-10 flex-1 gap-2 rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition-colors sm:flex-initial sm:px-3.5",
                  "hover:bg-stone-200/70 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-700/60 dark:hover:text-stone-100",
                  "data-[state=active]:bg-stone-700 data-[state=active]:font-semibold data-[state=active]:text-white data-[state=active]:shadow-sm",
                  "dark:data-[state=active]:bg-stone-200 dark:data-[state=active]:text-stone-900"
                )}
              >
                <span
                  className={cn("size-2 shrink-0 rounded-full", color.dot)}
                  aria-hidden
                />
                {f === "all" ? "All" : STATUS_META[f].label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-xs tabular-nums",
                    active
                      ? "bg-white/20 text-white dark:bg-black/10 dark:text-stone-900"
                      : "bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300"
                  )}
                >
                  {counts[f] ?? 0}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {/* Mobile (< md): stacked card list */}
      <div className="space-y-3 md:hidden">
        {visible.length === 0 && (
          <div className="rounded-lg border bg-card py-10 text-center text-muted-foreground">
            No RSVPs in this view.
          </div>
        )}
        {visible.map((row) => (
          <div
            key={row.id}
            className="rounded-lg border bg-card p-4 shadow-xs"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <button
                  className="block max-w-full truncate text-left font-medium hover:underline"
                  onClick={() => setDetail(row)}
                >
                  {row.name}
                </button>
                <div className="mt-1">
                  <StatusBadge status={row.status} />
                </div>
              </div>
              <RowActions
                row={row}
                pending={pendingId === row.id}
                onUpdate={updateStatus}
                onView={setDetail}
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
              <TableHead>Name</TableHead>
              <TableHead>Attending</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden lg:table-cell">Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-10 text-center text-muted-foreground"
                >
                  No RSVPs in this view.
                </TableCell>
              </TableRow>
            )}
            {visible.map((row) => (
              <TableRow key={row.id}>
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
                  {row.email ? (
                    <a
                      href={`mailto:${row.email}`}
                      className="inline-flex items-center gap-1 text-sm hover:underline"
                    >
                      <MailIcon className="size-3.5" />
                      {row.email}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                  {formatWhen(row.createdAt)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={row.status} />
                </TableCell>
                <TableCell className="text-right">
                  <RowActions
                    row={row}
                    pending={pendingId === row.id}
                    onUpdate={updateStatus}
                    onView={setDetail}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
                  <dt className="text-muted-foreground">Message</dt>
                  <dd className="whitespace-pre-wrap">
                    {detail.message ? detail.message : "—"}
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
              <DialogFooter>
                <DialogClose asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 w-full sm:h-9 sm:w-auto"
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
