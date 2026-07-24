import { NextResponse, after } from "next/server";
import { ObjectId } from "mongodb";
import { rsvpsCollection } from "@/lib/collections";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { canTransition, isRsvpStatus } from "@/lib/rsvp-status";
import { sendIvEmail } from "@/lib/iv/send";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let _id: ObjectId;
  try {
    _id = new ObjectId(id);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const next = (body as Record<string, unknown>)?.status;
  if (!isRsvpStatus(next)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const col = await rsvpsCollection();
  const doc = await col.findOne({ _id });
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (doc.status === next) {
    return NextResponse.json({ ok: true, status: next });
  }

  if (!canTransition(doc.status, next)) {
    return NextResponse.json(
      { error: `Cannot move from "${doc.status}" to "${next}".` },
      { status: 409 }
    );
  }

  await col.updateOne(
    { _id },
    {
      $set: {
        status: next,
        updatedAt: new Date(),
        reviewedBy: admin.email,
        reviewedAt: new Date(),
      },
    }
  );

  // First time a guest is accepted, deliver their IV. after() so email
  // latency/failure never blocks or fails the status change; sendIvEmail
  // checks are duplicated here so we don't even schedule a no-op.
  if (next === "accepted" && doc.email && !doc.ivSentAt) {
    const { email } = doc;
    after(() =>
      sendIvEmail({
        _id: doc._id!,
        name: doc.name,
        email,
        ivToken: doc.ivToken,
      })
    );
  }

  return NextResponse.json({ ok: true, status: next });
}
