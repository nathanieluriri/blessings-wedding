import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { adminsCollection } from "@/lib/collections";
import { getCurrentAdmin } from "@/lib/auth/current-admin";

// Updates preferences the signed-in admin controls for their own account.
// Currently: the per-admin email-notification gate (RSVP + test emails).
export async function PATCH(request: Request) {
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

  const value = (body as Record<string, unknown>)?.emailNotificationsEnabled;
  if (typeof value !== "boolean") {
    return NextResponse.json(
      { error: "emailNotificationsEnabled must be true or false." },
      { status: 400 }
    );
  }

  const col = await adminsCollection();
  await col.updateOne(
    { _id: new ObjectId(admin.id) },
    { $set: { emailNotificationsEnabled: value } }
  );

  return NextResponse.json({ ok: true, emailNotificationsEnabled: value });
}
