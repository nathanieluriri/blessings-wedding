import type { Binary, Collection, ObjectId } from "mongodb";
import { getDb } from "./mongodb";
import type { RsvpStatus } from "./rsvp-status";

export type AdminRole = "root" | "admin";

export interface AdminDoc {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  name?: string;
  role: AdminRole;
  mustChangePassword?: boolean;
  // Per-admin master gate for platform notification emails (new-RSVP + test).
  // Missing/true = on (the default); false = this admin opted out. Security mail
  // (sign-in codes, password resets, invites) is never gated by this.
  emailNotificationsEnabled?: boolean;
  createdAt: Date;
  createdBy?: string; // email of the admin who created this account
  // ── Two-factor auth (TOTP authenticator app + email-OTP fallback) ──
  twoFactorEnabled?: boolean;
  totpSecretEnc?: string; // AES-256-GCM(base32 secret), active once enabled
  totpPendingEnc?: string; // secret during enrollment, before first verify
  recoveryCodeHashes?: string[]; // bcrypt hashes; removed as codes are consumed
}

export interface RsvpDoc {
  _id?: ObjectId;
  name: string;
  email?: string;
  attending: "yes" | "no";
  message?: string;
  status: RsvpStatus;
  createdAt: Date;
  updatedAt: Date;
  reviewedBy?: string; // email of admin who last changed status
  reviewedAt?: Date;
}

export interface SettingsDoc {
  _id: "global";
  weddingDate: string; // ISO string
  rsvpDeadline?: string; // ISO string; defaults to DEFAULT_RSVP_DEADLINE when unset
  updatedAt: Date;
  updatedBy?: string;
}

/** Notification preferences, stored alongside SettingsDoc in `settings`. */
export interface NotificationSettingsDoc {
  _id: "notifications";
  newRsvpEnabled: boolean;
  extraRecipients: string[]; // custom addresses beyond every admin's email
  updatedAt: Date;
  updatedBy?: string;
}

/** One configurable social link (stored shape; loosely typed platform). */
export interface SocialLinkRecord {
  platform: string;
  enabled: boolean;
  url: string;
}

/** Social links shown in the hero, stored alongside SettingsDoc in `settings`. */
export interface SocialSettingsDoc {
  _id: "social";
  links: SocialLinkRecord[];
  updatedAt: Date;
  updatedBy?: string;
}

// ── Background music ────────────────────────────────────────────────────────

/**
 * One uploaded song in the library (max 5). The raw audio bytes live in the
 * GridFS `audio` bucket; `fileId` points at the `audio.files` document.
 * Trim/volume/loop are the playback settings applied on the public site.
 */
export interface SongDoc {
  _id?: ObjectId;
  title: string;
  fileId: ObjectId; // GridFS audio.files _id
  mimeType: string;
  size: number; // bytes
  duration: number; // seconds (decoded client-side at upload)
  peaks: number[]; // normalized 0..1 waveform, length ~PEAK_COUNT
  trimStart: number; // seconds
  trimEnd: number; // seconds
  volume: number; // 0..1 — the background level (admin-set "max volume")
  loop: boolean;
  createdAt: Date;
  createdBy?: string; // email of the admin who uploaded
}

/** Which song is the active background track, stored in `settings` by _id. */
export interface MusicSettingsDoc {
  _id: "music";
  activeSongId: ObjectId | null;
  updatedAt: Date;
  updatedBy?: string;
}

/**
 * One in-flight chunked upload session. We stage chunks across several HTTP
 * requests (Vercel caps a request body at ~4.5 MB) and assemble them into
 * GridFS on finalize. A TTL index prunes abandoned sessions after an hour.
 */
export interface AudioUploadDoc {
  _id: string; // uploadId (random hex)
  fileName: string;
  mimeType: string;
  size: number;
  duration: number;
  peaks: number[];
  totalChunks: number;
  createdAt: Date; // TTL anchor
  createdBy?: string;
}

