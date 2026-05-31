import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { settingsCollection } from "@/lib/collections";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { WEDDING_SETTINGS_TAG } from "@/lib/settings";

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

  const fields = body as Record<string, unknown>;

  const raw = fields?.weddingDate;
  if (typeof raw !== "string") {
    return NextResponse.json(
      { error: "A wedding date is required." },
      { status: 400 }
    );
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return NextResponse.json(
      { error: "That date is invalid." },
      { status: 400 }
    );
  }

  // RSVP deadline is optional; validated only when supplied.
  const rawDeadline = fields?.rsvpDeadline;
  let deadline: Date | undefined;
  if (rawDeadline !== undefined && rawDeadline !== null && rawDeadline !== "") {
    if (typeof rawDeadline !== "string") {
      return NextResponse.json(
        { error: "That RSVP deadline is invalid." },
        { status: 400 }
      );
    }
    deadline = new Date(rawDeadline);
    if (Number.isNaN(deadline.getTime())) {
      return NextResponse.json(
        { error: "That RSVP deadline is invalid." },
        { status: 400 }
      );
    }
  }

  const col = await settingsCollection();
  await col.updateOne(
    { _id: "global" },
    {
      $set: {
        weddingDate: date.toISOString(),
        ...(deadline ? { rsvpDeadline: deadline.toISOString() } : {}),
        updatedAt: new Date(),
        updatedBy: admin.email,
      },
    },
    { upsert: true }
  );

  revalidateTag(WEDDING_SETTINGS_TAG, "max");

  return NextResponse.json({
    ok: true,
    weddingDate: date.toISOString(),
    ...(deadline ? { rsvpDeadline: deadline.toISOString() } : {}),
  });
}
