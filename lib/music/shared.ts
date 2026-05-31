// Pure, framework-free helpers + constants for the background-music feature.
// Imported by BOTH server (route handlers, lib) and client (admin editor,
// public player) code, so it must never import `mongodb`, `next`, or the DOM.

/** Hard cap on how many songs may live in the library at once. */
export const MAX_SONGS = 5;

/** Largest accepted upload, in bytes (15 MB). Mirrored in the admin UI copy. */
export const MAX_FILE_BYTES = 15 * 1024 * 1024;

/**
 * Size of each upload chunk, in bytes (4 MB). Kept comfortably under Vercel's
 * ~4.5 MB serverless request-body limit so every chunk POST succeeds.
 */
export const UPLOAD_CHUNK_BYTES = 4 * 1024 * 1024;

/** Default background volume for a freshly uploaded song (0..1). */
export const DEFAULT_VOLUME = 0.6;

/** Minimum length of a trimmed clip, in seconds — guards against a zero-width region. */
export const MIN_CLIP_SECONDS = 1;

/** Number of waveform peaks we precompute + store for the editor canvas. */
export const PEAK_COUNT = 800;

/** Accepted audio MIME types (browsers vary; we also sniff by extension). */
export const ACCEPTED_AUDIO_MIME = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/aac",
  "audio/x-m4a",
  "audio/m4a",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/webm",
  "audio/flac",
] as const;

export const ACCEPTED_AUDIO_EXT = [
  ".mp3",
  ".m4a",
  ".aac",
  ".mp4",
  ".wav",
  ".ogg",
  ".oga",
  ".webm",
  ".flac",
] as const;

/**
 * Serializable song shape sent to the browser (no ObjectId / BSON). The admin
 * editor and the public player both consume this.
 */
export interface SongClient {
  id: string;
  title: string;
  mimeType: string;
  size: number;
  duration: number; // seconds
  trimStart: number; // seconds
  trimEnd: number; // seconds
  volume: number; // 0..1
  loop: boolean;
  peaks: number[]; // normalized 0..1, length ~PEAK_COUNT
  createdAt: string; // ISO
  active: boolean;
}

/** What the public player needs to start the active track. */
export interface ActiveSongClient {
  id: string;
  trimStart: number;
  trimEnd: number;
  volume: number;
  loop: boolean;
  duration: number;
}

/** Clamp a volume into the inclusive 0..1 range; non-finite -> DEFAULT_VOLUME. */
export function clampVolume(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return DEFAULT_VOLUME;
  return Math.min(1, Math.max(0, n));
}

/**
 * Normalize a requested [start, end] trim against the track duration.
 * Guarantees 0 <= start < end <= duration with at least MIN_CLIP_SECONDS
 * between them (collapsing toward a valid window when the input is degenerate).
 */
export function normalizeTrim(
  start: unknown,
  end: unknown,
  duration: number
): { trimStart: number; trimEnd: number } {
  const dur = Number.isFinite(duration) && duration > 0 ? duration : 0;
  let s = Number(start);
  let e = Number(end);
  if (!Number.isFinite(s)) s = 0;
  if (!Number.isFinite(e)) e = dur;

  s = Math.min(Math.max(0, s), dur);
  e = Math.min(Math.max(0, e), dur);

  // Ensure start strictly precedes end by at least the minimum clip length.
  const minLen = Math.min(MIN_CLIP_SECONDS, dur);
  if (e - s < minLen) {
    if (s + minLen <= dur) {
      e = s + minLen;
    } else {
      e = dur;
      s = Math.max(0, dur - minLen);
    }
  }
  return { trimStart: round3(s), trimEnd: round3(e) };
}

/** Round to millisecond precision so stored times stay tidy. */
export function round3(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/**
 * Loop decision for the public player's `timeupdate` handler: returns true when
 * playback has reached/exceeded the clip end and should seek back to the start.
 * A small epsilon keeps the seam from firing repeatedly on the same frame.
 */
export function reachedClipEnd(currentTime: number, trimEnd: number): boolean {
  return currentTime >= trimEnd - 0.05;
}

/** How many chunks a file of `size` bytes splits into at `chunkBytes` each. */
export function chunkCount(size: number, chunkBytes: number = UPLOAD_CHUNK_BYTES): number {
  if (size <= 0) return 0;
  return Math.ceil(size / chunkBytes);
}

/** Format seconds as `m:ss` (or `h:mm:ss` past an hour) for editor labels. */
export function formatClock(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) totalSeconds = 0;
  const s = Math.floor(totalSeconds % 60);
  const m = Math.floor((totalSeconds / 60) % 60);
  const h = Math.floor(totalSeconds / 3600);
  const ss = String(s).padStart(2, "0");
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${ss}`;
  return `${m}:${ss}`;
}

/** Human-readable file size for the library cards. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/** True if the filename/MIME looks like an audio file we accept. */
export function looksLikeAudio(fileName: string, mimeType: string): boolean {
  const mime = (mimeType || "").toLowerCase();
  if (mime.startsWith("audio/")) return true;
  if ((ACCEPTED_AUDIO_MIME as readonly string[]).includes(mime)) return true;
  const lower = (fileName || "").toLowerCase();
  return (ACCEPTED_AUDIO_EXT as readonly string[]).some((ext) => lower.endsWith(ext));
}
