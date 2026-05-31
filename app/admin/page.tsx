import Link from "next/link";
import { CalendarHeartIcon, CheckCircle2Icon, XCircleIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { rsvpsCollection } from "@/lib/collections";
import { getWeddingDate, formatLongDate } from "@/lib/settings";
import {
  RSVP_STATUSES,
  STATUS_COLOR,
  STATUS_META,
  type RsvpStatus,
} from "@/lib/rsvp-status";
import StatusBadge from "./rsvps/status-badge";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const col = await rsvpsCollection();

  const [statusAgg, attendingAgg, total, recent, weddingDate] =
    await Promise.all([
      col
        .aggregate<{ _id: RsvpStatus; count: number }>([
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ])
        .toArray(),
      col
        .aggregate<{ _id: "yes" | "no"; count: number }>([
          { $group: { _id: "$attending", count: { $sum: 1 } } },
        ])
        .toArray(),
      col.countDocuments(),
      col.find().sort({ createdAt: -1 }).limit(6).toArray(),
      getWeddingDate(),
    ]);

  const statusCounts = Object.fromEntries(
    statusAgg.map((s) => [s._id, s.count])
  ) as Record<RsvpStatus, number>;
  const attending = Object.fromEntries(
    attendingAgg.map((a) => [a._id, a.count])
  ) as Record<"yes" | "no", number>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-[color:var(--primary)]">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Overview of RSVPs and the big day.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total RSVPs</CardDescription>
            <CardTitle className="text-3xl">{total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <CheckCircle2Icon className="size-4 text-[color:var(--primary)]" />
              Attending
            </CardDescription>
            <CardTitle className="text-3xl">{attending.yes ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <XCircleIcon className="size-4 text-muted-foreground" />
              Can&apos;t make it
            </CardDescription>
            <CardTitle className="text-3xl">{attending.no ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1.5">
              <CalendarHeartIcon className="size-4 text-[color:var(--primary)]" />
              Wedding date
            </CardDescription>
            <CardTitle className="text-lg leading-tight">
              {formatLongDate(weddingDate)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Status breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">By status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {RSVP_STATUSES.map((s) => (
            <Badge
              key={s}
              variant="outline"
              className="gap-1.5 px-3 py-1 text-sm"
            >
              <span
                className={cn("size-2 rounded-full", STATUS_COLOR[s].dot)}
                aria-hidden
              />
              {STATUS_META[s].label}
              <span className="font-semibold">{statusCounts[s] ?? 0}</span>
            </Badge>
          ))}
        </CardContent>
      </Card>

      {/* Recent submissions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent RSVPs</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin/rsvps">View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {recent.length === 0 && (
            <p className="text-sm text-muted-foreground">No RSVPs yet.</p>
          )}
          {recent.map((r) => (
            <div
              key={r._id!.toHexString()}
              className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{r.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {r.attending === "yes" ? "Attending" : "Not attending"}
                  {r.email ? ` · ${r.email}` : ""}
                </div>
              </div>
              <StatusBadge status={r.status} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
