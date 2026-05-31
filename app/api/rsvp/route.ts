import { NextResponse, after } from "next/server";
import { rsvpsCollection } from "@/lib/collections";
import { sendNewRsvpNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = (body ?? {}) as Record<string, unknown>;
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const email = typeof data.email === "string" ? data.email.trim() : "";
  const message = typeof data.message === "string" ? data.message.trim() : "";
  const attending = data.attending;

  if (name.length < 2) {
    return NextResponse.json(
      { error: "Please enter your full name." },
      { status: 400 }
    );
  }
  if (attending !== "yes" && attending !== "no") {
    return NextResponse.json(
      { error: "Please let us know if you'll attend." },
      { status: 400 }
    );
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "That email address looks off." },
      { status: 400 }
    );
  }

  try {
    const now = new Date();
    const col = await rsvpsCollection();
    await col.insertOne({
      name,
      email: email || undefined,
      attending,
      message: message || undefined,
      status: "new",
      createdAt: now,
      updatedAt: now,
    });

    // Notify admins after the response is sent — delivery must never block or
    // fail the guest's submission.
    after(() =>
      sendNewRsvpNotification({
        name,
        attending,
        email: email || undefined,
        message: message || undefined,
      })
    );

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("[rsvp] insert failed:", err);
    return NextResponse.json(
      { error: "Could not save your RSVP. Please try again." },
      { status: 500 }
    );
  }
}
