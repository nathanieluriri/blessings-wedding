import { NextResponse, after } from "next/server";
import { ObjectId } from "mongodb";
import { rsvpsCollection } from "@/lib/collections";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { canTransition, isRsvpStatus } from "@/lib/rsvp-status";
import { revokeIvs, sendIvEmail } from "@/lib/iv/send";

// Bulk actions for the selection checkboxes in the admin RSVPs table:
//   status     — move every selected row to one status (this is "approve in
//                bulk"; newly-accepted guests get their IV just like the
//                single-row PATCH does)
//   resend-iv  — re-deliver the IV to every selected guest, already-sent or not
//   delete-iv  — destroy the selected IVs (links die, rows go back in the pool)
export const maxDuration = 300; // Vercel function ceiling

// Resend allows 2 requests/second; one send takes ~1s, so a 600ms gap keeps a
// long run comfortably under the limit. Matches the backlog endpoint.
const SEND_GAP_MS = 600;
// Cap a single run so even a full selection finishes inside maxDuration.
// Progress persists per row, so the admin can simply run it again.
const MAX_SENDS_PER_RUN = 150;
// Selection cap — a guard against a malformed request, not a real workflow
// limit; ObjectId parsing on a huge array is the only cost here.
const MAX_IDS = 1000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { ids: rawIds, action, status } = (body ?? {}) as {
    ids?: unknown;
    action?: unknown;
    status?: unknown;
  };

  if (!Array.isArray(rawIds) || rawIds.length === 0) {
    return NextResponse.json({ error: "Nothing selected." }, { status: 400 });
  }
  if (rawIds.length > MAX_IDS) {
    return NextResponse.json({ error: "Too many rows." }, { status: 400 });
  }

  // Drop anything that isn't a valid ObjectId rather than failing the whole
  // batch — a stale row in the client's selection shouldn't block the rest.
  const ids: ObjectId[] = [];
  for (const raw of rawIds) {
    if (typeof raw !== "string") continue;
    try {
      ids.push(new ObjectId(raw));
    } catch {
      /* ignore */
    }
  }
  if (ids.length === 0) {
    return NextResponse.json({ error: "Nothing selected." }, { status: 400 });
  }

  const col = await rsvpsCollection();

  // ── Destroy IVs ─────────────────────────────────────────────────────────
  if (action === "delete-iv") {
    const removed = await revokeIvs(ids);
    return NextResponse.json({ ok: true, removed });
  }

  // ── Delete the responses themselves ─────────────────────────────────────
  // No soft-delete and no undo. Names are read first purely so the deletion
  // is auditable in the logs after the rows are gone.
  if (action === "delete-rsvp") {
    const doomed = await col
      .find({ _id: { $in: ids } })
      .project<{ name: string }>({ name: 1 })
      .toArray();
    const result = await col.deleteMany({ _id: { $in: ids } });
    if (result.deletedCount > 0) {
      console.warn(
        `[rsvp] ${admin.email} deleted ${result.deletedCount} RSVP(s): ` +
          doomed.map((d) => d.name).join(", ")
      );
    }
    return NextResponse.json({ ok: true, deleted: result.deletedCount });
  }

  // ── Resend IVs ──────────────────────────────────────────────────────────
  if (action === "resend-iv") {
    const docs = await col.find({ _id: { $in: ids } }).toArray();
    const batch = docs.slice(0, MAX_SENDS_PER_RUN);

    let sent = 0;
    let failed = 0;
    let skippedNoEmail = 0;

    for (let i = 0; i < batch.length; i++) {
      const doc = batch[i];
      if (!doc.email) {
        skippedNoEmail++;
        continue;
      }
      const result = await sendIvEmail(
        { _id: doc._id!, name: doc.name, email: doc.email, ivToken: doc.ivToken },
        { force: true }
      );
      if (result.ok) sent++;
      else failed++;
      if (i < batch.length - 1) await sleep(SEND_GAP_MS);
    }

    return NextResponse.json({
      ok: true,
      sent,
      failed,
      skippedNoEmail,
      notAttempted: docs.length - batch.length,
    });
  }

  // ── Change status ───────────────────────────────────────────────────────
  if (action !== "status") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
  if (!isRsvpStatus(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const docs = await col.find({ _id: { $in: ids } }).toArray();
  const now = new Date();

  // Rows already in the target status are a no-op, not a failure; rows the
  // state machine forbids are reported so the admin knows they were left alone.
  const movable = docs.filter(
    (d) => d.status !== status && canTransition(d.status, status)
  );
  const unchanged = docs.filter((d) => d.status === status).length;
  const blocked = docs.length - movable.length - unchanged;

  if (movable.length > 0) {
    await col.updateMany(
      { _id: { $in: movable.map((d) => d._id!) } },
      {
        $set: {
          status,
          updatedAt: now,
          reviewedBy: admin.email,
          reviewedAt: now,
        },
      }
    );
  }

  // Newly-accepted guests get their IV, exactly like the single-row PATCH.
  // after() so email latency never delays the admin's response, and spaced
  // sequentially so a big approval run doesn't trip Resend's rate limit.
  // sendIvEmail's own ivSentAt guard makes a double-send impossible.
  const toMail = movable
    .filter((d) => status === "accepted" && d.email && !d.ivSentAt)
    .slice(0, MAX_SENDS_PER_RUN);

  if (toMail.length > 0) {
    after(async () => {
      for (let i = 0; i < toMail.length; i++) {
        const doc = toMail[i];
        await sendIvEmail({
          _id: doc._id!,
          name: doc.name,
          email: doc.email!,
          ivToken: doc.ivToken,
        });
        if (i < toMail.length - 1) await sleep(SEND_GAP_MS);
      }
    });
  }

  return NextResponse.json({
    ok: true,
    updated: movable.length,
    unchanged,
    blocked,
    queuedIvs: toMail.length,
  });
}
