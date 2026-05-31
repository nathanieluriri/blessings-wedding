import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import {
  audioUploadsCollection,
  songsCollection,
} from "@/lib/collections";
import {
  MAX_FILE_BYTES,
  MAX_SONGS,
  UPLOAD_CHUNK_BYTES,
  PEAK_COUNT,
  chunkCount,
  looksLikeAudio,
} from "@/lib/music/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Begin a chunked upload: validate the file metadata, reserve a session, and
 * tell the client the chunk size to slice with. Bytes arrive via /chunk; the
 * session is assembled into GridFS by /finalize.
 */
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

  const fileName = typeof body.fileName === "string" ? body.fileName.trim() : "";
  const mimeType = typeof body.mimeType === "string" ? body.mimeType : "";
  const size = Number(body.size);
  const duration = Number(body.duration);
  const peaks = Array.isArray(body.peaks) ? body.peaks : null;

  if (!fileName) {
    return NextResponse.json({ error: "A file name is required." }, { status: 400 });
  }
  if (!looksLikeAudio(fileName, mimeType)) {
    return NextResponse.json(
      { error: "That doesn't look like an audio file." },
      { status: 400 }
    );
  }
  if (!Number.isFinite(size) || size <= 0) {
    return NextResponse.json({ error: "Invalid file size." }, { status: 400 });
  }
  if (size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: `Songs must be ${Math.round(MAX_FILE_BYTES / (1024 * 1024))} MB or smaller.` },
      { status: 400 }
    );
  }
  if (!Number.isFinite(duration) || duration <= 0) {
    return NextResponse.json({ error: "Could not read the song length." }, { status: 400 });
  }
  if (!peaks) {
    return NextResponse.json({ error: "Missing waveform data." }, { status: 400 });
  }

  const songs = await songsCollection();
  if ((await songs.countDocuments({})) >= MAX_SONGS) {
    return NextResponse.json(
      { error: `You can store at most ${MAX_SONGS} songs. Delete one first.` },
      { status: 409 }
    );
  }

  const cleanPeaks = peaks
    .slice(0, PEAK_COUNT)
    .map((v) => {
      const n = Number(v);
      return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0;
    });

  const uploadId = new ObjectId().toHexString();
  const totalChunks = chunkCount(size, UPLOAD_CHUNK_BYTES);

  const uploads = await audioUploadsCollection();
  await uploads.insertOne({
    _id: uploadId,
    fileName: fileName.slice(0, 200),
    mimeType: mimeType || "audio/mpeg",
    size,
    duration,
    peaks: cleanPeaks,
    totalChunks,
    createdAt: new Date(),
    createdBy: admin.email,
  });

  return NextResponse.json({
    ok: true,
    uploadId,
    chunkSize: UPLOAD_CHUNK_BYTES,
    totalChunks,
  });
}
