import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { setActiveSong } from "@/lib/music/store";
import { MUSIC_TAG } from "@/lib/music/read";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Choose the active background song (or clear it with songId: null). */
export async function PATCH(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const raw = body.songId;
  if (raw !== null && typeof raw !== "string") {
    return NextResponse.json({ error: "Invalid song id." }, { status: 400 });
  }

  const ok = await setActiveSong(raw, admin.email);
  if (!ok) {
    return NextResponse.json({ error: "Song not found." }, { status: 404 });
  }

  revalidateTag(MUSIC_TAG, "max");
  return NextResponse.json({ ok: true });
}