/** A single staged chunk of an in-flight upload (binary payload). */
export interface AudioUploadChunkDoc {
  _id?: ObjectId;
  uploadId: string;
  index: number;
  data: Binary;
  createdAt: Date; // TTL anchor
}

/** One-time, time-boxed password-reset token (hash stored, never the token). */
export interface PasswordResetDoc {
  _id?: ObjectId;
  adminId: ObjectId;
  tokenHash: string; // sha256 hex of the random token
  expiresAt: Date; // TTL index removes the row after this
  createdAt: Date;
}

/** Short-lived login challenge for the email-OTP 2FA fallback. */
export interface OtpChallengeDoc {
  _id?: ObjectId;
  adminId: ObjectId;
  purpose: "login_2fa";
  codeHash: string; // bcrypt hash of the 6-digit code
  expiresAt: Date; // TTL index removes the row after this
  attempts: number;
  createdAt: Date;
}

let indexesEnsured = false;

async function ensureIndexes() {
  if (indexesEnsured) return;
  const db = await getDb();
  await db
    .collection<AdminDoc>("admins")
    .createIndex({ email: 1 }, { unique: true });
  await db.collection<RsvpDoc>("rsvps").createIndex({ createdAt: -1 });
  // TTL indexes: Mongo prunes rows once `expiresAt` passes.
  await db
    .collection<PasswordResetDoc>("passwordResets")
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db
    .collection<OtpChallengeDoc>("otpChallenges")
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  // Music: newest songs first; staging collections self-prune after 1 hour.
  await db.collection<SongDoc>("songs").createIndex({ createdAt: -1 });
  await db
    .collection<AudioUploadDoc>("audioUploads")
    .createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 });
  await db
    .collection<AudioUploadChunkDoc>("audioUploadChunks")
    .createIndex({ uploadId: 1, index: 1 });
  await db
    .collection<AudioUploadChunkDoc>("audioUploadChunks")
    .createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 });
  indexesEnsured = true;
}

export async function adminsCollection(): Promise<Collection<AdminDoc>> {
  await ensureIndexes();
  const db = await getDb();
  return db.collection<AdminDoc>("admins");
}

export async function rsvpsCollection(): Promise<Collection<RsvpDoc>> {
  await ensureIndexes();
  const db = await getDb();
  return db.collection<RsvpDoc>("rsvps");
}

export async function settingsCollection(): Promise<Collection<SettingsDoc>> {
  const db = await getDb();
  return db.collection<SettingsDoc>("settings");
}

export async function notificationSettingsCollection(): Promise<
  Collection<NotificationSettingsDoc>
> {
  const db = await getDb();
  return db.collection<NotificationSettingsDoc>("settings");
}

export async function socialSettingsCollection(): Promise<
  Collection<SocialSettingsDoc>
> {
  const db = await getDb();
  return db.collection<SocialSettingsDoc>("settings");
}

export async function songsCollection(): Promise<Collection<SongDoc>> {
  await ensureIndexes();
  const db = await getDb();
  return db.collection<SongDoc>("songs");
}

export async function musicSettingsCollection(): Promise<
  Collection<MusicSettingsDoc>
> {
  const db = await getDb();
  return db.collection<MusicSettingsDoc>("settings");
}

export async function audioUploadsCollection(): Promise<
  Collection<AudioUploadDoc>
> {
  await ensureIndexes();
  const db = await getDb();
  return db.collection<AudioUploadDoc>("audioUploads");
}

export async function audioUploadChunksCollection(): Promise<
  Collection<AudioUploadChunkDoc>
> {
  await ensureIndexes();
  const db = await getDb();
  return db.collection<AudioUploadChunkDoc>("audioUploadChunks");
}

export async function passwordResetsCollection(): Promise<
  Collection<PasswordResetDoc>
> {
  await ensureIndexes();
  const db = await getDb();
  return db.collection<PasswordResetDoc>("passwordResets");
}

export async function otpChallengesCollection(): Promise<
  Collection<OtpChallengeDoc>
> {
  await ensureIndexes();
  const db = await getDb();
  return db.collection<OtpChallengeDoc>("otpChallenges");
}
