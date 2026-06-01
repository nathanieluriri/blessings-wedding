import type { Metadata } from "next";
import { rsvpsCollection } from "@/lib/collections";
import RsvpsTable, { type RsvpRow } from "./rsvps-table";

export const metadata: Metadata = { title: "RSVPs" };
export const dynamic = "force-dynamic";

export default async function RsvpsPage() {
  const col = await rsvpsCollection();
  const docs = await col.find().sort({ createdAt: -1 }).toArray();

  const rows: RsvpRow[] = docs.map((d) => ({
    id: d._id!.toHexString(),
    name: d.name,
    email: d.email,
    phone: d.phone,
    attending: d.attending,
    message: d.message,
    status: d.status,
    createdAt: d.createdAt.toISOString(),
    reviewedBy: d.reviewedBy,
    reviewedAt: d.reviewedAt?.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-[color:var(--primary)]">
          RSVPs
        </h1>
        <p className="text-sm text-muted-foreground">
          Review and triage guest responses.
        </p>
      </div>
      <RsvpsTable rows={rows} />
    </div>
  );
}
