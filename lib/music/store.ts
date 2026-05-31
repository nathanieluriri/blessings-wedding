// Server-side data operations for the background-music feature: GridFS audio
// storage, the song library, chunked-upload assembly, and the active-song
// pointer. Server-only (imports the mongodb driver + node:stream). Cached public
// reads live in `read.ts`; pure helpers live in `shared.ts`.

import { Readable } from "node:stream";
import { GridFSBucket, ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import {
  songsCollection,
  musicSettingsCollection,
  audioUploadsCollection,
  audioUploadChunksCollection,
  type SongDoc,
} from "@/lib/collections";
import {
  clampVolume,
  normalizeTrim,
  DEFAULT_VOLUME,
  MAX_SONGS,
  PEAK_COUNT,
  type SongClient,
} from "./shared";

const BUCKET_NAME = "audio";

export async function getAudioBucket(): Promise<GridFSBucket> {
  const db = await getDb();
  return new GridFSBucket(db, { bucketName: BUCKET_NAME });
}

/** Parse a hex id into an ObjectId, or null when it isn't a valid id. */
export function toObjectId(id: string | null | undefined): ObjectId | null {
  if (!id || !ObjectId.isValid(id)) return null;
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

/** Serializable shape for the client (no BSON types). */
export function toSongClient(doc: SongDoc, activeId: ObjectId | null): SongClient {
  const id = doc._id!.toHexString();
  return {
    id,
    title: doc.title,
    mimeType: doc.mimeType,
    size: doc.size,
    duration: doc.duration,
    trimStart: doc.trimStart,
    trimEnd: doc.trimEnd,
    volume: doc.volume,
    loop: doc.loop,
    peaks: Array.isArray(doc.peaks) ? doc.peaks : [],
    createdAt: doc.createdAt.toISOString(),
    active: activeId != null && activeId.equals(doc._id!),
  };
}

/** The current active-song id (raw), or null. */
export async function getActiveSongId(): Promise<ObjectId | null> {
  const col = await musicSettingsCollection();
  const doc = await col.findOne({ _id: "music" });
  return doc?.activeSongId ?? null;
}

/** Full library, newest first, with the active flag resolved. Uncached. */
export async function listSongs(): Promise<SongClient[]> {
  const [col, activeId] = await Promise.all([
    songsCollection(),
    getActiveSongId(),
  ]);
  const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
  return docs.map((d) => toSongClient(d, activeId));
}

export async function countSongs(): Promise<number> {
  const col = await songsCollection();
  return col.countDocuments({});
}

export async function getSong(id: string): Promise<SongClient | null> {
  const _id = toObjectId(id);
  if (!_id) return null;
  const [col, activeId] = await Promise.all([
    songsCollection(),
    getActiveSongId(),
  ]);
  const doc = await col.findOne({ _id });
  return doc ? toSongClient(doc, activeId) : null;
}

/**
 * Set (or clear, with null) the active background song. When an id is given it
 * must reference an existing song. Returns false when the id doesn't resolve.
 */
export async function setActiveSong(
  id: string | null,
  adminEmail: string
): Promise<boolean> {
  let activeSongId: ObjectId | null = null;
  if (id !== null) {
    const _id = toObjectId(id);
    if (!_id) return false;
    const col = await songsCollection();
    const exists = await col.findOne({ _id }, { projection: { _id: 1 } });
    if (!exists) return false;
    activeSongId = _id;
  }
  const settings = await musicSettingsCollection();
  await settings.updateOne(
    { _id: "music" },
    { $set: { activeSongId, updatedAt: new Date(), updatedBy: adminEmail } },
    { upsert: true }
  );
  return true;
}

export interface SongSettingsPatch {
  trimStart?: unknown;
  trimEnd?: unknown;
  volume?: unknown;
  loop?: unknown;
}

/** Apply trim/volume/loop changes to a song, clamped against its duration. */
export async function updateSongSettings(
  id: string,
  patch: SongSettingsPatch
): Promise<SongClient | null> {
  const _id = toObjectId(id);
  if (!_id) return null;
  const col = await songsCollection();
  const doc = await col.findOne({ _id });
  if (!doc) return null;

  const { trimStart, trimEnd } = normalizeTrim(
    patch.trimStart ?? doc.trimStart,
    patch.trimEnd ?? doc.trimEnd,
    doc.duration
  );
  const volume =
    patch.volume === undefined ? doc.volume : clampVolume(patch.volume);
  const loop = patch.loop === undefined ? doc.loop : patch.loop === true;

  await col.updateOne(
    { _id },
    { $set: { trimStart, trimEnd, volume, loop } }
  );
  const activeId = await getActiveSongId();
  return toSongClient({ ...doc, trimStart, trimEnd, volume, loop }, activeId);
}

/** Delete a song: its GridFS bytes, its doc, and the active pointer if it held it. */
export async function deleteSong(id: string): Promise<boolean> {
  const _id = toObjectId(id);
  if (!_id) return false;
  const col = await songsCollection();
  const doc = await col.findOne({ _id });
  if (!doc) return false;

  const bucket = await getAudioBucket();
  try {
    await bucket.delete(doc.fileId);
  } catch {
    // File may already be gone; proceed to drop the metadata regardless.
  }
  await col.deleteOne({ _id });

  const settings = await musicSettingsCollection();
  await settings.updateOne(
    { _id: "music", activeSongId: _id },
    { $set: { activeSongId: null, updatedAt: new Date() } }
  );
  return true;
}

export interface FinalizeResult {
  ok: boolean;
  song?: SongClient;
  error?: string;
}

/**
 * Assemble a staged chunked upload into GridFS and create the song document.
 * Streams the ordered chunks into the bucket, then prunes the staging records.
 * Enforces the song cap and auto-activates the first song in an empty library.
 */
export async function finalizeUpload(
  uploadId: string,
  adminEmail: string
): Promise<FinalizeResult> {
  const sessions = await audioUploadsCollection();
  const session = await sessions.findOne({ _id: uploadId });
  if (!session) return { ok: false, error: "Upload session not found or expired." };

  const cleanup = async () => {
    const chunksCol = await audioUploadChunksCollection();
    await Promise.all([
      sessions.deleteOne({ _id: uploadId }),
      chunksCol.deleteMany({ uploadId }),
    ]);
  };

  // Re-check the cap at finalize (a parallel upload may have filled it).
  if ((await countSongs()) >= MAX_SONGS) {
    await cleanup();
    return { ok: false, error: `You can store at most ${MAX_SONGS} songs.` };
  }

  const chunksCol = await audioUploadChunksCollection();
  const chunkDocs = await chunksCol
    .find({ uploadId })
    .sort({ index: 1 })
    .toArray();

  if (chunkDocs.length !== session.totalChunks) {
    return {
      ok: false,
      error: `Upload incomplete (${chunkDocs.length}/${session.totalChunks} chunks received).`,
    };
  }

  const buffers = chunkDocs.map((c) => Buffer.from(c.data.buffer));
  const assembledSize = buffers.reduce((n, b) => n + b.length, 0);
  if (assembledSize !== session.size) {
    return {
      ok: false,
      error: "Uploaded bytes did not match the expected size. Please retry.",
    };
  }

  // Stream the ordered buffers into GridFS and await completion.
  const bucket = await getAudioBucket();
  const upload = bucket.openUploadStream(session.fileName, {
    metadata: { contentType: session.mimeType, uploadedBy: adminEmail },
  });
  const fileId = upload.id; // available synchronously
  await new Promise<void>((resolve, reject) => {
    Readable.from(buffers)
      .on("error", reject)
      .pipe(upload)
      .on("error", reject)
      .on("finish", () => resolve());
  });

  const { trimStart, trimEnd } = normalizeTrim(0, session.duration, session.duration);
  const peaks = sanitizePeaks(session.peaks);

  const songDoc: SongDoc = {
    title: deriveTitle(session.fileName),
    fileId,
    mimeType: session.mimeType,
    size: session.size,
    duration: session.duration,
    peaks,
    trimStart,
    trimEnd,
    volume: DEFAULT_VOLUME,
    loop: true,
    createdAt: new Date(),
    createdBy: adminEmail,
  };

  const col = await songsCollection();
  const res = await col.insertOne(songDoc);
  await cleanup();

  // Auto-activate when the library was previously empty / had no active song.
  const settings = await musicSettingsCollection();
  const music = await settings.findOne({ _id: "music" });
  if (!music?.activeSongId) {
    await settings.updateOne(
      { _id: "music" },
      {
        $set: {
          activeSongId: res.insertedId,
          updatedAt: new Date(),
          updatedBy: adminEmail,
        },
      },
      { upsert: true }
    );
  }

  const activeId = await getActiveSongId();
  return { ok: true, song: toSongClient({ ...songDoc, _id: res.insertedId }, activeId) };
}

/** Strip the extension and tidy a filename into a human title. */
function deriveTitle(fileName: string): string {
  const base = fileName.replace(/\.[^/.]+$/, "").replace(/[_]+/g, " ").trim();
  return base.length > 0 ? base.slice(0, 120) : "Untitled";
}

/** Coerce stored peaks to a clean, bounded array of 0..1 numbers. */
function sanitizePeaks(input: unknown): number[] {
  if (!Array.isArray(input)) return [];
  const out: number[] = [];
  for (const v of input.slice(0, PEAK_COUNT)) {
    const n = Number(v);
    out.push(Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);
  }
  return out;
}
