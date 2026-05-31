import { Readable } from "node:stream";
import { getAudioBucket, toObjectId } from "@/lib/music/store";
import { songsCollection } from "@/lib/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public audio byte server with HTTP Range support so an <audio> element can
 * seek (e.g. jump to the clip's trim start) and the browser can buffer
 * progressively. Streams straight from the GridFS `audio` bucket — never
 * buffers the whole file. HTTP Range is INCLUSIVE on both ends; GridFS's `end`
 * option is EXCLUSIVE, so we pass `endIncl + 1`.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const songId = toObjectId(id);
  if (!songId) return new Response("Not found", { status: 404 });

  try {
    // Resolve the song document (the UI passes the song's doc id). From it
    // we read the GridFS `fileId` to stream the audio bytes.
    const songsCol = await songsCollection();
    const songDoc = await songsCol.findOne({ _id: songId }, { projection: { fileId: 1 } });
    if (!songDoc || !songDoc.fileId) return new Response("Not found", { status: 404 });
    const fileId = songDoc.fileId;

    const bucket = await getAudioBucket();
    const file = await bucket.find({ _id: fileId }, { limit: 1 }).next();
    if (!file) return new Response("Not found", { status: 404 });

    const total = file.length;
    const contentType =
      (file.metadata?.contentType as string | undefined) ?? "audio/mpeg";
    const rangeHeader = request.headers.get("range");

    const baseHeaders: Record<string, string> = {
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
      // Bytes are immutable per file id, so they can cache aggressively.
      "Cache-Control": "public, max-age=31536000, immutable",
    };

    // Whole-file request.
    if (!rangeHeader) {
      const node = bucket.openDownloadStream(fileId);
      return new Response(Readable.toWeb(node) as unknown as ReadableStream, {
        status: 200,
        headers: { ...baseHeaders, "Content-Length": String(total) },
      });
    }

    // Range request: "bytes=start-end" (both inclusive; either side optional).
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.trim());
    if (!match) {
      return new Response(null, {
        status: 416,
        headers: { ...baseHeaders, "Content-Range": `bytes */${total}` },
      });
    }
    const start = match[1] ? parseInt(match[1], 10) : 0;
    const endIncl = match[2] ? parseInt(match[2], 10) : total - 1;
    const clampedStart = Math.max(0, start);
    const clampedEnd = Math.min(endIncl, total - 1);

    if (
      !Number.isFinite(clampedStart) ||
      !Number.isFinite(clampedEnd) ||
      clampedStart > clampedEnd
    ) {
      return new Response(null, {
        status: 416,
        headers: { ...baseHeaders, "Content-Range": `bytes */${total}` },
      });
    }

    // GridFS `end` is exclusive -> +1.
    const node = bucket.openDownloadStream(fileId, {
      start: clampedStart,
      end: clampedEnd + 1,
    });
    return new Response(Readable.toWeb(node) as unknown as ReadableStream, {
      status: 206,
      headers: {
        ...baseHeaders,
        "Content-Range": `bytes ${clampedStart}-${clampedEnd}/${total}`,
        "Content-Length": String(clampedEnd - clampedStart + 1),
      },
    });
  } catch (err: unknown) {
    // Return a 503 so the client knows the service is unavailable instead of
    // letting the exception bubble and produce an uncaught error in the browser.
    return new Response(
      JSON.stringify({ error: "Service unavailable", details: String(err) }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}
