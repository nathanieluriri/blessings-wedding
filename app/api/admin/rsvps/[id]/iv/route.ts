import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { rsvpsCollection } from "@/lib/collections";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { revokeIvs, sendIvEmail } from "@/lib/iv/send";

// Per-guest IV controls for the admin RSVPs table:
//   POST   — resend the IV email, even if the guest already received one
//   DELETE — destroy the IV: the token dies (their link stops working) and the
//            row re-enters the "not sent" pool
//
// Both are deliberate admin actions on a single row, so unlike the auto-send
// path they answer synchronously — the table needs the outcome for its toast.

async function resolve(id: string) {
  let _id: ObjectId;
  try {
    _id = new ObjectId(id);
  } catch {
    return null;
  }
  const col = await rsvpsCollection();
  const doc = await col.findOne({ _id });
  return doc ? { doc, _id } : null;
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const found = await resolve(id);
  if (!found) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { doc } = found;
  if (!doc.email) {
    return NextResponse.json(
      { error: "This guest has no email address." },
      { status: 422 }
    );
  }

  const result = await sendIvEmail(
    { _id: doc._id!, name: doc.name, email: doc.email, ivToken: doc.ivToken },
    { force: true }
  );
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Send failed." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, email: doc.email });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const found = await resolve(id);
  if (!found) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const removed = await revokeIvs([found._id]);
  return NextResponse.json({ ok: true, removed });
}
