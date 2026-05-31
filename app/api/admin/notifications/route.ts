import { NextResponse } from "next/server";
import { notificationSettingsCollection } from "@/lib/collections";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import {
  dedupeEmails,
  getAdminEmails,
  getNotificationSettings,
} from "@/lib/notifications";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [settings, adminEmails] = await Promise.all([
    getNotificationSettings(),
    getAdminEmails(),
  ]);

  return NextResponse.json({
    ...settings,
    adminEmails: dedupeEmails(adminEmails),
  });
}

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

  const data = (body ?? {}) as Record<string, unknown>;
  const newRsvpEnabled = data.newRsvpEnabled === true;
  const rawList = Array.isArray(data.extraRecipients)
    ? data.extraRecipients
    : [];
  const cleaned = dedupeEmails(
    rawList.filter((x): x is string => typeof x === "string")
  );

  const invalid = cleaned.find((e) => !EMAIL_RE.test(e));
  if (invalid) {
    return NextResponse.json(
      { error: `"${invalid}" is not a valid email address.` },
      { status: 400 }
    );
  }

  const col = await notificationSettingsCollection();
  await col.updateOne(
    { _id: "notifications" },
    {
      $set: {
        newRsvpEnabled,
        extraRecipients: cleaned,
        updatedAt: new Date(),
        updatedBy: admin.email,
      },
    },
    { upsert: true }
  );

  return NextResponse.json({ ok: true, newRsvpEnabled, extraRecipients: cleaned });
}
