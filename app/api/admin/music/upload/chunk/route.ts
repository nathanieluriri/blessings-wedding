import { NextResponse } from "next/server";
import { Binary } from "mongodb";
import { getCurrentAdmin } from "@/lib/auth/current-admin";
import {
  audioUploadsCollection,
  audioUploadChunksCollection,
} from "@/lib/collections";
import { UPLOAD_CHUNK_BYTES } from "@/lib/music/shared";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// A little slack over the nominal chunk size for header/encoding overhead.
const MAX_CHUNK_BYTES = UPLOAD_CHUNK_BYTES + 64 * 1024;

/**
 * Receive one raw-bytes chunk of an in-flight upload and stage it. Idempotent:
 * re-sending the same (uploadId, index) overwrites rather than duplicates, so a
 * retried chunk is safe.
 */
export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const uploadId = url.searchParams.get("uploadId") ?? "";
  const index = Number(url.searchParams.get("index"));

  if (!uploadId || !Number.isInteger(index) || index < 0) {
    return NextResponse.json({ error: "Invalid chunk reference." }, { status: 400 });
  }

  const uploads = await audioUploadsCollection();
  const session = await uploads.findOne({ _id: uploadId });
  if (!session) {
    return NextResponse.json(
      { error: "Upload session not found or expired." },
      { status: 404 }
    );
  }
  if (index >= session.totalChunks) {
    return NextResponse.json({ error: "Chunk index out of range." }, { status: 400 });
  }

  const buffer = Buffer.from(await request.arrayBuffer());
  if (buffer.length === 0) {
    return NextResponse.json({ error: "Empty chunk." }, { status: 400 });
  }
  if (buffer.length > MAX_CHUNK_BYTES) {
    return NextResponse.json({ error: "Chunk too large." }, { status: 413 });
  }

  const chunks = await audioUploadChunksCollection();
  await chunks.updateOne(
    { uploadId, index },
    { $set: { uploadId, index, data: new Binary(buffer), createdAt: new Date() } },
    { upsert: true }
  );

  const received = await chunks.countDocuments({ uploadId });
  return NextResponse.json({ ok: true, received, total: session.totalChunks });
}
