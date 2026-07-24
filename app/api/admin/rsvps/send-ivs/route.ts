import { NextResponse } from "next/server";
import { rsvpsCollection } from "@/lib/collections";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { sendIvEmail } from "@/lib/iv/send";

// One-shot backlog delivery: emails the IV to every accepted guest with an
// email address who hasn't received one yet. Sequential with a small delay —
// Resend allows 2 requests/second.
export async function POST() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const col = await rsvpsCollection();
  const targets = await col
    .find({ status: "accepted", ivSentAt: { $exists: false } })
    .toArray();

  let sent = 0;
  let failed = 0;
  let skippedNoEmail = 0;

  for (const doc of targets) {
    if (!doc.email) {
      skippedNoEmail++;
      continue;
    }
    const result = await sendIvEmail({
      _id: doc._id!,
      name: doc.name,
      email: doc.email,
      ivToken: doc.ivToken,
    });
    if (result.ok) sent++;
    else failed++;
    await new Promise((r) => setTimeout(r, 600));
  }

  return NextResponse.json({ sent, failed, skippedNoEmail });
}
