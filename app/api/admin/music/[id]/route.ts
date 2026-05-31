import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import { deleteSong, updateSongSettings } from "@/lib/music/store";
import { MUSIC_TAG } from "@/lib/music/read";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Update a song's trim / volume / loop settings. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const song = await updateSongSettings(id, {
    trimStart: body.trimStart,
    trimEnd: body.trimEnd,
    volume: body.volume,
    loop: body.loop,
  });
  if (!song) {
    return NextResponse.json({ error: "Song not found." }, { status: 404 });
  }

  revalidateTag(MUSIC_TAG, "max");
  return NextResponse.json({ ok: true, song });
}

/** Remove a song (GridFS bytes + metadata + active pointer if held). */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const ok = await deleteSong(id);
  if (!ok) {
    return NextResponse.json({ error: "Song not found." }, { status: 404 });
  }

  revalidateTag(MUSIC_TAG, "max");
  return NextResponse.json({ ok: true });
}
