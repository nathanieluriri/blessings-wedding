import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { finalizeUpload } from "@/lib/music/store";
import { MUSIC_TAG } from "@/lib/music/read";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Assemble the staged chunks into GridFS and create the song. */
export async function POST(request: Request) {
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

  const uploadId = typeof body.uploadId === "string" ? body.uploadId : "";
  if (!uploadId) {
    return NextResponse.json({ error: "Missing upload id." }, { status: 400 });
  }

  const result = await finalizeUpload(uploadId, admin.email);
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Upload failed." }, { status: 400 });
  }

  revalidateTag(MUSIC_TAG, "max");
  return NextResponse.json({ ok: true, song: result.song });
}
